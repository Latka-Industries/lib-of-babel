//! Search-by-content, search-by-title, and whole-book text locate.
//!
//! Content locate (≤ one page) uses the **page-linked** bijection (padded page 0).
//! Longer content pastes use [`locate_book`] — pad to [`BOOK_CONTENT_SYMBOLS`] and
//! [`crate::basile::invert_book_symbols`] (same book map as photo Find).

use core::fmt::Write;

use num_bigint::BigInt;

use crate::basile::{
    filler_digits, invert_book_symbols, invert_page_symbols, invert_title_symbols, title_symbols_at,
};
use crate::config::{
    BOOK_CONTENT_SYMBOLS, GENERATOR_VERSION, MAX_SEARCH_CHARS, PAGE_CONTENT_SYMBOLS,
    PAGES_PER_BOOK, TITLE_LEN, alphabet,
};
use crate::search_segment::{
    count_cells, flatten_to_cells, text_to_cell_indices, text_to_cell_indices_n,
};

/// Result of a reverse lookup — the canonical address where a search phrase lives.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PageLocation {
    pub universe_seed: u64,
    pub z: BigInt,
    pub n: BigInt,
    pub book_index: u32,
    pub page: u32,
    pub alphabet_id: u32,
}

/// Search hit — content locate is capped at one page (`MAX_SEARCH_CHARS`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocateResult {
    /// First page of the padded / placed phrase.
    pub location: PageLocation,
    /// Number of consecutive pages in the padded layout.
    pub page_span: u32,
    /// Cell count after normalization (alphabet symbols).
    pub char_count: usize,
}

/// Errors returned by [`locate_page`].
#[derive(Debug, PartialEq, Clone)]
pub enum LocateError {
    /// One or more spans outside the selected alphabet (byte offset + sample).
    InvalidChars(Vec<(usize, String)>),
    /// Empty phrase, over capacity, or insufficient pages remaining in the book.
    Message(String),
}

/// Title search hit — one book in one gallery.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TitleLocateResult {
    pub location: PageLocation,
    /// Cell count after normalization.
    pub char_count: usize,
}

/// Whole-book text locate — book-linked invert of a padded full-book flat.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BookLocateResult {
    pub location: PageLocation,
    /// Pages spanned by the query prefix (ceil(char_count / PAGE)).
    pub page_span: u32,
    pub char_count: usize,
    /// Padded letter flat (`BOOK_CONTENT_SYMBOLS`) — identity for handoff.
    pub flat: String,
}

fn symbols_to_flat(symbols: &[u16], ab: &[&str]) -> String {
    let mut out = String::with_capacity(symbols.len().saturating_mul(2));
    for &i in symbols {
        out.push_str(ab[i as usize]);
    }
    out
}

fn normalize_search_text(text: &str) -> String {
    text.to_lowercase()
}

/// Deterministic column offset for placing a short phrase on its first page.
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

/// How many consecutive pages a flat search phrase occupies (cell count).
#[must_use]
pub fn search_page_span(full: &str, alphabet_id: u32) -> u32 {
    let ab = alphabet(alphabet_id);
    let total = count_cells(full, ab);
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

/// One contiguous slice of a multi-page search hit: `(offset_on_page, cell_start, cell_len)`.
#[must_use]
pub fn search_page_segment(
    full: &str,
    alphabet_id: u32,
    page_in_span: u32,
) -> Option<(usize, usize, usize)> {
    let ab = alphabet(alphabet_id);
    let total = count_cells(full, ab);
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
/// Returns an error string when `text` contains a character that is not a cell
/// of the alphabet identified by `alphabet_id`.
pub fn text_to_symbols(text: &str, alphabet_id: u32) -> Result<Vec<u16>, String> {
    let ab = alphabet(alphabet_id);
    text_to_cell_indices(text, ab)
        .map_err(|(_, sample)| format!("invalid character '{sample}' for this alphabet"))
}

fn flatten_search_text(text: &str, alphabet_id: u32) -> Result<String, LocateError> {
    let ab = alphabet(alphabet_id);
    flatten_to_cells(text, ab).map_err(LocateError::InvalidChars)
}

/// Canonical padded **first** page for a flat query (enough to Basile-invert).
///
/// Only the cells that land on page 0 are materialised — full-book flats no longer
/// force a 1.3M-symbol convert before invert.
fn build_padded_page0(
    flat: &str,
    alphabet_id: u32,
) -> Result<[u16; PAGE_CONTENT_SYMBOLS], LocateError> {
    let ab = alphabet(alphabet_id);
    let alpha_len = ab.len() as u32;
    let (off, start, len) = search_page_segment(flat, alphabet_id, 0)
        .ok_or_else(|| LocateError::Message("search text is empty".into()))?;
    // Need indices `[0, start+len)` so the page-0 slice is addressable.
    let need = start + len;
    let query = text_to_cell_indices_n(flat, ab, Some(need)).map_err(|(_, sample)| {
        LocateError::Message(format!("invalid character '{sample}' for this alphabet"))
    })?;
    if start + len > query.len() {
        return Err(LocateError::Message("search segment out of range".into()));
    }
    let filler = filler_digits(flat, alpha_len, PAGE_CONTENT_SYMBOLS);
    let mut page = [0u16; PAGE_CONTENT_SYMBOLS];
    page.copy_from_slice(&filler[..PAGE_CONTENT_SYMBOLS]);
    page[off..off + len].copy_from_slice(&query[start..start + len]);
    Ok(page)
}

/// Reverse lookup: phrase → coordinates (page-linked invert of padded page 0).
///
/// The virgin page at the returned address contains the padded query (short
/// queries: query @ offset + filler). Multi-page: page 0 matches the first
/// padded block; `page_span` drives UI highlight across following pages.
///
/// # Errors
///
/// Returns [`LocateError::InvalidChars`] when the query uses symbols outside
/// the alphabet, or [`LocateError::Message`] for empty text, over-long text
/// (beyond one page), or an unmaterialisable page-0 segment.
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
    let ab = alphabet(alphabet_id);
    let char_count = count_cells(&flat, ab);
    if char_count > MAX_SEARCH_CHARS {
        return Err(LocateError::Message(format!(
            "text too long (max {MAX_SEARCH_CHARS} characters — one page)"
        )));
    }
    let page_span = search_page_span(&flat, alphabet_id);
    debug_assert!((1..=PAGES_PER_BOOK).contains(&page_span));
    let page0 = build_padded_page0(&flat, alphabet_id)?;
    let alpha_len = ab.len() as u32;
    let key = invert_page_symbols(&page0, universe_seed, alphabet_id, alpha_len);

    // Prefer the inverted page; if the span would run past the book end, shift
    // start back so navigation stays in-book (virgin page 0 may then differ —
    // only happens when invert lands in the last `span-1` pages).
    let max_start = PAGES_PER_BOOK - page_span;
    let page = key.page.min(max_start);

    Ok(LocateResult {
        location: PageLocation {
            universe_seed,
            z: key.z,
            n: key.n,
            book_index: key.book_index,
            page,
            alphabet_id,
        },
        page_span,
        char_count,
    })
}

/// Reverse lookup: long phrase → book-map coordinates (pad + book invert).
///
/// Requires **more than one page** of cells (`> PAGE_CONTENT_SYMBOLS`). Shorter
/// queries must use [`locate_page`]. Query is placed at the start of the book;
/// the remainder is deterministic filler (same family as page/title pad).
///
/// # Errors
///
/// Returns [`LocateError::InvalidChars`] or [`LocateError::Message`] for empty,
/// ≤ one page, or over one full book.
pub fn locate_book(
    text: &str,
    alphabet_id: u32,
    universe_seed: u64,
) -> Result<BookLocateResult, LocateError> {
    let text = normalize_search_text(text);
    let flat = flatten_search_text(&text, alphabet_id)?;
    if flat.is_empty() {
        return Err(LocateError::Message("search text is empty".into()));
    }
    let ab = alphabet(alphabet_id);
    let alpha_len = ab.len() as u32;
    let query = text_to_symbols(&flat, alphabet_id).map_err(LocateError::Message)?;
    let char_count = query.len();
    if char_count <= PAGE_CONTENT_SYMBOLS {
        return Err(LocateError::Message(format!(
            "text too short for book locate (need more than {PAGE_CONTENT_SYMBOLS} characters — one page)"
        )));
    }
    if char_count > BOOK_CONTENT_SYMBOLS {
        return Err(LocateError::Message(format!(
            "text too long (max {BOOK_CONTENT_SYMBOLS} characters — one book)"
        )));
    }
    let mut symbols = filler_digits(&flat, alpha_len, BOOK_CONTENT_SYMBOLS);
    symbols[..char_count].copy_from_slice(&query);
    let (z, n, book_index) = invert_book_symbols(&symbols, universe_seed, alphabet_id, alpha_len);
    let page_span = char_count.div_ceil(PAGE_CONTENT_SYMBOLS) as u32;
    let page_span = page_span.clamp(1, PAGES_PER_BOOK);
    Ok(BookLocateResult {
        location: PageLocation {
            universe_seed,
            z,
            n,
            book_index,
            page: 0,
            alphabet_id,
        },
        page_span,
        char_count,
        flat: symbols_to_flat(&symbols, ab),
    })
}

/// Reverse lookup: spine title → book coordinates (Basile invert of padded title).
///
/// # Errors
///
/// Returns [`LocateError::InvalidChars`] when the title uses symbols outside
/// the alphabet, or [`LocateError::Message`] for empty text or titles longer
/// than [`TITLE_LEN`] characters.
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
    let ab = alphabet(alphabet_id);
    let alpha_len = ab.len() as u32;
    let query = text_to_symbols(&flat, alphabet_id).map_err(LocateError::Message)?;
    let char_count = query.len();
    if char_count > TITLE_LEN {
        return Err(LocateError::Message(format!(
            "title too long (max {TITLE_LEN} characters)"
        )));
    }
    let mut symbols = filler_digits(&flat, alpha_len, TITLE_LEN);
    let off = if char_count >= TITLE_LEN {
        0
    } else {
        let max_off = TITLE_LEN - char_count;
        let mut h = blake3::Hasher::new();
        h.update(b"lob:search:title:offset");
        h.update(&GENERATOR_VERSION.to_le_bytes());
        h.update(flat.as_bytes());
        let digest = h.finalize();
        let mut prefix = [0u8; 8];
        prefix.copy_from_slice(&digest.as_bytes()[0..8]);
        (u64::from_le_bytes(prefix) as usize) % (max_off + 1)
    };
    symbols[off..off + char_count].copy_from_slice(&query);
    let (z, n, book_index) = invert_title_symbols(&symbols, universe_seed, alphabet_id, alpha_len);
    Ok(TitleLocateResult {
        location: PageLocation {
            universe_seed,
            z,
            n,
            book_index,
            page: 0,
            alphabet_id,
        },
        char_count,
    })
}

/// Lowercase a search query (matches frontend path).
pub fn normalize_query(text: &str) -> String {
    normalize_search_text(text)
}

/// Append `s` as a JSON string literal (quotes + escapes).
pub fn push_json_string(out: &mut String, s: &str) {
    out.push('"');
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

/// Escape a string as a JSON string literal.
pub fn json_string_literal(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    push_json_string(&mut out, s);
    out
}

/// Escape a short invalid sample as a JSON string literal.
pub fn json_char_literal(c: &str) -> String {
    json_string_literal(c)
}

/// Spine title string at `(z, n, book)` under the Basile title map.
#[must_use]
pub fn spine_title_at(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    universe_seed: u64,
) -> String {
    let ab = alphabet(alphabet_id);
    let syms = title_symbols_at(
        z,
        n,
        book_index,
        universe_seed,
        alphabet_id,
        ab.len() as u32,
    );
    let mut out = String::with_capacity(TITLE_LEN * 4);
    for &s in &syms {
        out.push_str(ab[s as usize]);
    }
    out.trim().to_string()
}
