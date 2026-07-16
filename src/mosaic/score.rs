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

/// Photo ranking: luma-heavy colour error + horizontal edge structure.
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
