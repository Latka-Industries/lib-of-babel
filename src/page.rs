//! Page and book text generation (Basile virgin pages — no search overlay).

use num_bigint::BigInt;

use crate::basile::{PageKey, page_symbols_at};
use crate::config::{
    CHARS_PER_LINE, LINES_PER_PAGE, MAX_ALPHABET_LEN, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK,
    alphabet,
};

/// Gallery coordinate + page identity for text generation.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PageAddr {
    /// Staircase floor (vertical axis).
    pub z: BigInt,
    /// Hallway position (horizontal axis).
    pub n: BigInt,
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
        z: impl Into<BigInt>,
        n: impl Into<BigInt>,
        book_index: u32,
        page: u32,
        alphabet_id: u32,
        universe_seed: u64,
    ) -> Self {
        Self {
            z: z.into(),
            n: n.into(),
            book_index,
            page,
            alphabet_id,
            universe_seed,
        }
    }

    fn to_key(&self) -> PageKey {
        PageKey {
            universe_seed: self.universe_seed,
            z: self.z.clone(),
            n: self.n.clone(),
            book_index: self.book_index,
            page: self.page,
            alphabet_id: self.alphabet_id,
        }
    }
}

/// Page render request — address only (search highlight is UI-only in v9).
pub struct PageRender {
    /// Where to render.
    pub addr: PageAddr,
}

impl PageRender {
    /// Ordinary page render with no search overlay.
    #[must_use]
    pub fn new(addr: PageAddr) -> Self {
        Self { addr }
    }
}

/// Raw symbol indices for one virgin page (Basile map).
#[must_use]
pub fn page_symbols(req: &PageRender) -> [u16; PAGE_CONTENT_SYMBOLS] {
    let alpha_len_usize = alphabet(req.addr.alphabet_id).len();
    debug_assert!(
        alpha_len_usize > 0 && alpha_len_usize <= MAX_ALPHABET_LEN as usize,
        "alphabet must fit u16 soft cap"
    );
    page_symbols_at(&req.addr.to_key(), alpha_len_usize as u32)
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
#[must_use]
pub fn page_text(req: &PageRender) -> String {
    let ab = alphabet(req.addr.alphabet_id);
    let state = page_symbols(req);
    symbols_to_page_text(&state, ab)
}

/// Full text of one book (lazy: only call when a book is opened).
#[must_use]
pub fn book_text(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    universe_seed: u64,
) -> String {
    let ab = alphabet(alphabet_id);
    let mut out = String::with_capacity(
        (PAGES_PER_BOOK as usize) * (PAGE_CONTENT_SYMBOLS + LINES_PER_PAGE as usize),
    );
    for page in 0..PAGES_PER_BOOK {
        let req = PageRender::new(PageAddr::new(
            z.clone(),
            n.clone(),
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
