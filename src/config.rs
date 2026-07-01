//! Library dimensions, alphabets, and version — the frozen generator contract.

/// Bump only with intent — this is the schema for all generated content.
pub const GENERATOR_VERSION: u32 = 6;

const ALPHABET_BORGES: &[u8] = b"abcdefghijklmnopqrstuv ,.";
const ALPHABET_BASILE: &[u8] = b"abcdefghijklmnopqrstuvwxyz ,.";

/// The default alphabet when none is specified.
pub const DEFAULT_ALPHABET: u32 = 29;

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

pub const FEISTEL_ROUNDS: u32 = 12;

/// Two base-`alpha_len` digits per packed address byte (32 bytes → 64 symbols).
pub const ADDR_SYMBOLS: usize = 32 * 2;

/// Max searchable content in one book (410 pages × 3200 symbols).
pub const MAX_SEARCH_CHARS: usize = PAGE_CONTENT_SYMBOLS * PAGES_PER_BOOK as usize;

/// Symbol table for an alphabet id: `25` = Borges (`a–v`), anything else = Basile (`a–z`).
#[inline]
#[must_use]
pub fn alphabet(alphabet_id: u32) -> &'static [u8] {
    match alphabet_id {
        25 => ALPHABET_BORGES,
        _ => ALPHABET_BASILE,
    }
}
