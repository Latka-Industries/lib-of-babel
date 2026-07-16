//! Glyph index → flat string and content-locate for mosaics.

use crate::search::{LocateError, LocateResult};

pub(crate) fn indices_to_flat(indices: &[u16], ab: &[&str]) -> String {
    let mut out = String::with_capacity(indices.len().saturating_mul(2));
    for &i in indices {
        out.push_str(ab[i as usize]);
    }
    out
}

/// Mosaic reverse lookup — same address rules as content [`locate_page`]
/// (long / full-book flats clamp so the embed always fits).
pub fn locate_mosaic_flat(
    flat: &str,
    alphabet_id: u32,
    universe_seed: u64,
) -> Result<LocateResult, LocateError> {
    crate::search::locate_page(flat, alphabet_id, universe_seed)
}
