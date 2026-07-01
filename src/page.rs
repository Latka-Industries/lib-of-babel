//! Page and book text generation.

use crate::config::{
    alphabet, CHARS_PER_LINE, LINES_PER_PAGE, PAGES_PER_BOOK, PAGE_CONTENT_SYMBOLS,
};
use crate::feistel::{feistel_encrypt, feistel_key, plaintext_from_address};
use crate::search::{search_page_segment, text_to_symbols};

/// Gallery coordinate + page identity for text generation.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PageAddr {
    pub z: i64,
    pub n: i64,
    pub book_index: u32,
    pub page: u32,
    pub alphabet_id: u32,
    pub universe_seed: u64,
}

impl PageAddr {
    #[must_use]
    pub fn new(
        z: i64,
        n: i64,
        book_index: u32,
        page: u32,
        alphabet_id: u32,
        universe_seed: u64,
    ) -> Self {
        Self {
            z,
            n,
            book_index,
            page,
            alphabet_id,
            universe_seed,
        }
    }
}

/// Page render request — address plus optional search embed.
pub struct PageRender<'a> {
    pub addr: PageAddr,
    pub search_full: Option<&'a str>,
    pub search_hit_start_page: Option<u32>,
}

impl<'a> PageRender<'a> {
    #[must_use]
    pub fn new(addr: PageAddr) -> Self {
        Self {
            addr,
            search_full: None,
            search_hit_start_page: None,
        }
    }

    #[must_use]
    pub fn with_search(mut self, full: &'a str, hit_start_page: u32) -> Self {
        self.search_full = Some(full);
        self.search_hit_start_page = Some(hit_start_page);
        self
    }
}

fn normalize_search_text(text: &str) -> String {
    text.to_lowercase()
}

#[must_use]
pub fn page_symbols(req: &PageRender<'_>) -> [u8; PAGE_CONTENT_SYMBOLS] {
    let PageAddr {
        z,
        n,
        book_index,
        page,
        alphabet_id,
        universe_seed,
    } = req.addr;
    let alpha_len = alphabet(alphabet_id).len() as u8;
    let mut state = plaintext_from_address(
        universe_seed,
        z,
        n,
        book_index,
        page,
        alphabet_id,
        alpha_len,
    );
    feistel_encrypt(&mut state, feistel_key(alphabet_id), alpha_len);
    if let (Some(full), Some(hit_start)) = (req.search_full, req.search_hit_start_page) {
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

/// One page of content at the address in `req`.
pub fn page_text(req: &PageRender<'_>) -> String {
    let ab = alphabet(req.addr.alphabet_id);
    let normalized = req.search_full.map(normalize_search_text);
    let render = PageRender {
        addr: req.addr,
        search_full: normalized.as_deref(),
        search_hit_start_page: req.search_hit_start_page,
    };
    let state = page_symbols(&render);
    symbols_to_page_text(&state, ab)
}

/// Full text of one book (lazy: only call when a book is opened).
#[must_use]
pub fn book_text(z: i64, n: i64, book_index: u32, alphabet_id: u32, universe_seed: u64) -> String {
    let ab = alphabet(alphabet_id);
    let mut out = String::with_capacity(
        (PAGES_PER_BOOK as usize) * (PAGE_CONTENT_SYMBOLS + LINES_PER_PAGE as usize),
    );
    for page in 0..PAGES_PER_BOOK {
        let req = PageRender::new(PageAddr::new(
            z,
            n,
            book_index,
            page,
            alphabet_id,
            universe_seed,
        ));
        let state = page_symbols(&req);
        out.push_str(&symbols_to_page_text(&state, ab));
    }
    out
}
