//! Mosaic unit tests — no full-book Basile (that hangs debug `cargo test`).

use super::{
    COARSE_FACTOR, MosaicOpts, PhotoPaletteKind, alphabet_space_idx, book_cell_count,
    book_grid_dims, build_nearest_lut, downsample_rgba, nearest_index, oklab_dist_sq,
    project_indices, project_indices_sized, project_photo_preview, rgb_fit_triple, srgb_to_oklab,
};
use crate::color::{build_glyph_palette, room_accent_at};
use crate::config::{DEFAULT_ALPHABET, alphabet};
use crate::universe::{lock_for_tests, set_universe};
use num_bigint::BigInt;

fn lock_universe() -> std::sync::MutexGuard<'static, ()> {
    lock_for_tests()
}

fn bi(x: i64) -> BigInt {
    BigInt::from(x)
}

fn accent_for(z: &BigInt, n: &BigInt, universe_seed: u64) -> (f64, f64, f64) {
    let a = room_accent_at(z, n, universe_seed);
    (a[0], a[1], a[2])
}

/// Synthetic full-book RGBA painted from a glyph palette (no Basile materialise).
fn paint_synthetic(alphabet_id: u32, hue: f64, chroma: f64, light: f64) -> Vec<u8> {
    let ab = alphabet(alphabet_id);
    let palette = build_glyph_palette(ab, hue, chroma, light);
    let n = book_cell_count();
    let mut out = vec![0u8; n * 4];
    for i in 0..n {
        let rgb = palette[i % palette.len()];
        let o = i * 4;
        out[o] = rgb[0];
        out[o + 1] = rgb[1];
        out[o + 2] = rgb[2];
        out[o + 3] = 255;
    }
    out
}

#[test]
fn book_grid_dims_match_cell_count() {
    let (w, h) = book_grid_dims();
    assert_eq!((w * h) as usize, book_cell_count());
}

#[test]
fn project_round_trip_on_synthetic_palette_is_near_exact() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let (hue, chroma, light) = accent_for(&bi(1), &bi(2), 0);
    let pixels = paint_synthetic(alphabet_id, hue, chroma, light);
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let palette = build_glyph_palette(ab, hue, chroma, light);
    let (_, mosaic) = project_indices(&pixels, &palette, space_idx, 0.0, false);
    let fit = rgb_fit_triple(&pixels, &mosaic, 1).rms_percent;
    assert!(
        fit > 99.9,
        "projecting a palette-painted grid should be near-exact (got {fit})"
    );
}

#[test]
fn wrong_accent_fit_is_noticeably_worse() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let (hue, chroma, light) = accent_for(&bi(1), &bi(2), 0);
    let pixels = paint_synthetic(alphabet_id, hue, chroma, light);
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let good = build_glyph_palette(ab, hue, chroma, light);
    let bad = build_glyph_palette(ab, hue, chroma * 0.5, light);
    let (_, mosaic_good) = project_indices(&pixels, &good, space_idx, 0.0, false);
    let (_, mosaic_bad) = project_indices(&pixels, &bad, space_idx, 0.0, false);
    let good_fit = rgb_fit_triple(&pixels, &mosaic_good, 1).rms_percent;
    let bad_fit = rgb_fit_triple(&pixels, &mosaic_bad, 1).rms_percent;
    assert!(good_fit > 99.9);
    assert!(
        bad_fit < 99.0,
        "mismatched chroma should not claim near-perfect fit (got {bad_fit})"
    );
}

#[test]
fn oklab_nearest_prefers_matching_accent_palette() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let (hue, chroma, light) = accent_for(&bi(9), &bi(2), 0);
    let pixels = paint_synthetic(alphabet_id, hue, chroma, light);
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let good = build_glyph_palette(ab, hue, chroma, light);
    let bad = build_glyph_palette(ab, (hue + 180.0) % 360.0, chroma, light);
    let sample = [pixels[0], pixels[1], pixels[2]];
    let lut_good = build_nearest_lut(&good, space_idx, 0.0);
    let lut_bad = build_nearest_lut(&bad, space_idx, 0.0);
    let ig = nearest_index(&lut_good, &good, sample, space_idx, 0.0) as usize;
    let ib = nearest_index(&lut_bad, &bad, sample, space_idx, 0.0) as usize;
    let d_good = oklab_dist_sq(srgb_to_oklab(sample), srgb_to_oklab(good[ig]));
    let d_bad = oklab_dist_sq(srgb_to_oklab(sample), srgb_to_oklab(bad[ib]));
    assert!(
        d_good <= d_bad + 1e-9,
        "OKLab nearest under matching accent should not lose (good={d_good} bad={d_bad})"
    );
    let (_, mosaic_good) = project_indices(&pixels, &good, space_idx, 0.0, false);
    let (_, mosaic_bad) = project_indices(&pixels, &bad, space_idx, 0.0, false);
    let good_fit = rgb_fit_triple(&pixels, &mosaic_good, 8).rank_percent();
    let bad_fit = rgb_fit_triple(&pixels, &mosaic_bad, 8).rank_percent();
    assert!(
        good_fit > bad_fit,
        "OKLab project should rank true accent higher (good={good_fit} bad={bad_fit})"
    );
}

#[test]
fn multi_metric_fit_prefers_matching_accent_over_wrong_hue() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let (hue, chroma, light) = accent_for(&bi(4), &bi(5), 0);
    let pixels = paint_synthetic(alphabet_id, hue, chroma, light);
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let good = build_glyph_palette(ab, hue, chroma, light);
    let bad = build_glyph_palette(ab, (hue + 180.0) % 360.0, chroma, light);
    let (_, mosaic_good) = project_indices(&pixels, &good, space_idx, 0.0, false);
    let (_, mosaic_bad) = project_indices(&pixels, &bad, space_idx, 0.0, false);
    let good_fit = rgb_fit_triple(&pixels, &mosaic_good, 1).rank_percent();
    let bad_fit = rgb_fit_triple(&pixels, &mosaic_bad, 1).rank_percent();
    assert!(
        good_fit > bad_fit,
        "multi-metric fit should prefer matching accent (good={good_fit} bad={bad_fit})"
    );
}

#[test]
fn preview_factor_shrinks_grid() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let (hue, chroma, light) = accent_for(&bi(0), &bi(0), 0);
    let pixels = paint_synthetic(alphabet_id, hue, chroma, light);
    let (bw, bh) = book_grid_dims();
    let opts = MosaicOpts::new(
        alphabet_id,
        hue,
        chroma,
        light,
        0.0,
        false,
        PhotoPaletteKind::Glyph,
    );
    let (pw, ph, mosaic) = project_photo_preview(&pixels, &opts, 8).expect("preview");
    assert_eq!(pw as usize, (bw as usize / 8).max(1));
    assert_eq!(ph as usize, (bh as usize / 8).max(1));
    assert_eq!(mosaic.len(), (pw * ph * 4) as usize);
}

#[test]
fn coarse_downsample_preserves_ranking_signal() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let (hue, chroma, light) = accent_for(&bi(8), &bi(1), 0);
    let pixels = paint_synthetic(alphabet_id, hue, chroma, light);
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let (bw, bh) = book_grid_dims();
    let (coarse, cw, ch) = downsample_rgba(&pixels, bw as usize, bh as usize, COARSE_FACTOR);
    let good = build_glyph_palette(ab, hue, chroma, light);
    let bad = build_glyph_palette(ab, (hue + 90.0) % 360.0, chroma, light);
    let (_, g) = project_indices_sized(&coarse, cw, ch, &good, space_idx, 0.0, false);
    let (_, b) = project_indices_sized(&coarse, cw, ch, &bad, space_idx, 0.0, false);
    let good_fit = rgb_fit_triple(&coarse, &g, 1).rank_percent();
    let bad_fit = rgb_fit_triple(&coarse, &b, 1).rank_percent();
    assert!(
        good_fit > bad_fit,
        "coarse ranking should still prefer true accent (good={good_fit} bad={bad_fit})"
    );
}
