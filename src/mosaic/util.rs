//! Shared mosaic helpers: alphabet context, diffs, hit JSON.

use std::cmp::Ordering;

use crate::config::alphabet;
use crate::search::{LocateError, LocateResult, symbols_to_flat};
use crate::utils::JsonObject;

use super::project::{Accent, PhotoPaletteKind, alphabet_space_idx};

pub(crate) const ERR_BOOK_GRID: &str =
    r#"{"ok":false,"error":"image must match the full-book colour grid"}"#;

pub(crate) fn indices_to_flat(indices: &[u16], ab: &[&str]) -> String {
    symbols_to_flat(indices, ab)
}

/// Mosaic reverse lookup — same address rules as content [`locate_page`]
/// (long / full-book flats clamp so the embed always fits).
pub(crate) fn locate_mosaic_flat(
    flat: &str,
    alphabet_id: u32,
    universe_seed: u64,
) -> Result<LocateResult, LocateError> {
    crate::search::locate_page(flat, alphabet_id, universe_seed)
}

/// Alphabet slice + space cell index (+ length) for one lens.
pub(crate) fn alphabet_ctx(alphabet_id: u32) -> (&'static [&'static str], usize, u32) {
    let ab = alphabet(alphabet_id);
    (ab, alphabet_space_idx(ab), ab.len() as u32)
}

pub(crate) fn palette_for(ab: &[&str], accent: Accent, kind: PhotoPaletteKind) -> Vec<[u8; 3]> {
    kind.build(ab, accent)
}

/// Per-pixel `|src − mosaic|` (alpha forced opaque). Exact babel decode → near black.
pub(crate) fn rgba_abs_diff(src: &[u8], mosaic: &[u8]) -> Vec<u8> {
    let n = src.len().min(mosaic.len());
    let mut out = vec![0u8; n];
    let mut i = 0;
    while i + 3 < n {
        out[i] = src[i].abs_diff(mosaic[i]);
        out[i + 1] = src[i + 1].abs_diff(mosaic[i + 1]);
        out[i + 2] = src[i + 2].abs_diff(mosaic[i + 2]);
        out[i + 3] = 255;
        i += 4;
    }
    out
}

pub(crate) fn by_percent_desc(a: f64, b: f64) -> Ordering {
    b.partial_cmp(&a).unwrap_or(Ordering::Equal)
}

pub(crate) struct JsonHit<'a> {
    /// RMS fit % (display).
    pub percent: f64,
    /// Mean abs RGB error 0..255.
    pub mae: f64,
    /// Pearson RGB correlation.
    pub corr: f64,
    pub z: &'a num_bigint::BigInt,
    pub n: &'a num_bigint::BigInt,
    pub book: u32,
    pub page: u32,
    pub page_span: u32,
    pub hue: f64,
    pub chroma: f64,
    pub light: f64,
    pub space_threshold: f64,
    pub dither: bool,
    pub label: &'a str,
    pub alphabet_id: u32,
    /// Babel exact uses tighter float precision than photo candidates.
    pub babel_exact: bool,
}

fn write_hit_json(out: &mut String, h: &JsonHit<'_>) {
    // Compact z/n — never emit megadigit decimals into JSON (freezes JS).
    let z = crate::gallery::format_coord(h.z);
    let n = crate::gallery::format_coord(h.n);
    // babel exact → tighter floats + page scope; photo candidates → book scope.
    let (p_pct, p_mae, p_corr, p_hue, p_chr, p_lit, scope) = if h.babel_exact {
        (4, 6, 6, 6, 6, 6, "page")
    } else {
        (2, 3, 4, 3, 4, 4, "book")
    };

    let mut obj = JsonObject::begin(out);
    obj.f64("percent", h.percent, p_pct);
    obj.f64("mae", h.mae, p_mae);
    obj.f64("corr", h.corr, p_corr);
    obj.str("z", &z);
    obj.str("n", &n);
    obj.u32("book", h.book);
    obj.u32("page", h.page + 1);
    obj.u32("page_span", h.page_span);
    obj.f64("hue", h.hue, p_hue);
    obj.f64("chroma", h.chroma, p_chr);
    obj.f64("light", h.light, p_lit);
    if h.babel_exact {
        obj.raw("space_threshold", "0");
        obj.bool("dither", false);
    } else {
        obj.f64("space_threshold", h.space_threshold, 2);
        obj.bool("dither", h.dither);
    }
    obj.str("label", h.label);
    obj.u32("alphabet", h.alphabet_id);
    obj.str("scope", scope);
    obj.finish();
}

pub(crate) fn json_results(hits: &[JsonHit<'_>]) -> String {
    let mut out = String::from(r#"{"ok":true,"results":["#);
    for (i, h) in hits.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        write_hit_json(&mut out, h);
    }
    out.push_str("]}");
    out
}
