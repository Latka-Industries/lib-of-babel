//! Multi-hypothesis photo → room candidates (coarse sweep + fine locate).

use wasm_bindgen::prelude::*;

use crate::color::book_grid_dims;
use crate::search::LocateResult;
use crate::universe::universe as active_universe;
use crate::utils::JsonObject;

use super::project::{
    Accent, MosaicOpts, PhotoPaletteKind, ensure_book_rgba, project_indices, project_indices_sized,
};
use super::score::{downsample_rgba, rgb_fit_triple};
use super::util::{
    ERR_BOOK_GRID, JsonHit, alphabet_ctx, by_percent_desc, indices_to_flat, json_results,
    locate_mosaic_flat, palette_for,
};

/// Coarse photo search: subsample every Nth cell, sweep hue × chroma × light.
pub(crate) const COARSE_FACTOR: usize = 8;
/// Kept modest so the UI can stay responsive (each fine locate is a full book).
const COARSE_HUE_STEPS: usize = 12;
const COARSE_CHROMA: [f64; 3] = [0.08, 0.15, 0.22];
const COARSE_LIGHT: [f64; 3] = [0.50, 0.66, 0.78];
const COARSE_KEEP: usize = 4;
const FINE_TOP: usize = 4;

#[derive(Clone)]
pub(crate) struct CandidatePack {
    accent: Accent,
    space_threshold: f64,
    dither: bool,
    label: &'static str,
}

impl CandidatePack {
    fn from_opts(opts: &MosaicOpts, label: &'static str) -> Self {
        Self {
            accent: opts.accent,
            space_threshold: opts.space_threshold,
            dither: opts.dither,
            label,
        }
    }

    fn with_accent(opts: &MosaicOpts, accent: Accent, label: &'static str) -> Self {
        Self {
            accent,
            space_threshold: opts.space_threshold,
            dither: opts.dither,
            label,
        }
    }

    fn dedup_key(&self) -> (i32, i32, i32, bool) {
        (
            (self.accent.hue / 5.0).round() as i32,
            (self.accent.chroma * 100.0).round() as i32,
            (self.accent.light * 100.0).round() as i32,
            self.dither,
        )
    }
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
    palette_kind: PhotoPaletteKind,
) -> Option<PackEval> {
    let (ab, space_idx, _) = alphabet_ctx(alphabet_id);
    let palette = palette_for(ab, pack.accent, palette_kind);
    let space = pack.space_threshold.clamp(0.0, 255.0);
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

fn score_coarse_photo(
    coarse_src: &[u8],
    cw: usize,
    ch: usize,
    ab: &[&str],
    space_idx: usize,
    pack: &CandidatePack,
    palette_kind: PhotoPaletteKind,
) -> f64 {
    let palette = palette_for(ab, pack.accent, palette_kind);
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

struct LocateHit {
    /// Displayed RMS fit %.
    percent: f64,
    mae: f64,
    corr: f64,
    /// Joint sort key (rms/mae/corr).
    rank: f64,
    accent: Accent,
    space_threshold: f64,
    dither: bool,
    label: String,
    z: num_bigint::BigInt,
    n: num_bigint::BigInt,
    book: u32,
    page: u32,
    page_span: u32,
}

impl LocateHit {
    fn from_pack_eval(pack: &CandidatePack, ev: PackEval) -> Self {
        let loc = &ev.locate.location;
        Self {
            percent: ev.rms_percent,
            mae: ev.mae,
            corr: ev.corr,
            rank: ev.rank_percent,
            accent: pack.accent,
            space_threshold: pack.space_threshold,
            dither: pack.dither,
            label: ev.label,
            z: loc.z.clone(),
            n: loc.n.clone(),
            book: loc.book_index,
            page: loc.page,
            page_span: ev.locate.page_span,
        }
    }

    fn take_if_better(&mut self, pack: &CandidatePack, ev: PackEval) {
        if ev.rank_percent <= self.rank {
            return;
        }
        let loc = &ev.locate.location;
        self.percent = ev.rms_percent;
        self.mae = ev.mae;
        self.corr = ev.corr;
        self.rank = ev.rank_percent;
        self.accent = pack.accent;
        self.space_threshold = pack.space_threshold;
        self.dither = pack.dither;
        self.label = ev.label;
        self.page = loc.page;
        self.page_span = ev.locate.page_span;
    }
}

/// Coarse downsample sweep → keep top distinct packs (+ space variants).
fn coarse_candidate_packs(src_rgba: &[u8], opts: &MosaicOpts) -> Vec<CandidatePack> {
    let (ab, space_idx, _) = alphabet_ctx(opts.alphabet_id);
    let (bw, bh) = book_grid_dims();
    let (coarse_src, cw, ch) = downsample_rgba(src_rgba, bw as usize, bh as usize, COARSE_FACTOR);
    let palette_kind = opts.palette_kind();

    let mut coarse: Vec<(f64, CandidatePack)> =
        Vec::with_capacity(1 + COARSE_HUE_STEPS * COARSE_CHROMA.len() * COARSE_LIGHT.len());
    let mut push_coarse = |pack: CandidatePack| {
        let pct = score_coarse_photo(&coarse_src, cw, ch, ab, space_idx, &pack, palette_kind);
        coarse.push((pct, pack));
    };

    push_coarse(CandidatePack::from_opts(opts, "current"));
    for step in 0..COARSE_HUE_STEPS {
        let h = (step as f64) * (360.0 / COARSE_HUE_STEPS as f64);
        for &c in &COARSE_CHROMA {
            for &l in &COARSE_LIGHT {
                push_coarse(CandidatePack::with_accent(
                    opts,
                    Accent::new(h, c, l),
                    "coarse",
                ));
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
    let mut hits: Vec<LocateHit> = Vec::new();
    for pack in packs {
        let Some(ev) = evaluate_pack(src, alphabet_id, pack, palette_kind) else {
            continue;
        };
        let loc = &ev.locate.location;
        if let Some(existing) = hits
            .iter_mut()
            .find(|h| h.z == loc.z && h.n == loc.n && h.book == loc.book_index)
        {
            existing.take_if_better(pack, ev);
            continue;
        }
        hits.push(LocateHit::from_pack_eval(pack, ev));
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
            hue: h.accent.hue,
            chroma: h.accent.chroma,
            light: h.accent.light,
            space_threshold: h.space_threshold,
            dither: h.dither,
            label: &h.label,
            alphabet_id,
            babel_exact: false,
        })
        .collect();
    json_results(&json_hits)
}

/// Coarse palette packs only (no full-book locate) — cheap enough for one frame.
///
/// Returns `{ ok, packs:[{hue,chroma,light,space_threshold,dither,label}] }`.
#[wasm_bindgen]
#[must_use]
pub fn mosaic_candidate_packs_json(src_rgba: &[u8], opts: &MosaicOpts) -> String {
    if ensure_book_rgba(src_rgba).is_err() {
        return ERR_BOOK_GRID.into();
    }
    let packs = coarse_candidate_packs(src_rgba, opts);
    let mut out = String::from(r#"{"ok":true,"packs":["#);
    for (i, p) in packs.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        let mut obj = JsonObject::begin(&mut out);
        obj.f64("hue", p.accent.hue, 3);
        obj.f64("chroma", p.accent.chroma, 4);
        obj.f64("light", p.accent.light, 4);
        obj.f64("space_threshold", p.space_threshold, 2);
        obj.bool("dither", p.dither);
        obj.str("label", p.label);
        obj.finish();
    }
    out.push_str("]}");
    out
}

/// Full-res project + locate for one mosaic pack (call from JS with yields between).
///
/// Returns `{ ok, results:[hit] }` or `{ ok:false, error }`.
#[wasm_bindgen]
#[must_use]
pub fn mosaic_candidate_eval_json(src_rgba: &[u8], opts: &MosaicOpts, label: &str) -> String {
    if ensure_book_rgba(src_rgba).is_err() {
        return ERR_BOOK_GRID.into();
    }
    let pack = CandidatePack::from_opts(opts, "eval");
    // Label is owned by the caller string — stash into LocateHit via evaluate.
    let Some(mut ev) = evaluate_pack(src_rgba, opts.alphabet_id, &pack, opts.palette_kind()) else {
        return r#"{"ok":false,"error":"could not locate mosaic"}"#.into();
    };
    if !label.is_empty() {
        ev.label = label.to_string();
    }
    let hit = LocateHit::from_pack_eval(&pack, ev);
    hits_to_json(std::slice::from_ref(&hit), opts.alphabet_id)
}

/// Top mosaic destinations for an uploaded book-grid image (blocking; prefer chunked API).
///
/// Coarse downsample sweep over hue × chroma × light, then full-res locate for
/// survivors. Scores use joint rms / mae / corr (photo↔alphabet mosaic).
///
/// Returns JSON `{ ok, results:[{ percent, mae, corr, z, n, book, page, page_span, hue, chroma, light,
/// space_threshold, dither, label, alphabet }] }` (`percent` is RMS fit %).
#[wasm_bindgen]
#[must_use]
pub fn mosaic_candidates_json(src_rgba: &[u8], opts: &MosaicOpts) -> String {
    if ensure_book_rgba(src_rgba).is_err() {
        return ERR_BOOK_GRID.into();
    }
    let packs = coarse_candidate_packs(src_rgba, opts);
    let hits = fine_locate_hits(src_rgba, opts.alphabet_id, &packs, opts.palette_kind());
    hits_to_json(&hits, opts.alphabet_id)
}
