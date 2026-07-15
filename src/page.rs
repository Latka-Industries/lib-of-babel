//! Page and book text generation.

use crate::config::{
    CHARS_PER_LINE, LINES_PER_PAGE, MAX_ALPHABET_LEN, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK,
    alphabet,
};
use crate::feistel::{feistel_encrypt, feistel_key, plaintext_from_address};
use crate::search::{search_page_segment, text_to_symbols};

/// Gallery coordinate + page identity for text generation.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct PageAddr {
    /// Staircase floor (vertical axis).
    pub z: i64,
    /// Hallway position (horizontal axis).
    pub n: i64,
    /// Flat book index `0..BOOKS_PER_GALLERY`.
    pub book_index: u32,
    /// Zero-based page within the book.
    pub page: u32,
    /// Alphabet lens id (see `config::alphabet_def`).
    pub alphabet_id: u32,
    /// Active multiverse seed.
    pub universe_seed: u64,
}

impl PageAddr {
    /// Build an address for one page in one book.
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
    /// Where to render.
    pub addr: PageAddr,
    /// Full normalized search phrase (may span pages).
    pub search_full: Option<&'a str>,
    /// First page of the search hit within the book.
    pub search_hit_start_page: Option<u32>,
}

impl<'a> PageRender<'a> {
    /// Ordinary page render with no search overlay.
    #[must_use]
    pub fn new(addr: PageAddr) -> Self {
        Self {
            addr,
            search_full: None,
            search_hit_start_page: None,
        }
    }

    /// Attach a multi-page search embed starting at `hit_start_page`.
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

/// Raw symbol indices for one page (post-Feistel, with optional search embed).
#[must_use]
pub fn page_symbols(req: &PageRender<'_>) -> [u16; PAGE_CONTENT_SYMBOLS] {
    let PageAddr {
        z,
        n,
        book_index,
        page,
        alphabet_id,
        universe_seed,
    } = req.addr;
    let alpha_len_usize = alphabet(alphabet_id).len();
    debug_assert!(
        alpha_len_usize > 0 && alpha_len_usize <= MAX_ALPHABET_LEN as usize,
        "alphabet must fit Feistel u16 soft cap"
    );
    let alpha_len = alpha_len_usize as u16;
    let mut state = plaintext_from_address(universe_seed, z, n, book_index, page, alpha_len);
    feistel_encrypt(&mut state, feistel_key(alphabet_id), alpha_len);
    if let (Some(full), Some(hit_start)) = (req.search_full, req.search_hit_start_page)
        && page >= hit_start
    {
        let page_in_span = page - hit_start;
        if let Some((off, start, len)) = search_page_segment(full, alphabet_id, page_in_span) {
            let ab = alphabet(alphabet_id);
            let slice = crate::search_segment::slice_cells(full, ab, start, len);
            if let Ok(syms) = text_to_symbols(&slice, alphabet_id) {
                state[off..off + len].copy_from_slice(&syms);
            }
        }
    }
    state
}

fn symbols_to_page_text(symbols: &[u16; PAGE_CONTENT_SYMBOLS], ab: &[&str]) -> String {
    let mut out = String::with_capacity(PAGE_CONTENT_SYMBOLS * 4 + LINES_PER_PAGE as usize);
    for row in 0..LINES_PER_PAGE {
        for col in 0..CHARS_PER_LINE {
            let idx = (row * CHARS_PER_LINE + col) as usize;
            out.push_str(ab[symbols[idx] as usize]);
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
