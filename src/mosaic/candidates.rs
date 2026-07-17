//! Multi-hypothesis photo → room candidates + babel exact decode.

use std::cmp::Ordering;
use std::fmt::Write as _;

use wasm_bindgen::prelude::*;

use crate::color::{
    book_grid_dims, book_image_book_scope_at, build_glyph_palette, build_photo_luma_palette,
    room_accent_at,
};
use crate::config::alphabet;
use crate::search::{LocateResult, json_string_literal};
use crate::universe::universe as active_universe;

use super::flat::{indices_to_flat, locate_mosaic_flat};
use super::project::{
    MosaicOpts, PhotoPaletteKind, alphabet_space_idx, ensure_book_rgba, project_indices,
    project_indices_sized,
};
use super::score::{downsample_rgba, fit_percent, rgb_fit_triple};

/// Coarse photo search: subsample every Nth cell, sweep hue × chroma × light.
pub(crate) const COARSE_FACTOR: usize = 8;
/// Kept modest so the UI can stay responsive (each fine locate is a full book).
const COARSE_HUE_STEPS: usize = 12;
const COARSE_CHROMA: [f64; 3] = [0.08, 0.15, 0.22];
const COARSE_LIGHT: [f64; 3] = [0.50, 0.66, 0.78];
const COARSE_KEEP: usize = 4;
const FINE_TOP: usize = 4;

const ERR_BOOK_GRID: &str = r#"{"ok":false,"error":"image must match the full-book colour grid"}"#;

#[derive(Clone)]
pub(crate) struct CandidatePack {
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    label: &'static str,
}

impl CandidatePack {
    fn dedup_key(&self) -> (i32, i32, i32, bool) {
        (
            (self.hue / 5.0).round() as i32,
            (self.chroma * 100.0).round() as i32,
            (self.light * 100.0).round() as i32,
            self.dither,
        )
    }
}

#[derive(Clone, Copy)]
enum EvalMode {
    /// Photo find — luma or glyph palette + joint rms/mae/corr rank.
    Photo { palette: PhotoPaletteKind },
}

struct PackEval {
    /// Displayed RMS %.
    rms_percent: f64,
    mae: f64,
    corr: f64,
    /// Sort key — joint multi-metric for photo.
    rank_percent: f64,
    label: String,
    locate: LocateResult,
}

fn evaluate_pack(
    src: &[u8],
    alphabet_id: u32,
    pack: &CandidatePack,
    mode: EvalMode,
) -> Option<PackEval> {
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let space = pack.space_threshold.clamp(0.0, 255.0);
    let palette = match mode {
        EvalMode::Photo {
            palette: PhotoPaletteKind::Glyph,
        } => build_glyph_palette(ab, pack.hue, pack.chroma, pack.light),
        EvalMode::Photo {
            palette: PhotoPaletteKind::Luma,
        } => build_photo_luma_palette(ab, pack.hue, pack.chroma, pack.light),
    };
    let (indices, mosaic) = project_indices(src, &palette, space_idx, space, pack.dither);
    let triple = rgb_fit_triple(src, &mosaic, 1);
    let flat = indices_to_flat(&indices, ab);
    let locate = locate_mosaic_flat(&flat, alphabet_id, active_universe()).ok()?;
    Some(PackEval {
        rms_percent: triple.rms_percent,
        mae: triple.mae,
        corr: triple.corr,
        rank_percent: triple.rank_percent(),
        label: pack.label.to_string(),
        locate,
    })
}

/// Per-pixel `|src − mosaic|` (alpha forced opaque). Exact babel decode → near black.
fn rgba_abs_diff(src: &[u8], mosaic: &[u8]) -> Vec<u8> {
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

fn score_coarse_photo(
    coarse_src: &[u8],
    cw: usize,
    ch: usize,
    ab: &[&str],
    space_idx: usize,
    pack: &CandidatePack,
    palette_kind: PhotoPaletteKind,
) -> f64 {
    let palette = match palette_kind {
        PhotoPaletteKind::Luma => build_photo_luma_palette(ab, pack.hue, pack.chroma, pack.light),
        PhotoPaletteKind::Glyph => build_glyph_palette(ab, pack.hue, pack.chroma, pack.light),
    };
    let (_ix, mosaic) = project_indices_sized(
        coarse_src,
        cw,
        ch,
        &palette,
        space_idx,
        pack.space_threshold,
        false,
    );
    rgb_fit_triple(coarse_src, &mosaic, 1).rank_percent()
}

fn by_percent_desc(a: f64, b: f64) -> Ordering {
    b.partial_cmp(&a).unwrap_or(Ordering::Equal)
}

struct JsonHit<'a> {
    /// RMS fit % (display).
    percent: f64,
    /// Mean abs RGB error 0..255.
    mae: f64,
    /// Pearson RGB correlation.
    corr: f64,
    z: &'a num_bigint::BigInt,
    n: &'a num_bigint::BigInt,
    book: u32,
    page: u32,
    page_span: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    label: &'a str,
    alphabet_id: u32,
    /// Babel exact uses tighter float precision than photo candidates.
    babel_exact: bool,
}

fn write_hit_json(out: &mut String, h: &JsonHit<'_>) {
    // Compact z/n — never emit megadigit decimals into JSON (freezes JS).
    let z = crate::gallery::format_coord(h.z);
    let n = crate::gallery::format_coord(h.n);
    if h.babel_exact {
        let _ = write!(
            out,
            concat!(
                "{{\"percent\":{:.4},\"mae\":{:.6},\"corr\":{:.6},",
                "\"z\":\"{}\",\"n\":\"{}\",\"book\":{},\"page\":{},",
                "\"page_span\":{},\"hue\":{:.6},\"chroma\":{:.6},\"light\":{:.6},",
                "\"space_threshold\":0,\"dither\":false,\"label\":{},\"alphabet\":{},",
                "\"scope\":\"page\"}}"
            ),
            h.percent,
            h.mae,
            h.corr,
            z,
            n,
            h.book,
            h.page + 1,
            h.page_span,
            h.hue,
            h.chroma,
            h.light,
            json_string_literal(h.label),
            h.alphabet_id,
        );
    } else {
        let _ = write!(
            out,
            concat!(
                "{{\"percent\":{:.2},\"mae\":{:.3},\"corr\":{:.4},",
                "\"z\":\"{}\",\"n\":\"{}\",\"book\":{},\"page\":{},",
                "\"page_span\":{},\"hue\":{:.3},\"chroma\":{:.4},\"light\":{:.4},",
                "\"space_threshold\":{:.2},\"dither\":{},\"label\":{},\"alphabet\":{},",
                "\"scope\":\"book\"}}"
            ),
            h.percent,
            h.mae,
            h.corr,
            z,
            n,
            h.book,
            h.page + 1,
            h.page_span,
            h.hue,
            h.chroma,
            h.light,
            h.space_threshold,
            h.dither,
            json_string_literal(h.label),
            h.alphabet_id,
        );
    }
}

fn json_results(hits: &[JsonHit<'_>]) -> String {
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

struct LocateHit {
    /// Displayed RMS fit %.
    percent: f64,
    mae: f64,
    corr: f64,
    /// Joint sort key (rms/mae/corr).
    rank: f64,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    label: String,
    z: num_bigint::BigInt,
    n: num_bigint::BigInt,
    book: u32,
    page: u32,
    page_span: u32,
}

/// Coarse downsample sweep → keep top distinct packs (+ space variants).
fn coarse_candidate_packs(src_rgba: &[u8], opts: &MosaicOpts) -> Vec<CandidatePack> {
    let ab = alphabet(opts.alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let (bw, bh) = book_grid_dims();
    let (coarse_src, cw, ch) = downsample_rgba(src_rgba, bw as usize, bh as usize, COARSE_FACTOR);
    let palette_kind = opts.palette_kind;

    let mut coarse: Vec<(f64, CandidatePack)> =
        Vec::with_capacity(1 + COARSE_HUE_STEPS * COARSE_CHROMA.len() * COARSE_LIGHT.len());
    let mut push_coarse = |pack: CandidatePack| {
        let pct = score_coarse_photo(&coarse_src, cw, ch, ab, space_idx, &pack, palette_kind);
        coarse.push((pct, pack));
    };

    push_coarse(CandidatePack {
        hue: opts.hue,
        chroma: opts.chroma,
        light: opts.light,
        space_threshold: opts.space_threshold,
        dither: opts.dither,
        label: "current",
    });
    for step in 0..COARSE_HUE_STEPS {
        let h = (step as f64) * (360.0 / COARSE_HUE_STEPS as f64);
        for &c in &COARSE_CHROMA {
            for &l in &COARSE_LIGHT {
                push_coarse(CandidatePack {
                    hue: h,
                    chroma: c,
                    light: l,
                    space_threshold: opts.space_threshold,
                    dither: opts.dither,
                    label: "coarse",
                });
            }
        }
    }
    coarse.sort_by(|a, b| by_percent_desc(a.0, b.0));

    let mut packs: Vec<CandidatePack> = Vec::new();
    for (_pct, mut pack) in coarse {
        if packs.len() >= COARSE_KEEP {
            break;
        }
        let key = pack.dedup_key();
        if packs.iter().any(|p| p.dedup_key() == key) {
            continue;
        }
        if pack.label != "current" {
            pack.label = if packs.iter().all(|p| p.label == "current") {
                "best match"
            } else {
                "runner-up"
            };
        }
        packs.push(pack);
    }

    // No space-threshold variants — they change the mosaic→locate destination
    // but the virgin book colour map ignores space, so they confuse book-fit ranking.
    packs
}

/// Full-res locate for coarse survivors; keep best pack per destination.
fn fine_locate_hits(
    src: &[u8],
    alphabet_id: u32,
    packs: &[CandidatePack],
    palette_kind: PhotoPaletteKind,
) -> Vec<LocateHit> {
    let mode = EvalMode::Photo {
        palette: palette_kind,
    };
    let mut hits: Vec<LocateHit> = Vec::new();
    for pack in packs {
        let Some(ev) = evaluate_pack(src, alphabet_id, pack, mode) else {
            continue;
        };
        let loc = &ev.locate.location;
        if let Some(existing) = hits
            .iter_mut()
            .find(|h| h.z == loc.z && h.n == loc.n && h.book == loc.book_index)
        {
            if ev.rank_percent > existing.rank {
                existing.percent = ev.rms_percent;
                existing.mae = ev.mae;
                existing.corr = ev.corr;
                existing.rank = ev.rank_percent;
                existing.hue = pack.hue;
                existing.chroma = pack.chroma;
                existing.light = pack.light;
                existing.space_threshold = pack.space_threshold;
                existing.dither = pack.dither;
                existing.label = ev.label;
                existing.page = loc.page;
                existing.page_span = ev.locate.page_span;
            }
            continue;
        }
        hits.push(LocateHit {
            percent: ev.rms_percent,
            mae: ev.mae,
            corr: ev.corr,
            rank: ev.rank_percent,
            hue: pack.hue,
            chroma: pack.chroma,
            light: pack.light,
            space_threshold: pack.space_threshold,
            dither: pack.dither,
            label: ev.label,
            z: loc.z.clone(),
            n: loc.n.clone(),
            book: loc.book_index,
            page: loc.page,
            page_span: ev.locate.page_span,
        });
    }
    hits.sort_by(|a, b| by_percent_desc(a.rank, b.rank));
    hits.truncate(FINE_TOP);
    hits
}

fn hits_to_json(hits: &[LocateHit], alphabet_id: u32) -> String {
    let json_hits: Vec<JsonHit<'_>> = hits
        .iter()
        .map(|h| JsonHit {
            percent: h.percent,
            mae: h.mae,
            corr: h.corr,
            z: &h.z,
            n: &h.n,
            book: h.book,
            page: h.page,
            page_span: h.page_span,
            hue: h.hue,
            chroma: h.chroma,
            light: h.light,
            space_threshold: h.space_threshold,
            dither: h.dither,
            label: &h.label,
            alphabet_id,
            babel_exact: false,
        })
        .collect();
    json_results(&json_hits)
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
    use crate::config::{BOOK_CONTENT_SYMBOLS, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK};

    if ensure_book_rgba(src_rgba).is_err() {
        return Err(JsValue::from_str(
            "image must match the full-book colour grid",
        ));
    }
    let ab = alphabet(alphabet_id);
    let alpha_len = ab.len() as u32;
    let space_idx = alphabet_space_idx(ab);
    let palette = build_glyph_palette(ab, hue, chroma, light);
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
    room_hue: f64,
    room_chroma: f64,
    room_light: f64,
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
    use crate::config::BOOK_CONTENT_SYMBOLS;
    use crate::gallery::format_coord;

    if ensure_book_rgba(src_rgba).is_err() {
        return Err(JsValue::from_str(
            "image must match the full-book colour grid",
        ));
    }
    let ab = alphabet(alphabet_id);
    let alpha_len = ab.len() as u32;
    let space_idx = alphabet_space_idx(ab);
    let universe_seed = active_universe();
    // Project → invert → re-project under the hit's room accent until the
    // address stabilises (so letters match the virgin colour map there).
    let mut proj_hue = hue;
    let mut proj_chroma = chroma;
    let mut proj_light = light;
    let mut indices = Vec::new();
    let mut z = num_bigint::BigInt::from(0);
    let mut n = num_bigint::BigInt::from(0);
    let mut book_index = 0u32;
    for _ in 0..3 {
        let palette = build_glyph_palette(ab, proj_hue, proj_chroma, proj_light);
        let (next, _) = project_indices(src_rgba, &palette, space_idx, 0.0, false);
        if next.len() != BOOK_CONTENT_SYMBOLS {
            return Err(JsValue::from_str("mosaic cell count must equal one book"));
        }
        indices = next;
        let (z2, n2, b2) = invert_book_symbols(&indices, universe_seed, alphabet_id, alpha_len);
        let room = room_accent_at(&z2, &n2, universe_seed);
        let same_room = (room[0] - proj_hue).abs() < 1e-9
            && (room[1] - proj_chroma).abs() < 1e-9
            && (room[2] - proj_light).abs() < 1e-9;
        z = z2;
        n = n2;
        book_index = b2;
        proj_hue = room[0];
        proj_chroma = room[1];
        proj_light = room[2];
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
        room_hue: proj_hue,
        room_chroma: proj_chroma,
        room_light: proj_light,
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
    let ab = alphabet(alphabet_id);
    // Proof must use book-linked paint (page-linked `book_image` is a different map).
    let book = book_image_book_scope_at(&z, &n, book_index, alphabet_id);
    let book_pixels = book.pixels();
    let room = [locate.room_hue, locate.room_chroma, locate.room_light];
    let room_palette = build_glyph_palette(ab, room[0], room[1], room[2]);
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
        page_span: crate::config::PAGES_PER_BOOK,
        hue: room[0],
        chroma: room[1],
        light: room[2],
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

/// Colour glyph indices with a palette (book-grid RGBA).
fn paint_indices_rgba(indices: &[u16], palette: &[[u8; 3]]) -> Vec<u8> {
    let mut out = vec![0u8; indices.len() * 4];
    for (i, &idx) in indices.iter().enumerate() {
        let rgb = palette[idx as usize];
        let o = i * 4;
        out[o] = rgb[0];
        out[o + 1] = rgb[1];
        out[o + 2] = rgb[2];
        out[o + 3] = 255;
    }
    out
}

/// Coarse palette packs only (no full-book locate) — cheap enough for one frame.
///
/// `palette_kind`: `0` = luma ramp, `1` = glyph / letter colour map.
///
/// Returns `{ ok, packs:[{hue,chroma,light,space_threshold,dither,label}] }`.
#[wasm_bindgen]
#[must_use]
#[allow(clippy::too_many_arguments)] // flat wasm-bindgen ABI; packs into [`MosaicOpts`]
pub fn mosaic_candidate_packs_json(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    palette_kind: u32,
) -> String {
    if ensure_book_rgba(src_rgba).is_err() {
        return ERR_BOOK_GRID.into();
    }
    let opts = MosaicOpts::from_wasm(
        alphabet_id,
        hue,
        chroma,
        light,
        space_threshold,
        dither,
        palette_kind,
    );
    let packs = coarse_candidate_packs(src_rgba, &opts);
    let mut out = String::from(r#"{"ok":true,"packs":["#);
    for (i, p) in packs.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        let _ = write!(
            out,
            concat!(
                "{{\"hue\":{:.3},\"chroma\":{:.4},\"light\":{:.4},",
                "\"space_threshold\":{:.2},\"dither\":{},\"label\":{}}}"
            ),
            p.hue,
            p.chroma,
            p.light,
            p.space_threshold,
            p.dither,
            json_string_literal(p.label),
        );
    }
    out.push_str("]}");
    out
}

/// Full-res project + locate for one mosaic pack (call from JS with yields between).
///
/// `palette_kind`: `0` = luma ramp, `1` = glyph / letter colour map.
///
/// Returns `{ ok, results:[hit] }` or `{ ok:false, error }`.
#[wasm_bindgen]
#[must_use]
#[allow(clippy::too_many_arguments)] // flat wasm-bindgen ABI; packs into [`MosaicOpts`]
pub fn mosaic_candidate_eval_json(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    palette_kind: u32,
    label: &str,
) -> String {
    if ensure_book_rgba(src_rgba).is_err() {
        return ERR_BOOK_GRID.into();
    }
    let opts = MosaicOpts::from_wasm(
        alphabet_id,
        hue,
        chroma,
        light,
        space_threshold,
        dither,
        palette_kind,
    );
    let pack = CandidatePack {
        hue: opts.hue,
        chroma: opts.chroma,
        light: opts.light,
        space_threshold: opts.space_threshold,
        dither: opts.dither,
        label: "eval",
    };
    // Label is owned by the caller string — stash into LocateHit via evaluate.
    let mode = EvalMode::Photo {
        palette: opts.palette_kind,
    };
    let Some(mut ev) = evaluate_pack(src_rgba, opts.alphabet_id, &pack, mode) else {
        return r#"{"ok":false,"error":"could not locate mosaic"}"#.into();
    };
    if !label.is_empty() {
        ev.label = label.to_string();
    }
    let loc = &ev.locate.location;
    let hit = LocateHit {
        percent: ev.rms_percent,
        mae: ev.mae,
        corr: ev.corr,
        rank: ev.rank_percent,
        hue: pack.hue,
        chroma: pack.chroma,
        light: pack.light,
        space_threshold: pack.space_threshold,
        dither: pack.dither,
        label: ev.label,
        z: loc.z.clone(),
        n: loc.n.clone(),
        book: loc.book_index,
        page: loc.page,
        page_span: ev.locate.page_span,
    };
    hits_to_json(std::slice::from_ref(&hit), opts.alphabet_id)
}

/// Top mosaic destinations for an uploaded book-grid image (blocking; prefer chunked API).
///
/// Coarse downsample sweep over hue × chroma × light, then full-res locate for
/// survivors. Scores use joint rms / mae / corr (photo↔alphabet mosaic).
///
/// `palette_kind`: `0` = luma ramp, `1` = glyph / letter colour map.
///
/// Returns JSON `{ ok, results:[{ percent, mae, corr, z, n, book, page, page_span, hue, chroma, light,
/// space_threshold, dither, label, alphabet }] }` (`percent` is RMS fit %).
#[wasm_bindgen]
#[must_use]
#[allow(clippy::too_many_arguments)] // flat wasm-bindgen ABI; packs into [`MosaicOpts`]
pub fn mosaic_candidates_json(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    palette_kind: u32,
) -> String {
    if ensure_book_rgba(src_rgba).is_err() {
        return ERR_BOOK_GRID.into();
    }
    let opts = MosaicOpts::from_wasm(
        alphabet_id,
        hue,
        chroma,
        light,
        space_threshold,
        dither,
        palette_kind,
    );
    let packs = coarse_candidate_packs(src_rgba, &opts);
    let hits = fine_locate_hits(src_rgba, opts.alphabet_id, &packs, opts.palette_kind);
    hits_to_json(&hits, opts.alphabet_id)
}
