//! WASM exports — JSON strings and thin wrappers over the pure generator core.

use core::fmt::Write;

use wasm_bindgen::prelude::*;

use crate::config::{BOOKS_PER_GALLERY, DEFAULT_ALPHABET, GENERATOR_VERSION};
use crate::gallery::{
    book_index_to_shelf, gallery_titles, neighbor, node_fingerprint, node_hash_bytes, parse_coord,
};
use crate::page::{PageAddr, PageRender, book_text, page_text};
use crate::search::{
    LocateError, PageLocation, json_char_literal, json_string_literal, locate_page, locate_title,
    normalize_query, push_json_string, search_page_segment, search_page_span,
};
use crate::universe::{self, universe as active_universe};

fn locate_error_json(err: LocateError) -> String {
    match err {
        LocateError::InvalidChars(list) => {
            let invalid_json: String = list
                .iter()
                .map(|(i, c)| format!(r#"{{"i":{},"c":{}}}"#, i, json_char_literal(c)))
                .collect::<Vec<_>>()
                .join(",");
            format!(
                r#"{{"ok":false,"error":"invalid characters for this alphabet","invalid":[{invalid_json}]}}"#
            )
        }
        LocateError::Message(e) => {
            format!(r#"{{"ok":false,"error":{}}}"#, json_string_literal(&e))
        }
    }
}

fn locate_hit_json(
    loc: &PageLocation,
    char_count: usize,
    page: u32,
    page_end: u32,
    page_span: u32,
) -> String {
    let (wall, shelf, book_on_shelf) = book_index_to_shelf(loc.book_index);
    format!(
        concat!(
            "{{\"ok\":true,",
            "\"universe_seed\":\"{}\",\"z\":\"{}\",\"n\":\"{}\",",
            "\"book\":{},\"page\":{},\"page_end\":{},\"page_span\":{},",
            "\"char_count\":{},\"alphabet\":{},",
            "\"wall\":{},\"shelf\":{},\"book_on_shelf\":{}}}"
        ),
        loc.universe_seed,
        loc.z,
        loc.n,
        loc.book_index,
        page,
        page_end,
        page_span,
        char_count,
        loc.alphabet_id,
        wall + 1,
        shelf + 1,
        book_on_shelf + 1,
    )
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
/// JSON array of Feistel cells for `alphabet_id` (unknown id → Basile).
pub fn alphabet_symbols_json(alphabet_id: u32) -> String {
    let cells = crate::config::alphabet(alphabet_id);
    let mut s = String::from("[");
    for (i, cell) in cells.iter().enumerate() {
        if i > 0 {
            s.push(',');
        }
        push_json_string(&mut s, cell);
    }
    s.push(']');
    s
}

#[wasm_bindgen]
#[must_use]
/// Cell count for `alphabet_id` (unknown id → Basile).
pub fn alphabet_len(alphabet_id: u32) -> u32 {
    u32::try_from(crate::config::alphabet(alphabet_id).len()).unwrap_or(u32::MAX)
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
    let z = parse_coord(z);
    let n = parse_coord(n);
    let embed = if title_embed.is_empty() {
        None
    } else {
        Some(title_embed)
    };
    let titles = gallery_titles(&z, &n, alphabet_id, active_universe(), embed);
    let mut s = String::from("[");
    for (i, t) in titles.iter().enumerate() {
        if i > 0 {
            s.push(',');
        }
        // Titles may contain `"` / `\` under Basile++ / Basile# — must escape.
        push_json_string(&mut s, t);
    }
    s.push(']');
    s
}

#[wasm_bindgen]
#[must_use]
/// 16-hex-digit prefix of the **room** BLAKE3 fingerprint (header hash).
/// Stable across alphabet lenses; only `(universe, z, n)` matter.
pub fn node_hash_hex(z: &str, n: &str) -> String {
    let z = parse_coord(z);
    let n = parse_coord(n);
    format!("{:016x}", node_fingerprint(&z, &n, active_universe()))
}

#[wasm_bindgen]
#[must_use]
/// Full 256-bit room fingerprint as 64 hex digits.
pub fn node_hash_full_hex(z: &str, n: &str) -> String {
    let z = parse_coord(z);
    let n = parse_coord(n);
    let b = node_hash_bytes(&z, &n, active_universe());
    let mut s = String::with_capacity(64);
    for byte in b {
        let _ = write!(s, "{byte:02x}");
    }
    s
}

#[wasm_bindgen]
#[must_use]
/// Full text of one book (410 pages). Expensive — only call when downloading.
pub fn book_text_for(z: &str, n: &str, book_index: u32, alphabet_id: u32) -> String {
    let z = parse_coord(z);
    let n = parse_coord(n);
    book_text(&z, &n, book_index, alphabet_id, active_universe())
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
    let z = parse_coord(z);
    let n = parse_coord(n);
    let q = if search_query.is_empty() {
        None
    } else {
        Some(search_query)
    };
    let hit_start = u32::try_from(search_start_page).ok();
    let req = PageRender::new(PageAddr::new(
        z,
        n,
        book_index,
        page,
        alphabet_id,
        active_universe(),
    ));
    let _ = (q, hit_start); // highlight is UI-only; virgin page text is Basile
    page_text(&req)
}

#[wasm_bindgen]
#[must_use]
/// How many consecutive pages a normalized search phrase occupies.
pub fn search_page_span_for(text: &str, alphabet_id: u32) -> u32 {
    search_page_span(&normalize_query(text), alphabet_id)
}

#[wasm_bindgen]
#[must_use]
/// Text slice embedded on page `page_in_span` of a multi-page search hit.
pub fn search_page_embed_for(text: &str, alphabet_id: u32, page_in_span: u32) -> String {
    let flat = normalize_query(text);
    let ab = crate::config::alphabet(alphabet_id);
    search_page_segment(&flat, alphabet_id, page_in_span)
        .map(|(_, start, len)| crate::search_segment::slice_cells(&flat, ab, start, len))
        .unwrap_or_default()
}

#[wasm_bindgen]
#[must_use]
/// Reverse lookup: phrase → JSON hit `{ ok, z, n, book, page, … }` or validation error.
/// `z` / `n` in the success payload are JSON strings (decimal) for JS `BigInt`.
pub fn locate_page_json(text: &str, alphabet_id: u32) -> String {
    match locate_page(text, alphabet_id, active_universe()) {
        Ok(res) => {
            let loc = &res.location;
            locate_hit_json(
                loc,
                res.char_count,
                loc.page + 1,
                loc.page + res.page_span,
                res.page_span,
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
    match locate_title(text, alphabet_id, active_universe()) {
        Ok(res) => locate_hit_json(&res.location, res.char_count, 1, 1, 1),
        Err(e) => locate_error_json(e),
    }
}

#[wasm_bindgen]
#[must_use]
/// Neighbor coordinate as JSON `["z","n"]` (decimal strings) for move `mv` (0–3).
pub fn neighbor_json(z: &str, n: &str, mv: u8) -> String {
    let z = parse_coord(z);
    let n = parse_coord(n);
    let (nz, nn) = neighbor(&z, &n, mv);
    format!(r#"["{nz}","{nn}"]"#)
}
