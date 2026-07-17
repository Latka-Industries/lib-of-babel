//! Basile-style content ↔ address bijection (generator v11 — dual scopes).
//!
//! # Two bijection scopes
//!
//! - **Page-linked** ([`page_symbols_at`] / [`invert_page_symbols`]): every
//!   possible *page* exists once under `content = (addr * C) mod |Σ|^3200`.
//!   Wander, spines, short text search, reader `book_image`.
//! - **Book-linked** ([`book_symbols_at`] / [`invert_book_symbols`]): every
//!   possible *full book* exists once under
//!   `content = ((addr + 1) * C) mod |Σ|^BOOK`. Photo Find / Babelgram identity.
//!
//! Same `(z, n, book)` labels under different scopes are different virgin content.
//! Titles still use [`TITLE_LEN`] digits → `(z, n, book)`.

use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

use num_bigint::{BigInt, BigUint, Sign};
use num_integer::Integer;
use num_traits::{One, Pow, Signed, Zero};

use crate::config::{
    BOOK_CONTENT_SYMBOLS, BOOKS_PER_GALLERY, GENERATOR_VERSION, PAGE_CONTENT_SYMBOLS,
    PAGES_PER_BOOK, TITLE_LEN,
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
    let zz = zigzag(z);
    let nn = zigzag(n);
    let sum = &zz + &nn;
    (&sum * (&sum + BigUint::one())) / BigUint::from(2u32) + nn
}

/// `pair_gallery(z, n) % m` without building the full Cantor square when `m` is odd.
///
/// Content-search rooms have multi-thousand-digit `(z, n)`. Pairing those 700× for
/// spines is the gallery lag; reducing mod the (small) title modulus once is enough.
fn pair_gallery_mod(z: &BigInt, n: &BigInt, m: &BigUint) -> BigUint {
    if m.is_zero() {
        return BigUint::zero();
    }
    // T(s)=s(s+1)/2 mod m is determined by s mod m only when 2 is invertible (m odd).
    if m.bit(0) {
        let zz = zigzag_mod(z, m);
        let nn = zigzag_mod(n, m);
        let sum = (&zz + &nn) % m;
        let inv2 = mod_inverse(&BigUint::from(2u32), m);
        let tri = ((&sum * (&sum + BigUint::one())) % m * inv2) % m;
        (tri + nn) % m
    } else {
        pair_gallery(z, n) % m
    }
}

fn zigzag_mod(i: &BigInt, m: &BigUint) -> BigUint {
    match i.sign() {
        Sign::Minus => {
            let mag = i.magnitude() % m;
            let two_mag = (BigUint::from(2u32) * mag) % m;
            if two_mag.is_zero() {
                m - BigUint::one()
            } else {
                two_mag - BigUint::one()
            }
        }
        Sign::NoSign | Sign::Plus => {
            let z = i.to_biguint().unwrap_or_default() % m;
            (BigUint::from(2u32) * z) % m
        }
    }
}

fn unpair_gallery(idx: &BigUint) -> (BigInt, BigInt) {
    let disc = BigUint::from(8u32) * idx + BigUint::one();
    let root = disc.sqrt();
    let triangle = (root - BigUint::one()) / BigUint::from(2u32);
    let base = (&triangle * (&triangle + BigUint::one())) / BigUint::from(2u32);
    let nn = idx - &base;
    let zz = &triangle - &nn;
    (unzigzag(&zz), unzigzag(&nn))
}

fn u64_from_big(x: &BigUint) -> u64 {
    x.to_u64_digits().first().copied().unwrap_or(0)
}

/// Linear page index: `page + PAGES * (book + BOOKS * pair(z,n))`.
///
/// Used by page-linked invert. Hot forward paths use [`pair_gallery_mod`]
/// so huge coordinates stay cheap.
#[must_use]
#[allow(dead_code)] // round-trip helper; invert uses [`unpack_page_index`]
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

/// `a⁻¹ mod α^len` via Newton/Hensel lifting (extended-gcd on α^len is intractable at book size).
///
/// Requires `gcd(a, α) = 1`. Our scramble constant satisfies `C ≡ 1 (mod α)`.
fn mod_inverse_alpha_pow(a: &BigUint, alpha_len: u32, len: usize) -> BigUint {
    debug_assert!(len >= 1);
    debug_assert!((2..=4096).contains(&alpha_len));
    let alpha = BigUint::from(alpha_len);
    let mut i = mod_inverse(a, &alpha);
    let mut lifted = 1usize;
    while lifted < len {
        let next = lifted.saturating_mul(2).min(len);
        let m = modulus(alpha_len, next);
        let ai = (a * &i) % &m;
        let two = BigUint::from(2u32);
        let t = if two >= ai { two - ai } else { &m + two - ai };
        i = (&i * t) % &m;
        lifted = next;
    }
    debug_assert!({
        let n = modulus(alpha_len, len);
        (a * &i) % &n == BigUint::one()
    });
    i
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
    // Default universe + Basile book map: load from the baked blob (no Hensel warm).
    let computed =
        if let Some(baked) = baked_book_scramble(universe_seed, alphabet_id, alpha_len, len) {
            baked
        } else {
            scramble_params_uncached(universe_seed, alphabet_id, alpha_len, len)
        };
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
    // Full-book modulus is fine in release WASM; in `cargo test` (debug) it looks
    // "stuck" for minutes. Unit tests must use smaller `len` or avoid book Basile.
    assert!(
        !(cfg!(test) && len == BOOK_CONTENT_SYMBOLS),
        "test tried to scramble BOOK_CONTENT_SYMBOLS ({len}) — that hangs debug CI; \
         use a medium length or do not call book_symbols_at / invert_book / locate_page / book_image from unit tests"
    );
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
    let i = mod_inverse_alpha_pow(&c, alpha_len, len);
    (c, i, n)
}

/// Digits little-endian (index 0 = least significant) → big integer.
///
/// Skips leading/trailing zero digits so short zero-padded book searches stay cheap.
#[must_use]
pub fn digits_to_int(digits: &[u16], alpha_len: u32) -> BigUint {
    debug_assert!(digits.iter().all(|&d| u32::from(d) < alpha_len));
    let Some(start) = digits.iter().position(|&d| d != 0) else {
        return BigUint::zero();
    };
    let end = digits
        .iter()
        .rposition(|&d| d != 0)
        .map_or(start, |i| i + 1);
    let slice = &digits[start..end];
    let body = digits_to_int_dense(slice, alpha_len);
    if start == 0 {
        body
    } else {
        body * BigUint::from(alpha_len).pow(start as u32)
    }
}

fn digits_to_int_dense(digits: &[u16], alpha_len: u32) -> BigUint {
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
        for slot in &mut out {
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

/// Book address: `book + BOOKS * pair(z,n)` (no page — pages are slices of the book).
fn book_addr(z: &BigInt, n: &BigInt, book_index: u32, n_mod: &BigUint) -> BigUint {
    let g = pair_gallery_mod(z, n, n_mod);
    BigUint::from(book_index % BOOKS_PER_GALLERY) + BigUint::from(BOOKS_PER_GALLERY) * g
}

fn unpack_book_addr(mut addr: BigUint) -> (BigInt, BigInt, u32) {
    let books = BigUint::from(BOOKS_PER_GALLERY);
    let book = (u64_from_big(&(&addr % &books)) as u32) % BOOKS_PER_GALLERY;
    addr /= &books;
    let (z, n) = unpair_gallery(&addr);
    (z, n, book)
}

/// Cache key for [`book_symbols_at`]: universe, alphabet, α, book, z/n bytes.
type BookSymbolsKey = (u64, u32, u32, u32, Vec<u8>, Vec<u8>);
static BOOK_SYMBOLS_CACHE: OnceLock<Mutex<HashMap<BookSymbolsKey, Arc<[u16]>>>> = OnceLock::new();

/// Virgin full-book symbols at `(z, n, book)` (book-level Basile map).
///
/// Results are cached (Arc) — regenerating `α^BOOK` content is expensive; page
/// turns and `book_image` must share one materialisation per open book.
#[must_use]
pub fn book_symbols_at(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
) -> Arc<[u16]> {
    debug_assert!((1..=4096).contains(&alpha_len));
    let cache = BOOK_SYMBOLS_CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    let key = (
        universe_seed,
        alphabet_id,
        alpha_len,
        book_index % BOOKS_PER_GALLERY,
        z.to_signed_bytes_le(),
        n.to_signed_bytes_le(),
    );
    if let Ok(guard) = cache.lock()
        && let Some(hit) = guard.get(&key)
    {
        return Arc::clone(hit);
    }
    let (c, _i, modulus) =
        scramble_params(universe_seed, alphabet_id, alpha_len, BOOK_CONTENT_SYMBOLS);
    // `+ 1` so gallery origin (addr 0) is not the all-zero digit book.
    let addr = book_addr(z, n, book_index, &modulus) % &modulus;
    let content = ((&addr + BigUint::one()) * &c) % &modulus;
    let digits = int_to_digits(content, alpha_len, BOOK_CONTENT_SYMBOLS);
    let arc: Arc<[u16]> = Arc::from(digits.into_boxed_slice());
    if let Ok(mut guard) = cache.lock() {
        // Keep a small working set — each entry is ~2.5 MiB.
        if guard.len() >= 4 {
            guard.clear();
        }
        guard.insert(key, Arc::clone(&arc));
    }
    arc
}

const SCRAMBLE_BLOB_MAGIC: &[u8; 8] = b"LOBSCRv1";

/// Encode `(C, I, N)` for the book map into a portable LE blob (host gen tool).
#[must_use]
pub fn encode_book_scramble_blob(
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
    c: &BigUint,
    i: &BigUint,
    n: &BigUint,
) -> Vec<u8> {
    let c_b = c.to_bytes_le();
    let i_b = i.to_bytes_le();
    let n_b = n.to_bytes_le();
    let mut out = Vec::with_capacity(40 + c_b.len() + i_b.len() + n_b.len());
    out.extend_from_slice(SCRAMBLE_BLOB_MAGIC);
    out.extend_from_slice(&GENERATOR_VERSION.to_le_bytes());
    out.extend_from_slice(&universe_seed.to_le_bytes());
    out.extend_from_slice(&alphabet_id.to_le_bytes());
    out.extend_from_slice(&alpha_len.to_le_bytes());
    out.extend_from_slice(&(BOOK_CONTENT_SYMBOLS as u64).to_le_bytes());
    out.extend_from_slice(&(c_b.len() as u32).to_le_bytes());
    out.extend_from_slice(&(i_b.len() as u32).to_le_bytes());
    out.extend_from_slice(&(n_b.len() as u32).to_le_bytes());
    out.extend_from_slice(&c_b);
    out.extend_from_slice(&i_b);
    out.extend_from_slice(&n_b);
    out
}

/// Compute book-map `(C, I, N)` and encode (used by `gen_basile_scramble`).
///
/// # Panics
///
/// Same as uncached scramble for book length under `cfg(test)`.
#[must_use]
pub fn export_book_scramble_blob(universe_seed: u64, alphabet_id: u32, alpha_len: u32) -> Vec<u8> {
    let (c, i, n) =
        scramble_params_uncached(universe_seed, alphabet_id, alpha_len, BOOK_CONTENT_SYMBOLS);
    encode_book_scramble_blob(universe_seed, alphabet_id, alpha_len, &c, &i, &n)
}

#[cfg(not(test))]
fn decode_book_scramble_blob(
    bytes: &[u8],
) -> Option<(u64, u32, u32, usize, BigUint, BigUint, BigUint)> {
    if bytes.len() < 40 || &bytes[0..8] != SCRAMBLE_BLOB_MAGIC {
        return None;
    }
    let mut o = 8;
    let read_u32 = |buf: &[u8], o: &mut usize| -> Option<u32> {
        let v = u32::from_le_bytes(buf.get(*o..*o + 4)?.try_into().ok()?);
        *o += 4;
        Some(v)
    };
    let read_u64 = |buf: &[u8], o: &mut usize| -> Option<u64> {
        let v = u64::from_le_bytes(buf.get(*o..*o + 8)?.try_into().ok()?);
        *o += 8;
        Some(v)
    };
    let gen_ver = read_u32(bytes, &mut o)?;
    if gen_ver != GENERATOR_VERSION {
        return None;
    }
    let universe_seed = read_u64(bytes, &mut o)?;
    let alphabet_id = read_u32(bytes, &mut o)?;
    let alpha_len = read_u32(bytes, &mut o)?;
    let len = read_u64(bytes, &mut o)? as usize;
    let c_len = read_u32(bytes, &mut o)? as usize;
    let i_len = read_u32(bytes, &mut o)? as usize;
    let n_len = read_u32(bytes, &mut o)? as usize;
    if bytes.len() < o + c_len + i_len + n_len {
        return None;
    }
    let c = BigUint::from_bytes_le(&bytes[o..o + c_len]);
    o += c_len;
    let i = BigUint::from_bytes_le(&bytes[o..o + i_len]);
    o += i_len;
    let n = BigUint::from_bytes_le(&bytes[o..o + n_len]);
    Some((universe_seed, alphabet_id, alpha_len, len, c, i, n))
}

/// Baked default: universe `0` + Basile book map (`mise run gen-basile-scramble`).
#[cfg(not(test))]
static BAKED_DEFAULT_BOOK_SCRAMBLE: &[u8] = include_bytes!("../data/basile_book_scramble_u0.bin");

fn baked_book_scramble(
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
    len: usize,
) -> Option<(BigUint, BigUint, BigUint)> {
    // Host unit tests never ship the multi‑MiB blob; WASM/release does.
    #[cfg(test)]
    {
        let _ = (universe_seed, alphabet_id, alpha_len, len);
        None
    }
    #[cfg(not(test))]
    {
        if len != BOOK_CONTENT_SYMBOLS {
            return None;
        }
        let (blob_universe, blob_alphabet, blob_alpha_len, blob_len, factor_c, inv, modulus) =
            decode_book_scramble_blob(BAKED_DEFAULT_BOOK_SCRAMBLE)?;
        if blob_universe == universe_seed
            && blob_alphabet == alphabet_id
            && blob_alpha_len == alpha_len
            && blob_len == len
        {
            Some((factor_c, inv, modulus))
        } else {
            None
        }
    }
}

/// Precompute and cache `(C, I, N)` for the full-book Basile map.
///
/// Default universe + Basile loads from the baked blob (instant). Other
/// `(universe, alphabet)` pairs still compute on demand (can take minutes).
pub fn warm_book_scramble(universe_seed: u64, alphabet_id: u32, alpha_len: u32) {
    let _ = scramble_params(universe_seed, alphabet_id, alpha_len, BOOK_CONTENT_SYMBOLS);
}

/// Invert a full-book symbol stream → `(z, n, book_index)`.
///
/// # Panics
///
/// Debug-asserts `symbols.len() == BOOK_CONTENT_SYMBOLS`.
#[must_use]
pub fn invert_book_symbols(
    symbols: &[u16],
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
) -> (BigInt, BigInt, u32) {
    debug_assert_eq!(symbols.len(), BOOK_CONTENT_SYMBOLS);
    let (_c, i, modulus) =
        scramble_params(universe_seed, alphabet_id, alpha_len, BOOK_CONTENT_SYMBOLS);
    let content = digits_to_int(symbols, alpha_len) % &modulus;
    let raw = (content * i) % &modulus; // addr + 1 (mod N)
    let addr = if raw.is_zero() {
        &modulus - BigUint::one()
    } else {
        raw - BigUint::one()
    };
    unpack_book_addr(addr)
}

/// Virgin page symbols at `key` (page-linked Basile map).
#[must_use]
pub fn page_symbols_at(key: &PageKey, alpha_len: u32) -> [u16; PAGE_CONTENT_SYMBOLS] {
    debug_assert!((1..=4096).contains(&alpha_len));
    let (c, _i, n) = scramble_params(
        key.universe_seed,
        key.alphabet_id,
        alpha_len,
        PAGE_CONTENT_SYMBOLS,
    );
    let g = pair_gallery_mod(&key.z, &key.n, &n);
    let addr = (BigUint::from(key.page % PAGES_PER_BOOK)
        + BigUint::from(PAGES_PER_BOOK)
            * (BigUint::from(key.book_index % BOOKS_PER_GALLERY)
                + BigUint::from(BOOKS_PER_GALLERY) * g))
        % &n;
    let content = (addr * c) % n;
    let digits = int_to_digits(content, alpha_len, PAGE_CONTENT_SYMBOLS);
    digits_u16_to_page(&digits)
}

/// Invert a full page of symbols → page key (page-linked map).
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
    let g = pair_gallery_mod(z, n, &modulus);
    title_symbols_from_g(book_index, &g, &c, &modulus, alpha_len)
}

fn title_symbols_from_g(
    book_index: u32,
    g_mod: &BigUint,
    c: &BigUint,
    modulus: &BigUint,
    alpha_len: u32,
) -> [u16; TITLE_LEN] {
    let addr = (BigUint::from(book_index % BOOKS_PER_GALLERY)
        + BigUint::from(BOOKS_PER_GALLERY) * g_mod)
        % modulus;
    let content = (addr * c) % modulus;
    let digits = int_to_digits(content, alpha_len, TITLE_LEN);
    let mut out = [0u16; TITLE_LEN];
    out.copy_from_slice(&digits[..TITLE_LEN]);
    out
}

/// All 700 spine title symbol rows for a gallery — pairs `(z, n)` **once**.
#[must_use]
pub fn title_symbols_for_gallery(
    z: &BigInt,
    n: &BigInt,
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
) -> Vec<[u16; TITLE_LEN]> {
    let (c, _i, modulus) = scramble_params(universe_seed, alphabet_id, alpha_len, TITLE_LEN);
    let g = pair_gallery_mod(z, n, &modulus);
    (0..BOOKS_PER_GALLERY)
        .map(|i| title_symbols_from_g(i, &g, &c, &modulus, alpha_len))
        .collect()
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
    fn title_round_trip() {
        let alpha = 29u32;
        let z = BigInt::from(2);
        let n = BigInt::from(-3);
        let book = 15u32;
        let syms = title_symbols_at(&z, &n, book, 0, 29, alpha);
        let back = invert_title_symbols(&syms, 0, 29, alpha);
        assert_eq!(back, (z, n, book));
    }

    #[test]
    fn pair_gallery_mod_matches_full_pair() {
        let coords = [
            (BigInt::from(0), BigInt::from(0)),
            (BigInt::from(12), BigInt::from(-7)),
            (BigInt::from(-1), BigInt::from(1)),
            (
                BigInt::parse_bytes(b"999999999999999999999999999999", 10).unwrap(),
                BigInt::from(-42),
            ),
        ];
        // Odd moduli (2 invertible) and one even fallback.
        let moduli = [
            BigUint::from(29u32).pow(24u32),
            BigUint::from(10007u32),
            BigUint::from(64u32),
        ];
        for (z, n) in &coords {
            for m in &moduli {
                assert_eq!(
                    pair_gallery_mod(z, n, m),
                    pair_gallery(z, n) % m,
                    "z={z} n={n} m={m}"
                );
            }
        }
    }

    #[test]
    fn gallery_titles_match_per_book_at_huge_coords() {
        let z = BigInt::parse_bytes(b"9223372036854775808", 10).unwrap();
        let n = BigInt::from(-42);
        let batch = title_symbols_for_gallery(&z, &n, 0, 29, 29);
        assert_eq!(batch.len(), BOOKS_PER_GALLERY as usize);
        for (i, row) in batch.iter().enumerate() {
            let one = title_symbols_at(&z, &n, i as u32, 0, 29, 29);
            assert_eq!(row, &one, "book {i}");
        }
        let titles = crate::gallery::gallery_titles(&z, &n, 29, 0, None);
        let spine0 = crate::search::spine_title_at(&z, &n, 0, 29, 0);
        assert_eq!(titles[0], spine0);
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
    fn hensel_inverse_medium_round_trip() {
        // Book-shaped map at a small length — never BOOK_CONTENT_SYMBOLS in CI.
        let len = 6_400usize;
        let alpha = 29u32;
        let (c, i, n) = scramble_params(0, 29, alpha, len);
        assert_eq!((&c * &i) % &n, BigUint::from(1u32));
        let mut digits = vec![0u16; len];
        for (idx, slot) in digits.iter_mut().enumerate() {
            *slot = ((idx * 7 + 3) % 29) as u16;
        }
        let content = digits_to_int(&digits, alpha) % &n;
        let addr = (&content * &i) % &n;
        let back = (&addr * &c) % &n;
        assert_eq!(content, back);
        assert_eq!(int_to_digits(back, alpha, len), digits);
    }
}
