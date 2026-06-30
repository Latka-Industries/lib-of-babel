//! lib-of-babel — deterministic generator core for a walkable Library of Babel.
//!
//! Every gallery is a pure function of its `(z, n)` coordinate. Nothing is stored:
//! the same coordinate always yields the same 700 books and the same fingerprint.
//!
//! NOTE: `GENERATOR_VERSION` freezes the contract. Changing the alphabet, PRNG,
//! seeding order, fingerprint, or dimensions below invalidates every previously
//! exported path/hash, so bump the version deliberately.

use wasm_bindgen::prelude::*;

/// Bump only with intent — this is the schema for all generated content.
pub const GENERATOR_VERSION: u32 = 0;

/// Selectable alphabets. The id IS the symbol count and is folded into the
/// gallery seed, so each alphabet is a distinct library (different text AND
/// different fingerprints). Anything that changes the bytes on screen must be
/// part of the address — alphabet joins coordinate + version in that contract.
///
/// - `25` Borges-canonical: 22 letters (a–v) + space, comma, period.
/// - `29` Basile / default: 26 letters (a–z) + space, comma, period.
const ALPHABET_BORGES: &[u8] = b"abcdefghijklmnopqrstuv ,.";
const ALPHABET_BASILE: &[u8] = b"abcdefghijklmnopqrstuvwxyz ,.";

/// The default alphabet when none is specified.
pub const DEFAULT_ALPHABET: u32 = 29;

#[inline]
fn alphabet(alphabet_id: u32) -> &'static [u8] {
    match alphabet_id {
        25 => ALPHABET_BORGES,
        _ => ALPHABET_BASILE, // 29 and any unknown id fall back to the default
    }
}

// Gallery geometry (Borges-canonical).
const WALLS: u32 = 4;
const SHELVES_PER_WALL: u32 = 5;
const BOOKS_PER_SHELF: u32 = 35;
/// 4 * 5 * 35 = 700 books per gallery.
pub const BOOKS_PER_GALLERY: u32 = WALLS * SHELVES_PER_WALL * BOOKS_PER_SHELF;

// Book geometry.
const PAGES_PER_BOOK: u32 = 410;
const LINES_PER_PAGE: u32 = 40;
const CHARS_PER_LINE: u32 = 80;

const TITLE_LEN: usize = 24;

/// SplitMix64 — small, fast, deterministic. Used as both mixer and PRNG step.
#[inline]
fn splitmix64(mut x: u64) -> u64 {
    x = x.wrapping_add(0x9E37_79B9_7F4A_7C15);
    let mut z = x;
    z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
    z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
    z ^ (z >> 31)
}

/// Combine two values into one seed deterministically.
#[inline]
fn mix2(a: u64, b: u64) -> u64 {
    splitmix64(a ^ splitmix64(b).wrapping_add(0x1234_5678_9ABC_DEF0))
}

/// Seed for the gallery at coordinate `(z, n)` within an alphabet's universe.
#[inline]
pub fn gallery_seed(z: i64, n: i64, alphabet_id: u32) -> u64 {
    let s = mix2(z as u64, n as u64);
    let v = splitmix64(s ^ (GENERATOR_VERSION as u64).wrapping_mul(0xA5A5_5A5A_F0F0_0F0F));
    splitmix64(v ^ (alphabet_id as u64).wrapping_mul(0x9E37_79B1_85EB_CA87))
}

/// Seed for one book, addressed within a gallery by its flat shelf index.
#[inline]
pub fn book_seed(gallery_seed: u64, book_index: u32) -> u64 {
    mix2(gallery_seed, book_index as u64)
}

/// A simple deterministic PRNG stream from a seed.
struct Prng(u64);
impl Prng {
    #[inline]
    fn new(seed: u64) -> Self {
        Prng(seed ^ 0xDEAD_BEEF_CAFE_F00D)
    }
    #[inline]
    fn next_u64(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        splitmix64(self.0)
    }
    #[inline]
    fn next_symbol(&mut self, alphabet: &[u8]) -> u8 {
        alphabet[(self.next_u64() % alphabet.len() as u64) as usize]
    }
}

/// Deterministic spine title for a book seed (drawn from the given alphabet).
pub fn book_title(book_seed: u64, alphabet: &[u8]) -> String {
    let mut p = Prng::new(book_seed);
    let mut bytes = Vec::with_capacity(TITLE_LEN);
    for _ in 0..TITLE_LEN {
        bytes.push(p.next_symbol(alphabet));
    }
    // Safe: every alphabet is ASCII.
    String::from_utf8(bytes).unwrap().trim().to_string()
}

/// The 700 spine titles for a gallery, in shelf order.
pub fn gallery_titles(z: i64, n: i64, alphabet_id: u32) -> Vec<String> {
    let gs = gallery_seed(z, n, alphabet_id);
    let ab = alphabet(alphabet_id);
    (0..BOOKS_PER_GALLERY)
        .map(|i| book_title(book_seed(gs, i), ab))
        .collect()
}

/// Fingerprint over the 700 book identities — the gallery's permalink/proof.
/// Alphabet-dependent (via `gallery_seed`), so each alphabet is a distinct library.
///
/// PLACEHOLDER: a 64-bit deterministic mix. Replace with BLAKE3 (256-bit) before
/// shipping exports; that swap is a `GENERATOR_VERSION` bump.
pub fn node_fingerprint(z: i64, n: i64, alphabet_id: u32) -> u64 {
    let gs = gallery_seed(z, n, alphabet_id);
    let mut acc: u64 = splitmix64(gs ^ GENERATOR_VERSION as u64);
    for i in 0..BOOKS_PER_GALLERY {
        acc = mix2(acc, book_seed(gs, i));
    }
    acc
}

/// Full text of one book (lazy: only call when a book is opened).
pub fn book_text(z: i64, n: i64, book_index: u32, alphabet_id: u32) -> String {
    let bs = book_seed(gallery_seed(z, n, alphabet_id), book_index);
    let ab = alphabet(alphabet_id);
    let mut p = Prng::new(bs ^ 0x00C0_FFEE_00C0_FFEE);
    let total = (PAGES_PER_BOOK * LINES_PER_PAGE * CHARS_PER_LINE) as usize;
    let mut out = String::with_capacity(total + (PAGES_PER_BOOK * LINES_PER_PAGE) as usize);
    for _page in 0..PAGES_PER_BOOK {
        for _line in 0..LINES_PER_PAGE {
            for _c in 0..CHARS_PER_LINE {
                out.push(p.next_symbol(ab) as char);
            }
            out.push('\n');
        }
    }
    out
}

// ---------------------------------------------------------------------------
// Movement: (z, n) lattice. 0=left, 1=right, 2=up, 3=down.
// ---------------------------------------------------------------------------

/// Returns the neighbor coordinate `[z, n]` for a move, or `null` semantics via
/// returning the same coordinate is avoided — all four moves are always valid.
pub fn neighbor(z: i64, n: i64, mv: u8) -> (i64, i64) {
    match mv {
        0 => (z, n - 1), // left hallway
        1 => (z, n + 1), // right hallway
        2 => (z + 1, n), // stairs up
        _ => (z - 1, n), // stairs down
    }
}

// ---------------------------------------------------------------------------
// WASM surface (JSON strings so the web layer stays decoupled).
// ---------------------------------------------------------------------------

#[wasm_bindgen]
pub fn generator_version() -> u32 {
    GENERATOR_VERSION
}

#[wasm_bindgen]
pub fn books_per_gallery() -> u32 {
    BOOKS_PER_GALLERY
}

/// The default alphabet id (symbol count) used when none is specified.
#[wasm_bindgen]
pub fn default_alphabet() -> u32 {
    DEFAULT_ALPHABET
}

/// JSON array of the 700 spine titles for `(z, n)` in the given alphabet.
#[wasm_bindgen]
pub fn gallery_titles_json(z: i64, n: i64, alphabet_id: u32) -> String {
    let titles = gallery_titles(z, n, alphabet_id);
    let mut s = String::from("[");
    for (i, t) in titles.iter().enumerate() {
        if i > 0 {
            s.push(',');
        }
        s.push('"');
        s.push_str(t); // alphabet has no `"` or `\`, safe to embed
        s.push('"');
    }
    s.push(']');
    s
}

/// Lowercase hex fingerprint of the gallery (currently 16 hex chars / 64 bits).
#[wasm_bindgen]
pub fn node_hash_hex(z: i64, n: i64, alphabet_id: u32) -> String {
    format!("{:016x}", node_fingerprint(z, n, alphabet_id))
}

/// Full text of one book at `(z, n)` shelf index `book_index` in the given alphabet.
#[wasm_bindgen]
pub fn book_text_for(z: i64, n: i64, book_index: u32, alphabet_id: u32) -> String {
    book_text(z, n, book_index, alphabet_id)
}

// ---------------------------------------------------------------------------
// Whole-book color map: every character of all 410 pages as one RGBA image.
// Layout is a near-square "contact sheet" of page tiles so the result has a
// sane aspect ratio (not an 80 x 16400 sliver). Palette matches the web page
// view: per-gallery hue/chroma/lightness in OKLCH, converted to sRGB here so
// the output is identical on every browser.
// ---------------------------------------------------------------------------

/// Gap (px) between page tiles in the contact sheet.
const TILE_GUTTER: u32 = 2;

/// Björn Ottosson's OKLCH -> linear sRGB -> gamma sRGB. `l` in 0..1, `h` in deg.
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
    /// RGBA bytes, row-major, `width * height * 4` long.
    #[wasm_bindgen(getter)]
    pub fn pixels(&self) -> Vec<u8> {
        self.pixels.clone()
    }
}

/// Render every character of the book at `(z, n)` shelf `book_index` as colors,
/// tiled page-by-page into a near-square contact sheet.
#[wasm_bindgen]
pub fn book_image(z: i64, n: i64, book_index: u32, alphabet_id: u32) -> BookImage {
    let ab = alphabet(alphabet_id);
    let len = ab.len();
    let space_idx = len - 3; // alphabets end with " ,." → space is third from last

    // per-gallery palette, identical formula to the JS page view (hash hex slices)
    let fp = node_fingerprint(z, n, alphabet_id);
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
    const BG_RGB: [u8; 3] = [0x0b, 0x0b, 0x0d];

    // contact-sheet geometry: pick cols so the montage is roughly square
    let pages = PAGES_PER_BOOK;
    let (pw, ph) = (CHARS_PER_LINE, LINES_PER_PAGE);
    let cols = ((pages as f64 * ph as f64 / pw as f64).sqrt().round() as u32).max(1);
    let rows = pages.div_ceil(cols);
    let width = cols * pw + (cols - 1) * TILE_GUTTER;
    let height = rows * ph + (rows - 1) * TILE_GUTTER;

    let mut pixels = vec![0u8; (width as usize) * (height as usize) * 4];
    for px in pixels.chunks_exact_mut(4) {
        px[0] = BG_RGB[0];
        px[1] = BG_RGB[1];
        px[2] = BG_RGB[2];
        px[3] = 255;
    }

    // draw in the exact generation order (page → line → col) so colors match text
    let bs = book_seed(gallery_seed(z, n, alphabet_id), book_index);
    let mut p = Prng::new(bs ^ 0x00C0_FFEE_00C0_FFEE);
    for page in 0..pages {
        let x0 = (page % cols) * (pw + TILE_GUTTER);
        let y0 = (page / cols) * (ph + TILE_GUTTER);
        for ly in 0..ph {
            for lx in 0..pw {
                let idx = (p.next_u64() % len as u64) as usize;
                let rgb = if idx == space_idx {
                    SPACE_RGB
                } else {
                    palette[idx]
                };
                let off = (((y0 + ly) * width + (x0 + lx)) as usize) * 4;
                pixels[off] = rgb[0];
                pixels[off + 1] = rgb[1];
                pixels[off + 2] = rgb[2];
                pixels[off + 3] = 255;
            }
        }
    }

    BookImage {
        width,
        height,
        pixels,
    }
}

/// Neighbor for a move, as a JSON `[z, n]` pair.
#[wasm_bindgen]
pub fn neighbor_json(z: i64, n: i64, mv: u8) -> String {
    let (nz, nn) = neighbor(z, n, mv);
    format!("[{},{}]", nz, nn)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gallery_is_deterministic() {
        assert_eq!(gallery_titles(3, -7, 29), gallery_titles(3, -7, 29));
        assert_ne!(gallery_titles(3, -7, 29), gallery_titles(3, -8, 29));
    }

    #[test]
    fn gallery_has_700_books() {
        assert_eq!(gallery_titles(0, 0, 29).len(), BOOKS_PER_GALLERY as usize);
        assert_eq!(BOOKS_PER_GALLERY, 700);
    }

    #[test]
    fn fingerprint_is_stable() {
        assert_eq!(node_fingerprint(1, 1, 29), node_fingerprint(1, 1, 29));
        assert_ne!(node_fingerprint(1, 1, 29), node_fingerprint(1, 2, 29));
    }

    #[test]
    fn alphabet_sizes_are_correct() {
        assert_eq!(alphabet(25).len(), 25);
        assert_eq!(alphabet(29).len(), 29);
        assert_eq!(alphabet(999), alphabet(DEFAULT_ALPHABET)); // unknown → default
    }

    #[test]
    fn alphabet_is_a_universe_axis() {
        // same coordinate, different alphabet → different library (text + hash)
        assert_ne!(node_fingerprint(1, 1, 25), node_fingerprint(1, 1, 29));
        assert_ne!(gallery_titles(1, 1, 25), gallery_titles(1, 1, 29));
        // Borges text uses only a–v; Basile may use a–z
        let borges = book_text(0, 0, 0, 25);
        assert!(!borges.contains(['w', 'x', 'y', 'z']));
    }

    #[test]
    fn book_image_is_well_shaped_and_deterministic() {
        let img = book_image(2, -3, 17, 29);
        // every character of the book is represented as one pixel
        let cells = (PAGES_PER_BOOK * LINES_PER_PAGE * CHARS_PER_LINE) as usize;
        assert!(img.pixels.len() == (img.width as usize) * (img.height as usize) * 4);
        assert!(img.pixels.len() / 4 >= cells); // tiles + gutters cover all chars
                                                // roughly square, never a degenerate sliver
        let ratio = img.width as f64 / img.height as f64;
        assert!(ratio > 0.5 && ratio < 2.0, "ratio {ratio} not near-square");
        // deterministic, and alphabet is still an axis of the universe
        assert_eq!(book_image(2, -3, 17, 29).pixels, img.pixels);
        assert_ne!(book_image(2, -3, 17, 25).pixels, img.pixels);
    }

    #[test]
    fn moves_are_reversible() {
        let (z, n) = (5_i64, 9_i64);
        // left then right returns home
        let (a, b) = neighbor(z, n, 0);
        assert_eq!(neighbor(a, b, 1), (z, n));
        // up then down returns home
        let (c, d) = neighbor(z, n, 2);
        assert_eq!(neighbor(c, d, 3), (z, n));
    }
}
