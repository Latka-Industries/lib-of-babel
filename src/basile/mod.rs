//! Basile-style content ↔ address bijection (generator v11 — dual scopes).
//!
//! # Two bijection scopes
//!
//! - **Page-linked** ([`page_symbols_at`] / [`invert_page_symbols`]): every
//!   possible *page* exists once under `content = (addr * C) mod |Σ|^3200`.
//!   Wander, spines, short text search, reader `book_image`.
//! - **Book-linked** ([`book_symbols_at`] / [`invert_book_symbols`]): every
//!   possible *full book* exists once under
//!   `content = ((addr + 1) * C) mod |Σ|^BOOK`. Photo Find / Babelgram identity.
//!
//! Same `(z, n, book)` labels under different scopes are different virgin content.
//! Titles still use [`TITLE_LEN`] digits → `(z, n, book)`.

mod digits;
mod engine;
mod pairing;
mod scramble;

#[cfg(test)]
mod tests;

pub use engine::{
    book_symbols_at, filler_digits, invert_book_symbols, invert_page_symbols, invert_title_symbols,
    page_symbols_at, title_symbols_at, title_symbols_for_gallery,
};
// Host tooling / in-crate callers may use these; not every build path references each.
#[allow(unused_imports)]
pub use digits::{digits_to_int, int_to_digits};
#[allow(unused_imports)]
pub use pairing::{PageKey, unpack_page_index};
#[allow(unused_imports)]
pub use scramble::{encode_book_scramble_blob, export_book_scramble_blob, warm_book_scramble};
