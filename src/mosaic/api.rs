//! WASM exports for mosaic project / flat preview.

use wasm_bindgen::prelude::*;

use crate::config::alphabet;

use super::flat::indices_to_flat;
use super::project::project_photo_luma;
use super::score::fit_perceptual_percent;

/// Mosaic image returned to JS (`putImageData` + fit %).
#[wasm_bindgen]
pub struct MosaicImage {
    width: u32,
    height: u32,
    percent: f64,
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
    pub fn pixels(&self) -> Vec<u8> {
        self.pixels.clone()
    }
}

/// Project a book-grid RGBA buffer onto the alphabet palette (preview).
///
/// # Errors
///
/// Returns a string `JsValue` when `src_rgba` is not the full-book colour grid
/// length (`book_cell_count() * 4`).
#[wasm_bindgen]
pub fn mosaic_project(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
) -> Result<MosaicImage, JsValue> {
    let (width, height, _indices, mosaic) = project_photo_luma(
        src_rgba,
        alphabet_id,
        hue,
        chroma,
        light,
        space_threshold,
        dither,
    )
    .map_err(|e| JsValue::from_str(&e))?;
    // Live photo preview uses the same metric as find matches.
    let percent = fit_perceptual_percent(src_rgba, &mosaic, 1);
    Ok(MosaicImage {
        width,
        height,
        percent,
        pixels: mosaic,
    })
}

/// Build the embeddable cell string for a mosaic projection (no space-collapse).
///
/// # Errors
///
/// Returns a string `JsValue` when `src_rgba` is not the full-book colour grid
/// length (`book_cell_count() * 4`).
#[wasm_bindgen]
pub fn mosaic_flat_for(
    src_rgba: &[u8],
    alphabet_id: u32,
    hue: f64,
    chroma: f64,
    light: f64,
    space_threshold: f64,
    dither: bool,
) -> Result<String, JsValue> {
    let (_w, _h, indices, _mosaic) = project_photo_luma(
        src_rgba,
        alphabet_id,
        hue,
        chroma,
        light,
        space_threshold,
        dither,
    )
    .map_err(|e| JsValue::from_str(&e))?;
    Ok(indices_to_flat(&indices, alphabet(alphabet_id)))
}
