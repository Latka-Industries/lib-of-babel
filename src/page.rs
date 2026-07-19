//! Page and book text generation (Basile virgin pages — no search overlay).

use num_bigint::BigInt;

use crate::basile::{PageKey, book_symbols_at, page_symbols_at};
use crate::config::{
    CHARS_PER_LINE, LINES_PER_PAGE, MAX_ALPHABET_LEN, PAGE_CONTENT_SYMBOLS, PAGES_PER_BOOK,
    alphabet,
};

/// Which Basile bijection feeds text / colour paint.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ContentScope {
    /// Page-linked map — wander, spines, short text search, reader `book_image`.
    PageLinked,
    /// Book-linked map — photo Find / Babelgram identity.
    BookLinked,
}

impl ContentScope {
    /// Wire / JSON token (`"page"` / `"book"`).
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::PageLinked => "page",
            Self::BookLinked => "book",
        }
    }
}

impl core::fmt::Display for ContentScope {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.write_str(self.as_str())
    }
}

impl From<ContentScope> for &'static str {
    fn from(scope: ContentScope) -> Self {
        scope.as_str()
    }
}

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
}

impl From<&PageAddr> for PageKey {
    fn from(a: &PageAddr) -> Self {
        Self {
            universe_seed: a.universe_seed,
            z: a.z.clone(),
            n: a.n.clone(),
            book_index: a.book_index,
            page: a.page,
            alphabet_id: a.alphabet_id,
        }
    }
}

impl From<&PageKey> for PageAddr {
    fn from(k: &PageKey) -> Self {
        Self {
            z: k.z.clone(),
            n: k.n.clone(),
            book_index: k.book_index,
            page: k.page,
            alphabet_id: k.alphabet_id,
            universe_seed: k.universe_seed,
        }
    }
}

impl From<PageKey> for PageAddr {
    fn from(k: PageKey) -> Self {
        Self::from(&k)
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

/// Raw symbol indices for one virgin page under `scope`.
#[must_use]
pub fn page_symbols_for(req: &PageRender, scope: ContentScope) -> [u16; PAGE_CONTENT_SYMBOLS] {
    let ab = alphabet(req.addr.alphabet_id);
    let alpha_len = ab.len() as u32;
    debug_assert!(
        alpha_len > 0 && alpha_len <= u32::from(MAX_ALPHABET_LEN),
        "alphabet must fit u16 soft cap"
    );
    match scope {
        ContentScope::PageLinked => page_symbols_at(&PageKey::from(&req.addr), alpha_len),
        ContentScope::BookLinked => {
            let book = book_symbols_at(
                &req.addr.z,
                &req.addr.n,
                req.addr.book_index,
                req.addr.universe_seed,
                req.addr.alphabet_id,
                alpha_len,
            );
            let page = (req.addr.page % PAGES_PER_BOOK) as usize;
            let start = page * PAGE_CONTENT_SYMBOLS;
            let mut page_syms = [0u16; PAGE_CONTENT_SYMBOLS];
            page_syms.copy_from_slice(&book[start..start + PAGE_CONTENT_SYMBOLS]);
            page_syms
        }
    }
}

/// Raw symbol indices for one virgin page (**page-linked**).
#[must_use]
pub fn page_symbols(req: &PageRender) -> [u16; PAGE_CONTENT_SYMBOLS] {
    page_symbols_for(req, ContentScope::PageLinked)
}

/// One page slice of the **book-linked** map.
#[must_use]
pub fn page_symbols_book_scope(req: &PageRender) -> [u16; PAGE_CONTENT_SYMBOLS] {
    page_symbols_for(req, ContentScope::BookLinked)
}

fn symbols_to_page_text(symbols: &[u16], ab: &[&str]) -> String {
    debug_assert_eq!(symbols.len(), PAGE_CONTENT_SYMBOLS);
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

/// One page of content at the address in `req` under `scope`.
#[must_use]
pub fn page_text_for(req: &PageRender, scope: ContentScope) -> String {
    symbols_to_page_text(
        &page_symbols_for(req, scope),
        alphabet(req.addr.alphabet_id),
    )
}

/// One page of content at the address in `req` (**page-linked**).
#[must_use]
pub fn page_text(req: &PageRender) -> String {
    page_text_for(req, ContentScope::PageLinked)
}

/// One page slice of the **book-linked** map (photo Find / Babelgram).
#[must_use]
pub fn page_text_book_scope(req: &PageRender) -> String {
    page_text_for(req, ContentScope::BookLinked)
}

/// Full text of one book under `scope`.
#[must_use]
pub fn book_text_for(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    universe_seed: u64,
    scope: ContentScope,
) -> String {
    let ab = alphabet(alphabet_id);
    let mut out = String::with_capacity(
        (PAGES_PER_BOOK as usize) * (PAGE_CONTENT_SYMBOLS + LINES_PER_PAGE as usize),
    );
    match scope {
        ContentScope::PageLinked => {
            for page in 0..PAGES_PER_BOOK {
                let req = PageRender::new(PageAddr::new(
                    z.clone(),
                    n.clone(),
                    book_index,
                    page,
                    alphabet_id,
                    universe_seed,
                ));
                out.push_str(&symbols_to_page_text(
                    &page_symbols_for(&req, ContentScope::PageLinked),
                    ab,
                ));
            }
        }
        ContentScope::BookLinked => {
            let book = book_symbols_at(
                z,
                n,
                book_index,
                universe_seed,
                alphabet_id,
                ab.len() as u32,
            );
            for page in 0..PAGES_PER_BOOK {
                let start = page as usize * PAGE_CONTENT_SYMBOLS;
                out.push_str(&symbols_to_page_text(
                    &book[start..start + PAGE_CONTENT_SYMBOLS],
                    ab,
                ));
            }
        }
    }
    out
}

/// Full text of one book — **page-linked** (wander / short search).
#[must_use]
pub fn book_text(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    universe_seed: u64,
) -> String {
    book_text_for(
        z,
        n,
        book_index,
        alphabet_id,
        universe_seed,
        ContentScope::PageLinked,
    )
}

/// Full text of one book — **book-linked** (photo Find / Babelgram identity).
#[must_use]
pub fn book_text_book_scope(
    z: &BigInt,
    n: &BigInt,
    book_index: u32,
    alphabet_id: u32,
    universe_seed: u64,
) -> String {
    book_text_for(
        z,
        n,
        book_index,
        alphabet_id,
        universe_seed,
        ContentScope::BookLinked,
    )
}
