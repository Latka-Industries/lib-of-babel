//! Virgin page / book / title symbol maps and their inverses.

use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

use num_bigint::{BigInt, BigUint};
use num_traits::{One, Zero};

use crate::config::{
    BOOK_CONTENT_SYMBOLS, BOOKS_PER_GALLERY, GENERATOR_VERSION, PAGE_CONTENT_SYMBOLS, TITLE_LEN,
};

use super::digits::{digits_to_int, digits_u16_to_page, int_to_digits};
use super::pairing::{
    PageKey, book_addr, pack_book_addr_g, pack_page_addr, pair_gallery_mod, unpack_book_addr,
    unpack_page_index,
};
use super::scramble::scramble_params;

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
    let addr = pack_page_addr(key.book_index, key.page, &g) % &n;
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
    unpack_book_addr(addr)
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
    let addr = pack_book_addr_g(book_index, g_mod) % modulus;
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
