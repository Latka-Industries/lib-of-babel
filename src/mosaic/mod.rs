//! Photo → alphabet colour mosaic → locate (full-book projection).
//!
//! Source RGBA must already be reshaped to [`crate::color::book_grid_dims`].
//! Quantize onto the alphabet palette, score vs the photo, and reverse-lookup
//! destinations for top candidate param packs.
//!
//! Modules:
//! - [`lab`] — sRGB/OKLab + nearest LUT
//! - [`project`] — palette quantization / dither
//! - [`score`] — RGB + perceptual fit, downsample
//! - [`flat`] — indices → flat string + locate
//! - [`api`] — WASM project / flat preview
//! - [`candidates`] — babel decode, photo `mosaic_find_book`, legacy packs

mod api;
mod candidates;
mod flat;
mod lab;
mod project;
mod score;

#[cfg(test)]
mod tests;

pub use api::{MosaicImage, mosaic_flat_for, mosaic_project, mosaic_project_preview};
pub use candidates::{
    BabelLocateResult, FindBookLocate, mosaic_babel_json, mosaic_candidate_eval_json,
    mosaic_candidate_packs_json, mosaic_candidates_json, mosaic_find_book, mosaic_find_book_finish,
    mosaic_find_book_locate,
};

// Re-export internals into this module so `tests` can `use super::…`.
#[cfg(test)]
#[allow(unused_imports)]
use crate::color::{book_cell_count, book_grid_dims};
#[cfg(test)]
#[allow(unused_imports)]
use candidates::COARSE_FACTOR;
#[cfg(test)]
#[allow(unused_imports)]
use flat::{indices_to_flat, locate_mosaic_flat};
#[cfg(test)]
#[allow(unused_imports)]
use lab::{build_nearest_lut, nearest_index, oklab_dist_sq, srgb_to_oklab};
#[cfg(test)]
#[allow(unused_imports)]
use project::{
    MosaicOpts, PhotoPaletteKind, alphabet_space_idx, project_indices, project_indices_sized,
    project_photo_preview,
};
#[cfg(test)]
#[allow(unused_imports)]
use score::{downsample_rgba, fit_percent, rgb_fit_triple};
