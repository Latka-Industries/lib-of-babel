//! Quantize RGBA onto an alphabet palette (with optional dither).

use crate::color::{
    book_cell_count, book_grid_dims, build_glyph_palette, build_photo_luma_palette,
};
use crate::config::alphabet;

use super::lab::{build_nearest_lut, clamp_channel, nearest_index};
use super::score::downsample_rgba;

/// Which alphabet colour map to project the photo onto.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum PhotoPaletteKind {
    /// Lightness ramp (structure-first greys).
    Luma,
    /// Reading glyph colours (per-letter hues — Babelgram stamp map).
    Glyph,
}

impl PhotoPaletteKind {
    pub(crate) fn from_u32(v: u32) -> Self {
        if v == 0 { Self::Luma } else { Self::Glyph }
    }
}

/// Alphabet packs keep space at `len - 3` (before `.` and `,`).
pub(crate) fn alphabet_space_idx(ab: &[&str]) -> usize {
    ab.len() - 3
}

/// Quantize book-grid RGBA → glyph indices + mosaic RGBA.
pub(crate) fn project_indices(
    src: &[u8],
    palette: &[[u8; 3]],
    space_idx: usize,
    space_threshold: f64,
    dither: bool,
) -> (Vec<u16>, Vec<u8>) {
    let (width, height) = book_grid_dims();
    project_indices_sized(
        src,
        width as usize,
        height as usize,
        palette,
        space_idx,
        space_threshold,
        dither,
    )
}

/// Quantize RGBA of size `w`×`h` → glyph indices + mosaic RGBA.
pub(crate) fn project_indices_sized(
    src: &[u8],
    w: usize,
    h: usize,
    palette: &[[u8; 3]],
    space_idx: usize,
    space_threshold: f64,
    dither: bool,
) -> (Vec<u16>, Vec<u8>) {
    let total = w * h;
    debug_assert_eq!(src.len(), total * 4);
    let lut = build_nearest_lut(palette, space_idx, space_threshold);

    let mut work = src.to_vec();
    let mut indices = vec![0u16; total];
    let mut mosaic = vec![0u8; total * 4];

    for y in 0..h {
        for x in 0..w {
            let i = y * w + x;
            let o = i * 4;
            let rgb = [work[o], work[o + 1], work[o + 2]];
            let idx = nearest_index(&lut, palette, rgb, space_idx, space_threshold);
            indices[i] = idx;
            let chosen = palette[idx as usize];
            mosaic[o] = chosen[0];
            mosaic[o + 1] = chosen[1];
            mosaic[o + 2] = chosen[2];
            mosaic[o + 3] = 255;

            if !dither {
                continue;
            }
            let er = f64::from(rgb[0]) - f64::from(chosen[0]);
            let eg = f64::from(rgb[1]) - f64::from(chosen[1]);
            let eb = f64::from(rgb[2]) - f64::from(chosen[2]);
            let diffuse = |px: &mut [u8], factor: f64| {
                px[0] = clamp_channel(f64::from(px[0]) + er * factor);
                px[1] = clamp_channel(f64::from(px[1]) + eg * factor);
                px[2] = clamp_channel(f64::from(px[2]) + eb * factor);
            };
            if x + 1 < w {
                diffuse(&mut work[(i + 1) * 4..(i + 1) * 4 + 4], 7.0 / 16.0);
            }
            if y + 1 < h {
                if x > 0 {
                    diffuse(&mut work[(i + w - 1) * 4..(i + w - 1) * 4 + 4], 3.0 / 16.0);
                }
                diffuse(&mut work[(i + w) * 4..(i + w) * 4 + 4], 5.0 / 16.0);
                if x + 1 < w {
                    diffuse(&mut work[(i + w + 1) * 4..(i + w + 1) * 4 + 4], 1.0 / 16.0);
                }
            }
        }
    }

    (indices, mosaic)
}

pub(crate) fn ensure_book_rgba(src: &[u8]) -> Result<(u32, u32), String> {
    let (w, h) = book_grid_dims();
    let need = book_cell_count() * 4;
    if src.len() != need {
        return Err(format!(
            "expected RGBA length {need} for {w}×{h} book grid, got {}",
            src.len()
        ));
    }
    Ok((w, h))
}

fn build_photo_palette(
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    palette_kind: PhotoPaletteKind,
) -> (usize, Vec<[u8; 3]>) {
    let ab = alphabet(alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let palette = match palette_kind {
        PhotoPaletteKind::Luma => build_photo_luma_palette(ab, hue, chroma, light),
        PhotoPaletteKind::Glyph => build_glyph_palette(ab, hue, chroma, light),
    };
    (space_idx, palette)
}

/// Project a validated book-grid buffer onto an alphabet colour map.
pub(crate) fn project_photo(
    src: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    palette_kind: PhotoPaletteKind,
) -> Result<(u32, u32, Vec<u16>, Vec<u8>), String> {
    let (width, height) = ensure_book_rgba(src)?;
    let (space_idx, palette) = build_photo_palette(alphabet_id, hue, chroma, light, palette_kind);
    let (indices, mosaic) = project_indices(
        src,
        &palette,
        space_idx,
        space_threshold.clamp(0.0, 255.0),
        dither,
    );
    Ok((width, height, indices, mosaic))
}

/// Downsampled projection for live UI knobs (same palette policy as [`project_photo`]).
pub(crate) fn project_photo_preview(
    src: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    palette_kind: PhotoPaletteKind,
    factor: usize,
) -> Result<(u32, u32, Vec<u8>), String> {
    let (bw, bh) = ensure_book_rgba(src)?;
    let (coarse, cw, ch) = downsample_rgba(src, bw as usize, bh as usize, factor.max(1));
    let (space_idx, palette) = build_photo_palette(alphabet_id, hue, chroma, light, palette_kind);
    let (_indices, mosaic) = project_indices_sized(
        &coarse,
        cw,
        ch,
        &palette,
        space_idx,
        space_threshold.clamp(0.0, 255.0),
        dither,
    );
    Ok((cw as u32, ch as u32, mosaic))
}
