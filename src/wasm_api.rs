//! WASM exports — JSON strings and thin wrappers over the pure generator core.

use wasm_bindgen::prelude::*;

use crate::config::{BOOKS_PER_GALLERY, DEFAULT_ALPHABET, GENERATOR_VERSION};
use crate::gallery::{
    book_index_to_shelf, gallery_titles, neighbor, node_fingerprint, node_hash_bytes,
};
use crate::page::{book_text, page_text};
use crate::search::{
    json_char_literal, locate_page, normalize_query, search_page_segment, search_page_span,
    LocateError,
};
use crate::universe::{self, universe as active_universe};

#[wasm_bindgen]
pub fn generator_version() -> u32 {
    GENERATOR_VERSION
}

#[wasm_bindgen]
pub fn books_per_gallery() -> u32 {
    BOOKS_PER_GALLERY
}

#[wasm_bindgen]
pub fn default_alphabet() -> u32 {
    DEFAULT_ALPHABET
}

#[wasm_bindgen]
pub fn set_universe(universe_seed: u64) {
    universe::set_universe(universe_seed);
}

#[wasm_bindgen]
pub fn get_universe() -> u64 {
    universe::get_universe()
}

#[wasm_bindgen]
pub fn universe_seed_for(name: &str) -> u64 {
    universe::universe_seed_for(name)
}

#[wasm_bindgen]
pub fn gallery_titles_json(z: i64, n: i64, alphabet_id: u32) -> String {
    let titles = gallery_titles(z, n, alphabet_id, active_universe());
    let mut s = String::from("[");
    for (i, t) in titles.iter().enumerate() {
        if i > 0 {
            s.push(',');
        }
        s.push('"');
        s.push_str(t);
        s.push('"');
    }
    s.push(']');
    s
}

#[wasm_bindgen]
pub fn node_hash_hex(z: i64, n: i64, alphabet_id: u32) -> String {
    format!("{:016x}", node_fingerprint(z, n, alphabet_id, active_universe()))
}

#[wasm_bindgen]
pub fn node_hash_full_hex(z: i64, n: i64, alphabet_id: u32) -> String {
    let b = node_hash_bytes(z, n, alphabet_id, active_universe());
    let mut s = String::with_capacity(64);
    for byte in b {
        s.push_str(&format!("{byte:02x}"));
    }
    s
}

#[wasm_bindgen]
pub fn book_text_for(z: i64, n: i64, book_index: u32, alphabet_id: u32) -> String {
    book_text(z, n, book_index, alphabet_id, active_universe())
}

#[wasm_bindgen]
pub fn page_text_for(
    z: i64,
    n: i64,
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
    let hit_start = if search_start_page < 0 {
        None
    } else {
        Some(search_start_page as u32)
    };
    page_text(
        z,
        n,
        book_index,
        page,
        alphabet_id,
        active_universe(),
        q,
        hit_start,
    )
}

#[wasm_bindgen]
pub fn search_page_span_for(text: &str) -> u32 {
    search_page_span(&normalize_query(text))
}

#[wasm_bindgen]
pub fn search_page_embed_for(text: &str, page_in_span: u32) -> String {
    let flat = normalize_query(text);
    search_page_segment(&flat, page_in_span)
        .map(|(_, start, len)| flat.chars().skip(start).take(len).collect())
        .unwrap_or_default()
}

#[wasm_bindgen]
pub fn locate_page_json(text: &str, alphabet_id: u32) -> String {
    match locate_page(text, alphabet_id, active_universe()) {
        Ok(res) => {
            let loc = res.location;
            let (wall, shelf, book_on_shelf) = book_index_to_shelf(loc.book_index);
            let last_page = loc.page + res.page_span;
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
                loc.page + 1,
                last_page,
                res.page_span,
                res.char_count,
                loc.alphabet_id,
                wall + 1,
                shelf + 1,
                book_on_shelf + 1,
            )
        }
        Err(LocateError::InvalidChars(list)) => {
            let invalid_json: String = list
                .iter()
                .map(|(i, c)| format!(r#"{{"i":{},"c":{}}}"#, i, json_char_literal(*c)))
                .collect::<Vec<_>>()
                .join(",");
            format!(
                r#"{{"ok":false,"error":"invalid characters for this alphabet","invalid":[{}]}}"#,
                invalid_json
            )
        }
        Err(LocateError::Message(e)) => {
            format!(r#"{{"ok":false,"error":"{}"}}"#, e.replace('"', "\\\""))
        }
    }
}

#[wasm_bindgen]
pub fn neighbor_json(z: i64, n: i64, mv: u8) -> String {
    let (nz, nn) = neighbor(z, n, mv);
    format!("[{},{}]", nz, nn)
}
