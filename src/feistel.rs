//! Reversible Feistel PRP over page symbols and address embedding.

use crate::config::{
    ADDR_SYMBOLS, BOOKS_PER_GALLERY, FEISTEL_ROUNDS, GENERATOR_VERSION, PAGE_CONTENT_SYMBOLS,
    PAGES_PER_BOOK,
};
use crate::gallery::{book_seed, gallery_seed};
use crate::prng::{mix2, splitmix64};

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
fn feistel_f(right: u8, round: u32, pos: usize, base_key: u64, alpha_len: u8) -> u8 {
    let rk = round_key(base_key, round);
    let x = rk
        .wrapping_add(pos as u64)
        .wrapping_add((right as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15));
    (splitmix64(x) % alpha_len as u64) as u8
}

pub fn feistel_encrypt(state: &mut [u8; PAGE_CONTENT_SYMBOLS], base_key: u64, alpha_len: u8) {
    let half = PAGE_CONTENT_SYMBOLS / 2;
    let mut scratch = [0u8; PAGE_CONTENT_SYMBOLS];
    for round in 0..FEISTEL_ROUNDS {
        for i in 0..half {
            let f = feistel_f(state[half + i], round, i, base_key, alpha_len);
            scratch[i] = state[half + i];
            scratch[half + i] = (state[i] + f) % alpha_len;
        }
        state.copy_from_slice(&scratch);
    }
}

#[cfg(test)]
pub fn feistel_decrypt(state: &mut [u8; PAGE_CONTENT_SYMBOLS], base_key: u64, alpha_len: u8) {
    let half = PAGE_CONTENT_SYMBOLS / 2;
    let mut scratch = [0u8; PAGE_CONTENT_SYMBOLS];
    for round in (0..FEISTEL_ROUNDS).rev() {
        for i in 0..half {
            let f = feistel_f(state[i], round, i, base_key, alpha_len);
            scratch[half + i] = state[i];
            scratch[i] = (state[half + i] + alpha_len - f) % alpha_len;
        }
        state.copy_from_slice(&scratch);
    }
}

pub fn pack_page_address(universe_seed: u64, z: i64, n: i64, book_index: u32, page: u32) -> [u8; 32] {
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
    let universe_seed = u64::from_le_bytes(packed[0..8].try_into().unwrap());
    let z = i64::from_le_bytes(packed[8..16].try_into().unwrap());
    let n = i64::from_le_bytes(packed[16..24].try_into().unwrap());
    let book_index =
        u32::from_le_bytes(packed[24..28].try_into().unwrap()) % BOOKS_PER_GALLERY;
    let page = u32::from_le_bytes(packed[28..32].try_into().unwrap()) % PAGES_PER_BOOK;
    (universe_seed, z, n, book_index, page)
}

fn embed_packed(state: &mut [u8; PAGE_CONTENT_SYMBOLS], packed: &[u8; 32], alpha_len: u8) {
    for (i, &b) in packed.iter().enumerate() {
        state[2 * i] = b % alpha_len;
        state[2 * i + 1] = b / alpha_len;
    }
}

/// Pre-Feistel plaintext: embedded address + book-seed-keyed fill for the rest.
pub fn plaintext_from_address(
    universe_seed: u64,
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
    alpha_len: u8,
) -> [u8; PAGE_CONTENT_SYMBOLS] {
    let mut state = [0u8; PAGE_CONTENT_SYMBOLS];
    let packed = pack_page_address(universe_seed, z, n, book_index, page);
    embed_packed(&mut state, &packed, alpha_len);

    let gs = gallery_seed(z, n, alphabet_id, universe_seed);
    let bs = book_seed(gs, book_index);

    let mut h = blake3::Hasher::new();
    h.update(b"lob:page:fill");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&packed);
    h.update(&bs.to_le_bytes());
    h.update(&page.to_le_bytes());
    let mut xof = h.finalize_xof();
    let mut buf = [0u8; 32];
    for i in ADDR_SYMBOLS..PAGE_CONTENT_SYMBOLS {
        let off = (i - ADDR_SYMBOLS) % 32;
        if off == 0 {
            xof.fill(&mut buf);
        }
        state[i] = buf[off] % alpha_len;
    }
    state
}
