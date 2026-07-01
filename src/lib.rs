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
pub const GENERATOR_VERSION: u32 = 6;

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
/// Two base-`alpha_len` digits per packed address byte (32 bytes → 64 symbols).
const ADDR_SYMBOLS: usize = 32 * 2;

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

fn pack_page_address(universe_seed: u64, z: i64, n: i64, book_index: u32, page: u32) -> [u8; 32] {
    let mut p = [0u8; 32];
    p[0..8].copy_from_slice(&universe_seed.to_le_bytes());
    p[8..16].copy_from_slice(&z.to_le_bytes());
    p[16..24].copy_from_slice(&n.to_le_bytes());
    p[24..28].copy_from_slice(&book_index.to_le_bytes());
    p[28..32].copy_from_slice(&page.to_le_bytes());
    p
}

fn unpack_page_address(packed: &[u8; 32]) -> (u64, i64, i64, u32, u32) {
    let universe_seed = u64::from_le_bytes(packed[0..8].try_into().unwrap());
    let z = i64::from_le_bytes(packed[8..16].try_into().unwrap());
    let n = i64::from_le_bytes(packed[16..24].try_into().unwrap());
    let book_index =
        u32::from_le_bytes(packed[24..28].try_into().unwrap()) % BOOKS_PER_GALLERY;
    let page = u32::from_le_bytes(packed[28..32].try_into().unwrap()) % PAGES_PER_BOOK;
    (universe_seed, z, n, book_index, page)
}

fn embed_packed(state: &mut [u8; PAGE_CONTENT_SYMBOLS], packed: &[u8; 32], alpha_len: u8) {
    for (i, &b) in packed.iter().enumerate() {
        state[2 * i] = b % alpha_len;
        state[2 * i + 1] = b / alpha_len;
    }
}

fn address_from_plaintext(
    state: &[u8; PAGE_CONTENT_SYMBOLS],
    alpha_len: u8,
) -> (u64, i64, i64, u32, u32) {
    let mut packed = [0u8; 32];
    for (i, byte) in packed.iter_mut().enumerate() {
        *byte = (state[2 * i] as u16 + (state[2 * i + 1] as u16) * (alpha_len as u16)) as u8;
    }
    unpack_page_address(&packed)
}

/// Pre-Feistel plaintext: embedded address + book-seed-keyed fill for the rest.
fn plaintext_from_address(
    universe_seed: u64,
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
    alpha_len: u8,
) -> [u8; PAGE_CONTENT_SYMBOLS] {
    let mut state = [0u8; PAGE_CONTENT_SYMBOLS];
    let packed = pack_page_address(universe_seed, z, n, book_index, page);
    embed_packed(&mut state, &packed, alpha_len);

    let gs = gallery_seed(z, n, alphabet_id, universe_seed);
    let bs = book_seed(gs, book_index);

    let mut h = blake3::Hasher::new();
    h.update(b"lob:page:fill");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&packed);
    h.update(&bs.to_le_bytes());
    h.update(&page.to_le_bytes());
    let mut xof = h.finalize_xof();
    let mut buf = [0u8; 32];
    for i in ADDR_SYMBOLS..PAGE_CONTENT_SYMBOLS {
        let off = (i - ADDR_SYMBOLS) % 32;
        if off == 0 {
            xof.fill(&mut buf);
        }
        state[i] = buf[off] % alpha_len;
    }
    state
}

/// Max searchable content in one book (410 pages × 3200 symbols).
pub const MAX_SEARCH_CHARS: usize = PAGE_CONTENT_SYMBOLS * PAGES_PER_BOOK as usize;

/// Result of a reverse lookup — the canonical address where a search phrase lives.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PageLocation {
    pub universe_seed: u64,
    pub z: i64,
    pub n: i64,
    pub book_index: u32,
    pub page: u32,
    pub alphabet_id: u32,
}

/// Search hit — may span consecutive pages in one book.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocateResult {
    pub location: PageLocation,
    /// How many consecutive pages the text occupies (1 for a single page).
    pub page_span: u32,
    pub char_count: usize,
}

/// Deterministic shelf address for a search phrase within one universe.
fn coords_from_phrase(text: &str, alphabet_id: u32, universe_seed: u64) -> PageLocation {
    let mut h = blake3::Hasher::new();
    h.update(b"lob:search:coords");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&universe_seed.to_le_bytes());
    h.update(&alphabet_id.to_le_bytes());
    h.update(text.as_bytes());
    let digest = h.finalize();
    let bytes = digest.as_bytes();
    PageLocation {
        universe_seed,
        z: i64::from_le_bytes(bytes[0..8].try_into().unwrap()),
        n: i64::from_le_bytes(bytes[8..16].try_into().unwrap()),
        book_index: u32::from_le_bytes(bytes[16..20].try_into().unwrap()) % BOOKS_PER_GALLERY,
        page: u32::from_le_bytes(bytes[20..24].try_into().unwrap()) % PAGES_PER_BOOK,
        alphabet_id,
    }
}

/// Where the phrase sits on its page — deterministic per phrase, not always at the start.
fn search_offset(text: &str, phrase_len: usize) -> usize {
    debug_assert!(phrase_len <= PAGE_CONTENT_SYMBOLS);
    if phrase_len >= PAGE_CONTENT_SYMBOLS {
        return 0;
    }
    let mut h = blake3::Hasher::new();
    h.update(b"lob:search:offset");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(text.as_bytes());
    let b = h.finalize();
    let max_off = PAGE_CONTENT_SYMBOLS - phrase_len;
    (u64::from_le_bytes(b.as_bytes()[0..8].try_into().unwrap()) as usize) % (max_off + 1)
}

fn search_start_offset(full_len: usize, full: &str) -> usize {
    if full_len >= PAGE_CONTENT_SYMBOLS {
        0
    } else {
        search_offset(full, full_len)
    }
}

/// How many consecutive pages a flat search phrase occupies.
pub fn search_page_span(full: &str) -> u32 {
    let total = full.chars().count();
    if total == 0 {
        return 0;
    }
    let start_off = search_start_offset(total, full);
    let mut pos = 0usize;
    let mut pages = 0u32;
    while pos < total {
        let len = if pages == 0 {
            (PAGE_CONTENT_SYMBOLS - start_off).min(total - pos)
        } else {
            PAGE_CONTENT_SYMBOLS.min(total - pos)
        };
        if len == 0 {
            break;
        }
        pos += len;
        pages += 1;
    }
    pages.max(1)
}

/// One contiguous slice of a multi-page search hit: `(offset_on_page, char_start, char_len)`.
pub fn search_page_segment(full: &str, page_in_span: u32) -> Option<(usize, usize, usize)> {
    let total = full.chars().count();
    if total == 0 {
        return None;
    }
    let start_off = search_start_offset(total, full);
    let mut pos = 0usize;
    for p in 0..=page_in_span {
        if pos >= total {
            return None;
        }
        let (off, len) = if p == 0 {
            let l = (PAGE_CONTENT_SYMBOLS - start_off).min(total - pos);
            (start_off, l)
        } else {
            let l = PAGE_CONTENT_SYMBOLS.min(total - pos);
            (0, l)
        };
        if p == page_in_span {
            return Some((off, pos, len));
        }
        pos += len;
    }
    None
}

fn page_symbols(
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
    universe_seed: u64,
    search_full: Option<&str>,
    search_hit_start_page: Option<u32>,
) -> [u8; PAGE_CONTENT_SYMBOLS] {
    let alpha_len = alphabet(alphabet_id).len() as u8;
    let mut state =
        plaintext_from_address(universe_seed, z, n, book_index, page, alphabet_id, alpha_len);
    feistel_encrypt(&mut state, feistel_key(alphabet_id), alpha_len);
    if let (Some(full), Some(hit_start)) = (search_full, search_hit_start_page) {
        if page >= hit_start {
            let page_in_span = page - hit_start;
            if let Some((off, start, len)) = search_page_segment(full, page_in_span) {
                let slice: String = full.chars().skip(start).take(len).collect();
                if let Ok(syms) = text_to_symbols(&slice, alphabet_id) {
                    state[off..off + len].copy_from_slice(&syms);
                }
            }
        }
    }
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

/// One page of content at `(z, n, book_index, page)`.
/// Pass the full flat `search_query` and `search_hit_start_page` when rendering a search hit.
pub fn page_text(
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
    universe_seed: u64,
    search_query: Option<&str>,
    search_hit_start_page: Option<u32>,
) -> String {
    let ab = alphabet(alphabet_id);
    let normalized_query = search_query
        .filter(|q| !q.is_empty())
        .map(normalize_search_text);
    let state = page_symbols(
        z,
        n,
        book_index,
        page,
        alphabet_id,
        universe_seed,
        normalized_query.as_deref(),
        search_hit_start_page,
    );
    symbols_to_page_text(&state, ab)
}

/// Full text of one book (lazy: only call when a book is opened).
pub fn book_text(z: i64, n: i64, book_index: u32, alphabet_id: u32, universe_seed: u64) -> String {
    let ab = alphabet(alphabet_id);
    let mut out = String::with_capacity(
        (PAGES_PER_BOOK as usize) * (PAGE_CONTENT_SYMBOLS + LINES_PER_PAGE as usize),
    );
    for page in 0..PAGES_PER_BOOK {
        let state = page_symbols(z, n, book_index, page, alphabet_id, universe_seed, None, None);
        // book_text never embeds search hits
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

/// Lowercase search phrases — the library alphabets are lowercase-only.
fn normalize_search_text(text: &str) -> String {
    text.to_lowercase()
}

#[derive(Debug, PartialEq, Clone)]
pub enum LocateError {
    InvalidChars(Vec<(usize, char)>),
    Message(String),
}

fn json_char_literal(c: char) -> String {
    let mut s = String::from("\"");
    match c {
        '\\' => s.push_str("\\\\"),
        '"' => s.push_str("\\\""),
        '\n' => s.push_str("\\n"),
        '\r' => s.push_str("\\r"),
        '\t' => s.push_str("\\t"),
        c if c.is_ascii() && !c.is_control() => s.push(c),
        c => s.push_str(&format!("\\u{:04x}", c as u32)),
    }
    s.push('"');
    s
}

/// Flatten search text (strip newlines, validate alphabet). Returns every invalid char.
fn flatten_search_text(text: &str, alphabet_id: u32) -> Result<String, LocateError> {
    let ab = alphabet(alphabet_id);
    let mut out = String::new();
    let mut invalid = Vec::new();
    for (i, ch) in text.chars().enumerate() {
        if ch == '\n' || ch == '\r' {
            continue;
        }
        let b = ch as u8;
        if !ab.contains(&b) {
            invalid.push((i, ch));
            continue;
        }
        if ch == ' ' && out.ends_with(' ') {
            continue;
        }
        out.push(ch);
    }
    if !invalid.is_empty() {
        return Err(LocateError::InvalidChars(invalid));
    }
    Ok(out.trim().to_string())
}


/// Reverse lookup: phrase → coordinates in the given universe (may span pages).
pub fn locate_page(
    text: &str,
    alphabet_id: u32,
    universe_seed: u64,
) -> Result<LocateResult, LocateError> {
    let text = normalize_search_text(text);
    let flat = flatten_search_text(&text, alphabet_id)?;
    if flat.is_empty() {
        return Err(LocateError::Message("search text is empty".into()));
    }
    if flat.len() > MAX_SEARCH_CHARS {
        return Err(LocateError::Message(format!(
            "text too long (max {MAX_SEARCH_CHARS} characters — one book)"
        )));
    }
    let page_span = search_page_span(&flat);
    let location = coords_from_phrase(&flat, alphabet_id, universe_seed);
    if location.page + page_span > PAGES_PER_BOOK {
        let room = PAGES_PER_BOOK - location.page;
        return Err(LocateError::Message(format!(
            "text needs {page_span} pages but only {room} remain in this book — try a shorter phrase"
        )));
    }
    Ok(LocateResult {
        char_count: flat.len(),
        page_span,
        location,
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
/// Names starting with `0x` are parsed as a literal seed (for search permalinks).
#[wasm_bindgen]
pub fn universe_seed_for(name: &str) -> u64 {
    let t = name.trim();
    if t.is_empty() {
        return 0;
    }
    if let Some(hex) = t.strip_prefix("0x").or_else(|| t.strip_prefix("0X")) {
        if let Ok(v) = u64::from_str_radix(hex, 16) {
            return v;
        }
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

/// One page of text; `page` is **0-indexed** (0..409). Pass the full search phrase
/// and the 0-indexed start page of the hit (`search_start_page` = -1 when not searching).
#[wasm_bindgen]
pub fn page_text_for(
    z: i64,
    n: i64,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
    search_query: &str,
    search_start_page: i32,
) -> String {
    let q = if search_query.is_empty() {
        None
    } else {
        Some(search_query)
    };
    let hit_start = if search_start_page < 0 {
        None
    } else {
        Some(search_start_page as u32)
    };
    page_text(
        z,
        n,
        book_index,
        page,
        alphabet_id,
        universe(),
        q,
        hit_start,
    )
}

/// How many consecutive pages a search phrase spans after flattening.
#[wasm_bindgen]
pub fn search_page_span_for(text: &str) -> u32 {
    search_page_span(&normalize_search_text(text))
}

/// The substring embedded on one page of a multi-page search hit (`page_in_span` is 0-based).
#[wasm_bindgen]
pub fn search_page_embed_for(text: &str, page_in_span: u32) -> String {
    let flat = normalize_search_text(text);
    search_page_segment(&flat, page_in_span)
        .map(|(_, start, len)| flat.chars().skip(start).take(len).collect())
        .unwrap_or_default()
}

/// Reverse lookup: find where `text` lives (Basile-style embed at a deterministic offset).
/// Returns JSON `{ok, ...}` or `{ok:false, error}`.
#[wasm_bindgen]
pub fn locate_page_json(text: &str, alphabet_id: u32) -> String {
    match locate_page(text, alphabet_id, universe()) {
        Ok(res) => {
            let loc = res.location;
            let (wall, shelf, book_on_shelf) = book_index_to_shelf(loc.book_index);
            let last_page = loc.page + res.page_span;
            format!(
                concat!(
                    "{{\"ok\":true,",
                    "\"universe_seed\":\"{}\",\"z\":\"{}\",\"n\":\"{}\",",
                    "\"book\":{},\"page\":{},\"page_end\":{},\"page_span\":{},",
                    "\"char_count\":{},\"alphabet\":{},",
                    "\"wall\":{},\"shelf\":{},\"book_on_shelf\":{}}}"
                ),
                loc.universe_seed,
                loc.z,
                loc.n,
                loc.book_index,
                loc.page + 1,
                last_page,
                res.page_span,
                res.char_count,
                loc.alphabet_id,
                wall + 1,
                shelf + 1,
                book_on_shelf + 1,
            )
        }
        Err(LocateError::InvalidChars(list)) => {
            let invalid_json: String = list
                .iter()
                .map(|(i, c)| format!(r#"{{"i":{},"c":{}}}"#, i, json_char_literal(*c)))
                .collect::<Vec<_>>()
                .join(",");
            format!(
                r#"{{"ok":false,"error":"invalid characters for this alphabet","invalid":[{}]}}"#,
                invalid_json
            )
        }
        Err(LocateError::Message(e)) => {
            format!(r#"{{"ok":false,"error":"{}"}}"#, e.replace('"', "\\\""))
        }
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
        assert_eq!(universe_seed_for("0xdeadbeefcafebabe"), 0xDEAD_BEEF_CAFE_BABE);
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
    fn address_pack_round_trips() {
        let cases = [
            (0_u64, 12_i64, -5_i64, 333_u32, 200_u32),
            (7_u64, -3_i64, 42_i64, 17_u32, 99_u32),
            (0_u64, 0_i64, 0_i64, 0_u32, 0_u32),
        ];
        for (uni, z, n, book, page) in cases {
            let packed = pack_page_address(uni, z, n, book, page);
            assert_eq!(unpack_page_address(&packed), (uni, z, n, book, page));
        }
    }

    #[test]
    fn feistel_round_trips() {
        let alpha_len = 29;
        let key = feistel_key(29);
        let mut state = plaintext_from_address(7, -3, 42, 17, 99, 29, alpha_len);
        let orig = state;
        feistel_encrypt(&mut state, key, alpha_len);
        assert_ne!(state, orig);
        feistel_decrypt(&mut state, key, alpha_len);
        assert_eq!(state, orig);
    }

    #[test]
    fn books_in_gallery_differ_substantially() {
        let flat = |s: &str| s.chars().filter(|c| *c != '\n').collect::<String>();
        let a = flat(&page_text(0, 0, 0, 0, 29, 0, None, None));
        let b = flat(&page_text(0, 0, 1, 0, 29, 0, None, None));
        let diff = a.chars().zip(b.chars()).filter(|(x, y)| x != y).count();
        assert!(diff > 1000, "only {diff} chars differ between book 0 and 1");
    }

    #[test]
    fn search_rejects_hyphens_and_quotes() {
        assert!(matches!(
            locate_page("twenty-nine", 29, 0),
            Err(LocateError::InvalidChars(_))
        ));
        assert!(locate_page("twenty nine", 29, 0).is_ok());
        assert!(matches!(
            locate_page("don't", 29, 0),
            Err(LocateError::InvalidChars(_))
        ));
    }

    #[test]
    fn search_normalizes_case() {
        let a = locate_page("Hello World", 29, 0).expect("locate");
        let b = locate_page("hello world", 29, 0).expect("locate");
        assert_eq!(a, b);
    }

    #[test]
    fn locate_is_deterministic() {
        let phrase = "forgive me for i have sinned";
        let a = locate_page(phrase, 29, 0).expect("locate");
        let b = locate_page(phrase, 29, 0).expect("locate");
        assert_eq!(a, b);
    }

    #[test]
    fn search_is_scoped_to_universe() {
        let phrase = "hello world";
        let a = locate_page(phrase, 29, 0).expect("locate");
        let b = locate_page(phrase, 29, 7).expect("locate");
        assert_eq!(a.location.universe_seed, 0);
        assert_eq!(b.location.universe_seed, 7);
        assert_ne!(
            (
                a.location.z,
                a.location.n,
                a.location.book_index,
                a.location.page
            ),
            (
                b.location.z,
                b.location.n,
                b.location.book_index,
                b.location.page
            )
        );
    }

    #[test]
    fn search_spans_consecutive_pages() {
        let phrase: String = "a".repeat(4000);
        let res = locate_page(&phrase, 29, 0).expect("locate");
        assert_eq!(res.page_span, 2);
        assert_eq!(res.char_count, 4000);
        let loc = res.location;
        let hit = Some(loc.page);
        let p0 = page_text(
            loc.z,
            loc.n,
            loc.book_index,
            loc.page,
            29,
            loc.universe_seed,
            Some(&phrase),
            hit,
        );
        let p1 = page_text(
            loc.z,
            loc.n,
            loc.book_index,
            loc.page + 1,
            29,
            loc.universe_seed,
            Some(&phrase),
            hit,
        );
        let flat0: String = p0.chars().filter(|c| *c != '\n').collect();
        let flat1: String = p1.chars().filter(|c| *c != '\n').collect();
        assert_eq!(&flat0[..3200], &phrase[..3200]);
        assert_eq!(&flat1[..800], &phrase[3200..]);
        let concat = format!("{flat0}{flat1}");
        assert_eq!(&concat[..4000], phrase.as_str());
    }

    #[test]
    fn search_embeds_phrase_on_page() {
        let phrase = "sit on a pan otis";
        let loc = locate_page(phrase, 29, 0).expect("locate").location;
        let page = page_text(
            loc.z,
            loc.n,
            loc.book_index,
            loc.page,
            29,
            loc.universe_seed,
            Some(phrase),
            Some(loc.page),
        );
        let flat: String = page.chars().filter(|c| *c != '\n').collect();
        let off = search_offset(phrase, phrase.len());
        assert_eq!(&flat[off..off + phrase.len()], phrase);
    }

    #[test]
    fn generator_version_is_frozen_in_tests() {
        assert_eq!(GENERATOR_VERSION, 6);
    }
}
