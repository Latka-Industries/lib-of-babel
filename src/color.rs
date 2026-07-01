//! Whole-book colour map rendered as an RGBA image.

use wasm_bindgen::prelude::*;

use crate::config::{alphabet, CHARS_PER_LINE, LINES_PER_PAGE, PAGES_PER_BOOK};
use crate::gallery::node_fingerprint;
use crate::page::page_symbols;
use crate::universe::universe;

fn oklch_to_srgb(l: f64, c: f64, h_deg: f64) -> [u8; 3] {
    let h = h_deg * std::f64::consts::PI / 180.0;
    let a = c * h.cos();
    let b = c * h.sin();
    let l_ = l + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
    let m_ = l - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
    let s_ = l - 0.089_484_177_5 * a - 1.291_485_548 * b;
    let (l3, m3, s3) = (l_ * l_ * l_, m_ * m_ * m_, s_ * s_ * s_);
    let lin = [
        4.076_741_662_1 * l3 - 3.307_711_591_3 * m3 + 0.230_969_929_2 * s3,
        -1.268_438_004_6 * l3 + 2.609_757_401_1 * m3 - 0.341_319_396_5 * s3,
        -0.004_196_086_3 * l3 - 0.703_418_614_7 * m3 + 1.707_614_701 * s3,
    ];
    let mut out = [0u8; 3];
    for (i, &cc) in lin.iter().enumerate() {
        let v = if cc <= 0.003_130_8 {
            12.92 * cc
        } else {
            1.055 * cc.powf(1.0 / 2.4) - 0.055
        };
        out[i] = (v.clamp(0.0, 1.0) * 255.0).round() as u8;
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
    pub fn width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.height
    }

    #[wasm_bindgen(getter)]
    pub fn pixels(&self) -> Vec<u8> {
        self.pixels.clone()
    }
}

#[wasm_bindgen]
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
    let mut h = (total as f64).sqrt() as usize;
    while total % h != 0 {
        h -= 1;
    }
    let height = h as u32;
    let width = (total / h) as u32;

    let mut pixels = vec![0u8; total * 4];
    let mut px_idx = 0;
    for page in 0..PAGES_PER_BOOK {
        let state = page_symbols(z, n, book_index, page, alphabet_id, universe(), None, None);
        for &sym in state.iter() {
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
