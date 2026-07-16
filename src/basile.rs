//! Basile-style content ↔ address bijection (generator v9).
//!
//! # Model
//!
//! A **page** is a length-[`PAGE_CONTENT_SYMBOLS`] digit string in base `|Σ|`.
//! That integer maps bijectively to a page address via
//! `content = (addr_int * C) mod N` with `N = |Σ|^3200` and
//! `I = C⁻¹ (mod N)`. `C ≡ 1 (mod |Σ|)` so it stays coprime to `N`.
//!
//! `C` / `I` are keyed by `(GENERATOR_VERSION, universe_seed, alphabet_id)`.
//!
//! Short search pads the query into one full page (deterministic offset +
//! invertible filler), then inverts. Multi-page search pads into `S` consecutive
//! pages and inverts **each** page under the same map, then solves for a start
//! address whose consecutive page indices regenerate that stream — which holds
//! because we **build** the stream as virgin pages of a chosen start address
//! (filler chooses the free symbols; the query symbols are fixed into place,
//! and the address is the invert of the completed first page, with subsequent
//! pages taken as `page_symbols(start+i)` — wait: for arbitrary query text,
//! consecutive page-level contents are not free).
//!
//! Practical multipage rule (v9): build the padded `S`-page symbol stream, then
//! set the start address to `invert(page_0)` and **define** pages `1..S-1` of
//! the hit as the remaining stream slices. Those slices are real pages at
//! *some* addresses; to keep them on `start+1..` we instead generate every page
//! independently (page-level) and for locate we place the query by constructing
//! page 0 (pad+invert) and requiring pages `1..` to equal `page_symbols(start+i)`
//! only when the query was taken from the library. For **search**, we construct
//! the full padded stream and invert page 0; virgin page 0 contains the start
//! of the query. Continuation pages are whatever the generator yields; the UI
//! may still highlight using the query string. Full consecutive reconstruction
//! for arbitrary multipage text needs book-level encoding (future).
//!
//! Titles use the same modular map on [`TITLE_LEN`] digits → `(z, n, book)`.

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

use num_bigint::{BigInt, BigUint, Sign};
use num_integer::Integer;
use num_traits::{One, Pow, Signed, Zero};

use crate::config::{
    BOOKS_PER_GALLERY, GENERATOR_VERSION, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK, TITLE_LEN,
};

/// One page address in a universe + alphabet lens.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct PageKey {
    pub universe_seed: u64,
    pub z: BigInt,
    pub n: BigInt,
    pub book_index: u32,
    pub page: u32,
    pub alphabet_id: u32,
}

/// Zigzag: non-negative → `2n`, negative → `2|n|-1` (arbitrary-precision).
#[inline]
fn zigzag(i: &BigInt) -> BigUint {
    match i.sign() {
        Sign::Minus => (i.magnitude().clone() << 1) - BigUint::one(),
        Sign::NoSign | Sign::Plus => i.to_biguint().unwrap_or_default() << 1,
    }
}

#[inline]
fn unzigzag(u: &BigUint) -> BigInt {
    if u.bit(0) {
        -BigInt::from((u + BigUint::one()) >> 1)
    } else {
        BigInt::from(u >> 1)
    }
}

fn pair_gallery(z: &BigInt, n: &BigInt) -> BigUint {
    let a = zigzag(z);
    let b = zigzag(n);
    let s = &a + &b;
    (&s * (&s + BigUint::one())) / BigUint::from(2u32) + b
}

fn unpair_gallery(idx: &BigUint) -> (BigInt, BigInt) {
    let disc = BigUint::from(8u32) * idx + BigUint::one();
    let sqrt = disc.sqrt();
    let w = (sqrt - BigUint::one()) / BigUint::from(2u32);
    let t = (&w * (&w + BigUint::one())) / BigUint::from(2u32);
    let b = idx - &t;
    let a = &w - &b;
    (unzigzag(&a), unzigzag(&b))
}

fn u64_from_big(x: &BigUint) -> u64 {
    x.to_u64_digits().first().copied().unwrap_or(0)
}

/// Linear page index: `page + PAGES * (book + BOOKS * pair(z,n))`.
#[must_use]
pub fn pack_page_index(z: &BigInt, n: &BigInt, book_index: u32, page: u32) -> BigUint {
    let g = pair_gallery(z, n);
    let book = BigUint::from(book_index % BOOKS_PER_GALLERY);
    let page = BigUint::from(page % PAGES_PER_BOOK);
    page + BigUint::from(PAGES_PER_BOOK) * (book + BigUint::from(BOOKS_PER_GALLERY) * g)
}

#[must_use]
pub fn unpack_page_index(mut x: BigUint) -> (BigInt, BigInt, u32, u32) {
    let pages = BigUint::from(PAGES_PER_BOOK);
    let books = BigUint::from(BOOKS_PER_GALLERY);
    let page = (u64_from_big(&(&x % &pages)) as u32) % PAGES_PER_BOOK;
    x /= &pages;
    let book = (u64_from_big(&(&x % &books)) as u32) % BOOKS_PER_GALLERY;
    x /= &books;
    let (z, n) = unpair_gallery(&x);
    (z, n, book, page)
}

fn modulus(alpha_len: u32, len: usize) -> BigUint {
    BigUint::from(alpha_len).pow(len as u32)
}

fn mod_inverse(a: &BigUint, m: &BigUint) -> BigUint {
    let a_mod = a % m;
    let mut r0 = BigInt::from(m.clone());
    let mut r1 = BigInt::from(a_mod);
    let mut s0 = BigInt::zero();
    let mut s1 = BigInt::one();
    while !r1.is_zero() {
        let (q, r2) = r0.div_rem(&r1);
        r0 = r1;
        r1 = r2;
        let s2 = &s0 - &q * &s1;
        s0 = s1;
        s1 = s2;
    }
    debug_assert_eq!(r0, BigInt::one(), "C must be coprime to N");
    let mut inv = s0 % BigInt::from(m.clone());
    if inv.is_negative() {
        inv += BigInt::from(m.clone());
    }
    inv.to_biguint().expect("inverse fits in BigUint")
}

/// `(C, I, N)` for a block of `len` symbols — cached (N = α^len is expensive).
fn scramble_params(
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
    len: usize,
) -> (BigUint, BigUint, BigUint) {
    type ScrambleKey = (u64, u32, u32, usize);
    type ScrambleTriple = (BigUint, BigUint, BigUint);
    static CACHE: OnceLock<Mutex<HashMap<ScrambleKey, ScrambleTriple>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    let key = (universe_seed, alphabet_id, alpha_len, len);
    if let Ok(guard) = cache.lock()
        && let Some(hit) = guard.get(&key)
    {
        return hit.clone();
    }
    let computed = scramble_params_uncached(universe_seed, alphabet_id, alpha_len, len);
    if let Ok(mut guard) = cache.lock() {
        guard.insert(key, computed.clone());
    }
    computed
}

fn scramble_params_uncached(
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
    len: usize,
) -> (BigUint, BigUint, BigUint) {
    let n = modulus(alpha_len, len);
    let mut h = blake3::Hasher::new();
    h.update(b"lob:basile:C");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&universe_seed.to_le_bytes());
    h.update(&alphabet_id.to_le_bytes());
    h.update(&alpha_len.to_le_bytes());
    h.update(&(len as u64).to_le_bytes());
    let digest = h.finalize();
    let mut expand = blake3::Hasher::new();
    expand.update(b"lob:basile:C:xof");
    expand.update(digest.as_bytes());
    let mut xof = expand.finalize_xof();
    let need = (n.bits() / 8).saturating_add(64) as usize;
    let mut buf = vec![0u8; need.max(64)];
    xof.fill(&mut buf);
    let mut h_int = BigUint::from_bytes_le(&buf);
    let n_div = &n / alpha_len;
    if n_div.is_zero() {
        h_int = BigUint::zero();
    } else {
        h_int %= &n_div;
    }
    let c = h_int * alpha_len + BigUint::one();
    let i = mod_inverse(&c, &n);
    (c, i, n)
}

/// Digits little-endian (index 0 = least significant) → big integer.
#[must_use]
pub fn digits_to_int(digits: &[u16], alpha_len: u32) -> BigUint {
    debug_assert!(digits.iter().all(|&d| u32::from(d) < alpha_len));
    // `from_radix_le` only accepts radix ∈ 2..=256 and one byte per digit.
    if (2..=256).contains(&alpha_len) {
        let raw: Vec<u8> = digits.iter().map(|&d| d as u8).collect();
        BigUint::from_radix_le(&raw, alpha_len).unwrap_or_else(BigUint::zero)
    } else {
        let mut n = BigUint::zero();
        let base = BigUint::from(alpha_len);
        for &d in digits.iter().rev() {
            n = n * &base + BigUint::from(u32::from(d));
        }
        n
    }
}

/// Big integer → `len` little-endian digits (padded with zeros).
#[must_use]
pub fn int_to_digits(mut n: BigUint, alpha_len: u32, len: usize) -> Vec<u16> {
    if alpha_len <= 256 {
        let mut digits = n.to_radix_le(alpha_len);
        digits.resize(len, 0);
        digits.truncate(len);
        digits.into_iter().map(u16::from).collect()
    } else {
        let base = BigUint::from(alpha_len);
        let mut out = vec![0u16; len];
        for slot in out.iter_mut() {
            if n.is_zero() {
                break;
            }
            let (q, r) = n.div_rem(&base);
            *slot = u64_from_big(&r) as u16;
            n = q;
        }
        out
    }
}

fn digits_u16_to_page(digits: &[u16]) -> [u16; PAGE_CONTENT_SYMBOLS] {
    let mut out = [0u16; PAGE_CONTENT_SYMBOLS];
    let n = digits.len().min(PAGE_CONTENT_SYMBOLS);
    out[..n].copy_from_slice(&digits[..n]);
    out
}

/// Virgin page symbols at `key` (page-level Basile map).
#[must_use]
pub fn page_symbols_at(key: &PageKey, alpha_len: u32) -> [u16; PAGE_CONTENT_SYMBOLS] {
    debug_assert!((1..=4096).contains(&alpha_len));
    let (c, _i, n) = scramble_params(
        key.universe_seed,
        key.alphabet_id,
        alpha_len,
        PAGE_CONTENT_SYMBOLS,
    );
    let addr = pack_page_index(&key.z, &key.n, key.book_index, key.page) % &n;
    let content = (addr * c) % n;
    let digits = int_to_digits(content, alpha_len, PAGE_CONTENT_SYMBOLS);
    digits_u16_to_page(&digits)
}

/// Invert a full page of symbols → page key (same universe / alphabet / `alpha_len`).
#[must_use]
pub fn invert_page_symbols(
    symbols: &[u16; PAGE_CONTENT_SYMBOLS],
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
) -> PageKey {
    let (_c, i, n) = scramble_params(universe_seed, alphabet_id, alpha_len, PAGE_CONTENT_SYMBOLS);
    let content = digits_to_int(symbols, alpha_len) % &n;
    let addr = (content * i) % n;
    let (z, n_coord, book_index, page) = unpack_page_index(addr);
    PageKey {
        universe_seed,
        z,
        n: n_coord,
        book_index,
        page,
        alphabet_id,
    }
}

/// Spine title symbols (exactly [`TITLE_LEN`]) → `(z, n, book_index)`.
#[must_use]
pub fn invert_title_symbols(
    symbols: &[u16],
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
) -> (BigInt, BigInt, u32) {
    debug_assert_eq!(symbols.len(), TITLE_LEN);
    let (_c, i, n) = scramble_params(universe_seed, alphabet_id, alpha_len, TITLE_LEN);
    let content = digits_to_int(symbols, alpha_len) % &n;
    let addr = (content * i) % n;
    // Reuse page unpack but ignore page (titles live at page 0 slot in pack by using
    // book-only index: book + BOOKS * gallery).
    let books = BigUint::from(BOOKS_PER_GALLERY);
    let book = (u64_from_big(&(&addr % &books)) as u32) % BOOKS_PER_GALLERY;
    let g = &addr / &books;
    let (z, n_coord) = unpair_gallery(&g);
    (z, n_coord, book)
}

/// `(z, n, book)` → title symbol indices.
#[must_use]
pub fn title_symbols_at(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
) -> [u16; TITLE_LEN] {
    let (c, _i, modulus) = scramble_params(universe_seed, alphabet_id, alpha_len, TITLE_LEN);
    let g = pair_gallery(z, n);
    let addr = (BigUint::from(book_index % BOOKS_PER_GALLERY)
        + BigUint::from(BOOKS_PER_GALLERY) * g)
        % &modulus;
    let content = (addr * c) % modulus;
    let digits = int_to_digits(content, alpha_len, TITLE_LEN);
    let mut out = [0u16; TITLE_LEN];
    out.copy_from_slice(&digits[..TITLE_LEN]);
    out
}

/// Deterministic filler digit stream for padding (invertible as part of the page).
#[must_use]
pub fn filler_digits(seed_text: &str, alpha_len: u32, count: usize) -> Vec<u16> {
    let mut h = blake3::Hasher::new();
    h.update(b"lob:basile:filler");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&alpha_len.to_le_bytes());
    h.update(seed_text.as_bytes());
    let mut xof = h.finalize_xof();
    let mut out = Vec::with_capacity(count);
    let mut buf = [0u8; 8];
    while out.len() < count {
        xof.fill(&mut buf);
        let v = u64::from_le_bytes(buf);
        out.push((v % u64::from(alpha_len)) as u16);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn page_round_trip_basile29() {
        let key = PageKey {
            universe_seed: 0,
            z: BigInt::from(3),
            n: BigInt::from(-7),
            book_index: 42,
            page: 17,
            alphabet_id: 29,
        };
        let alpha = 29u32;
        let symbols = page_symbols_at(&key, alpha);
        let back = invert_page_symbols(&symbols, 0, 29, alpha);
        assert_eq!(back, key);
    }

    #[test]
    fn pack_unpack_page_index_bigint() {
        let cases = [
            (BigInt::from(0), BigInt::from(0), 0u32, 0u32),
            (BigInt::from(1), BigInt::from(-1), 699, 409),
            (BigInt::from(-50), BigInt::from(12), 3, 7),
            // Beyond i64 — must not truncate on unpack.
            (
                BigInt::parse_bytes(b"9223372036854775808", 10).unwrap(),
                BigInt::from(-3),
                1,
                2,
            ),
        ];
        for (z, n, b, p) in cases {
            let x = pack_page_index(&z, &n, b, p);
            let (z2, n2, b2, p2) = unpack_page_index(x);
            assert_eq!((z2, n2, b2, p2), (z, n, b, p));
        }
    }

    #[test]
    fn title_round_trip() {
        let alpha = 29u32;
        let z = BigInt::from(2);
        let n = BigInt::from(-3);
        let book = 15u32;
        let syms = title_symbols_at(&z, &n, book, 0, 29, alpha);
        let back = invert_title_symbols(&syms, 0, 29, alpha);
        assert_eq!(back, (z, n, book));
    }
}

#[cfg(test)]
mod content_bijection_tests {
    use super::*;

    #[test]
    fn digits_round_trip() {
        let mut page = [0u16; PAGE_CONTENT_SYMBOLS];
        for (i, slot) in page.iter_mut().enumerate() {
            *slot = (i % 29) as u16;
        }
        let x = digits_to_int(&page, 29);
        let back = int_to_digits(x, 29, PAGE_CONTENT_SYMBOLS);
        assert_eq!(page.as_slice(), back.as_slice());
    }

    #[test]
    fn mul_inverse_on_arbitrary() {
        let mut page = [0u16; PAGE_CONTENT_SYMBOLS];
        for (i, slot) in page.iter_mut().enumerate() {
            *slot = ((i * 7 + 3) % 29) as u16;
        }
        let (c, i, n) = scramble_params(0, 29, 29, PAGE_CONTENT_SYMBOLS);
        let content = digits_to_int(&page, 29) % &n;
        let addr = (&content * &i) % &n;
        let content2 = (&addr * &c) % &n;
        assert_eq!(content, content2, "C*I not identity");
        let regen = int_to_digits(content2, 29, PAGE_CONTENT_SYMBOLS);
        assert_eq!(page.as_slice(), regen.as_slice());
    }

    #[test]
    fn arbitrary_page_content_round_trips() {
        let mut page = [0u16; PAGE_CONTENT_SYMBOLS];
        for (i, slot) in page.iter_mut().enumerate() {
            *slot = ((i * 13 + 11) % 29) as u16;
        }
        let key = invert_page_symbols(&page, 0, 29, 29);
        let regen = page_symbols_at(&key, 29);
        assert_eq!(page, regen);
    }
}
