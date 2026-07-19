//! WASM exports — JSON strings and thin wrappers over the pure generator core.

use core::fmt::Write;

use num_bigint::BigInt;
use wasm_bindgen::prelude::*;

use crate::config::{BOOKS_PER_GALLERY, DEFAULT_ALPHABET, GENERATOR_VERSION, alphabet};
use crate::gallery;
use crate::page::{
    ContentScope, PageAddr, PageRender, book_text_for as page_book_text,
    page_text_for as page_page_text,
};
use crate::search;
use crate::universe::{self, universe as active_universe};
use crate::utils::{JsonObject, push_json_string};

fn parse_zn(z: &str, n: &str) -> (BigInt, BigInt) {
    (gallery::parse_coord(z), gallery::parse_coord(n))
}

fn page_render_for(z: &str, n: &str, book_index: u32, page: u32, alphabet_id: u32) -> PageRender {
    let (z, n) = parse_zn(z, n);
    PageRender::new(PageAddr::new(
        z,
        n,
        book_index,
        page,
        alphabet_id,
        active_universe(),
    ))
}

fn json_string_array<'a>(items: impl Iterator<Item = &'a str>) -> String {
    let mut s = String::from("[");
    for (i, item) in items.enumerate() {
        if i > 0 {
            s.push(',');
        }
        push_json_string(&mut s, item);
    }
    s.push(']');
    s
}

fn locate_error_json(err: search::LocateError) -> String {
    match err {
        search::LocateError::InvalidChars(list) => {
            let mut invalid = String::from("[");
            for (j, (i, c)) in list.iter().enumerate() {
                if j > 0 {
                    invalid.push(',');
                }
                let mut item = String::new();
                {
                    let mut obj = JsonObject::begin(&mut item);
                    obj.usize("i", *i);
                    obj.str("c", c);
                    obj.finish();
                }
                invalid.push_str(&item);
            }
            invalid.push(']');

            let mut out = String::new();
            let mut obj = JsonObject::begin(&mut out);
            obj.bool("ok", false);
            obj.str("error", "invalid characters for this alphabet");
            obj.raw("invalid", &invalid);
            obj.finish();
            out
        }
        search::LocateError::Message(e) => {
            let mut out = String::new();
            let mut obj = JsonObject::begin(&mut out);
            obj.bool("ok", false);
            obj.str("error", &e);
            obj.finish();
            out
        }
    }
}

/// Shared success payload for page / title / book locate.
///
/// When `flat` is `Some`, appends a `flat` string field (book scope).
fn locate_hit_json(
    loc: &search::PageLocation,
    char_count: usize,
    page: u32,
    page_end: u32,
    page_span: u32,
    scope: &str,
    flat: Option<&str>,
) -> String {
    let (wall, shelf, book_on_shelf) = gallery::book_index_to_shelf(loc.book_index);
    let cap = flat.map_or(256, |f| f.len().saturating_add(256));
    let mut out = String::with_capacity(cap);
    {
        let mut obj = JsonObject::begin(&mut out);
        obj.bool("ok", true);
        // Seed as string so JS never loses precision on large u64.
        obj.str("universe_seed", &loc.universe_seed.to_string());
        obj.str("z", &gallery::format_coord(&loc.z));
        obj.str("n", &gallery::format_coord(&loc.n));
        obj.u32("book", loc.book_index);
        obj.u32("page", page);
        obj.u32("page_end", page_end);
        obj.u32("page_span", page_span);
        obj.usize("char_count", char_count);
        obj.u32("alphabet", loc.alphabet_id);
        obj.u32("wall", wall + 1);
        obj.u32("shelf", shelf + 1);
        obj.u32("book_on_shelf", book_on_shelf + 1);
        obj.str("scope", scope);
        if let Some(flat) = flat {
            obj.str("flat", flat);
        }
        obj.finish();
    }
    out
}

#[wasm_bindgen]
#[must_use]
/// Frozen schema version — must match on journey verify and export.
pub fn generator_version() -> u32 {
    GENERATOR_VERSION
}

#[wasm_bindgen]
#[must_use]
/// Books per gallery (700).
pub fn books_per_gallery() -> u32 {
    BOOKS_PER_GALLERY
}

#[wasm_bindgen]
#[must_use]
/// Default alphabet id when none is specified (29 = Basile).
pub fn default_alphabet() -> u32 {
    DEFAULT_ALPHABET
}

#[wasm_bindgen]
#[must_use]
/// JSON array of alphabet cells for `alphabet_id` (unknown id → Basile).
pub fn alphabet_symbols_json(alphabet_id: u32) -> String {
    json_string_array(alphabet(alphabet_id).iter().copied())
}

#[wasm_bindgen]
#[must_use]
/// Cell count for `alphabet_id` (unknown id → Basile).
pub fn alphabet_len(alphabet_id: u32) -> u32 {
    u32::try_from(alphabet(alphabet_id).len()).unwrap_or(u32::MAX)
}

#[wasm_bindgen]
/// Set the active universe seed for all subsequent generator calls.
pub fn set_universe(universe_seed: u64) {
    universe::set_universe(universe_seed);
}

#[wasm_bindgen]
#[must_use]
/// Read the active universe seed.
pub fn get_universe() -> u64 {
    universe::get_universe()
}

/// Precompute the book-linked Basile modulus / inverse for the active universe.
///
/// First call is the expensive one-time step behind photo Find; safe to call
/// again (cached).
#[wasm_bindgen]
pub fn warm_book_basile(alphabet_id: u32) {
    let alpha_len = alphabet_len(alphabet_id);
    crate::basile::warm_book_scramble(active_universe(), alphabet_id, alpha_len);
}

#[wasm_bindgen]
#[must_use]
/// Map a universe name (or `0x` hex) to a stable seed. Blank → `0`.
pub fn universe_seed_for(name: &str) -> u64 {
    universe::universe_seed_for(name)
}

#[wasm_bindgen]
#[must_use]
/// JSON array of 700 spine titles for gallery `(z, n)`.
/// Pass `title_embed` (normalized) to show a title-search hit on its canonical spine.
/// `z` / `n` are decimal strings (JS `String(bigint)`).
pub fn gallery_titles_json(z: &str, n: &str, alphabet_id: u32, title_embed: &str) -> String {
    let (z, n) = parse_zn(z, n);
    let embed = if title_embed.is_empty() {
        None
    } else {
        Some(title_embed)
    };
    let titles = gallery::gallery_titles(&z, &n, alphabet_id, active_universe(), embed);
    // Titles may contain `"` / `\` under Basile++ / Basile# — must escape.
    json_string_array(titles.iter().map(String::as_str))
}

#[wasm_bindgen]
#[must_use]
/// 16-hex-digit prefix of the **room** BLAKE3 fingerprint (header hash).
/// Stable across alphabet lenses; only `(universe, z, n)` matter.
pub fn node_hash_hex(z: &str, n: &str) -> String {
    let (z, n) = parse_zn(z, n);
    format!(
        "{:016x}",
        gallery::node_fingerprint(&z, &n, active_universe())
    )
}

#[wasm_bindgen]
#[must_use]
/// Full 256-bit room fingerprint as 64 hex digits.
pub fn node_hash_full_hex(z: &str, n: &str) -> String {
    let (z, n) = parse_zn(z, n);
    let b = gallery::node_hash_bytes(&z, &n, active_universe());
    let mut s = String::with_capacity(64);
    for byte in b {
        let _ = write!(s, "{byte:02x}");
    }
    s
}

#[wasm_bindgen]
#[must_use]
/// Full text of one book (410 pages) — **page-linked**. Expensive — download only.
pub fn book_text_for(z: &str, n: &str, book_index: u32, alphabet_id: u32) -> String {
    let (z, n) = parse_zn(z, n);
    page_book_text(
        &z,
        &n,
        book_index,
        alphabet_id,
        active_universe(),
        ContentScope::PageLinked,
    )
}

#[wasm_bindgen]
#[must_use]
/// Full text of one book — **book-linked** (photo Find / Babelgram). Coords may be `c…`.
pub fn book_text_book_scope_for(z: &str, n: &str, book_index: u32, alphabet_id: u32) -> String {
    let (z, n) = parse_zn(z, n);
    page_book_text(
        &z,
        &n,
        book_index,
        alphabet_id,
        active_universe(),
        ContentScope::BookLinked,
    )
}

#[wasm_bindgen]
#[must_use]
/// One formatted page. Pass `search_start_page = -1` for no search embed.
pub fn page_text_for(
    z: &str,
    n: &str,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
    search_query: &str,
    search_start_page: i32,
) -> String {
    let q = if search_query.is_empty() {
        None
    } else {
        Some(search_query)
    };
    let hit_start = u32::try_from(search_start_page).ok();
    let req = page_render_for(z, n, book_index, page, alphabet_id);
    let _ = (q, hit_start); // highlight is UI-only; virgin page text is Basile
    page_page_text(&req, ContentScope::PageLinked)
}

#[wasm_bindgen]
#[must_use]
/// One formatted page from the **book-linked** map (`z`/`n` may be compact `c…`).
/// First call materialises the full book (cached); prefer handoff RGBA for Find open.
pub fn page_text_book_scope_for(
    z: &str,
    n: &str,
    book_index: u32,
    page: u32,
    alphabet_id: u32,
) -> String {
    page_page_text(
        &page_render_for(z, n, book_index, page, alphabet_id),
        ContentScope::BookLinked,
    )
}

#[wasm_bindgen]
#[must_use]
/// How many consecutive pages a normalized search phrase occupies.
pub fn search_page_span_for(text: &str, alphabet_id: u32) -> u32 {
    search::search_page_span(&search::normalize_query(text), alphabet_id)
}

#[wasm_bindgen]
#[must_use]
/// Text slice embedded on page `page_in_span` of a multi-page search hit.
pub fn search_page_embed_for(text: &str, alphabet_id: u32, page_in_span: u32) -> String {
    let flat = search::normalize_query(text);
    let ab = alphabet(alphabet_id);
    search::search_page_segment(&flat, alphabet_id, page_in_span)
        .map(|(_, start, len)| search::segment::slice_cells(&flat, ab, start, len))
        .unwrap_or_default()
}

#[wasm_bindgen]
#[must_use]
/// Reverse lookup: phrase → JSON hit `{ ok, z, n, book, page, … }` or validation error.
/// `z` / `n` in the success payload are JSON strings (decimal) for JS `BigInt`.
pub fn locate_page_json(text: &str, alphabet_id: u32) -> String {
    match search::locate_page(text, alphabet_id, active_universe()) {
        Ok(res) => {
            let loc = &res.location;
            locate_hit_json(
                loc,
                res.char_count,
                loc.page + 1,
                loc.page + res.page_span,
                res.page_span,
                "page",
                None,
            )
        }
        Err(e) => locate_error_json(e),
    }
}

#[wasm_bindgen]
#[must_use]
/// Max spine-title length (characters).
///
/// # Panics
///
/// Panics if [`crate::config::TITLE_LEN`] exceeds `u32::MAX`.
pub fn max_title_len() -> u32 {
    u32::try_from(crate::config::TITLE_LEN).expect("TITLE_LEN fits in u32")
}

#[wasm_bindgen]
#[must_use]
/// Reverse lookup: spine title → JSON hit `{ ok, z, n, book, … }` or validation error.
pub fn locate_title_json(text: &str, alphabet_id: u32) -> String {
    match search::locate_title(text, alphabet_id, active_universe()) {
        Ok(res) => locate_hit_json(&res.location, res.char_count, 1, 1, 1, "page", None),
        Err(e) => locate_error_json(e),
    }
}

#[wasm_bindgen]
#[must_use]
/// Whole-book text locate → JSON hit `{ ok, z, n, book, scope:"book", flat, … }`.
///
/// Requires more than one page of cells; pads to a full book then book-map invert.
pub fn locate_book_json(text: &str, alphabet_id: u32) -> String {
    match search::locate_book(text, alphabet_id, active_universe()) {
        Ok(res) => locate_hit_json(
            &res.location,
            res.char_count,
            1,
            res.page_span,
            res.page_span,
            "book",
            Some(&res.flat),
        ),
        Err(e) => locate_error_json(e),
    }
}

#[wasm_bindgen]
#[must_use]
/// Neighbor coordinate as JSON `["z","n"]` (decimal strings) for move `mv` (0–3).
pub fn neighbor_json(z: &str, n: &str, mv: u8) -> String {
    let (z, n) = parse_zn(z, n);
    let (nz, nn) = gallery::neighbor(&z, &n, mv);
    format!(r#"["{nz}","{nn}"]"#)
}
