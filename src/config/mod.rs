//! Library dimensions, alphabets, and version — the frozen generator contract.
//!
//! Layout:
//! - [`ids`] — lens ids
//! - [`tables`] — glyph vectors
//! - [`registry`] — [`AlphabetDef`] joining id + name + symbols

mod generated;
mod ids;
mod registry;
mod tables;

#[allow(unused_imports)]
pub use ids::{ALPHABET_ID, AlphabetIds};
#[allow(unused_imports)]
pub use registry::{ALPHABET_REGISTRY, AlphabetDef, alphabet, alphabet_def};
#[allow(unused_imports)]
pub use tables::{ALPHABET_TABLE, AlphabetTables};

/// Bump only with intent — this is the schema for all generated content.
/// v11: dual bijection scopes — **page-linked** (wander / short text) and
/// **book-linked** (photo Find / Babelgram identity). Same `(z,n,book)` labels
/// under different scopes are different virgin content.
/// v10 was book-map everywhere; v9 was page-level only.
pub const GENERATOR_VERSION: u32 = 11;

/// Soft upper bound on alphabet cell count for generator v8.
pub const MAX_ALPHABET_LEN: u16 = 4096;

/// The default alphabet when none is specified.
pub const DEFAULT_ALPHABET: u32 = ALPHABET_ID.basile;

// Gallery geometry (Borges-canonical).
pub const WALLS: u32 = 4;
pub const SHELVES_PER_WALL: u32 = 5;
pub const BOOKS_PER_SHELF: u32 = 35;
/// 4 * 5 * 35 = 700 books per gallery.
pub const BOOKS_PER_GALLERY: u32 = WALLS * SHELVES_PER_WALL * BOOKS_PER_SHELF;

// Book geometry.
pub const PAGES_PER_BOOK: u32 = 410;
pub const LINES_PER_PAGE: u32 = 40;
pub const CHARS_PER_LINE: u32 = 80;

pub const TITLE_LEN: usize = 24;

/// Content symbols per page (40 × 80); newlines are inserted on format only.
pub const PAGE_CONTENT_SYMBOLS: usize = (LINES_PER_PAGE * CHARS_PER_LINE) as usize;

/// Full-book content length (410 × 3200) — Basile v10 book-level modulus size.
pub const BOOK_CONTENT_SYMBOLS: usize = PAGE_CONTENT_SYMBOLS * PAGES_PER_BOOK as usize;

/// Max searchable content for text locate (= one page).
pub const MAX_SEARCH_CHARS: usize = PAGE_CONTENT_SYMBOLS;
