//! sRGB ↔ `OKLab` helpers + nearest-palette LUT for mosaic quantization.

/// Nearest-colour LUT resolution per RGB channel (32³ = 32 768 entries).
pub(crate) const LUT_BINS: usize = 32;
pub(crate) const LUT_SHIFT: u32 = 3; // 8 - log2(32)
pub(crate) fn srgb_channel_to_linear(c: u8) -> f64 {
    let x = f64::from(c) / 255.0;
    if x <= 0.040_45 {
        x / 12.92
    } else {
        ((x + 0.055) / 1.055).powf(2.4)
    }
}

/// sRGB 8-bit → `OKLab` (Björn Ottosson).
pub(crate) fn srgb_to_oklab(rgb: [u8; 3]) -> [f64; 3] {
    let lin_r = srgb_channel_to_linear(rgb[0]);
    let lin_g = srgb_channel_to_linear(rgb[1]);
    let lin_b = srgb_channel_to_linear(rgb[2]);
    // Cone LMS (paper names L/M/S).
    let cone_l = 0.412_221_470_8 * lin_r + 0.536_332_536_3 * lin_g + 0.051_445_992_9 * lin_b;
    let cone_m = 0.211_903_498_2 * lin_r + 0.680_699_545_1 * lin_g + 0.107_396_956_6 * lin_b;
    let cone_s = 0.088_302_461_9 * lin_r + 0.281_718_837_6 * lin_g + 0.629_978_700_5 * lin_b;
    let root_l = cone_l.cbrt();
    let root_m = cone_m.cbrt();
    let root_s = cone_s.cbrt();
    [
        0.210_454_255_3 * root_l + 0.793_617_785_0 * root_m - 0.004_072_046_8 * root_s,
        1.977_998_495_1 * root_l - 2.428_592_205_0 * root_m + 0.450_593_709_9 * root_s,
        0.025_904_037_1 * root_l + 0.782_771_766_2 * root_m - 0.808_675_766_0 * root_s,
    ]
}

pub(crate) fn oklab_dist_sq(a: [f64; 3], b: [f64; 3]) -> f64 {
    let dl = a[0] - b[0];
    let da = a[1] - b[1];
    let db = a[2] - b[2];
    dl * dl + da * da + db * db
}

pub(crate) fn luminance_f64(r: f64, g: f64, b: f64) -> f64 {
    0.2126 * r + 0.7152 * g + 0.0722 * b
}

pub(crate) fn luminance(rgb: [u8; 3]) -> f64 {
    luminance_f64(f64::from(rgb[0]), f64::from(rgb[1]), f64::from(rgb[2]))
}

pub(crate) fn lut_index(r: u8, g: u8, b: u8) -> usize {
    let rq = (u32::from(r) >> LUT_SHIFT) as usize;
    let gq = (u32::from(g) >> LUT_SHIFT) as usize;
    let bq = (u32::from(b) >> LUT_SHIFT) as usize;
    (rq * LUT_BINS + gq) * LUT_BINS + bq
}

/// Nearest palette entry in `OKLab` (used for photo projection).
pub(crate) fn build_nearest_lut(
    palette: &[[u8; 3]],
    space_idx: usize,
    space_threshold: f64,
) -> Vec<u16> {
    let mut lut = vec![0u16; LUT_BINS * LUT_BINS * LUT_BINS];
    let half = (256 / LUT_BINS / 2) as u8;
    let palette_lab: Vec<[f64; 3]> = palette.iter().map(|&p| srgb_to_oklab(p)).collect();
    for rq in 0..LUT_BINS {
        for gq in 0..LUT_BINS {
            for bq in 0..LUT_BINS {
                let r = ((rq << LUT_SHIFT) as u8).saturating_add(half);
                let g = ((gq << LUT_SHIFT) as u8).saturating_add(half);
                let b = ((bq << LUT_SHIFT) as u8).saturating_add(half);
                let rgb = [r, g, b];
                let idx = if luminance(rgb) <= space_threshold {
                    space_idx as u16
                } else {
                    let lab = srgb_to_oklab(rgb);
                    let mut best = 0usize;
                    let mut best_d = f64::INFINITY;
                    for (i, &plab) in palette_lab.iter().enumerate() {
                        if i == space_idx {
                            continue;
                        }
                        let d = oklab_dist_sq(lab, plab);
                        if d < best_d {
                            best_d = d;
                            best = i;
                        }
                    }
                    best as u16
                };
                lut[lut_index(r, g, b)] = idx;
            }
        }
    }
    lut
}

pub(crate) fn exact_palette_index(palette: &[[u8; 3]], rgb: [u8; 3]) -> Option<u16> {
    palette.iter().position(|&p| p == rgb).map(|i| i as u16)
}

pub(crate) fn nearest_index(
    lut: &[u16],
    palette: &[[u8; 3]],
    rgb: [u8; 3],
    space_idx: usize,
    space_threshold: f64,
) -> u16 {
    if let Some(i) = exact_palette_index(palette, rgb) {
        return i;
    }
    if luminance(rgb) <= space_threshold {
        return space_idx as u16;
    }
    lut[lut_index(rgb[0], rgb[1], rgb[2])]
}

pub(crate) fn clamp_channel(v: f64) -> u8 {
    v.round().clamp(0.0, 255.0) as u8
}
