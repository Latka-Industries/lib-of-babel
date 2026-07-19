//! Quantize RGBA onto an alphabet palette (with optional dither).

use wasm_bindgen::prelude::*;

use crate::color::{
    book_cell_count, book_grid_dims, build_glyph_palette, build_photo_luma_palette, room_accent_at,
};
use crate::config::alphabet;

use super::lab::{build_nearest_lut, clamp_channel, nearest_index};
use super::score::downsample_rgba;

/// OKLCH accent knobs shared by projection / room palette.
#[derive(Clone, Copy, Debug)]
pub(crate) struct Accent {
    pub hue: f64,
    pub chroma: f64,
    pub light: f64,
}

impl Accent {
    pub(crate) fn new(hue: f64, chroma: f64, light: f64) -> Self {
        Self { hue, chroma, light }
    }

    pub(crate) fn from_array([hue, chroma, light]: [f64; 3]) -> Self {
        Self { hue, chroma, light }
    }

    pub(crate) fn for_room(
        z: &num_bigint::BigInt,
        n: &num_bigint::BigInt,
        universe_seed: u64,
    ) -> Self {
        Self::from_array(room_accent_at(z, n, universe_seed))
    }

    pub(crate) fn approx_eq(self, other: Self) -> bool {
        (self.hue - other.hue).abs() < 1e-9
            && (self.chroma - other.chroma).abs() < 1e-9
            && (self.light - other.light).abs() < 1e-9
    }
}

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

    pub(crate) fn build(self, ab: &[&str], accent: Accent) -> Vec<[u8; 3]> {
        match self {
            Self::Luma => build_photo_luma_palette(ab, accent.hue, accent.chroma, accent.light),
            Self::Glyph => build_glyph_palette(ab, accent.hue, accent.chroma, accent.light),
        }
    }
}

/// Shared knobs for photo→alphabet projection / candidate search.
///
/// Construct from JS with `new MosaicOpts(alphabetId, hue, chroma, light, space, dither, paletteKind)`
/// (`paletteKind`: `0` luma, `1` glyph), then pass to `mosaic_project*` / candidate exports.
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct MosaicOpts {
    pub(crate) alphabet_id: u32,
    pub(crate) accent: Accent,
    pub(crate) space_threshold: f64,
    pub(crate) dither: bool,
    /// `0` luma, `1` glyph — kept as `u32` so wasm-bindgen can expose the struct cleanly.
    palette_kind: u32,
}

impl MosaicOpts {
    #[must_use]
    pub(crate) fn new(
        alphabet_id: u32,
        hue: f64,
        chroma: f64,
        light: f64,
        space_threshold: f64,
        dither: bool,
        palette_kind: PhotoPaletteKind,
    ) -> Self {
        Self {
            alphabet_id,
            accent: Accent::new(hue, chroma, light),
            space_threshold: space_threshold.clamp(0.0, 255.0),
            dither,
            palette_kind: match palette_kind {
                PhotoPaletteKind::Luma => 0,
                PhotoPaletteKind::Glyph => 1,
            },
        }
    }

    #[must_use]
    pub(crate) fn palette_kind(self) -> PhotoPaletteKind {
        PhotoPaletteKind::from_u32(self.palette_kind)
    }
}

#[wasm_bindgen]
impl MosaicOpts {
    /// Pack flat JS knobs (`palette_kind`: `0` luma, `1` glyph).
    #[wasm_bindgen(constructor)]
    #[must_use]
    pub fn create(
        alphabet_id: u32,
        hue: f64,
        chroma: f64,
        light: f64,
        space_threshold: f64,
        dither: bool,
        palette_kind: u32,
    ) -> MosaicOpts {
        Self::new(
            alphabet_id,
            hue,
            chroma,
            light,
            space_threshold,
            dither,
            PhotoPaletteKind::from_u32(palette_kind),
        )
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

fn build_photo_palette(opts: &MosaicOpts) -> (usize, Vec<[u8; 3]>) {
    let ab = alphabet(opts.alphabet_id);
    let space_idx = alphabet_space_idx(ab);
    let palette = opts.palette_kind().build(ab, opts.accent);
    (space_idx, palette)
}

/// Project a validated book-grid buffer onto an alphabet colour map.
pub(crate) fn project_photo(
    src: &[u8],
    opts: &MosaicOpts,
) -> Result<(u32, u32, Vec<u16>, Vec<u8>), String> {
    let (width, height) = ensure_book_rgba(src)?;
    let (space_idx, palette) = build_photo_palette(opts);
    let (indices, mosaic) =
        project_indices(src, &palette, space_idx, opts.space_threshold, opts.dither);
    Ok((width, height, indices, mosaic))
}

/// Downsampled projection for live UI knobs (same palette policy as [`project_photo`]).
pub(crate) fn project_photo_preview(
    src: &[u8],
    opts: &MosaicOpts,
    factor: usize,
) -> Result<(u32, u32, Vec<u8>), String> {
    let (bw, bh) = ensure_book_rgba(src)?;
    let (coarse, cw, ch) = downsample_rgba(src, bw as usize, bh as usize, factor.max(1));
    let (space_idx, palette) = build_photo_palette(opts);
    let (_indices, mosaic) = project_indices_sized(
        &coarse,
        cw,
        ch,
        &palette,
        space_idx,
        opts.space_threshold,
        opts.dither,
    );
    Ok((cw as u32, ch as u32, mosaic))
}
