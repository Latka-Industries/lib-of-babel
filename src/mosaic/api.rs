//! WASM exports for mosaic project / flat preview.

use wasm_bindgen::prelude::*;

use crate::config::alphabet;

use super::flat::indices_to_flat;
use super::project::{MosaicOpts, project_photo, project_photo_preview};

/// Mosaic image returned to JS (`putImageData` + fit metrics).
#[wasm_bindgen]
pub struct MosaicImage {
    width: u32,
    height: u32,
    /// RMS fit % — same field name as before for JS.
    percent: f64,
    mae: f64,
    corr: f64,
    pixels: Vec<u8>,
}

#[wasm_bindgen]
impl MosaicImage {
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
    pub fn percent(&self) -> f64 {
        self.percent
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn mae(&self) -> f64 {
        self.mae
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn corr(&self) -> f64 {
        self.corr
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn pixels(&self) -> Vec<u8> {
        self.pixels.clone()
    }
}

fn mosaic_image(width: u32, height: u32, pixels: Vec<u8>) -> MosaicImage {
    MosaicImage {
        width,
        height,
        percent: 0.0,
        mae: 0.0,
        corr: 0.0,
        pixels,
    }
}

/// Project a book-grid RGBA buffer onto the alphabet palette (full resolution).
///
/// Fit metrics on the returned image are left at zero — callers that need
/// rms/mae/corr should score separately (search path does).
///
/// `palette_kind`: `0` = luma ramp, `1` = glyph / letter colour map.
///
/// # Errors
///
/// Returns a string `JsValue` when `src_rgba` is not the full-book colour grid
/// length (`book_cell_count() * 4`).
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)] // flat wasm-bindgen ABI; packs into [`MosaicOpts`]
pub fn mosaic_project(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    palette_kind: u32,
) -> Result<MosaicImage, JsValue> {
    let opts = MosaicOpts::from_wasm(
        alphabet_id,
        hue,
        chroma,
        light,
        space_threshold,
        dither,
        palette_kind,
    );
    let (width, height, _indices, mosaic) =
        project_photo(src_rgba, &opts).map_err(|e| JsValue::from_str(&e))?;
    Ok(mosaic_image(width, height, mosaic))
}

/// Downsampled projection for responsive mosaic knobs (`factor` ≥ 1).
///
/// Same palette / space / dither policy as [`mosaic_project`], but subsampled
/// so live `input` events stay snappy. Fit metrics are always zero.
///
/// # Errors
///
/// Returns a string `JsValue` when `src_rgba` is not the full-book colour grid
/// length (`book_cell_count() * 4`).
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)] // flat wasm-bindgen ABI; packs into [`MosaicOpts`]
pub fn mosaic_project_preview(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    palette_kind: u32,
    factor: u32,
) -> Result<MosaicImage, JsValue> {
    let opts = MosaicOpts::from_wasm(
        alphabet_id,
        hue,
        chroma,
        light,
        space_threshold,
        dither,
        palette_kind,
    );
    let (width, height, mosaic) = project_photo_preview(src_rgba, &opts, factor.max(1) as usize)
        .map_err(|e| JsValue::from_str(&e))?;
    Ok(mosaic_image(width, height, mosaic))
}

/// Build the embeddable cell string for a mosaic projection (no space-collapse).
///
/// `palette_kind`: `0` = luma ramp, `1` = glyph / letter colour map.
///
/// # Errors
///
/// Returns a string `JsValue` when `src_rgba` is not the full-book colour grid
/// length (`book_cell_count() * 4`).
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)] // flat wasm-bindgen ABI; packs into [`MosaicOpts`]
pub fn mosaic_flat_for(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
    palette_kind: u32,
) -> Result<String, JsValue> {
    let opts = MosaicOpts::from_wasm(
        alphabet_id,
        hue,
        chroma,
        light,
        space_threshold,
        dither,
        palette_kind,
    );
    let (_w, _h, indices, _mosaic) =
        project_photo(src_rgba, &opts).map_err(|e| JsValue::from_str(&e))?;
    Ok(indices_to_flat(&indices, alphabet(opts.alphabet_id)))
}
