//! Gallery seeds, fingerprints, titles, and lattice navigation.
//!
//! Room identity (`gallery_seed` / `node_hash`) is a pure function of
//! `(universe, z, n, generator_version)`. Alphabet is a **lens**: it rewrites
//! spines and pages at the same address without changing the room hash or sigil.

use crate::config::{
    BOOKS_PER_GALLERY, BOOKS_PER_SHELF, GENERATOR_VERSION, SHELVES_PER_WALL, alphabet,
};
use crate::prng::{book_title, mix2, splitmix64};

/// Seed for the gallery at coordinate `(z, n)` within a universe.
///
/// Alphabet is intentionally not mixed in — it is a view lens over this room.
#[inline]
#[must_use]
pub fn gallery_seed(z_coord: i64, n_coord: i64, universe_seed: u64) -> u64 {
    let coord_mix = mix2(z_coord as u64, n_coord as u64);
    let version_mix =
        splitmix64(coord_mix ^ (GENERATOR_VERSION as u64).wrapping_mul(0xA5A5_5A5A_F0F0_0F0F));
    splitmix64(version_mix ^ universe_seed.wrapping_mul(0xC2B2_AE3D_27D4_EB4F))
}

/// Seed for one book, addressed within a gallery by its flat shelf index.
#[inline]
#[must_use]
pub fn book_seed(gallery_seed: u64, book_index: u32) -> u64 {
    mix2(gallery_seed, book_index as u64)
}

/// The 700 spine titles for a gallery, in shelf order.
///
/// When `title_embed` is set, the canonical book for that normalized title shows
/// the searched string on its spine (mirrors content-search embed).
#[must_use]
pub fn gallery_titles(
    z: i64,
    n: i64,
    alphabet_id: u32,
    universe_seed: u64,
    title_embed: Option<&str>,
) -> Vec<String> {
    let gs = gallery_seed(z, n, universe_seed);
    let ab = alphabet(alphabet_id);
    (0..BOOKS_PER_GALLERY)
        .map(|i| {
            if let Some(flat) = title_embed
                && crate::search::title_embeds_at(z, n, i, flat, alphabet_id, universe_seed)
            {
                return flat.to_string();
            }
            book_title(book_seed(gs, i), ab)
        })
        .collect()
}

/// BLAKE3 (256-bit) **room** fingerprint — stable across alphabet lenses.
///
/// Hashes the 700 book-slot seeds (derived from room identity). Text under a
/// given alphabet is a separate projection and does not enter this digest.
#[must_use]
pub fn node_hash_bytes(z: i64, n: i64, universe_seed: u64) -> [u8; 32] {
    let gs = gallery_seed(z, n, universe_seed);
    let mut h = blake3::Hasher::new();
    h.update(b"lob:room:1");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&universe_seed.to_le_bytes());
    h.update(&z.to_le_bytes());
    h.update(&n.to_le_bytes());
    for i in 0..BOOKS_PER_GALLERY {
        h.update(&book_seed(gs, i).to_le_bytes());
    }
    *h.finalize().as_bytes()
}

/// 64-bit prefix of the full fingerprint — compact header hash and palette seed.
#[must_use]
pub fn node_fingerprint(z: i64, n: i64, universe_seed: u64) -> u64 {
    let hash = node_hash_bytes(z, n, universe_seed);
    let mut prefix = [0u8; 8];
    prefix.copy_from_slice(&hash[0..8]);
    u64::from_be_bytes(prefix)
}

/// Map flat book index to `(wall, shelf, book_on_shelf)` — all zero-based.
#[inline]
#[must_use]
pub fn book_index_to_shelf(book_index: u32) -> (u32, u32, u32) {
    let per_wall = SHELVES_PER_WALL * BOOKS_PER_SHELF;
    let wall = book_index / per_wall;
    let rem = book_index % per_wall;
    let shelf = rem / BOOKS_PER_SHELF;
    let book_on_shelf = rem % BOOKS_PER_SHELF;
    (wall, shelf, book_on_shelf)
}

/// Returns the neighbor coordinate for a move: 0=left, 1=right, 2=up, 3=down.
#[must_use]
pub fn neighbor(z: i64, n: i64, mv: u8) -> (i64, i64) {
    match mv {
        0 => (z, n - 1),
        1 => (z, n + 1),
        2 => (z + 1, n),
        _ => (z - 1, n),
    }
}
