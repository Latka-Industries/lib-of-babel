//! Search-by-content and search-by-title: reverse lookup, validation, and embed planning.

use core::fmt::Write;

use crate::config::{
    BOOKS_PER_GALLERY, GENERATOR_VERSION, MAX_SEARCH_CHARS, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK,
    TITLE_LEN, alphabet,
};

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
    /// First page of the embedded phrase.
    pub location: PageLocation,
    /// Number of consecutive pages occupied.
    pub page_span: u32,
    /// Character count after normalization.
    pub char_count: usize,
}

/// Errors returned by [`locate_page`].
#[derive(Debug, PartialEq, Clone)]
pub enum LocateError {
    /// One or more characters outside the selected alphabet (index + char).
    InvalidChars(Vec<(usize, char)>),
    /// Empty phrase, over capacity, or insufficient pages remaining in the book.
    Message(String),
}

/// Title search hit — one book in one gallery.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TitleLocateResult {
    pub location: PageLocation,
    /// Character count after normalization.
    pub char_count: usize,
}

fn normalize_search_text(text: &str) -> String {
    text.to_lowercase()
}

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

/// Coordinates of the book whose spine bears a normalized title string.
pub fn title_coords_from_query(text: &str, alphabet_id: u32, universe_seed: u64) -> PageLocation {
    let mut h = blake3::Hasher::new();
    h.update(b"lob:search:title:coords");
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
        page: 0,
        alphabet_id,
    }
}

/// True when `(z, n, book_index)` is the canonical home for normalized `flat`.
pub fn title_embeds_at(
    z: i64,
    n: i64,
    book_index: u32,
    flat: &str,
    alphabet_id: u32,
    universe_seed: u64,
) -> bool {
    let loc = title_coords_from_query(flat, alphabet_id, universe_seed);
    loc.z == z && loc.n == n && loc.book_index == book_index
}

/// Deterministic column offset for embedding a phrase on its first page.
///
/// Returns `0` when `phrase_len >= PAGE_CONTENT_SYMBOLS` (phrase starts at column 0).
#[must_use]
pub fn search_offset(text: &str, phrase_len: usize) -> usize {
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
    let digest = b.as_bytes();
    let mut prefix = [0u8; 8];
    prefix.copy_from_slice(&digest[0..8]);
    (u64::from_le_bytes(prefix) as usize) % (max_off + 1)
}

fn search_start_offset(full_len: usize, full: &str) -> usize {
    if full_len >= PAGE_CONTENT_SYMBOLS {
        0
    } else {
        search_offset(full, full_len)
    }
}

/// How many consecutive pages a flat search phrase occupies.
#[must_use]
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
#[must_use]
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

/// Decode user text into alphabet symbol indices (newlines stripped).
///
/// # Errors
///
/// Returns an error if any character is outside the selected alphabet.
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
///
/// # Errors
///
/// Returns [`LocateError::InvalidChars`] when the phrase contains characters
/// outside the selected alphabet. Returns [`LocateError::Message`] when the
/// phrase is empty, exceeds one book's capacity, or would run past the last page
/// of the resolved book.
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
        location,
        page_span,
        char_count: flat.len(),
    })
}

/// Reverse lookup: spine title → book coordinates in the given universe.
///
/// # Errors
///
/// Same alphabet rules as [`locate_page`], with a maximum length of [`TITLE_LEN`]
/// characters after normalization.
pub fn locate_title(
    text: &str,
    alphabet_id: u32,
    universe_seed: u64,
) -> Result<TitleLocateResult, LocateError> {
    let text = normalize_search_text(text);
    let flat = flatten_search_text(&text, alphabet_id)?;
    if flat.is_empty() {
        return Err(LocateError::Message("search text is empty".into()));
    }
    let char_count = flat.chars().count();
    if char_count > TITLE_LEN {
        return Err(LocateError::Message(format!(
            "title too long (max {TITLE_LEN} characters)"
        )));
    }
    let location = title_coords_from_query(&flat, alphabet_id, universe_seed);
    Ok(TitleLocateResult {
        location,
        char_count,
    })
}

/// Lowercase a search query (matches frontend + embed path).
pub fn normalize_query(text: &str) -> String {
    normalize_search_text(text)
}

/// Escape a character as a JSON string literal (for `invalid` arrays in WASM JSON).
pub fn json_char_literal(c: char) -> String {
    let mut s = String::from("\"");
    match c {
        '\\' => s.push_str("\\\\"),
        '"' => s.push_str("\\\""),
        '\n' => s.push_str("\\n"),
        '\r' => s.push_str("\\r"),
        '\t' => s.push_str("\\t"),
        c if c.is_ascii() && !c.is_control() => s.push(c),
        c => {
            let _ = write!(s, "\\u{:04x}", c as u32);
        }
    }
    s.push('"');
    s
}
