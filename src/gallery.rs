//! Gallery seeds, fingerprints, titles, and lattice navigation.

use crate::config::{alphabet, BOOKS_PER_GALLERY, BOOKS_PER_SHELF, GENERATOR_VERSION, SHELVES_PER_WALL};
use crate::prng::{book_title, mix2, splitmix64};

/// Seed for the gallery at coordinate `(z, n)` within an alphabet + universe.
#[inline]
pub fn gallery_seed(z: i64, n: i64, alphabet_id: u32, universe_seed: u64) -> u64 {
    let s = mix2(z as u64, n as u64);
    let v = splitmix64(s ^ (GENERATOR_VERSION as u64).wrapping_mul(0xA5A5_5A5A_F0F0_0F0F));
    let a = splitmix64(v ^ (alphabet_id as u64).wrapping_mul(0x9E37_79B1_85EB_CA87));
    splitmix64(a ^ universe_seed.wrapping_mul(0xC2B2_AE3D_27D4_EB4F))
}

/// Seed for one book, addressed within a gallery by its flat shelf index.
#[inline]
pub fn book_seed(gallery_seed: u64, book_index: u32) -> u64 {
    mix2(gallery_seed, book_index as u64)
}

/// The 700 spine titles for a gallery, in shelf order.
pub fn gallery_titles(z: i64, n: i64, alphabet_id: u32, universe_seed: u64) -> Vec<String> {
    let gs = gallery_seed(z, n, alphabet_id, universe_seed);
    let ab = alphabet(alphabet_id);
    (0..BOOKS_PER_GALLERY)
        .map(|i| book_title(book_seed(gs, i), ab))
        .collect()
}

/// BLAKE3 (256-bit) fingerprint over the canonical 700 book identities.
pub fn node_hash_bytes(z: i64, n: i64, alphabet_id: u32, universe_seed: u64) -> [u8; 32] {
    let gs = gallery_seed(z, n, alphabet_id, universe_seed);
    let mut h = blake3::Hasher::new();
    h.update(b"lob:node:1");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&universe_seed.to_le_bytes());
    h.update(&alphabet_id.to_le_bytes());
    h.update(&z.to_le_bytes());
    h.update(&n.to_le_bytes());
    for i in 0..BOOKS_PER_GALLERY {
        h.update(&book_seed(gs, i).to_le_bytes());
    }
    *h.finalize().as_bytes()
}

/// 64-bit prefix of the full fingerprint — compact header hash and palette seed.
pub fn node_fingerprint(z: i64, n: i64, alphabet_id: u32, universe_seed: u64) -> u64 {
    let b = node_hash_bytes(z, n, alphabet_id, universe_seed);
    u64::from_be_bytes(b[..8].try_into().unwrap())
}

#[inline]
pub fn book_index_to_shelf(book_index: u32) -> (u32, u32, u32) {
    let per_wall = SHELVES_PER_WALL * BOOKS_PER_SHELF;
    let wall = book_index / per_wall;
    let rem = book_index % per_wall;
    let shelf = rem / BOOKS_PER_SHELF;
    let book_on_shelf = rem % BOOKS_PER_SHELF;
    (wall, shelf, book_on_shelf)
}

/// Returns the neighbor coordinate for a move: 0=left, 1=right, 2=up, 3=down.
pub fn neighbor(z: i64, n: i64, mv: u8) -> (i64, i64) {
    match mv {
        0 => (z, n - 1),
        1 => (z, n + 1),
        2 => (z + 1, n),
        _ => (z - 1, n),
    }
}
