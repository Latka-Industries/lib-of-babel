//! Reversible Feistel PRP over page symbols and address embedding.

use crate::config::{
    ADDR_SYMBOLS, FEISTEL_ROUNDS, GENERATOR_VERSION, MAX_ALPHABET_LEN, PAGE_CONTENT_SYMBOLS,
};
use crate::gallery::{book_seed, gallery_seed};
use crate::prng::{mix2, splitmix64};

/// Per-alphabet Feistel base key (version + alphabet id).
#[inline]
pub fn feistel_key(alphabet_id: u32) -> u64 {
    mix2(
        splitmix64((GENERATOR_VERSION as u64).wrapping_mul(0xA5A5_5A5A_F0F0_0F0F)),
        splitmix64(alphabet_id as u64),
    )
}

#[inline]
fn round_key(base: u64, round: u32) -> u64 {
    splitmix64(base ^ (round as u64).wrapping_mul(0x1234_5678_9ABC_DEF0))
}

#[inline]
fn feistel_f(right: u16, round: u32, pos: usize, base_key: u64, alpha_len: u16) -> u16 {
    let rk = round_key(base_key, round);
    let x = rk
        .wrapping_add(pos as u64)
        .wrapping_add((right as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15));
    (splitmix64(x) % u64::from(alpha_len)) as u16
}

/// Apply the Feistel PRP in place over one page's symbol array.
pub fn feistel_encrypt(state: &mut [u16; PAGE_CONTENT_SYMBOLS], base_key: u64, alpha_len: u16) {
    debug_assert!((1..=MAX_ALPHABET_LEN).contains(&alpha_len));
    let half = PAGE_CONTENT_SYMBOLS / 2;
    let mut scratch = [0u16; PAGE_CONTENT_SYMBOLS];
    let modulus = u32::from(alpha_len);
    for round in 0..FEISTEL_ROUNDS {
        for i in 0..half {
            let f = feistel_f(state[half + i], round, i, base_key, alpha_len);
            scratch[i] = state[half + i];
            scratch[half + i] = ((u32::from(state[i]) + u32::from(f)) % modulus) as u16;
        }
        state.copy_from_slice(&scratch);
    }
}

#[cfg(test)]
pub fn feistel_decrypt(state: &mut [u16; PAGE_CONTENT_SYMBOLS], base_key: u64, alpha_len: u16) {
    debug_assert!((1..=MAX_ALPHABET_LEN).contains(&alpha_len));
    let half = PAGE_CONTENT_SYMBOLS / 2;
    let mut scratch = [0u16; PAGE_CONTENT_SYMBOLS];
    let modulus = u32::from(alpha_len);
    for round in (0..FEISTEL_ROUNDS).rev() {
        for i in 0..half {
            let f = feistel_f(state[i], round, i, base_key, alpha_len);
            scratch[half + i] = state[i];
            scratch[i] = ((u32::from(state[half + i]) + modulus - u32::from(f)) % modulus) as u16;
        }
        state.copy_from_slice(&scratch);
    }
}

/// Pack `(universe, z, n, book, page)` into 32 bytes for address embedding.
pub fn pack_page_address(
    universe_seed: u64,
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
) -> [u8; 32] {
    let mut p = [0u8; 32];
    p[0..8].copy_from_slice(&universe_seed.to_le_bytes());
    p[8..16].copy_from_slice(&z.to_le_bytes());
    p[16..24].copy_from_slice(&n.to_le_bytes());
    p[24..28].copy_from_slice(&book_index.to_le_bytes());
    p[28..32].copy_from_slice(&page.to_le_bytes());
    p
}

#[cfg(test)]
pub fn unpack_page_address(packed: &[u8; 32]) -> (u64, i64, i64, u32, u32) {
    use crate::config::{BOOKS_PER_GALLERY, PAGES_PER_BOOK};
    let universe_seed = u64::from_le_bytes(packed[0..8].try_into().unwrap());
    let z = i64::from_le_bytes(packed[8..16].try_into().unwrap());
    let n = i64::from_le_bytes(packed[16..24].try_into().unwrap());
    let book_index = u32::from_le_bytes(packed[24..28].try_into().unwrap()) % BOOKS_PER_GALLERY;
    let page = u32::from_le_bytes(packed[28..32].try_into().unwrap()) % PAGES_PER_BOOK;
    (universe_seed, z, n, book_index, page)
}

fn embed_packed(state: &mut [u16; PAGE_CONTENT_SYMBOLS], packed: &[u8; 32], alpha_len: u16) {
    debug_assert!(alpha_len > 0);
    for (i, &b) in packed.iter().enumerate() {
        let b = u16::from(b);
        state[2 * i] = b % alpha_len;
        state[2 * i + 1] = b / alpha_len;
    }
}

/// Pre-Feistel plaintext: embedded address + room book-seed fill for the rest.
///
/// Alphabet enters later via `alpha_len` (symbol modulus) and the Feistel key.
pub fn plaintext_from_address(
    universe_seed: u64,
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alpha_len: u16,
) -> [u16; PAGE_CONTENT_SYMBOLS] {
    debug_assert!((1..=MAX_ALPHABET_LEN).contains(&alpha_len));
    let mut state = [0u16; PAGE_CONTENT_SYMBOLS];
    let packed = pack_page_address(universe_seed, z, n, book_index, page);
    embed_packed(&mut state, &packed, alpha_len);

    let gs = gallery_seed(z, n, universe_seed);
    let bs = book_seed(gs, book_index);

    let mut h = blake3::Hasher::new();
    h.update(b"lob:page:fill");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&packed);
    h.update(&bs.to_le_bytes());
    h.update(&page.to_le_bytes());
    let mut xof = h.finalize_xof();
    let mut buf = [0u8; 32];
    let mut buf_pos = 32; // force initial XOF fill
    let modulus = u32::from(alpha_len);
    for slot in state.iter_mut().skip(ADDR_SYMBOLS) {
        if buf_pos + 2 > 32 {
            xof.fill(&mut buf);
            buf_pos = 0;
        }
        let v = u16::from_le_bytes([buf[buf_pos], buf[buf_pos + 1]]);
        buf_pos += 2;
        *slot = (u32::from(v) % modulus) as u16;
    }
    state
}
