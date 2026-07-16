//! Multi-hypothesis photo → room candidates + babel exact decode.

use std::cmp::Ordering;
use std::fmt::Write as _;

use wasm_bindgen::prelude::*;

use crate::color::{book_grid_dims, build_glyph_palette, build_photo_luma_palette};
use crate::config::alphabet;
use crate::search::{LocateResult, json_string_literal};
use crate::universe::universe as active_universe;

use super::flat::{indices_to_flat, locate_mosaic_flat};
use super::project::{
    alphabet_space_idx, ensure_book_rgba, project_indices, project_indices_sized,
};
use super::score::{downsample_rgba, fit_percent, fit_perceptual_percent};

/// Coarse photo search: subsample every Nth cell, sweep hue × chroma × light.
pub(crate) const COARSE_FACTOR: usize = 8;
const COARSE_HUE_STEPS: usize = 18;
const COARSE_CHROMA: [f64; 4] = [0.06, 0.11, 0.16, 0.22];
const COARSE_LIGHT: [f64; 4] = [0.48, 0.58, 0.68, 0.78];
const COARSE_KEEP: usize = 6;
const FINE_TOP: usize = 5;

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
enum FitMode {
    /// Babelgram / stamped export — reading glyph palette + exact RGB.
    GlyphRgb,
    /// Photo find — luma-ramp palette + perceptual score.
    PhotoPerceptual,
}

fn evaluate_pack(
    src: &[u8],
    alphabet_id: u32,
    pack: &CandidatePack,
    mode: FitMode,
) -> Option<(f64, String, LocateResult)> {
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let space = pack.space_threshold.clamp(0.0, 255.0);
    let palette = match mode {
        FitMode::GlyphRgb => build_glyph_palette(ab, pack.hue, pack.chroma, pack.light),
        FitMode::PhotoPerceptual => build_photo_luma_palette(ab, pack.hue, pack.chroma, pack.light),
    };
    let (indices, mosaic) = project_indices(src, &palette, space_idx, space, pack.dither);
    let percent = match mode {
        FitMode::GlyphRgb => fit_percent(src, &mosaic),
        FitMode::PhotoPerceptual => fit_perceptual_percent(src, &mosaic, 1),
    };
    let flat = indices_to_flat(&indices, ab);
    let hit = locate_mosaic_flat(&flat, alphabet_id, active_universe()).ok()?;
    Some((percent, pack.label.to_string(), hit))
}

fn score_coarse_luma(
    coarse_src: &[u8],
    cw: usize,
    ch: usize,
    ab: &[&str],
    space_idx: usize,
    pack: &CandidatePack,
) -> f64 {
    let palette = build_photo_luma_palette(ab, pack.hue, pack.chroma, pack.light);
    let (_ix, mosaic) = project_indices_sized(
        coarse_src,
        cw,
        ch,
        &palette,
        space_idx,
        pack.space_threshold,
        false,
    );
    fit_perceptual_percent(coarse_src, &mosaic, 1)
}

fn by_percent_desc(a: f64, b: f64) -> Ordering {
    b.partial_cmp(&a).unwrap_or(Ordering::Equal)
}

struct JsonHit<'a> {
    percent: f64,
    z: i64,
    n: i64,
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
    if h.babel_exact {
        let _ = write!(
            out,
            concat!(
                "{{\"percent\":{:.4},\"z\":\"{}\",\"n\":\"{}\",\"book\":{},\"page\":{},",
                "\"page_span\":{},\"hue\":{:.6},\"chroma\":{:.6},\"light\":{:.6},",
                "\"space_threshold\":0,\"dither\":false,\"label\":{},\"alphabet\":{}}}"
            ),
            h.percent,
            h.z,
            h.n,
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
                "{{\"percent\":{:.2},\"z\":\"{}\",\"n\":\"{}\",\"book\":{},\"page\":{},",
                "\"page_span\":{},\"hue\":{:.3},\"chroma\":{:.4},\"light\":{:.4},",
                "\"space_threshold\":{:.2},\"dither\":{},\"label\":{},\"alphabet\":{}}}"
            ),
            h.percent,
            h.z,
            h.n,
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

struct LocateHit {
    percent: f64,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    label: String,
    z: i64,
    n: i64,
    book: u32,
    page: u32,
    page_span: u32,
}

/// Coarse downsample sweep → keep top distinct packs (+ space variants).
fn coarse_candidate_packs(
    src_rgba: &[u8],
    ab: &[&str],
    hue: f64,
    chroma: f64,
    light: f64,
    space: f64,
    dither: bool,
) -> Vec<CandidatePack> {
    let space_idx = alphabet_space_idx(ab);
    let (bw, bh) = book_grid_dims();
    let (coarse_src, cw, ch) = downsample_rgba(src_rgba, bw as usize, bh as usize, COARSE_FACTOR);

    let mut coarse: Vec<(f64, CandidatePack)> =
        Vec::with_capacity(1 + COARSE_HUE_STEPS * COARSE_CHROMA.len() * COARSE_LIGHT.len());
    let mut push_coarse = |pack: CandidatePack| {
        let pct = score_coarse_luma(&coarse_src, cw, ch, ab, space_idx, &pack);
        coarse.push((pct, pack));
    };

    push_coarse(CandidatePack {
        hue,
        chroma,
        light,
        space_threshold: space,
        dither,
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
                    space_threshold: space,
                    dither,
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

    if let Some(best) = packs.first().cloned() {
        for (space_mul, label) in [(0.6_f64, "space low"), (1.4_f64, "space high")] {
            packs.push(CandidatePack {
                space_threshold: (best.space_threshold * space_mul).clamp(0.0, 255.0),
                label,
                ..best
            });
        }
    }
    packs
}

/// Full-res locate for coarse survivors; keep best pack per destination.
fn fine_locate_hits(src: &[u8], alphabet_id: u32, packs: &[CandidatePack]) -> Vec<LocateHit> {
    let mut hits: Vec<LocateHit> = Vec::new();
    for pack in packs {
        let Some((percent, label, res)) =
            evaluate_pack(src, alphabet_id, pack, FitMode::PhotoPerceptual)
        else {
            continue;
        };
        let loc = &res.location;
        let key = (loc.z, loc.n, loc.book_index);
        if let Some(existing) = hits.iter_mut().find(|h| (h.z, h.n, h.book) == key) {
            if percent > existing.percent {
                existing.percent = percent;
                existing.hue = pack.hue;
                existing.chroma = pack.chroma;
                existing.light = pack.light;
                existing.space_threshold = pack.space_threshold;
                existing.dither = pack.dither;
                existing.label = label;
                existing.page = loc.page;
                existing.page_span = res.page_span;
            }
            continue;
        }
        hits.push(LocateHit {
            percent,
            hue: pack.hue,
            chroma: pack.chroma,
            light: pack.light,
            space_threshold: pack.space_threshold,
            dither: pack.dither,
            label,
            z: loc.z,
            n: loc.n,
            book: loc.book_index,
            page: loc.page,
            page_span: res.page_span,
        });
    }
    hits.sort_by(|a, b| by_percent_desc(a.percent, b.percent));
    hits.truncate(FINE_TOP);
    hits
}

fn hits_to_json(hits: &[LocateHit], alphabet_id: u32) -> String {
    let json_hits: Vec<JsonHit<'_>> = hits
        .iter()
        .map(|h| JsonHit {
            percent: h.percent,
            z: h.z,
            n: h.n,
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

/// Exact babel-export decode: one pack (`space=0`, no dither) → locate in the active universe.
///
/// Returns JSON `{ ok, results:[{ percent, z, n, book, page, page_span, hue, chroma, light,
/// space_threshold, dither, label, alphabet }] }` with a single hit when decode succeeds.
#[wasm_bindgen]
#[must_use]
pub fn mosaic_babel_json(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
) -> String {
    if ensure_book_rgba(src_rgba).is_err() {
        return ERR_BOOK_GRID.into();
    }
    let pack = CandidatePack {
        hue,
        chroma,
        light,
        space_threshold: 0.0,
        dither: false,
        label: "babel exact",
    };
    let Some((percent, label, res)) =
        evaluate_pack(src_rgba, alphabet_id, &pack, FitMode::GlyphRgb)
    else {
        return r#"{"ok":false,"error":"could not locate babel mosaic"}"#.into();
    };
    let loc = &res.location;
    json_results(&[JsonHit {
        percent,
        z: loc.z,
        n: loc.n,
        book: loc.book_index,
        page: loc.page,
        page_span: res.page_span,
        hue,
        chroma,
        light,
        space_threshold: 0.0,
        dither: false,
        label: &label,
        alphabet_id,
        babel_exact: true,
    }])
}

/// Top mosaic destinations for an uploaded book-grid image.
///
/// Coarse downsample sweep over hue × chroma × light, then full-res locate for
/// survivors. Scores use perceptual fit (luma + structure).
///
/// Returns JSON `{ ok, results:[{ percent, z, n, book, page, page_span, hue, chroma, light,
/// space_threshold, dither, label, alphabet }] }`.
#[wasm_bindgen]
#[must_use]
pub fn mosaic_candidates_json(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
) -> String {
    if ensure_book_rgba(src_rgba).is_err() {
        return ERR_BOOK_GRID.into();
    }
    let packs = coarse_candidate_packs(
        src_rgba,
        alphabet(alphabet_id),
        hue,
        chroma,
        light,
        space_threshold.clamp(0.0, 255.0),
        dither,
    );
    let hits = fine_locate_hits(src_rgba, alphabet_id, &packs);
    hits_to_json(&hits, alphabet_id)
}
