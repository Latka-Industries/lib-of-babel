//! Mosaic unit tests.

use super::{
    COARSE_FACTOR, alphabet_space_idx, book_cell_count, book_grid_dims, build_nearest_lut,
    downsample_rgba, fit_percent, fit_perceptual_percent, indices_to_flat, locate_mosaic_flat,
    nearest_index, oklab_dist_sq, project_indices, project_indices_sized, srgb_to_oklab,
};
use crate::color::{book_image_at, build_glyph_palette, room_accent_at};
use crate::config::{DEFAULT_ALPHABET, alphabet};
use crate::universe::set_universe;
use num_bigint::BigInt;
use std::sync::Mutex;

/// `set_universe` is process-global — serialize tests that touch it.
static UNIVERSE_LOCK: Mutex<()> = Mutex::new(());

fn lock_universe() -> std::sync::MutexGuard<'static, ()> {
    UNIVERSE_LOCK
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner)
}

fn bi(x: i64) -> BigInt {
    BigInt::from(x)
}

fn accent_for(z: &BigInt, n: &BigInt, universe_seed: u64) -> (f64, f64, f64) {
    let a = room_accent_at(z, n, universe_seed);
    (a[0], a[1], a[2])
}

#[test]
fn book_grid_matches_book_image() {
    let _g = lock_universe();
    set_universe(0);
    let img = book_image_at(&bi(0), &bi(0), 0, DEFAULT_ALPHABET);
    let (w, h) = book_grid_dims();
    assert_eq!(img.width(), w);
    assert_eq!(img.height(), h);
    assert_eq!(img.pixels().len(), book_cell_count() * 4);
}

#[test]
fn round_trip_book_image_exact_accent_near_perfect_fit() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let z = bi(1);
    let n = bi(2);
    let book = 3_u32;
    let img = book_image_at(&z, &n, book, alphabet_id);
    let pixels = img.pixels();
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let (hue, chroma, light) = accent_for(&z, &n, 0);
    let palette = build_glyph_palette(ab, hue, chroma, light);
    let (indices, mosaic) = project_indices(&pixels, &palette, space_idx, 0.0, false);
    assert!(
        fit_percent(&pixels, &mosaic) > 99.9,
        "exact accent should rebuild the export"
    );
    assert_eq!(indices.len(), book_cell_count());
    let flat = indices_to_flat(&indices, ab);
    let hit = locate_mosaic_flat(&flat, alphabet_id, 0).expect("locate");
    assert_eq!(hit.location.page, 0);
    assert!(hit.page_span >= 1);
    // True Basile: inverting virgin page 0 of this book returns the same shelf.
    assert_eq!(&hit.location.z, &z);
    assert_eq!(&hit.location.n, &n);
    assert_eq!(hit.location.book_index, book);
}

#[test]
fn babel_cross_universe_same_fit_different_coords() {
    let _g = lock_universe();
    let alphabet_id = DEFAULT_ALPHABET;
    let z = bi(5);
    let n = bi(-3);
    let book = 11_u32;
    set_universe(0);
    let img = book_image_at(&z, &n, book, alphabet_id);
    let pixels = img.pixels();
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let (hue, chroma, light) = accent_for(&z, &n, 0);
    let palette = build_glyph_palette(ab, hue, chroma, light);
    let (indices, mosaic) = project_indices(&pixels, &palette, space_idx, 0.0, false);
    let fit = fit_percent(&pixels, &mosaic);
    assert!(fit > 99.9);
    let flat = indices_to_flat(&indices, ab);

    let hit_a = locate_mosaic_flat(&flat, alphabet_id, 0).expect("u0");
    let hit_b = locate_mosaic_flat(&flat, alphabet_id, 7).expect("u7");
    assert_ne!(
        (
            &hit_a.location.z,
            &hit_a.location.n,
            hit_a.location.book_index
        ),
        (
            &hit_b.location.z,
            &hit_b.location.n,
            hit_b.location.book_index
        ),
        "same mosaic flat must land elsewhere in another universe"
    );
}

#[test]
fn wrong_accent_fit_is_noticeably_worse() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let img = book_image_at(&bi(1), &bi(2), 3, alphabet_id);
    let pixels = img.pixels();
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let (hue, chroma, light) = accent_for(&bi(1), &bi(2), 0);
    let good = build_glyph_palette(ab, hue, chroma, light);
    let bad = build_glyph_palette(ab, hue, chroma * 0.5, light);
    let (_, mosaic_good) = project_indices(&pixels, &good, space_idx, 0.0, false);
    let (_, mosaic_bad) = project_indices(&pixels, &bad, space_idx, 0.0, false);
    let good_fit = fit_percent(&pixels, &mosaic_good);
    let bad_fit = fit_percent(&pixels, &mosaic_bad);
    assert!(good_fit > 99.9);
    assert!(
        bad_fit < 99.0,
        "mismatched chroma should not claim near-perfect fit (got {bad_fit})"
    );
}

/// Regression: same flat locates elsewhere in another universe; virgin page holds it.
#[test]
fn stamped_export_cross_universe_locate_is_deterministic() {
    use crate::page::{PageAddr, PageRender, page_text};
    use crate::search::search_offset;

    let _g = lock_universe();
    const ORIGIN_U: u64 = 0x65ddeb89a4f13970;
    const SEARCH_U: u64 = 0xff27a58496aad39e;
    let alphabet_id = DEFAULT_ALPHABET;
    let flat = "stamped babelgram export";

    let hit = locate_mosaic_flat(flat, alphabet_id, SEARCH_U).expect("locate");
    let hit0 = locate_mosaic_flat(flat, alphabet_id, ORIGIN_U).expect("origin");
    assert_ne!(
        (&hit.location.z, &hit.location.n, hit.location.book_index),
        (&hit0.location.z, &hit0.location.n, hit0.location.book_index),
        "same flat must land elsewhere in another universe"
    );
    assert!(hit.page_span >= 1);

    set_universe(SEARCH_U);
    let loc = &hit.location;
    let addr = PageAddr::new(
        loc.z.clone(),
        loc.n.clone(),
        loc.book_index,
        loc.page,
        alphabet_id,
        SEARCH_U,
    );
    let virgin = page_text(&PageRender::new(addr));
    let page_flat: String = virgin.chars().filter(|c| *c != '\n').collect();
    let off = search_offset(flat, flat.len());
    assert_eq!(
        &page_flat[off..off + flat.len()],
        flat,
        "virgin page at locate coords must contain the flat"
    );
}

#[test]
fn oklab_nearest_prefers_matching_accent_palette() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let img = book_image_at(&bi(9), &bi(2), 0, alphabet_id);
    let pixels = img.pixels();
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let (hue, chroma, light) = accent_for(&bi(9), &bi(2), 0);
    let good = build_glyph_palette(ab, hue, chroma, light);
    let bad = build_glyph_palette(ab, (hue + 180.0) % 360.0, chroma, light);
    // Project a mid-grey source sample through LUTs — matching palette should win.
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
    let good_fit = fit_perceptual_percent(&pixels, &mosaic_good, 8);
    let bad_fit = fit_perceptual_percent(&pixels, &mosaic_bad, 8);
    assert!(
        good_fit > bad_fit,
        "OKLab project should rank true accent higher (good={good_fit} bad={bad_fit})"
    );
}

#[test]
fn perceptual_fit_prefers_matching_accent_over_wrong_hue() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let img = book_image_at(&bi(4), &bi(5), 6, alphabet_id);
    let pixels = img.pixels();
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let (hue, chroma, light) = accent_for(&bi(4), &bi(5), 0);
    let good = build_glyph_palette(ab, hue, chroma, light);
    let bad = build_glyph_palette(ab, (hue + 180.0) % 360.0, chroma, light);
    let (_, mosaic_good) = project_indices(&pixels, &good, space_idx, 0.0, false);
    let (_, mosaic_bad) = project_indices(&pixels, &bad, space_idx, 0.0, false);
    let good_fit = fit_perceptual_percent(&pixels, &mosaic_good, 1);
    let bad_fit = fit_perceptual_percent(&pixels, &mosaic_bad, 1);
    assert!(
        good_fit > bad_fit,
        "perceptual fit should prefer matching accent (good={good_fit} bad={bad_fit})"
    );
}

#[test]
fn coarse_downsample_preserves_ranking_signal() {
    let _g = lock_universe();
    set_universe(0);
    let alphabet_id = DEFAULT_ALPHABET;
    let img = book_image_at(&bi(8), &bi(1), 2, alphabet_id);
    let pixels = img.pixels();
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let (hue, chroma, light) = accent_for(&bi(8), &bi(1), 0);
    let (bw, bh) = book_grid_dims();
    let (coarse, cw, ch) = downsample_rgba(&pixels, bw as usize, bh as usize, COARSE_FACTOR);
    let good = build_glyph_palette(ab, hue, chroma, light);
    let bad = build_glyph_palette(ab, (hue + 90.0) % 360.0, chroma, light);
    let (_, g) = project_indices_sized(&coarse, cw, ch, &good, space_idx, 0.0, false);
    let (_, b) = project_indices_sized(&coarse, cw, ch, &bad, space_idx, 0.0, false);
    let good_fit = fit_perceptual_percent(&coarse, &g, 1);
    let bad_fit = fit_perceptual_percent(&coarse, &b, 1);
    assert!(
        good_fit > bad_fit,
        "coarse ranking should still prefer true accent (good={good_fit} bad={bad_fit})"
    );
}
