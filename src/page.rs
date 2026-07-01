//! Page and book text generation.

use crate::config::{
    alphabet, CHARS_PER_LINE, LINES_PER_PAGE, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK,
};
use crate::feistel::{feistel_encrypt, feistel_key, plaintext_from_address};
use crate::search::{search_page_segment, text_to_symbols};

fn normalize_search_text(text: &str) -> String {
    text.to_lowercase()
}

pub fn page_symbols(
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
        out.push_str(&symbols_to_page_text(&state, ab));
    }
    out
}
