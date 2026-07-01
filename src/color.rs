//! Whole-book colour map rendered as an RGBA image.

use wasm_bindgen::prelude::*;

use crate::config::{alphabet, CHARS_PER_LINE, LINES_PER_PAGE, PAGES_PER_BOOK};
use crate::gallery::node_fingerprint;
use crate::page::{page_symbols, PageAddr, PageRender};
use crate::universe::universe;

fn oklch_to_srgb(lightness: f64, chroma: f64, hue_deg: f64) -> [u8; 3] {
    let hue_rad = hue_deg * std::f64::consts::PI / 180.0;
    let oklab_a = chroma * hue_rad.cos();
    let oklab_b = chroma * hue_rad.sin();
    let l_ = lightness + 0.396_337_777_4 * oklab_a + 0.215_803_757_3 * oklab_b;
    let m_ = lightness - 0.105_561_345_8 * oklab_a - 0.063_854_172_8 * oklab_b;
    let s_ = lightness - 0.089_484_177_5 * oklab_a - 1.291_485_548 * oklab_b;
    let (l3, m3, s3) = (l_ * l_ * l_, m_ * m_ * m_, s_ * s_ * s_);
    let lin = [
        4.076_741_662_1 * l3 - 3.307_711_591_3 * m3 + 0.230_969_929_2 * s3,
        -1.268_438_004_6 * l3 + 2.609_757_401_1 * m3 - 0.341_319_396_5 * s3,
        -0.004_196_086_3 * l3 - 0.703_418_614_7 * m3 + 1.707_614_701 * s3,
    ];
    let mut out = [0u8; 3];
    for (i, &linear) in lin.iter().enumerate() {
        let gamma = if linear <= 0.003_130_8 {
            12.92 * linear
        } else {
            1.055 * linear.powf(1.0 / 2.4) - 0.055
        };
        out[i] = (gamma.clamp(0.0, 1.0) * 255.0).round() as u8;
    }
    out
}

/// One RGBA image of a whole book, ready for `ctx.putImageData`.
#[wasm_bindgen]
pub struct BookImage {
    width: u32,
    height: u32,
    pixels: Vec<u8>,
}

#[wasm_bindgen]
impl BookImage {
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
    pub fn pixels(&self) -> Vec<u8> {
        self.pixels.clone()
    }
}

#[wasm_bindgen]
#[must_use]
/// Render a whole book as an RGBA image (gallery palette keyed by fingerprint).
pub fn book_image(z: i64, n: i64, book_index: u32, alphabet_id: u32) -> BookImage {
    let ab = alphabet(alphabet_id);
    let len = ab.len();
    let space_idx = len - 3;

    let fp = node_fingerprint(z, n, alphabet_id, universe());
    let accent_hue = (((fp >> 48) & 0xffff) % 360) as f64;
    let accent_chroma = 0.08 + 0.14 * (((fp >> 32) & 0xffff) as f64 / 65535.0);
    let accent_light = 0.55 + 0.23 * (((fp >> 16) & 0xffff) as f64 / 65535.0);
    let step = 360.0 / len as f64;
    let palette: Vec<[u8; 3]> = (0..len)
        .map(|i| {
            oklch_to_srgb(
                accent_light,
                accent_chroma,
                (i as f64 * step + accent_hue) % 360.0,
            )
        })
        .collect();
    const SPACE_RGB: [u8; 3] = [0x15, 0x13, 0x1a];

    let total = (PAGES_PER_BOOK * LINES_PER_PAGE * CHARS_PER_LINE) as usize;
    let mut grid_side = (total as f64).sqrt() as usize;
    while !total.is_multiple_of(grid_side) {
        grid_side -= 1;
    }
    let height = grid_side as u32;
    let width = (total / grid_side) as u32;

    let mut pixels = vec![0u8; total * 4];
    let mut px_idx = 0;
    for page in 0..PAGES_PER_BOOK {
        let req = PageRender::new(PageAddr::new(
            z,
            n,
            book_index,
            page,
            alphabet_id,
            universe(),
        ));
        let state = page_symbols(&req);
        for &sym in &state {
            let idx = sym as usize;
            let rgb = if idx == space_idx {
                SPACE_RGB
            } else {
                palette[idx]
            };
            let px = &mut pixels[px_idx * 4..(px_idx + 1) * 4];
            px[0] = rgb[0];
            px[1] = rgb[1];
            px[2] = rgb[2];
            px[3] = 255;
            px_idx += 1;
        }
    }

    BookImage {
        width,
        height,
        pixels,
    }
}
