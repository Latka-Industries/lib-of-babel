//! Babel exact decode + photo find-book (locate → colour-map finish).

use wasm_bindgen::prelude::*;

use crate::color::{book_grid_dims, book_image_book_scope_at, paint_indices_rgba};
use crate::config::{BOOK_CONTENT_SYMBOLS, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK};
use crate::universe::universe as active_universe;

use super::project::{Accent, PhotoPaletteKind, ensure_book_rgba, project_indices};
use super::score::{fit_percent, rgb_fit_triple};
use super::util::{
    JsonHit, alphabet_ctx, indices_to_flat, json_results, palette_for, rgba_abs_diff,
};

/// Babel / photo locate → results JSON + full-book flat + proof frames.
///
/// Babel: `reproject_pixels` = stamp-accent mosaic; `diff_pixels` =
/// `|upload − reproject|` (exact → near-black); `mosaic_pixels` empty.
///
/// Photo: `reproject_pixels` = virgin shelf map; `mosaic_pixels` = projected
/// letters at hit accent; `diff_pixels` = `|mosaic − shelf|`.
#[wasm_bindgen]
pub struct BabelLocateResult {
    results_json: String,
    flat: String,
    reproject_pixels: Vec<u8>,
    /// Photo Find: projected letters painted at hit room accent (preview-like).
    mosaic_pixels: Vec<u8>,
    diff_pixels: Vec<u8>,
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl BabelLocateResult {
    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn results_json(&self) -> String {
        self.results_json.clone()
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn flat(&self) -> String {
        self.flat.clone()
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn reproject_pixels(&self) -> Vec<u8> {
        self.reproject_pixels.clone()
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn mosaic_pixels(&self) -> Vec<u8> {
        self.mosaic_pixels.clone()
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn diff_pixels(&self) -> Vec<u8> {
        self.diff_pixels.clone()
    }

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
}

/// Exact babel-export decode: project at stamp accent → **page-linked** invert of
/// the first page only (same fast path as pre–dual-map). Same-universe UI overrides
/// coords from the PNG stamp (`scope=page|book`); other-universe rematch uses this
/// page-0 address (legacy behaviour — not a full book-map Hensel on the UI thread).
///
/// On success: [`BabelLocateResult`] with `results_json`, `flat`,
/// `reproject_pixels` = stamp-accent mosaic, `diff_pixels` = `|upload − reproject|`
/// (exact decode → near-black).
///
/// # Errors
///
/// String `JsValue` when the buffer is not the book grid.
#[wasm_bindgen]
pub fn mosaic_babel_json(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
) -> Result<BabelLocateResult, JsValue> {
    use crate::basile::invert_page_symbols;

    if ensure_book_rgba(src_rgba).is_err() {
        return Err(JsValue::from_str(
            "image must match the full-book colour grid",
        ));
    }
    let (ab, space_idx, alpha_len) = alphabet_ctx(alphabet_id);
    let palette = palette_for(ab, Accent::new(hue, chroma, light), PhotoPaletteKind::Glyph);
    let (indices, mosaic) = project_indices(src_rgba, &palette, space_idx, 0.0, false);
    if indices.len() != BOOK_CONTENT_SYMBOLS {
        return Err(JsValue::from_str("mosaic cell count must equal one book"));
    }
    let triple = rgb_fit_triple(src_rgba, &mosaic, 1);
    let rms = fit_percent(src_rgba, &mosaic);
    let flat = indices_to_flat(&indices, ab);
    // Colour-print rematch: invert page 0 only (page map). Never full-book Hensel here.
    // Same-universe UI then overrides coords from the stamp for exact decode.
    let mut page0 = [0u16; PAGE_CONTENT_SYMBOLS];
    page0.copy_from_slice(&indices[..PAGE_CONTENT_SYMBOLS]);
    let key = invert_page_symbols(&page0, active_universe(), alphabet_id, alpha_len);
    let (width, height) = book_grid_dims();
    let diff_pixels = rgba_abs_diff(src_rgba, &mosaic);
    let results_json = json_results(&[JsonHit {
        percent: rms,
        mae: triple.mae,
        corr: triple.corr,
        z: &key.z,
        n: &key.n,
        book: key.book_index,
        page: key.page,
        page_span: PAGES_PER_BOOK,
        hue,
        chroma,
        light,
        space_threshold: 0.0,
        dither: false,
        label: "babel exact",
        alphabet_id,
        babel_exact: true,
    }]);
    Ok(BabelLocateResult {
        results_json,
        flat,
        reproject_pixels: mosaic,
        mosaic_pixels: Vec::new(),
        diff_pixels,
        width,
        height,
    })
}

/// Partial Find — letter mosaic + book-linked invert (no colour-map paint yet).
///
/// Used so the UI can report “finding book…” vs “constructing colour map…”.
#[wasm_bindgen]
pub struct FindBookLocate {
    z: String,
    n: String,
    book_index: u32,
    alphabet_id: u32,
    flat: String,
    indices: Vec<u16>,
    room: Accent,
}

#[wasm_bindgen]
impl FindBookLocate {
    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn flat(&self) -> String {
        self.flat.clone()
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn book_index(&self) -> u32 {
        self.book_index
    }
}

/// Photo → letter mosaic → Basile **book-level** invert (address only).
///
/// # Errors
///
/// String `JsValue` when the buffer is not the book grid.
#[wasm_bindgen]
pub fn mosaic_find_book_locate(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
) -> Result<FindBookLocate, JsValue> {
    use crate::basile::invert_book_symbols;
    use crate::gallery::format_coord;

    if ensure_book_rgba(src_rgba).is_err() {
        return Err(JsValue::from_str(
            "image must match the full-book colour grid",
        ));
    }
    let (ab, space_idx, alpha_len) = alphabet_ctx(alphabet_id);
    let universe_seed = active_universe();
    // Project → invert → re-project under the hit's room accent until the
    // address stabilises (so letters match the virgin colour map there).
    let mut accent = Accent::new(hue, chroma, light);
    let mut indices = Vec::new();
    let mut z = num_bigint::BigInt::from(0);
    let mut n = num_bigint::BigInt::from(0);
    let mut book_index = 0u32;
    for _ in 0..3 {
        let palette = palette_for(ab, accent, PhotoPaletteKind::Glyph);
        let (next, _) = project_indices(src_rgba, &palette, space_idx, 0.0, false);
        if next.len() != BOOK_CONTENT_SYMBOLS {
            return Err(JsValue::from_str("mosaic cell count must equal one book"));
        }
        indices = next;
        let (z2, n2, b2) = invert_book_symbols(&indices, universe_seed, alphabet_id, alpha_len);
        let room = Accent::for_room(&z2, &n2, universe_seed);
        let same_room = room.approx_eq(accent);
        z = z2;
        n = n2;
        book_index = b2;
        accent = room;
        if same_room {
            break;
        }
    }
    let flat = indices_to_flat(&indices, ab);
    Ok(FindBookLocate {
        z: format_coord(&z),
        n: format_coord(&n),
        book_index,
        alphabet_id,
        flat,
        indices,
        room: accent,
    })
}

/// Build book-scope colour map + metrics for a [`FindBookLocate`].
///
/// # Errors
///
/// String `JsValue` if coord parse / paint fails.
#[wasm_bindgen]
pub fn mosaic_find_book_finish(locate: &FindBookLocate) -> Result<BabelLocateResult, JsValue> {
    use crate::gallery::parse_coord;

    let z = parse_coord(&locate.z);
    let n = parse_coord(&locate.n);
    let book_index = locate.book_index;
    let alphabet_id = locate.alphabet_id;
    let (ab, _, _) = alphabet_ctx(alphabet_id);
    // Proof must use book-linked paint (page-linked `book_image` is a different map).
    let book = book_image_book_scope_at(&z, &n, book_index, alphabet_id);
    let book_pixels = book.pixels();
    let room = locate.room;
    let room_palette = palette_for(ab, room, PhotoPaletteKind::Glyph);
    let proof = paint_indices_rgba(&locate.indices, &room_palette);
    let fit = rgb_fit_triple(&proof, &book_pixels, 1);
    let (width, height) = book_grid_dims();
    let diff_pixels = rgba_abs_diff(&proof, &book_pixels);
    let babel_exact = fit.rms_percent >= 99.9 && fit.mae <= 0.5;
    let results_json = json_results(&[JsonHit {
        percent: fit.rms_percent,
        mae: fit.mae,
        corr: fit.corr,
        z: &z,
        n: &n,
        book: book_index,
        page: 0,
        page_span: PAGES_PER_BOOK,
        hue: room.hue,
        chroma: room.chroma,
        light: room.light,
        space_threshold: 0.0,
        dither: false,
        label: "alphabet mosaic (full book)",
        alphabet_id,
        babel_exact,
    }]);
    Ok(BabelLocateResult {
        results_json,
        flat: locate.flat.clone(),
        reproject_pixels: book_pixels,
        mosaic_pixels: proof,
        diff_pixels,
        width,
        height,
    })
}

/// Photo → alphabet letter mosaic → locate via Basile **book-level** invert.
///
/// A full-book letter grid is one virgin book (generator v10). Metrics compare
/// the mosaic painted with the room accent wheel to that book's colour map —
/// exact when the projected indices are the virgin symbols.
///
/// `hue` / `chroma` / `light` choose which letters the photo quantizes to.
///
/// # Errors
///
/// String `JsValue` when the buffer is not the book grid, or locate fails.
#[wasm_bindgen]
pub fn mosaic_find_book(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
) -> Result<BabelLocateResult, JsValue> {
    let locate = mosaic_find_book_locate(src_rgba, alphabet_id, hue, chroma, light)?;
    mosaic_find_book_finish(&locate)
}
