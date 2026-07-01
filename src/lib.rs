//! lib-of-babel — deterministic generator core for a walkable Library of Babel.
//!
//! Every gallery is a pure function of its `(z, n)` coordinate. Nothing is stored:
//! the same coordinate always yields the same 700 books and the same fingerprint.
//!
//! NOTE: `GENERATOR_VERSION` freezes the contract. Changing the alphabet, PRNG,
//! seeding order, fingerprint, or dimensions below invalidates every previously
//! exported path/hash, so bump the version deliberately.

use core::sync::atomic::{AtomicU64, Ordering};
use wasm_bindgen::prelude::*;

/// Bump only with intent — this is the schema for all generated content.
pub const GENERATOR_VERSION: u32 = 1;

/// The selected universe — the outermost axis of the multiverse. A single
/// deployment hosts infinitely many distinct infinite libraries; `0` (the
/// empty/default universe) is the canonical one. Set once from JS via
/// `set_universe`; every WASM entry point reads it and threads it into the seed.
/// Kept as global state so the JS call signatures stay coordinate-only, while
/// the internal generator functions remain pure (they take `universe_seed`).
static UNIVERSE: AtomicU64 = AtomicU64::new(0);

#[inline]
fn universe() -> u64 {
    UNIVERSE.load(Ordering::Relaxed)
}

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

/// Content symbols per page (40 × 80); newlines are inserted on format only.
const PAGE_CONTENT_SYMBOLS: usize =
    (LINES_PER_PAGE * CHARS_PER_LINE) as usize;
const FEISTEL_ROUNDS: u32 = 12;
/// Limbs for base-`alpha_len` expansion of a packed page address (~4660 bits).
const LIMBS: usize = 73;

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

/// Seed for the gallery at coordinate `(z, n)` within an alphabet + universe.
/// Universe is the outermost axis: it (with version + alphabet) is folded in so
/// each universe is a wholly distinct library, deterministic and reproducible.
#[inline]
pub fn gallery_seed(z: i64, n: i64, alphabet_id: u32, universe_seed: u64) -> u64 {
    let s = mix2(z as u64, n as u64);
    let v = splitmix64(s ^ (GENERATOR_VERSION as u64).wrapping_mul(0xA5A5_5A5A_F0F0_0F0F));
    let a = splitmix64(v ^ (alphabet_id as u64).wrapping_mul(0x9E37_79B1_85EB_CA87));
    splitmix64(a ^ universe_seed.wrapping_mul(0xC2B2_AE3D_27D4_EB4F))
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
pub fn gallery_titles(z: i64, n: i64, alphabet_id: u32, universe_seed: u64) -> Vec<String> {
    let gs = gallery_seed(z, n, alphabet_id, universe_seed);
    let ab = alphabet(alphabet_id);
    (0..BOOKS_PER_GALLERY)
        .map(|i| book_title(book_seed(gs, i), ab))
        .collect()
}

/// BLAKE3 (256-bit) fingerprint over the canonical 700 book identities — the
/// gallery's collision-resistant permalink/proof. Depends on universe + version
/// + alphabet + coordinate (via `gallery_seed`), so it is unique to this exact
/// library and location. Hashing the per-book seeds (not just the gallery seed)
/// binds the fingerprint to the full content identity of the gallery.
pub fn node_hash_bytes(z: i64, n: i64, alphabet_id: u32, universe_seed: u64) -> [u8; 32] {
    let gs = gallery_seed(z, n, alphabet_id, universe_seed);
    let mut h = blake3::Hasher::new();
    h.update(b"lob:node:1"); // domain separation tag (hash-scheme version)
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&universe_seed.to_le_bytes());
    h.update(&alphabet_id.to_le_bytes());
    h.update(&z.to_le_bytes());
    h.update(&n.to_le_bytes());
    for i in 0..BOOKS_PER_GALLERY {
        h.update(&book_seed(gs, i).to_le_bytes());
    }
    *h.finalize().as_bytes()
}

/// 64-bit prefix of the full fingerprint — used for the compact header hash,
/// permalink proof token, and the per-gallery colour palette. Big-endian so the
/// hex string and this integer expose the same leading bytes (palette parity
/// between the JS page view and the Rust whole-book image).
pub fn node_fingerprint(z: i64, n: i64, alphabet_id: u32, universe_seed: u64) -> u64 {
    let b = node_hash_bytes(z, n, alphabet_id, universe_seed);
    u64::from_be_bytes(b[..8].try_into().unwrap())
}

// ---------------------------------------------------------------------------
// Reversible page mapping (Feistel PRP over PAGE_CONTENT_SYMBOLS symbols).
// forward: address → page text; inverse: page text → address (search-by-content).
// ---------------------------------------------------------------------------

#[inline]
fn feistel_key(alphabet_id: u32) -> u64 {
    mix2(
        splitmix64((GENERATOR_VERSION as u64).wrapping_mul(0xA5A5_5A5A_F0F0_0F0F)),
        splitmix64(alphabet_id as u64),
    )
}

#[inline]
fn round_key(base: u64, round: u32) -> u64 {
    splitmix64(base ^ (round as u64).wrapping_mul(0x1234_5678_9ABC_DEF0))
}

#[inline]
fn feistel_f(right: u8, round: u32, pos: usize, base_key: u64, alpha_len: u8) -> u8 {
    let rk = round_key(base_key, round);
    let x = rk
        .wrapping_add(pos as u64)
        .wrapping_add((right as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15));
    (splitmix64(x) % alpha_len as u64) as u8
}

fn feistel_encrypt(state: &mut [u8; PAGE_CONTENT_SYMBOLS], base_key: u64, alpha_len: u8) {
    let half = PAGE_CONTENT_SYMBOLS / 2;
    let mut scratch = [0u8; PAGE_CONTENT_SYMBOLS];
    for round in 0..FEISTEL_ROUNDS {
        for i in 0..half {
            let f = feistel_f(state[half + i], round, i, base_key, alpha_len);
            scratch[i] = state[half + i];
            scratch[half + i] = (state[i] + f) % alpha_len;
        }
        state.copy_from_slice(&scratch);
    }
}

fn feistel_decrypt(state: &mut [u8; PAGE_CONTENT_SYMBOLS], base_key: u64, alpha_len: u8) {
    let half = PAGE_CONTENT_SYMBOLS / 2;
    let mut scratch = [0u8; PAGE_CONTENT_SYMBOLS];
    for round in (0..FEISTEL_ROUNDS).rev() {
        for i in 0..half {
            let f = feistel_f(state[i], round, i, base_key, alpha_len);
            scratch[half + i] = state[i];
            scratch[i] = (state[half + i] + alpha_len - f) % alpha_len;
        }
        state.copy_from_slice(&scratch);
    }
}

#[derive(Clone, Copy)]
struct Limbs([u64; LIMBS]);

impl Limbs {
    fn zero() -> Self {
        Self([0; LIMBS])
    }

    fn mul_add_small(&mut self, mul: u64, add: u64) {
        let mut carry = add as u128;
        for limb in self.0.iter_mut() {
            let v = carry + (*limb as u128) * (mul as u128);
            *limb = v as u64;
            carry = v >> 64;
        }
    }

    fn div_mod_small(&mut self, div: u64) -> u64 {
        let mut rem: u128 = 0;
        for limb in self.0.iter_mut().rev() {
            let v = (rem << 64) | (*limb as u128);
            *limb = (v / div as u128) as u64;
            rem = v % div as u128;
        }
        rem as u64
    }
}

fn encode_coords_to_limbs(
    universe_seed: u64,
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
) -> Limbs {
    let mut inner = Limbs::zero();
    inner.0[0] = n as u64;
    inner.0[1] = z as u64;
    inner.0[2] = universe_seed;
    let mut l = inner;
    l.mul_add_small(BOOKS_PER_GALLERY as u64, book_index as u64 % BOOKS_PER_GALLERY as u64);
    l.mul_add_small(PAGES_PER_BOOK as u64, page as u64 % PAGES_PER_BOOK as u64);
    l
}

fn decode_limbs_to_coords(mut l: Limbs) -> (u64, i64, i64, u32, u32) {
    let page = (l.div_mod_small(PAGES_PER_BOOK as u64) as u32) % PAGES_PER_BOOK;
    let book_index = (l.div_mod_small(BOOKS_PER_GALLERY as u64) as u32) % BOOKS_PER_GALLERY;
    let n = l.0[0] as i64;
    let z = l.0[1] as i64;
    let universe_seed = l.0[2];
    (universe_seed, z, n, book_index, page)
}

fn digits_from_address(
    universe_seed: u64,
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alpha_len: u8,
) -> [u8; PAGE_CONTENT_SYMBOLS] {
    let mut nlimb = encode_coords_to_limbs(universe_seed, z, n, book_index, page);
    let mut digits = [0u8; PAGE_CONTENT_SYMBOLS];
    for d in digits.iter_mut().rev() {
        *d = nlimb.div_mod_small(alpha_len as u64) as u8;
    }
    digits
}

fn address_from_digits(digits: &[u8; PAGE_CONTENT_SYMBOLS], alpha_len: u8) -> Limbs {
    let mut n = Limbs::zero();
    for &d in digits {
        n.mul_add_small(alpha_len as u64, d as u64);
    }
    n
}

fn page_symbols(
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
    universe_seed: u64,
) -> [u8; PAGE_CONTENT_SYMBOLS] {
    let ab = alphabet(alphabet_id);
    let alpha_len = ab.len() as u8;
    let mut state = digits_from_address(universe_seed, z, n, book_index, page, alpha_len);
    feistel_encrypt(&mut state, feistel_key(alphabet_id), alpha_len);
    state
}

fn symbols_to_page_text(symbols: &[u8; PAGE_CONTENT_SYMBOLS], ab: &[u8]) -> String {
    let mut out = String::with_capacity(PAGE_CONTENT_SYMBOLS + LINES_PER_PAGE as usize);
    for row in 0..LINES_PER_PAGE {
        for col in 0..CHARS_PER_LINE {
            let idx = (row * CHARS_PER_LINE + col) as usize;
            out.push(ab[symbols[idx] as usize] as char);
        }
        out.push('\n');
    }
    out
}

/// One page of content at `(z, n, book_index, page)` — reversible Feistel mapping.
pub fn page_text(
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
    universe_seed: u64,
) -> String {
    let ab = alphabet(alphabet_id);
    let state = page_symbols(z, n, book_index, page, alphabet_id, universe_seed);
    symbols_to_page_text(&state, ab)
}

/// Full text of one book (lazy: only call when a book is opened).
pub fn book_text(z: i64, n: i64, book_index: u32, alphabet_id: u32, universe_seed: u64) -> String {
    let ab = alphabet(alphabet_id);
    let mut out = String::with_capacity(
        (PAGES_PER_BOOK as usize) * (PAGE_CONTENT_SYMBOLS + LINES_PER_PAGE as usize),
    );
    for page in 0..PAGES_PER_BOOK {
        let state = page_symbols(z, n, book_index, page, alphabet_id, universe_seed);
        out.push_str(&symbols_to_page_text(&state, ab));
    }
    out
}

/// Decode user text into symbol indices; strips newlines. Returns Err on invalid chars.
pub fn text_to_symbols(text: &str, alphabet_id: u32) -> Result<Vec<u8>, String> {
    let ab = alphabet(alphabet_id);
    let mut out = Vec::with_capacity(PAGE_CONTENT_SYMBOLS);
    for ch in text.chars() {
        if ch == '\n' || ch == '\r' {
            continue;
        }
        let b = ch as u8;
        match ab.iter().position(|&c| c == b) {
            Some(i) => out.push(i as u8),
            None => return Err(format!("invalid character '{ch}' for this alphabet")),
        }
    }
    Ok(out)
}

/// Result of a reverse lookup — the canonical address where this page text lives.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PageLocation {
    pub universe_seed: u64,
    pub z: i64,
    pub n: i64,
    pub book_index: u32,
    pub page: u32,
    pub alphabet_id: u32,
}

/// Reverse lookup: padded page text → unique coordinates. Shorter strings are
/// space-padded to a full page (Borges-style: the phrase is at the start).
pub fn locate_page(text: &str, alphabet_id: u32) -> Result<PageLocation, String> {
    let ab = alphabet(alphabet_id);
    let alpha_len = ab.len() as u8;
    let space_idx = (alpha_len - 3) as u8; // alphabets end with " ,."
    let mut symbols = text_to_symbols(text, alphabet_id)?;
    if symbols.len() > PAGE_CONTENT_SYMBOLS {
        return Err(format!(
            "text too long (max {PAGE_CONTENT_SYMBOLS} content characters)"
        ));
    }
    while symbols.len() < PAGE_CONTENT_SYMBOLS {
        symbols.push(space_idx);
    }
    let mut state: [u8; PAGE_CONTENT_SYMBOLS] = symbols.try_into().map_err(|_| "internal")?;
    feistel_decrypt(&mut state, feistel_key(alphabet_id), alpha_len);
    let (universe_seed, z, n, book_index, page) =
        decode_limbs_to_coords(address_from_digits(&state, alpha_len));
    Ok(PageLocation {
        universe_seed,
        z,
        n,
        book_index,
        page,
        alphabet_id,
    })
}

#[inline]
pub fn book_index_to_shelf(book_index: u32) -> (u32, u32, u32) {
    let per_wall = SHELVES_PER_WALL * BOOKS_PER_SHELF;
    let wall = book_index / per_wall;
    let rem = book_index % per_wall;
    let shelf = rem / BOOKS_PER_SHELF;
    let book_on_shelf = rem % BOOKS_PER_SHELF;
    (wall, shelf, book_on_shelf)
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

/// Select the active universe. `0` is the default/canonical library. Call once
/// (and whenever the universe changes) before reading galleries.
#[wasm_bindgen]
pub fn set_universe(universe_seed: u64) {
    UNIVERSE.store(universe_seed, Ordering::Relaxed);
}

/// The currently selected universe seed.
#[wasm_bindgen]
pub fn get_universe() -> u64 {
    universe()
}

/// Map a memorable universe name to a stable seed. Empty/whitespace → `0` (the
/// default universe), so the canonical library needs no `&u=` in its links.
#[wasm_bindgen]
pub fn universe_seed_for(name: &str) -> u64 {
    let t = name.trim();
    if t.is_empty() {
        return 0;
    }
    let b = blake3::hash(t.as_bytes());
    u64::from_be_bytes(b.as_bytes()[..8].try_into().unwrap())
}

/// JSON array of the 700 spine titles for `(z, n)` in the active universe.
#[wasm_bindgen]
pub fn gallery_titles_json(z: i64, n: i64, alphabet_id: u32) -> String {
    let titles = gallery_titles(z, n, alphabet_id, universe());
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

/// Compact lowercase hex fingerprint (16 hex / 64-bit BLAKE3 prefix) — header
/// display, permalink proof token, and palette seed. Cheap and short; the full
/// 256-bit value is available via `node_hash_full_hex` for export/verification.
#[wasm_bindgen]
pub fn node_hash_hex(z: i64, n: i64, alphabet_id: u32) -> String {
    format!("{:016x}", node_fingerprint(z, n, alphabet_id, universe()))
}

/// Full 256-bit BLAKE3 fingerprint as 64 lowercase hex chars — the
/// collision-resistant proof for exports, the journey verifier, and proof-of-find.
#[wasm_bindgen]
pub fn node_hash_full_hex(z: i64, n: i64, alphabet_id: u32) -> String {
    let b = node_hash_bytes(z, n, alphabet_id, universe());
    let mut s = String::with_capacity(64);
    for byte in b {
        s.push_str(&format!("{byte:02x}"));
    }
    s
}

/// Full text of one book at `(z, n)` shelf index `book_index` in the given alphabet.
#[wasm_bindgen]
pub fn book_text_for(z: i64, n: i64, book_index: u32, alphabet_id: u32) -> String {
    book_text(z, n, book_index, alphabet_id, universe())
}

/// Reverse lookup: find where `text` already exists (space-padded to a full page).
/// Returns JSON `{ok, ...}` or `{ok:false, error}`.
#[wasm_bindgen]
pub fn locate_page_json(text: &str, alphabet_id: u32) -> String {
    match locate_page(text, alphabet_id) {
        Ok(loc) => {
            let (wall, shelf, book_on_shelf) = book_index_to_shelf(loc.book_index);
            format!(
                concat!(
                    "{{\"ok\":true,",
                    "\"universe_seed\":{},\"z\":{},\"n\":{},",
                    "\"book\":{},\"page\":{},\"alphabet\":{},",
                    "\"wall\":{},\"shelf\":{},\"book_on_shelf\":{}}}"
                ),
                loc.universe_seed,
                loc.z,
                loc.n,
                loc.book_index,
                loc.page + 1,
                loc.alphabet_id,
                wall + 1,
                shelf + 1,
                book_on_shelf + 1,
            )
        }
        Err(e) => format!(r#"{{"ok":false,"error":"{}"}}"#, e.replace('"', "\\\"")),
    }
}

// ---------------------------------------------------------------------------
// Whole-book color map: every character of all 410 pages as one RGBA image.
// The characters stream row-major into a fully-filled, near-square rectangle
// (dimensions chosen to divide the character count exactly, so there are no
// gutters and no empty cells). Palette matches the web page view: per-gallery
// hue/chroma/lightness in OKLCH, converted to sRGB here so the output is
// identical on every browser.
// ---------------------------------------------------------------------------

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
/// streamed row-major into a fully-filled, near-square rectangle.
#[wasm_bindgen]
pub fn book_image(z: i64, n: i64, book_index: u32, alphabet_id: u32) -> BookImage {
    let ab = alphabet(alphabet_id);
    let len = ab.len();
    let space_idx = len - 3; // alphabets end with " ,." → space is third from last

    // per-gallery palette, identical formula to the JS page view (hash hex slices)
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

    // total characters; choose the divisor pair nearest to square so the
    // rectangle is completely filled — no gutters, no empty trailing cells.
    let total = (PAGES_PER_BOOK * LINES_PER_PAGE * CHARS_PER_LINE) as usize;
    let mut h = (total as f64).sqrt() as usize;
    while total % h != 0 {
        h -= 1;
    }
    let height = h as u32;
    let width = (total / h) as u32;

    // draw in generation order (page → line → col), which is exactly row-major
    let mut pixels = vec![0u8; total * 4];
    let mut px_idx = 0;
    for page in 0..PAGES_PER_BOOK {
        let state = page_symbols(z, n, book_index, page, alphabet_id, universe());
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
        assert_eq!(gallery_titles(3, -7, 29, 0), gallery_titles(3, -7, 29, 0));
        assert_ne!(gallery_titles(3, -7, 29, 0), gallery_titles(3, -8, 29, 0));
    }

    #[test]
    fn gallery_has_700_books() {
        assert_eq!(gallery_titles(0, 0, 29, 0).len(), BOOKS_PER_GALLERY as usize);
        assert_eq!(BOOKS_PER_GALLERY, 700);
    }

    #[test]
    fn fingerprint_is_stable() {
        assert_eq!(node_fingerprint(1, 1, 29, 0), node_fingerprint(1, 1, 29, 0));
        assert_ne!(node_fingerprint(1, 1, 29, 0), node_fingerprint(1, 2, 29, 0));
    }

    #[test]
    fn fingerprint_is_blake3_and_full_hash_is_256_bit() {
        // The compact hash is the big-endian first 8 bytes of the full BLAKE3.
        let full = node_hash_bytes(1, 1, 29, 0);
        let prefix = u64::from_be_bytes(full[..8].try_into().unwrap());
        assert_eq!(node_fingerprint(1, 1, 29, 0), prefix);
        // 32 bytes = 256 bits = 64 hex chars; not all zero.
        assert_eq!(full.len(), 32);
        assert!(full.iter().any(|&b| b != 0));
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
        assert_ne!(node_fingerprint(1, 1, 25, 0), node_fingerprint(1, 1, 29, 0));
        assert_ne!(gallery_titles(1, 1, 25, 0), gallery_titles(1, 1, 29, 0));
        // Borges text uses only a–v; Basile may use a–z
        let borges = book_text(0, 0, 0, 25, 0);
        assert!(!borges.contains(['w', 'x', 'y', 'z']));
    }

    #[test]
    fn universe_is_the_outermost_axis() {
        // same coordinate + alphabet, different universe → wholly different library
        assert_ne!(node_fingerprint(1, 1, 29, 0), node_fingerprint(1, 1, 29, 7));
        assert_ne!(gallery_titles(1, 1, 29, 0), gallery_titles(1, 1, 29, 7));
        assert_ne!(book_text(0, 0, 0, 29, 0), book_text(0, 0, 0, 29, 7));
        // but each universe is itself fully deterministic
        assert_eq!(gallery_titles(1, 1, 29, 7), gallery_titles(1, 1, 29, 7));
    }

    #[test]
    fn universe_names_map_to_stable_seeds() {
        assert_eq!(universe_seed_for(""), 0);
        assert_eq!(universe_seed_for("   "), 0);
        assert_eq!(universe_seed_for("borges"), universe_seed_for("borges"));
        assert_eq!(universe_seed_for("borges"), universe_seed_for("  borges  "));
        assert_ne!(universe_seed_for("borges"), universe_seed_for("babel"));
        assert_ne!(universe_seed_for("borges"), 0);
    }

    #[test]
    fn book_image_is_well_shaped_and_deterministic() {
        let img = book_image(2, -3, 17, 29);
        // every character of the book is exactly one pixel — fully filled, no padding
        let cells = (PAGES_PER_BOOK * LINES_PER_PAGE * CHARS_PER_LINE) as usize;
        assert_eq!(
            img.pixels.len(),
            (img.width as usize) * (img.height as usize) * 4
        );
        assert_eq!(img.pixels.len(), cells * 4);
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

    #[test]
    fn coord_codec_round_trips() {
        let cases = [
            (0_u64, 12_i64, -5_i64, 333_u32, 200_u32),
            (7_u64, -3_i64, 42_i64, 17_u32, 99_u32),
            (0_u64, 0_i64, 0_i64, 0_u32, 0_u32),
        ];
        for (uni, z, n, book, page) in cases {
            let l = encode_coords_to_limbs(uni, z, n, book, page);
            let (u2, z2, n2, b2, p2) = decode_limbs_to_coords(l);
            assert_eq!((u2, z2, n2, b2, p2), (uni, z, n, book, page), "coords");
        }
    }

    #[test]
    fn feistel_round_trips() {
        let alpha_len = 29;
        let key = feistel_key(29);
        let mut state = digits_from_address(7, -3, 42, 17, 99, alpha_len);
        let orig = state;
        feistel_encrypt(&mut state, key, alpha_len);
        assert_ne!(state, orig);
        feistel_decrypt(&mut state, key, alpha_len);
        assert_eq!(state, orig);
    }

    #[test]
    fn page_locate_round_trips() {
        let (z, n, book, page) = (12_i64, -5_i64, 333_u32, 200_u32);
        let alpha = 29;
        let uni = 0_u64;
        let generated = page_text(z, n, book, page, alpha, uni);
        let loc = locate_page(&generated, alpha).expect("locate");
        assert_eq!(loc.z, z);
        assert_eq!(loc.n, n);
        assert_eq!(loc.book_index, book);
        assert_eq!(loc.page, page);
        assert_eq!(loc.universe_seed, uni);
        assert_eq!(loc.alphabet_id, alpha);
    }

    #[test]
    fn locate_finds_padded_phrase() {
        let phrase = "forgive me for i have sinned";
        let loc = locate_page(phrase, 29).expect("locate phrase");
        let page = page_text(loc.z, loc.n, loc.book_index, loc.page, 29, loc.universe_seed);
        let loc2 = locate_page(&page, 29).expect("re-locate");
        assert_eq!(loc, loc2);
    }

    #[test]
    fn generator_version_is_frozen_in_tests() {
        assert_eq!(GENERATOR_VERSION, 1);
    }
}
