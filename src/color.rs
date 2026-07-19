//! Whole-book colour map rendered as an RGBA image.
//!
//! Palette policy (keep in sync with `web/js/lib/color.js` → `buildAlphabetPalette`):
//! - **Letters** use an index-hash OKLCH hue under the room accent (scales past 36 glyphs).
//! - **Punct / digits / symbols** sit on a short muted arc opposite the accent.
//! - **Space** is a fixed near-black (not on the wheel).

use num_bigint::BigInt;
use wasm_bindgen::prelude::*;

use crate::basile::book_symbols_at;
use crate::config::{
    BOOK_CONTENT_SYMBOLS, CHARS_PER_LINE, LINES_PER_PAGE, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK,
    alphabet,
};
use crate::gallery::node_fingerprint;
use crate::gallery::parse_coord;
use crate::page::{PageAddr, PageRender, page_symbols};
use crate::search::segment::text_to_cell_indices;
use crate::universe::universe;

/// Arc width for the punct/digit stratum (degrees).
const PUNCT_ARC_DEG: f64 = 52.0;
pub(crate) const SPACE_RGB: [u8; 3] = [0x15, 0x13, 0x1a];

/// Total colour cells in a full-book mosaic (`PAGES × 40 × 80`).
#[must_use]
pub fn book_cell_count() -> usize {
    (PAGES_PER_BOOK * LINES_PER_PAGE * CHARS_PER_LINE) as usize
}

/// Near-square width × height for [`book_image`] / mosaic encode (shared).
#[must_use]
pub fn book_grid_dims() -> (u32, u32) {
    let total = book_cell_count();
    let mut grid_side = (total as f64).sqrt() as usize;
    while !total.is_multiple_of(grid_side) {
        grid_side -= 1;
    }
    let height = grid_side as u32;
    let width = (total / grid_side) as u32;
    (width, height)
}

fn oklch_to_srgb(lightness: f64, chroma: f64, hue_deg: f64) -> [u8; 3] {
    let hue_rad = hue_deg * std::f64::consts::PI / 180.0;
    let oklab_a = chroma * hue_rad.cos();
    let oklab_b = chroma * hue_rad.sin();
    let l_ = lightness + 0.396_337_777_4 * oklab_a + 0.215_803_757_3 * oklab_b;
    let m_ = lightness - 0.105_561_345_8 * oklab_a - 0.063_854_172_8 * oklab_b;
    let s_ = lightness - 0.089_484_177_5 * oklab_a - 1.291_485_548 * oklab_b;
    let (l3, m3, s3) = (l_ * l_ * l_, m_ * m_ * m_, s_ * s_ * s_);
    let lin = [
        4.076_741_662_1 * l3 - 3.307_711_591_3 * m3 + 0.230_969_929_2 * s3,
        -1.268_438_004_6 * l3 + 2.609_757_401_1 * m3 - 0.341_319_396_5 * s3,
        -0.004_196_086_3 * l3 - 0.703_418_614_7 * m3 + 1.707_614_701 * s3,
    ];
    let mut out = [0u8; 3];
    for (i, &linear) in lin.iter().enumerate() {
        let gamma = if linear <= 0.003_130_8 {
            12.92 * linear
        } else {
            1.055 * linear.powf(1.0 / 2.4) - 0.055
        };
        out[i] = (gamma.clamp(0.0, 1.0) * 255.0).round() as u8;
    }
    out
}

/// Mix alphabet index into a stable 32-bit hash (Knuth multiplicative).
#[inline]
fn index_hash(idx: u32, salt: u32) -> u32 {
    idx.wrapping_mul(0x9E37_79B1)
        .wrapping_add(salt)
        .wrapping_mul(0x85EB_CA6B)
}

/// Build per-glyph RGB colours for an alphabet lens at a gallery accent.
pub(crate) fn build_glyph_palette(
    ab: &[&str],
    accent_hue: f64,
    accent_chroma: f64,
    accent_light: f64,
) -> Vec<[u8; 3]> {
    let len = ab.len();
    let mut palette = vec![SPACE_RGB; len];
    let mut puncts = Vec::with_capacity(8);

    for (i, cell) in ab.iter().enumerate() {
        if *cell == " " {
            palette[i] = SPACE_RGB;
        } else if cell.chars().any(char::is_alphabetic) {
            let h = index_hash(i as u32, 0xA11E_77E5);
            let hue = (accent_hue + f64::from(h % 360)).rem_euclid(360.0);
            let chroma = accent_chroma * (0.82 + 0.18 * f64::from((h >> 8) & 0xff) / 255.0);
            let light = (accent_light + 0.08 * (f64::from((h >> 16) & 0xff) / 255.0 - 0.5))
                .clamp(0.35, 0.85);
            palette[i] = oklch_to_srgb(light, chroma, hue);
        } else {
            puncts.push(i);
        }
    }

    let pn = puncts.len();
    if pn > 0 {
        let base = (accent_hue + 168.0).rem_euclid(360.0);
        let pstep = PUNCT_ARC_DEG / pn as f64;
        let light = (accent_light * 0.78).clamp(0.35, 0.75);
        let chroma = accent_chroma * 0.4;
        for (k, &idx) in puncts.iter().enumerate() {
            let hue = (base + k as f64 * pstep).rem_euclid(360.0);
            palette[idx] = oklch_to_srgb(light, chroma, hue);
        }
    }

    palette
}

/// Photo-mosaic palette: non-space glyphs on a lightness ramp (structure-first).
///
/// Reading colour maps ([`build_glyph_palette`]) scatter hues so alphabet text looks
/// speckled. Photos need the opposite — nearby greys must stay nearby — so we place
/// every non-space cell on an OKLCH lightness ladder with a subdued accent tint.
pub(crate) fn build_photo_luma_palette(
    ab: &[&str],
    accent_hue: f64,
    accent_chroma: f64,
    accent_light: f64,
) -> Vec<[u8; 3]> {
    let len = ab.len();
    let mut palette = vec![SPACE_RGB; len];
    let mut ramp = Vec::with_capacity(len);
    for (i, cell) in ab.iter().enumerate() {
        if *cell != " " {
            ramp.push(i);
        }
    }
    if ramp.is_empty() {
        return palette;
    }
    let mid = accent_light.clamp(0.35, 0.85);
    let lo = (mid - 0.38).clamp(0.06, 0.45);
    let hi = (mid + 0.38).clamp(0.55, 0.96);
    let chroma = (accent_chroma * 0.32).clamp(0.0, 0.12);
    let n = ramp.len();
    for (k, &idx) in ramp.iter().enumerate() {
        let t = if n == 1 {
            0.5
        } else {
            k as f64 / (n - 1) as f64
        };
        let light = lo + (hi - lo) * t;
        palette[idx] = oklch_to_srgb(light, chroma, accent_hue.rem_euclid(360.0));
    }
    palette
}

/// One RGBA image of a whole book, ready for `ctx.putImageData`.
#[wasm_bindgen]
pub struct BookImage {
    width: u32,
    height: u32,
    pixels: Vec<u8>,
}

#[wasm_bindgen]
impl BookImage {
    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn height(&self) -> u32 {
        self.height
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn pixels(&self) -> Vec<u8> {
        self.pixels.clone()
    }
}

#[wasm_bindgen]
#[must_use]
/// Render a whole book as an RGBA image (gallery palette keyed by fingerprint).
/// `z` / `n` are decimal strings (JS `String(bigint)`).
pub fn book_image(z: &str, n: &str, book_index: u32, alphabet_id: u32) -> BookImage {
    book_image_inner(
        &parse_coord(z),
        &parse_coord(n),
        book_index,
        alphabet_id,
        None,
    )
}

/// Same as [`book_image`], but embeds a full-book search string (mosaic / content hit).
#[wasm_bindgen]
#[must_use]
pub fn book_image_search(
    z: &str,
    n: &str,
    book_index: u32,
    alphabet_id: u32,
    search_flat: &str,
) -> BookImage {
    let flat = search_flat.trim();
    book_image_inner(
        &parse_coord(z),
        &parse_coord(n),
        book_index,
        alphabet_id,
        if flat.is_empty() { None } else { Some(flat) },
    )
}

/// Native helper — **page-linked** colour map (`BigInt` coords).
#[must_use]
pub fn book_image_at(z: &BigInt, n: &BigInt, book_index: u32, alphabet_id: u32) -> BookImage {
    book_image_inner(z, n, book_index, alphabet_id, None)
}

/// **Book-linked** colour map for photo Find / Babelgram proof (matches
/// [`crate::basile::invert_book_symbols`]).
#[must_use]
pub fn book_image_book_scope_at(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
) -> BookImage {
    let pixels =
        book_image_book_scope_pages_inner(z, n, book_index, alphabet_id, 0, PAGES_PER_BOOK);
    let (width, height) = book_grid_dims();
    BookImage {
        width,
        height,
        pixels,
    }
}

/// WASM: full-book colour map under the **book-linked** Basile map (`z`/`n` may be `c…`).
#[wasm_bindgen]
#[must_use]
pub fn book_image_book_scope(z: &str, n: &str, book_index: u32, alphabet_id: u32) -> BookImage {
    book_image_book_scope_at(&parse_coord(z), &parse_coord(n), book_index, alphabet_id)
}

/// Paint a full-book letter flat with the room accent palette (text Find → Babelgram).
///
/// Identity is the flat from [`crate::search::locate_book`] / photo Find — not a virgin
/// rematerialise of `(z, n, book)`, which would diverge from the planted query.
///
/// # Errors
///
/// String `JsValue` when the flat has invalid alphabet cells or is not exactly
/// [`BOOK_CONTENT_SYMBOLS`] cells (see [`book_image_from_flat_at`]).
#[wasm_bindgen]
pub fn book_image_from_flat(
    z: &str,
    n: &str,
    alphabet_id: u32,
    flat: &str,
) -> Result<BookImage, JsValue> {
    book_image_from_flat_at(&parse_coord(z), &parse_coord(n), alphabet_id, flat)
        .map_err(|e| JsValue::from_str(&e))
}

/// Native helper — paint [`BOOK_CONTENT_SYMBOLS`] cells from a letter flat.
///
/// # Errors
///
/// Returns an error string when `flat` contains a character that is not a cell of
/// the alphabet, or when the cell count is not exactly [`BOOK_CONTENT_SYMBOLS`].
pub fn book_image_from_flat_at(
    z: &BigInt,
    n: &BigInt,
    alphabet_id: u32,
    flat: &str,
) -> Result<BookImage, String> {
    let ab = alphabet(alphabet_id);
    let indices = text_to_cell_indices(flat, ab)
        .map_err(|(off, sample)| format!("invalid flat at byte {off}: {sample:?}"))?;
    if indices.len() != BOOK_CONTENT_SYMBOLS {
        return Err(format!(
            "flat must be {BOOK_CONTENT_SYMBOLS} cells, got {}",
            indices.len()
        ));
    }
    let universe_seed = universe();
    let palette = room_palette(z, n, alphabet_id, universe_seed);
    let pixels = paint_indices_rgba(&indices, &palette);
    let (width, height) = book_grid_dims();
    Ok(BookImage {
        width,
        height,
        pixels,
    })
}

/// Page-range RGBA strip for worker parallelization (THI-144).
/// `page_end` is exclusive; clamped to `[0, PAGES_PER_BOOK]`.
/// Flat cell order matches full [`book_image`] — stitch by byte offset
/// `page_start * PAGE_CONTENT_SYMBOLS * 4`.
#[wasm_bindgen]
#[must_use]
pub fn book_image_pages(
    z: &str,
    n: &str,
    book_index: u32,
    alphabet_id: u32,
    page_start: u32,
    page_end: u32,
) -> Vec<u8> {
    book_image_pages_inner(
        &parse_coord(z),
        &parse_coord(n),
        book_index,
        alphabet_id,
        page_start,
        page_end,
    )
}

/// Native helper for tests (`BigInt` coords).
#[must_use]
pub fn book_image_pages_at(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    page_start: u32,
    page_end: u32,
) -> Vec<u8> {
    book_image_pages_inner(z, n, book_index, alphabet_id, page_start, page_end)
}

fn book_image_inner(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    _search_flat: Option<&str>,
) -> BookImage {
    let pixels = book_image_pages_inner(z, n, book_index, alphabet_id, 0, PAGES_PER_BOOK);
    let (width, height) = book_grid_dims();
    BookImage {
        width,
        height,
        pixels,
    }
}

/// Paint glyph indices with a palette → interleaved RGBA (`len * 4`).
pub(crate) fn paint_indices_rgba(indices: &[u16], palette: &[[u8; 3]]) -> Vec<u8> {
    let mut pixels = vec![0u8; indices.len() * 4];
    for (i, &idx) in indices.iter().enumerate() {
        let rgb = palette[idx as usize];
        let o = i * 4;
        pixels[o] = rgb[0];
        pixels[o + 1] = rgb[1];
        pixels[o + 2] = rgb[2];
        pixels[o + 3] = 255;
    }
    pixels
}

fn room_palette(z: &BigInt, n: &BigInt, alphabet_id: u32, universe_seed: u64) -> Vec<[u8; 3]> {
    let ab = alphabet(alphabet_id);
    let [hue, chroma, light] = room_accent_at(z, n, universe_seed);
    build_glyph_palette(ab, hue, chroma, light)
}

fn book_image_pages_inner(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    page_start: u32,
    page_end: u32,
) -> Vec<u8> {
    let start = page_start.min(PAGES_PER_BOOK);
    let end = page_end.min(PAGES_PER_BOOK).max(start);
    let universe_seed = universe();
    let palette = room_palette(z, n, alphabet_id, universe_seed);

    // Page-linked: each page is an independent virgin page (fast wander).
    let mut symbols = Vec::with_capacity((end - start) as usize * PAGE_CONTENT_SYMBOLS);
    for page in start..end {
        let req = PageRender::new(PageAddr::new(
            z.clone(),
            n.clone(),
            book_index,
            page,
            alphabet_id,
            universe_seed,
        ));
        symbols.extend_from_slice(&page_symbols(&req));
    }
    paint_indices_rgba(&symbols, &palette)
}

/// Book-linked paint — used only for mosaic Find proof (expensive).
fn book_image_book_scope_pages_inner(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    page_start: u32,
    page_end: u32,
) -> Vec<u8> {
    let start = page_start.min(PAGES_PER_BOOK);
    let end = page_end.min(PAGES_PER_BOOK).max(start);
    let universe_seed = universe();
    let ab = alphabet(alphabet_id);
    let palette = room_palette(z, n, alphabet_id, universe_seed);
    let book = book_symbols_at(
        z,
        n,
        book_index,
        universe_seed,
        alphabet_id,
        ab.len() as u32,
    );
    let sym_start = start as usize * PAGE_CONTENT_SYMBOLS;
    let sym_end = end as usize * PAGE_CONTENT_SYMBOLS;
    paint_indices_rgba(&book[sym_start..sym_end], &palette)
}

#[wasm_bindgen]
#[must_use]
/// Full-book mosaic grid size `[width, height]` (shared by encode + `book_image`).
pub fn book_image_dims() -> Vec<u32> {
    let (w, h) = book_grid_dims();
    vec![w, h]
}

/// Gallery accent OKLCH knobs for `(z, n)` in `universe_seed` — same formulas as [`book_image`].
/// Returns `[hue, chroma, lightness]`. `z` / `n` are decimal strings.
#[wasm_bindgen]
#[must_use]
pub fn room_accent(z: &str, n: &str, universe_seed: u64) -> Vec<f64> {
    room_accent_at(&parse_coord(z), &parse_coord(n), universe_seed).to_vec()
}

/// Native helper for tests / mosaic (`BigInt` coords).
#[must_use]
pub fn room_accent_at(z: &BigInt, n: &BigInt, universe_seed: u64) -> [f64; 3] {
    let fp = node_fingerprint(z, n, universe_seed);
    let hue = (((fp >> 48) & 0xffff) % 360) as f64;
    let chroma = 0.08 + 0.14 * (((fp >> 32) & 0xffff) as f64 / 65535.0);
    let light = 0.55 + 0.23 * (((fp >> 16) & 0xffff) as f64 / 65535.0);
    [hue, chroma, light]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{ALPHABET_ID, alphabet};

    #[test]
    fn basile_hash_keeps_letters_off_the_punct_arc() {
        let ab = alphabet(ALPHABET_ID.basile_hash);
        let palette = build_glyph_palette(ab, 40.0, 0.15, 0.66);
        let a_idx = ab.iter().position(|c| *c == "a").unwrap();
        let at_idx = ab.iter().position(|c| *c == "@").unwrap();
        // Letter and punct must not share the same RGB (different strata).
        assert_ne!(palette[a_idx], palette[at_idx]);
        let space_idx = ab.len() - 3;
        assert_eq!(palette[space_idx], SPACE_RGB);
    }

    #[test]
    fn letter_colours_are_index_stable_under_accent() {
        let ab = alphabet(ALPHABET_ID.basile);
        let p0 = build_glyph_palette(ab, 10.0, 0.12, 0.6);
        let p1 = build_glyph_palette(ab, 10.0, 0.12, 0.6);
        assert_eq!(p0, p1);
        let a_idx = ab.iter().position(|c| *c == "a").unwrap();
        let b_idx = ab.iter().position(|c| *c == "b").unwrap();
        assert_ne!(p0[a_idx], p0[b_idx]);
    }

    #[test]
    fn paint_from_flat_matches_book_grid() {
        use crate::config::BOOK_CONTENT_SYMBOLS;
        use num_bigint::BigInt;
        let ab = alphabet(ALPHABET_ID.basile);
        let space = ab.iter().position(|c| *c == " ").unwrap();
        let mut flat = String::new();
        for i in 0..BOOK_CONTENT_SYMBOLS {
            flat.push_str(ab[if i % 17 == 0 { 0 } else { space }]);
        }
        let img = book_image_from_flat_at(
            &BigInt::from(1),
            &BigInt::from(2),
            ALPHABET_ID.basile,
            &flat,
        )
        .expect("paint");
        let (w, h) = book_grid_dims();
        assert_eq!(img.width, w);
        assert_eq!(img.height, h);
        assert_eq!(img.pixels.len(), BOOK_CONTENT_SYMBOLS * 4);
    }

    #[test]
    fn photo_luma_palette_is_monotonic_in_luminance() {
        let ab = alphabet(ALPHABET_ID.basile);
        let palette = build_photo_luma_palette(ab, 40.0, 0.15, 0.66);
        let mut last = -1.0;
        for (i, cell) in ab.iter().enumerate() {
            if *cell == " " {
                continue;
            }
            let [r, g, b] = palette[i];
            let y = 0.2126 * f64::from(r) + 0.7152 * f64::from(g) + 0.0722 * f64::from(b);
            assert!(
                y + 1e-6 >= last,
                "luma ramp must be non-decreasing (got {last} then {y} at {cell})"
            );
            last = y;
        }
    }
}
