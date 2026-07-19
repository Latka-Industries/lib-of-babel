//! Gallery seeds, fingerprints, titles, and lattice navigation.
//!
//! Room identity (`gallery_seed` / `node_hash`) is a pure function of
//! `(universe, z, n, generator_version)`. Alphabet is a **lens**: it rewrites
//! spines and pages at the same address without changing the room hash or sigil.

use num_bigint::{BigInt, Sign};
use num_traits::Zero;

use crate::config::{BOOKS_PER_GALLERY, BOOKS_PER_SHELF, GENERATOR_VERSION, SHELVES_PER_WALL};
use crate::utils::mix2;

const B64URL: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/// Encode a byte slice as a base64url string.
#[must_use]
fn b64url_encode(data: &[u8]) -> String {
    let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
    let mut i = 0;
    while i + 3 <= data.len() {
        let n = (u32::from(data[i]) << 16) | (u32::from(data[i + 1]) << 8) | u32::from(data[i + 2]);
        out.push(B64URL[((n >> 18) & 63) as usize] as char);
        out.push(B64URL[((n >> 12) & 63) as usize] as char);
        out.push(B64URL[((n >> 6) & 63) as usize] as char);
        out.push(B64URL[(n & 63) as usize] as char);
        i += 3;
    }
    let rem = data.len() - i;
    if rem == 1 {
        let n = u32::from(data[i]) << 16;
        out.push(B64URL[((n >> 18) & 63) as usize] as char);
        out.push(B64URL[((n >> 12) & 63) as usize] as char);
    } else if rem == 2 {
        let n = (u32::from(data[i]) << 16) | (u32::from(data[i + 1]) << 8);
        out.push(B64URL[((n >> 18) & 63) as usize] as char);
        out.push(B64URL[((n >> 12) & 63) as usize] as char);
        out.push(B64URL[((n >> 6) & 63) as usize] as char);
    }
    out
}

/// Decode a base64url string as a byte slice.
#[must_use]
fn b64url_decode(input: &str) -> Option<Vec<u8>> {
    fn val(byte: u8) -> Option<u8> {
        match byte {
            b'A'..=b'Z' => Some(byte - b'A'),
            b'a'..=b'z' => Some(byte - b'a' + 26),
            b'0'..=b'9' => Some(byte - b'0' + 52),
            b'-' => Some(62),
            b'_' => Some(63),
            _ => None,
        }
    }
    let bytes = input.as_bytes();
    if bytes.is_empty() {
        return Some(Vec::new());
    }
    let mut out = Vec::with_capacity(bytes.len().div_ceil(4) * 3);
    let mut idx = 0;
    while idx < bytes.len() {
        let remain = bytes.len() - idx;
        if remain == 1 {
            return None;
        }
        let s0 = val(bytes[idx])?;
        let s1 = val(bytes[idx + 1])?;
        out.push((s0 << 2) | (s1 >> 4));
        if remain >= 3 {
            let s2 = val(bytes[idx + 2])?;
            out.push((s1 << 4) | (s2 >> 2));
            if remain >= 4 {
                let s3 = val(bytes[idx + 3])?;
                out.push((s2 << 6) | s3);
            }
        }
        idx += 4.min(remain);
    }
    Some(out)
}

/// Format a coordinate for WASM/JS: short decimal, or `c` + base64url(sign‖BE mag).
///
/// Uses byte length of the magnitude (not decimal `to_string`) so book-linked
/// megadigit axes never allocate a full decimal string just to decide encoding.
#[must_use]
pub fn format_coord(v: &BigInt) -> String {
    let (sign, mag) = v.to_bytes_be();
    // ≤10 bytes ≈ ≤24 decimal digits — safe for plain decimal in URLs/JSON.
    if mag.len() <= 10 {
        return v.to_string();
    }
    let mut raw = Vec::with_capacity(1 + mag.len().max(1));
    raw.push(u8::from(sign == Sign::Minus));
    if mag.is_empty() {
        raw.push(0);
    } else {
        raw.extend_from_slice(&mag);
    }
    format!("c{}", b64url_encode(&raw))
}

/// Parse a decimal or compact (`c…`) `BigInt` coordinate from WASM/JS.
#[must_use]
pub fn parse_coord(s: &str) -> BigInt {
    let s = s.trim();
    // Compact form: `c` + base64url (never a plain decimal).
    if let Some(rest) = s.strip_prefix('c')
        && !rest.is_empty()
        && let Some(bytes) = b64url_decode(rest)
        && !bytes.is_empty()
    {
        let neg = bytes[0] == 1;
        let mag = if bytes.len() == 1 {
            vec![0]
        } else {
            bytes[1..].to_vec()
        };
        let n = BigInt::from_bytes_be(Sign::Plus, &mag);
        return if neg { -n } else { n };
    }
    BigInt::parse_bytes(s.as_bytes(), 10).unwrap_or_else(BigInt::zero)
}

fn hash_coord_bytes(h: &mut blake3::Hasher, label: &[u8], v: &BigInt) {
    let bytes = v.to_signed_bytes_le();
    h.update(label);
    h.update(&(bytes.len() as u64).to_le_bytes());
    h.update(&bytes);
}

/// Seed for the gallery at coordinate `(z, n)` within a universe.
///
/// Alphabet is intentionally not mixed in — it is a view lens over this room.
/// Coordinates are hashed as signed little-endian `BigInt` bytes (not cast to i64).
#[inline]
#[must_use]
pub fn gallery_seed(z_coord: &BigInt, n_coord: &BigInt, universe_seed: u64) -> u64 {
    let mut h = blake3::Hasher::new();
    h.update(b"lob:gallery:seed:1");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&universe_seed.to_le_bytes());
    hash_coord_bytes(&mut h, b"z", z_coord);
    hash_coord_bytes(&mut h, b"n", n_coord);
    let digest = h.finalize();
    let mut prefix = [0u8; 8];
    prefix.copy_from_slice(&digest.as_bytes()[0..8]);
    u64::from_le_bytes(prefix)
}

/// Seed for one book, addressed within a gallery by its flat shelf index.
#[inline]
#[must_use]
pub fn book_seed(gallery_seed: u64, book_index: u32) -> u64 {
    mix2(gallery_seed, book_index as u64)
}

/// The 700 spine titles for a gallery, in shelf order.
///
/// When `title_embed` is set, the canonical book for that title still uses the
/// Basile spine map (the searched string is a substring of the virgin title).
#[must_use]
pub fn gallery_titles(
    z: &BigInt,
    n: &BigInt,
    alphabet_id: u32,
    universe_seed: u64,
    title_embed: Option<&str>,
) -> Vec<String> {
    let _ = title_embed; // highlight is UI-side; spines are always virgin Basile titles
    let ab = crate::config::alphabet(alphabet_id);
    let alpha_len = ab.len() as u32;
    let rows =
        crate::basile::title_symbols_for_gallery(z, n, universe_seed, alphabet_id, alpha_len);
    rows.into_iter()
        .map(|syms| {
            let mut out = String::with_capacity(crate::config::TITLE_LEN * 4);
            for &s in &syms {
                out.push_str(ab[s as usize]);
            }
            out.trim().to_string()
        })
        .collect()
}

/// BLAKE3 (256-bit) **room** fingerprint — stable across alphabet lenses.
///
/// Hashes the 700 book-slot seeds (derived from room identity). Text under a
/// given alphabet is a separate projection and does not enter this digest.
#[must_use]
pub fn node_hash_bytes(z: &BigInt, n: &BigInt, universe_seed: u64) -> [u8; 32] {
    let gs = gallery_seed(z, n, universe_seed);
    let mut h = blake3::Hasher::new();
    h.update(b"lob:room:1");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&universe_seed.to_le_bytes());
    hash_coord_bytes(&mut h, b"z", z);
    hash_coord_bytes(&mut h, b"n", n);
    for i in 0..BOOKS_PER_GALLERY {
        h.update(&book_seed(gs, i).to_le_bytes());
    }
    *h.finalize().as_bytes()
}

/// 64-bit prefix of the full fingerprint — compact header hash and palette seed.
#[must_use]
pub fn node_fingerprint(z: &BigInt, n: &BigInt, universe_seed: u64) -> u64 {
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
pub fn neighbor(z: &BigInt, n: &BigInt, mv: u8) -> (BigInt, BigInt) {
    match mv {
        0 => (z.clone(), n - 1),
        1 => (z.clone(), n + 1),
        2 => (z + 1, n.clone()),
        _ => (z - 1, n.clone()),
    }
}

#[cfg(test)]
mod coord_format_tests {
    use super::*;

    #[test]
    fn format_parse_coord_round_trip() {
        let cases = [
            BigInt::from(0),
            BigInt::from(-7),
            BigInt::from(12),
            BigInt::parse_bytes(b"999999999999999999999999999999", 10).unwrap(),
            -BigInt::parse_bytes(b"123456789012345678901234567890", 10).unwrap(),
        ];
        for v in &cases {
            let enc = format_coord(v);
            let back = parse_coord(&enc);
            assert_eq!(&back, v, "enc={enc}");
        }
    }

    #[test]
    fn huge_coord_uses_compact_prefix() {
        // >10 magnitude bytes → `c…`
        let v = BigInt::from(1) << 100;
        let enc = format_coord(&v);
        assert!(enc.starts_with('c'), "enc={enc}");
        assert_eq!(parse_coord(&enc), v);
    }
}
