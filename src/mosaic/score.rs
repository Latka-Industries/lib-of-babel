//! Photo↔mosaic fit scores and coarse downsampling.

use super::lab::luminance_f64;

/// Exact RGB RMS fit — Babelgram / round-trip export decode.
pub(crate) fn fit_percent(src: &[u8], mosaic: &[u8]) -> f64 {
    fit_rgb_percent(src, mosaic, 1)
}

fn rms_norm(sum_sq: f64, count: usize) -> f64 {
    if count == 0 {
        return 0.0;
    }
    (sum_sq / count as f64 / (255.0 * 255.0))
        .sqrt()
        .clamp(0.0, 1.0)
}

fn fit_from_loss(loss: f64) -> f64 {
    (100.0 * (1.0 - loss.clamp(0.0, 1.0))).clamp(0.0, 100.0)
}

pub(crate) fn fit_rgb_percent(src: &[u8], mosaic: &[u8], stride: usize) -> f64 {
    let n = src.len() / 4;
    if n == 0 {
        return 0.0;
    }
    let step = stride.max(1);
    let mut sum = 0.0;
    let mut count = 0usize;
    let mut i = 0;
    while i < n {
        let o = i * 4;
        let dr = f64::from(src[o]) - f64::from(mosaic[o]);
        let dg = f64::from(src[o + 1]) - f64::from(mosaic[o + 1]);
        let db = f64::from(src[o + 2]) - f64::from(mosaic[o + 2]);
        sum += dr * dr + dg * dg + db * db;
        count += 1;
        i += step;
    }
    // RGB uses per-channel average inside the RMS (÷ 3), same as before.
    fit_from_loss(rms_norm(sum / 3.0, count))
}

/// Photo↔mosaic triple used for ranking and Babelgram confirm UI.
#[derive(Clone, Copy, Debug)]
pub(crate) struct RgbFitTriple {
    /// RMS fit % — ideal ≈ 100.
    pub rms_percent: f64,
    /// Mean abs RGB error 0..255 — ideal ≈ 0.
    pub mae: f64,
    /// Pearson correlation — ideal ≈ 1.
    pub corr: f64,
}

impl RgbFitTriple {
    /// Joint 0..100 rank score (higher better). Near-equal weight on the three ideals.
    #[must_use]
    pub(crate) fn rank_percent(self) -> f64 {
        let rms_term = (self.rms_percent / 100.0).clamp(0.0, 1.0);
        let mae_term = (1.0 - (self.mae / 255.0).clamp(0.0, 1.0)).clamp(0.0, 1.0);
        // Negative corr is anti-structure — treat as zero for ranking.
        let corr_term = self.corr.clamp(0.0, 1.0);
        (100.0 * (0.40 * rms_term + 0.30 * mae_term + 0.30 * corr_term)).clamp(0.0, 100.0)
    }
}

/// Exact RGB RMS + MAE + Pearson on `src` vs `mosaic` (optional stride for coarse).
pub(crate) fn rgb_fit_triple(src: &[u8], mosaic: &[u8], stride: usize) -> RgbFitTriple {
    let rms_percent = fit_rgb_percent(src, mosaic, stride);
    let mae = rgb_mean_abs_diff_strided(src, mosaic, stride);
    let corr = rgb_pearson_corr_strided(src, mosaic, stride);
    RgbFitTriple {
        rms_percent,
        mae,
        corr,
    }
}

fn rgb_mean_abs_diff_strided(src: &[u8], mosaic: &[u8], stride: usize) -> f64 {
    let n = src.len().min(mosaic.len()) / 4;
    if n == 0 {
        return 0.0;
    }
    let step = stride.max(1);
    let mut sum = 0.0;
    let mut count = 0usize;
    let mut i = 0;
    while i < n {
        let o = i * 4;
        sum += f64::from(src[o].abs_diff(mosaic[o]));
        sum += f64::from(src[o + 1].abs_diff(mosaic[o + 1]));
        sum += f64::from(src[o + 2].abs_diff(mosaic[o + 2]));
        count += 1;
        i += step;
    }
    if count == 0 {
        return 0.0;
    }
    sum / (count as f64 * 3.0)
}

fn rgb_pearson_corr_strided(src: &[u8], mosaic: &[u8], stride: usize) -> f64 {
    let pixel_count = src.len().min(mosaic.len()) / 4;
    if pixel_count == 0 {
        return 1.0;
    }
    let step = stride.max(1);
    let mut sum_src = 0.0;
    let mut sum_mos = 0.0;
    let mut sum_src_sq = 0.0;
    let mut sum_mos_sq = 0.0;
    let mut sum_cross = 0.0;
    let mut count = 0.0;
    let mut pix = 0;
    while pix < pixel_count {
        let byte = pix * 4;
        for channel in 0..3 {
            let src_ch = f64::from(src[byte + channel]);
            let mos_ch = f64::from(mosaic[byte + channel]);
            sum_src += src_ch;
            sum_mos += mos_ch;
            sum_src_sq += src_ch * src_ch;
            sum_mos_sq += mos_ch * mos_ch;
            sum_cross += src_ch * mos_ch;
            count += 1.0;
        }
        pix += step;
    }
    if count <= 0.0 {
        return 1.0;
    }
    let mean_src = sum_src / count;
    let mean_mos = sum_mos / count;
    let cov = sum_cross / count - mean_src * mean_mos;
    let var_src = sum_src_sq / count - mean_src * mean_src;
    let var_mos = sum_mos_sq / count - mean_mos * mean_mos;
    if var_src <= f64::EPSILON || var_mos <= f64::EPSILON {
        return if cov.abs() <= f64::EPSILON { 1.0 } else { 0.0 };
    }
    (cov / (var_src.sqrt() * var_mos.sqrt())).clamp(-1.0, 1.0)
}

/// Photo ranking: luma-heavy colour error + horizontal edge structure.
#[allow(dead_code)] // kept for A/B / legacy tests while THI-143 uses rgb_fit_triple
pub(crate) fn fit_perceptual_percent(src: &[u8], mosaic: &[u8], stride: usize) -> f64 {
    let n = src.len() / 4;
    if n == 0 {
        return 0.0;
    }
    let step = stride.max(1);
    let mut luma_err = 0.0;
    let mut chroma_err = 0.0;
    let mut edge_err = 0.0;
    let mut count = 0usize;
    let mut edge_count = 0usize;
    let mut i = 0;
    while i < n {
        let o = i * 4;
        let sr = f64::from(src[o]);
        let sg = f64::from(src[o + 1]);
        let sb = f64::from(src[o + 2]);
        let mr = f64::from(mosaic[o]);
        let mg = f64::from(mosaic[o + 1]);
        let mb = f64::from(mosaic[o + 2]);
        let ys = luminance_f64(sr, sg, sb);
        let ym = luminance_f64(mr, mg, mb);
        let dl = ys - ym;
        luma_err += dl * dl;
        // Chroma residual after removing shared luma shift.
        let dr = (sr - ys) - (mr - ym);
        let dg = (sg - ys) - (mg - ym);
        let db = (sb - ys) - (mb - ym);
        chroma_err += (dr * dr + dg * dg + db * db) / 3.0;

        let j = i + step;
        if j < n {
            let o2 = j * 4;
            let ys2 = luminance_f64(
                f64::from(src[o2]),
                f64::from(src[o2 + 1]),
                f64::from(src[o2 + 2]),
            );
            let ym2 = luminance_f64(
                f64::from(mosaic[o2]),
                f64::from(mosaic[o2 + 1]),
                f64::from(mosaic[o2 + 2]),
            );
            let de = (ys2 - ys) - (ym2 - ym);
            edge_err += de * de;
            edge_count += 1;
        }
        count += 1;
        i += step;
    }
    let luma_norm = rms_norm(luma_err, count);
    let chroma_norm = rms_norm(chroma_err, count);
    let edge_norm = rms_norm(edge_err, edge_count);
    let loss = 0.55 * luma_norm + 0.20 * chroma_norm + 0.25 * edge_norm;
    fit_from_loss(loss)
}

pub(crate) fn downsample_rgba(
    src: &[u8],
    src_w: usize,
    src_h: usize,
    factor: usize,
) -> (Vec<u8>, usize, usize) {
    let f = factor.max(1);
    let dw = (src_w / f).max(1);
    let dh = (src_h / f).max(1);
    let mut out = vec![0u8; dw * dh * 4];
    for y in 0..dh {
        for x in 0..dw {
            let si = ((y * f) * src_w + (x * f)) * 4;
            let di = (y * dw + x) * 4;
            out[di] = src[si];
            out[di + 1] = src[si + 1];
            out[di + 2] = src[si + 2];
            out[di + 3] = 255;
        }
    }
    (out, dw, dh)
}
