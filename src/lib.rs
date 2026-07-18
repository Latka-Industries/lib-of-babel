//! lib-of-babel — deterministic generator core for a walkable Library of Babel.
//!
//! Every gallery is a pure function of its `(universe, z, n)` coordinate. Nothing
//! is stored: the same room always yields the same fingerprint. Alphabet is a
//! **lens** — it rewrites spines and pages without changing the room hash.
//!
//! NOTE: `GENERATOR_VERSION` freezes the contract. Changing the PRNG, seeding
//! order, fingerprint, or dimensions below invalidates every previously
//! exported path/hash, so bump the version deliberately.

mod basile;
mod color;
mod config;
mod gallery;
mod mosaic;
mod page;
mod prng;
mod search;
mod search_segment;
mod universe;
mod wasm_api;

pub use color::{
    BookImage, book_cell_count, book_grid_dims, book_image, book_image_at, book_image_book_scope,
    book_image_book_scope_at, book_image_dims, book_image_from_flat, book_image_from_flat_at,
    book_image_pages, book_image_pages_at, book_image_search, room_accent, room_accent_at,
};
pub use config::{
    BOOK_CONTENT_SYMBOLS, BOOKS_PER_GALLERY, DEFAULT_ALPHABET, GENERATOR_VERSION, MAX_SEARCH_CHARS,
    alphabet,
};
pub use gallery::{
    book_index_to_shelf, book_seed, format_coord, gallery_seed, gallery_titles, neighbor,
    node_fingerprint, node_hash_bytes, parse_coord,
};
pub use mosaic::{
    BabelLocateResult, FindBookLocate, MosaicImage, mosaic_babel_json, mosaic_candidate_eval_json,
    mosaic_candidate_packs_json, mosaic_candidates_json, mosaic_find_book, mosaic_find_book_finish,
    mosaic_find_book_locate, mosaic_flat_for, mosaic_project, mosaic_project_preview,
};
pub use page::{PageAddr, PageRender, book_text, book_text_book_scope, page_symbols, page_text};
pub use search::{
    BookLocateResult, LocateError, LocateResult, PageLocation, TitleLocateResult, locate_book,
    locate_page, locate_title, search_offset, search_page_segment, search_page_span,
    spine_title_at, text_to_symbols,
};
pub use wasm_api::*;

// Host tooling (bake default book scramble into `data/`).
pub use basile::{export_book_scramble_blob, warm_book_scramble};

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{
        BOOKS_PER_GALLERY, DEFAULT_ALPHABET, GENERATOR_VERSION, MAX_ALPHABET_LEN, alphabet,
    };
    use crate::search::LocateError;
    use num_bigint::BigInt;

    fn bi(x: i64) -> BigInt {
        BigInt::from(x)
    }

    #[test]
    fn gallery_is_deterministic() {
        assert_eq!(
            gallery_titles(&bi(3), &bi(-7), 29, 0, None),
            gallery_titles(&bi(3), &bi(-7), 29, 0, None)
        );
        assert_ne!(
            gallery_titles(&bi(3), &bi(-7), 29, 0, None),
            gallery_titles(&bi(3), &bi(-8), 29, 0, None)
        );
    }

    #[test]
    fn gallery_has_700_books() {
        assert_eq!(
            gallery_titles(&bi(0), &bi(0), 29, 0, None).len(),
            BOOKS_PER_GALLERY as usize
        );
        assert_eq!(BOOKS_PER_GALLERY, 700);
    }

    #[test]
    fn gallery_titles_json_escapes_quotes() {
        use crate::search::json_string_literal;
        use crate::universe::{lock_for_tests, set_universe};

        assert_eq!(json_string_literal(r#"a"b\c"#), r#""a\"b\\c""#);
        assert_eq!(json_string_literal("line\nbreak"), r#""line\nbreak""#);

        // gallery_titles_json reads process-global universe — lock vs mosaic tests.
        let _g = lock_for_tests();
        set_universe(0);
        let titles = gallery_titles(&bi(0), &bi(0), 48, 0, None);
        assert!(
            titles.iter().any(|t| t.contains('"')),
            "Basile++ spines should include double quotes"
        );
        let json = gallery_titles_json("0", "0", 48, "");
        assert!(json.starts_with('[') && json.ends_with(']'));
        for t in &titles {
            if t.contains('"') || t.contains('\\') {
                assert!(
                    !json.contains(&format!("\"{t}\"")),
                    "unescaped title leaked into JSON: {t}"
                );
                assert!(
                    json.contains(&json_string_literal(t)),
                    "escaped form missing for {t}"
                );
            }
        }
    }

    #[test]
    fn fingerprint_is_stable() {
        assert_eq!(
            node_fingerprint(&bi(1), &bi(1), 0),
            node_fingerprint(&bi(1), &bi(1), 0)
        );
        assert_ne!(
            node_fingerprint(&bi(1), &bi(1), 0),
            node_fingerprint(&bi(1), &bi(2), 0)
        );
    }

    #[test]
    fn fingerprint_is_blake3_and_full_hash_is_256_bit() {
        let full = node_hash_bytes(&bi(1), &bi(1), 0);
        let prefix = u64::from_be_bytes(full[..8].try_into().unwrap());
        assert_eq!(node_fingerprint(&bi(1), &bi(1), 0), prefix);
        assert_eq!(full.len(), 32);
        assert!(full.iter().any(|&b| b != 0));
    }

    #[test]
    fn alphabet_sizes_are_correct() {
        use crate::config::{ALPHABET_ID, ALPHABET_REGISTRY, alphabet_def};
        use std::collections::BTreeSet;

        assert_eq!(alphabet(999), alphabet(DEFAULT_ALPHABET));

        // (id, english name, must_contain, must_not_contain)
        let probes: &[(u32, &str, &[&str], &[&str])] = &[
            (ALPHABET_ID.basile_plus, "Basile++", &["?", "0"], &["@"]),
            (ALPHABET_ID.basile_hash, "Basile#", &["@", "="], &[]),
            (
                ALPHABET_ID.danish_norwegian,
                "Danish/Norwegian",
                &["æ", "ø"],
                &["ä"],
            ),
            (ALPHABET_ID.swedish, "Swedish", &["ä", "å"], &["æ"]),
            (ALPHABET_ID.turkish, "Turkish", &["ı", "ş"], &["q"]),
            (ALPHABET_ID.finnish, "Finnish", &["å"], &[]),
            (ALPHABET_ID.estonian, "Estonian", &["õ"], &[]),
            (ALPHABET_ID.hungarian, "Hungarian", &["ő"], &[]),
            (ALPHABET_ID.greek, "Greek", &["ω", "ς", "ά"], &["a"]),
            (ALPHABET_ID.spanish, "Spanish", &["ñ"], &[]),
            (ALPHABET_ID.german, "German", &["ß"], &[]),
            (ALPHABET_ID.french, "French", &["œ"], &[]),
            (ALPHABET_ID.polish, "Polish", &["ł", "ż"], &[]),
            (ALPHABET_ID.czech, "Czech", &["ř", "ů"], &[]),
            (ALPHABET_ID.slovak, "Slovak", &["ô", "ľ"], &[]),
            (
                ALPHABET_ID.croatian_serbian,
                "Croatian/Serbian",
                &["đ", "č"],
                &[],
            ),
            (ALPHABET_ID.latvian, "Latvian", &["ģ", "ķ"], &[]),
            (ALPHABET_ID.lithuanian, "Lithuanian", &["ė", "ų"], &[]),
            (ALPHABET_ID.albanian, "Albanian", &["ç", "ë"], &[]),
            (ALPHABET_ID.russian, "Russian", &["я", "ё"], &["a"]),
            (ALPHABET_ID.ukrainian, "Ukrainian", &["ї", "ґ"], &["ы"]),
            (ALPHABET_ID.bulgarian, "Bulgarian", &["ъ", "я"], &["ё"]),
            (ALPHABET_ID.icelandic, "Icelandic", &["þ", "ð", "æ"], &[]),
            (ALPHABET_ID.slovenian, "Slovenian", &["č", "š", "ž"], &["ć"]),
            (ALPHABET_ID.belarusian, "Belarusian", &["ў", "і"], &["и"]),
            (ALPHABET_ID.macedonian, "Macedonian", &["ѓ", "ќ", "ѕ"], &[]),
            (
                ALPHABET_ID.serbian_cyrillic,
                "Serbian Cyrillic",
                &["ђ", "ћ", "џ"],
                &["a"],
            ),
            (ALPHABET_ID.catalan, "Catalan", &["·", "ç", "ï"], &[]),
            (ALPHABET_ID.basque, "Basque", &["ñ", "ç"], &[]),
            (ALPHABET_ID.welsh, "Welsh", &["ŵ", "ŷ"], &[]),
            (ALPHABET_ID.irish, "Irish", &["á", "ú"], &[]),
            (ALPHABET_ID.maltese, "Maltese", &["ħ", "ġ", "ċ"], &[]),
            (ALPHABET_ID.armenian, "Armenian", &["ա", "ֆ"], &["և"]),
            (ALPHABET_ID.georgian, "Georgian", &["ა", "ჰ"], &["a"]),
            (ALPHABET_ID.hebrew, "Hebrew", &["א", "ת", "ך"], &["a"]),
            (ALPHABET_ID.arabic, "Arabic", &["ا", "ي", "ء"], &["پ"]),
            (ALPHABET_ID.persian, "Persian", &["پ", "چ", "گ"], &[]),
            (ALPHABET_ID.nko, "N'Ko", &["ߊ", "ߪ"], &["a"]),
            (ALPHABET_ID.amharic, "Amharic", &["ሀ", "ለ", "ፐ"], &["a"]),
            (ALPHABET_ID.swahili, "Swahili", &["a", "z"], &["ɓ"]),
            (ALPHABET_ID.afrikaans, "Afrikaans", &["ê", "ë"], &[]),
            (ALPHABET_ID.hausa, "Hausa", &["ɓ", "ƴ"], &[]),
            (ALPHABET_ID.yoruba, "Yoruba", &["ẹ", "ọ", "ṣ"], &[]),
            (ALPHABET_ID.igbo, "Igbo", &["ị", "ụ"], &[]),
            (ALPHABET_ID.wolof, "Wolof", &["ë", "ñ"], &[]),
            (ALPHABET_ID.tifinagh, "Tifinagh", &["ⴰ", "ⵣ"], &["a"]),
            (
                ALPHABET_ID.japanese,
                "Japanese",
                &["あ", "ン"],
                &["が", "a"],
            ),
            (ALPHABET_ID.korean, "Korean", &["이", "다"], &["a"]),
            (
                ALPHABET_ID.chinese,
                "Chinese (Simplified)",
                &["的", "一"],
                &["繁", "a"],
            ),
            (
                ALPHABET_ID.chinese_trad,
                "Chinese (Traditional)",
                &["的", "這"],
                &["简", "a"],
            ),
            (ALPHABET_ID.hindi, "Hindi", &["अ", "क"], &["a"]),
            (ALPHABET_ID.bengali, "Bengali", &["অ", "ক"], &["a"]),
            (ALPHABET_ID.tamil, "Tamil", &["அ", "க"], &["a"]),
            (ALPHABET_ID.telugu, "Telugu", &["అ", "క"], &["a"]),
            (ALPHABET_ID.kannada, "Kannada", &["ಅ", "ಕ"], &["a"]),
            (ALPHABET_ID.malayalam, "Malayalam", &["അ", "ക"], &["a"]),
            (ALPHABET_ID.gujarati, "Gujarati", &["અ", "ક"], &["a"]),
            (ALPHABET_ID.punjabi, "Punjabi", &["ਅ", "ਕ"], &["a"]),
            (ALPHABET_ID.odia, "Odia", &["ଅ", "କ"], &["a"]),
            (ALPHABET_ID.azerbaijani, "Azerbaijani", &["ə", "ğ"], &["w"]),
            (ALPHABET_ID.kazakh, "Kazakh", &["ä", "ū"], &["c"]),
            (ALPHABET_ID.uzbek, "Uzbek", &["ʻ"], &["ä"]),
            (ALPHABET_ID.turkmen, "Turkmen", &["ň", "ý"], &["q"]),
            (ALPHABET_ID.kyrgyz, "Kyrgyz", &["ң", "ө"], &["a"]),
            (ALPHABET_ID.mongolian, "Mongolian", &["ө", "ү"], &["a"]),
            (ALPHABET_ID.filipino, "Filipino", &["ñ"], &["ə"]),
            (ALPHABET_ID.vietnamese, "Vietnamese", &["đ", "ă"], &["ф"]),
            (ALPHABET_ID.thai, "Thai", &["ก", "ฮ"], &["a"]),
            (ALPHABET_ID.khmer, "Khmer", &["ក", "កា"], &["a", "្"]),
        ];
        assert_eq!(
            alphabet(ALPHABET_ID.japanese).len(),
            95,
            "hiragana + katakāna gojūon + punct"
        );
        for &(id, name, yes, no) in probes {
            assert_eq!(alphabet_def(id).name, name);
            let ab = alphabet(id);
            for &ch in yes {
                assert!(ab.contains(&ch), "{name} missing {ch:?}");
            }
            for &ch in no {
                assert!(!ab.contains(&ch), "{name} should not contain {ch:?}");
            }
        }

        let mut ids = BTreeSet::new();
        let owned_ids: BTreeSet<u32> = ALPHABET_REGISTRY.iter().map(|d| d.id).collect();
        for def in ALPHABET_REGISTRY {
            assert!(ids.insert(def.id), "duplicate alphabet id {}", def.id);
            let n = def.symbols.len();
            assert!(
                (1..=MAX_ALPHABET_LEN as usize).contains(&n),
                "{} glyph count {n} outside alphabet length 1..={}",
                def.name,
                MAX_ALPHABET_LEN
            );
            assert_eq!(alphabet(def.id).len(), n);
            assert_eq!(alphabet(def.id), def.symbols);
            assert_eq!(&def.symbols[n - 3..], &[" ", ",", "."]);
            // Prefer id == glyph_count. Allowed divergences:
            // - classic collide: the count slot is already another lens's id
            // - v8 inventory grow: permalink id stays frozen while len increases past it
            if def.id as usize == n {
                continue;
            }
            let count_taken = owned_ids.contains(&(n as u32));
            let frozen_permalink_growth = n > def.id as usize;
            assert!(
                count_taken || frozen_permalink_growth,
                "{} id {} ≠ len {n}, count slot free and not a freeze-grow (collide rule)",
                def.name,
                def.id
            );
        }

        let js =
            std::fs::read_to_string("web/js/lib/constants.js").expect("web/js/lib/constants.js");
        for def in ALPHABET_REGISTRY {
            let needle = format!("id: {}", def.id);
            assert!(
                js.contains(&needle),
                "web/js/lib/constants.js missing lens id {} ({})",
                def.id,
                def.name
            );
        }
        // Japanese is built from hiragana + mapped katakāna — spot-check length via node if needed;
        // full glyph dual stays dual; length parity for explicit `symbols:` strings:
        for def in ALPHABET_REGISTRY {
            let re = regex_lite_symbols_len(&js, def.id);
            if let Some(js_len) = re {
                assert_eq!(
                    js_len,
                    def.symbols.len(),
                    "JS/Rust length mismatch for {} (id {})",
                    def.name,
                    def.id
                );
            }
        }
    }

    /// Cell count for `symbols: [...]` arrays, or pure string literals (+ optional + PUNCT).
    fn regex_lite_symbols_len(js: &str, id: u32) -> Option<usize> {
        let marker = format!("id: {id},");
        let start = js.find(&marker)?;
        let window = &js[start..];
        let end = window.find("\n  },").unwrap_or(window.len().min(8000));
        let block = &window[..end];
        if block.contains("stem:") {
            return None;
        }
        // symbols: [ "a", "b", ... ]
        if let Some(i) = block.find("symbols: [") {
            let rest = &block[i + "symbols: [".len()..];
            let j = rest.find(']')?;
            let inner = &rest[..j];
            let mut count = 0usize;
            let mut chars = inner.chars().peekable();
            while let Some(c) = chars.next() {
                if c == '"' {
                    count += 1;
                    while let Some(d) = chars.next() {
                        if d == '\\' {
                            chars.next();
                            continue;
                        }
                        if d == '"' {
                            break;
                        }
                    }
                }
            }
            return Some(count);
        }
        for quote in ['"', '\''] {
            let key = format!("symbols: {quote}");
            if let Some(i) = block.find(&key) {
                let rest = &block[i + key.len()..];
                let j = rest.find(quote)?;
                let after = rest[j + 1..].trim_start();
                if after.starts_with('+') {
                    // "abc" + PUNCT — count chars + 3
                    return Some(rest[..j].chars().count() + 3);
                }
                if !after.starts_with(',') {
                    return None;
                }
                return Some(rest[..j].chars().count());
            }
        }
        None
    }

    #[test]
    fn alphabet_is_a_lens_not_a_room_axis() {
        // Room identity ignores alphabet; spines under each lens diverge.
        let room = node_hash_bytes(&bi(1), &bi(1), 0);
        assert_eq!(
            node_fingerprint(&bi(1), &bi(1), 0),
            u64::from_be_bytes(room[..8].try_into().unwrap())
        );
        assert_ne!(
            gallery_titles(&bi(1), &bi(1), 25, 0, None),
            gallery_titles(&bi(1), &bi(1), 29, 0, None)
        );
        // Spanish lens: room hash unchanged; accented glyphs in the inventory.
        use crate::config::{ALPHABET_ID, alphabet};
        assert_eq!(room, node_hash_bytes(&bi(1), &bi(1), 0));
        assert_ne!(
            gallery_titles(&bi(1), &bi(1), 29, 0, None),
            gallery_titles(&bi(1), &bi(1), ALPHABET_ID.spanish, 0, None)
        );
        let spanish = alphabet(ALPHABET_ID.spanish);
        assert!(
            spanish.iter().any(|c| {
                matches!(
                    *c,
                    "ñ" | "á" | "é" | "í" | "ó" | "ú" | "Ñ" | "Á" | "É" | "Í" | "Ó" | "Ú"
                )
            }),
            "spanish lens should include accented symbols"
        );
        assert!(
            !spanish.iter().any(|c| *c == "ü" || *c == "Ü"),
            "typical spanish lens omits diaeresis ü"
        );
        // Borges / latin-only lenses omit wxyz in the Basile-29 inventory story —
        // check the alphabet table, not a full-book render (v10 book Basile).
        let borges = alphabet(25);
        assert!(!borges.iter().any(|c| matches!(*c, "w" | "x" | "y" | "z")));
    }

    #[test]
    fn universe_is_the_outermost_axis() {
        assert_ne!(
            node_fingerprint(&bi(1), &bi(1), 0),
            node_fingerprint(&bi(1), &bi(1), 7)
        );
        assert_ne!(
            gallery_titles(&bi(1), &bi(1), 29, 0, None),
            gallery_titles(&bi(1), &bi(1), 29, 7, None)
        );
        assert_eq!(
            gallery_titles(&bi(1), &bi(1), 29, 7, None),
            gallery_titles(&bi(1), &bi(1), 29, 7, None)
        );
    }

    #[test]
    fn universe_names_map_to_stable_seeds() {
        use crate::universe::universe_seed_for;
        assert_eq!(universe_seed_for(""), 0);
        assert_eq!(universe_seed_for("   "), 0);
        assert_eq!(universe_seed_for("borges"), universe_seed_for("borges"));
        assert_eq!(universe_seed_for("borges"), universe_seed_for("  borges  "));
        assert_ne!(universe_seed_for("borges"), universe_seed_for("babel"));
        assert_ne!(universe_seed_for("borges"), 0);
        assert_eq!(
            universe_seed_for("0xdeadbeefcafebabe"),
            0xDEAD_BEEF_CAFE_BABE
        );
    }

    #[test]
    fn book_image_dims_are_near_square() {
        use crate::color::book_grid_dims;
        use crate::config::{CHARS_PER_LINE, LINES_PER_PAGE, PAGES_PER_BOOK};
        let (w, h) = book_grid_dims();
        let cells = PAGES_PER_BOOK * LINES_PER_PAGE * CHARS_PER_LINE;
        assert_eq!(w * h, cells);
        let ratio = f64::from(w) / f64::from(h);
        assert!(ratio > 0.5 && ratio < 2.0, "ratio {ratio} not near-square");
    }

    #[test]
    fn moves_are_reversible() {
        let z0 = bi(5);
        let n0 = bi(9);
        let (z_east, n_east) = neighbor(&z0, &n0, 0);
        assert_eq!(neighbor(&z_east, &n_east, 1), (z0.clone(), n0.clone()));
        let (z_north, n_north) = neighbor(&z0, &n0, 2);
        assert_eq!(neighbor(&z_north, &n_north, 3), (z0, n0));
    }

    #[test]
    fn clustered_alphabet_inventories_are_nonempty() {
        use crate::config::{ALPHABET_ID, alphabet};
        for &id in &[
            ALPHABET_ID.hindi,
            ALPHABET_ID.thai,
            ALPHABET_ID.khmer,
            ALPHABET_ID.chinese,
        ] {
            assert!(alphabet(id).len() > 10, "alphabet {id} inventory too small");
        }
    }

    #[test]
    fn books_in_gallery_have_distinct_spines() {
        let a = gallery_titles(&bi(0), &bi(0), 29, 0, None);
        assert_ne!(a[0], a[1], "adjacent books should not share a spine title");
    }

    #[test]
    fn search_rejects_hyphens_and_quotes() {
        assert!(matches!(
            locate_page("twenty-nine", 29, 0),
            Err(LocateError::InvalidChars(_))
        ));
        assert!(matches!(
            locate_page("don't", 29, 0),
            Err(LocateError::InvalidChars(_))
        ));
    }

    #[test]
    fn content_search_rejects_beyond_one_page() {
        use crate::config::PAGE_CONTENT_SYMBOLS;
        let over: String = "a".repeat(PAGE_CONTENT_SYMBOLS + 1);
        assert!(matches!(
            locate_page(&over, 29, 0),
            Err(LocateError::Message(msg)) if msg.contains("one page")
        ));
        let page = "a".repeat(PAGE_CONTENT_SYMBOLS);
        assert!(locate_page(&page, 29, 0).is_ok());
        // Span helper still reports multi-page lengths (not used for locate accept).
        assert_eq!(crate::search::search_page_span(&over, 29), 2);
    }

    #[test]
    fn book_locate_rejects_one_page_or_less() {
        use crate::config::PAGE_CONTENT_SYMBOLS;
        let page = "a".repeat(PAGE_CONTENT_SYMBOLS);
        assert!(matches!(
            locate_book(&page, 29, 0),
            Err(LocateError::Message(msg)) if msg.contains("too short")
        ));
        assert!(matches!(
            locate_book("", 29, 0),
            Err(LocateError::Message(msg)) if msg.contains("empty")
        ));
    }

    #[test]
    fn title_search_is_deterministic_and_embeds_on_spine() {
        use crate::config::TITLE_LEN;
        let title = "crimson spine";
        let hit = locate_title(title, 29, 0).expect("locate title");
        assert_eq!(locate_title(title, 29, 0).expect("again"), hit);
        assert!(hit.char_count <= TITLE_LEN);
        let loc = hit.location;
        let titles = gallery_titles(&loc.z, &loc.n, 29, 0, None);
        let spine = &titles[loc.book_index as usize];
        assert!(
            spine.contains(title),
            "virgin spine {spine:?} must contain title {title:?}"
        );
    }

    #[test]
    fn title_search_rejects_long_phrases() {
        let long = "a".repeat(25);
        assert!(matches!(
            locate_title(&long, 29, 0),
            Err(LocateError::Message(_))
        ));
    }

    #[test]
    fn generator_version_is_frozen_in_tests() {
        assert_eq!(GENERATOR_VERSION, 11);
        assert_eq!(MAX_ALPHABET_LEN, 4096);
    }
}
