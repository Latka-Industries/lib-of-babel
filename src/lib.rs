//! lib-of-babel — deterministic generator core for a walkable Library of Babel.
//!
//! Every gallery is a pure function of its `(z, n)` coordinate. Nothing is stored:
//! the same coordinate always yields the same 700 books and the same fingerprint.
//!
//! NOTE: `GENERATOR_VERSION` freezes the contract. Changing the alphabet, PRNG,
//! seeding order, fingerprint, or dimensions below invalidates every previously
//! exported path/hash, so bump the version deliberately.

mod color;
mod config;
mod feistel;
mod gallery;
mod page;
mod prng;
mod search;
mod universe;
mod wasm_api;

pub use color::{book_image, BookImage};
pub use config::{
    alphabet, BOOKS_PER_GALLERY, DEFAULT_ALPHABET, GENERATOR_VERSION, MAX_SEARCH_CHARS,
};
pub use gallery::{
    book_index_to_shelf, book_seed, gallery_seed, gallery_titles, neighbor, node_fingerprint,
    node_hash_bytes,
};
pub use page::{book_text, page_text, page_symbols};
pub use search::{
    locate_page, search_offset, search_page_segment, search_page_span, text_to_symbols,
    LocateError, LocateResult, PageLocation,
};
pub use wasm_api::*;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{alphabet, BOOKS_PER_GALLERY, DEFAULT_ALPHABET, GENERATOR_VERSION};
    use crate::feistel::{
        feistel_decrypt, feistel_encrypt, feistel_key, pack_page_address, plaintext_from_address,
        unpack_page_address,
    };
    use crate::search::LocateError;

    #[test]
    fn gallery_is_deterministic() {
        assert_eq!(gallery_titles(3, -7, 29, 0), gallery_titles(3, -7, 29, 0));
        assert_ne!(gallery_titles(3, -7, 29, 0), gallery_titles(3, -8, 29, 0));
    }

    #[test]
    fn gallery_has_700_books() {
        assert_eq!(gallery_titles(0, 0, 29, 0).len(), BOOKS_PER_GALLERY as usize);
        assert_eq!(BOOKS_PER_GALLERY, 700);
    }

    #[test]
    fn fingerprint_is_stable() {
        assert_eq!(node_fingerprint(1, 1, 29, 0), node_fingerprint(1, 1, 29, 0));
        assert_ne!(node_fingerprint(1, 1, 29, 0), node_fingerprint(1, 2, 29, 0));
    }

    #[test]
    fn fingerprint_is_blake3_and_full_hash_is_256_bit() {
        let full = node_hash_bytes(1, 1, 29, 0);
        let prefix = u64::from_be_bytes(full[..8].try_into().unwrap());
        assert_eq!(node_fingerprint(1, 1, 29, 0), prefix);
        assert_eq!(full.len(), 32);
        assert!(full.iter().any(|&b| b != 0));
    }

    #[test]
    fn alphabet_sizes_are_correct() {
        assert_eq!(alphabet(25).len(), 25);
        assert_eq!(alphabet(29).len(), 29);
        assert_eq!(alphabet(999), alphabet(DEFAULT_ALPHABET));
    }

    #[test]
    fn alphabet_is_a_universe_axis() {
        assert_ne!(node_fingerprint(1, 1, 25, 0), node_fingerprint(1, 1, 29, 0));
        assert_ne!(gallery_titles(1, 1, 25, 0), gallery_titles(1, 1, 29, 0));
        let borges = book_text(0, 0, 0, 25, 0);
        assert!(!borges.contains(['w', 'x', 'y', 'z']));
    }

    #[test]
    fn universe_is_the_outermost_axis() {
        assert_ne!(node_fingerprint(1, 1, 29, 0), node_fingerprint(1, 1, 29, 7));
        assert_ne!(gallery_titles(1, 1, 29, 0), gallery_titles(1, 1, 29, 7));
        assert_ne!(book_text(0, 0, 0, 29, 0), book_text(0, 0, 0, 29, 7));
        assert_eq!(gallery_titles(1, 1, 29, 7), gallery_titles(1, 1, 29, 7));
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
        assert_eq!(universe_seed_for("0xdeadbeefcafebabe"), 0xDEAD_BEEF_CAFE_BABE);
    }

    #[test]
    fn book_image_is_well_shaped_and_deterministic() {
        use crate::config::{CHARS_PER_LINE, LINES_PER_PAGE, PAGES_PER_BOOK};
        let img = book_image(2, -3, 17, 29);
        let cells = (PAGES_PER_BOOK * LINES_PER_PAGE * CHARS_PER_LINE) as usize;
        assert_eq!(
            img.pixels().len(),
            (img.width() as usize) * (img.height() as usize) * 4
        );
        assert_eq!(img.pixels().len(), cells * 4);
        let ratio = img.width() as f64 / img.height() as f64;
        assert!(ratio > 0.5 && ratio < 2.0, "ratio {ratio} not near-square");
        assert_eq!(book_image(2, -3, 17, 29).pixels(), img.pixels());
        assert_ne!(book_image(2, -3, 17, 25).pixels(), img.pixels());
    }

    #[test]
    fn moves_are_reversible() {
        let (z, n) = (5_i64, 9_i64);
        let (a, b) = neighbor(z, n, 0);
        assert_eq!(neighbor(a, b, 1), (z, n));
        let (c, d) = neighbor(z, n, 2);
        assert_eq!(neighbor(c, d, 3), (z, n));
    }

    #[test]
    fn address_pack_round_trips() {
        let cases = [
            (0_u64, 12_i64, -5_i64, 333_u32, 200_u32),
            (7_u64, -3_i64, 42_i64, 17_u32, 99_u32),
            (0_u64, 0_i64, 0_i64, 0_u32, 0_u32),
        ];
        for (uni, z, n, book, page) in cases {
            let packed = pack_page_address(uni, z, n, book, page);
            assert_eq!(unpack_page_address(&packed), (uni, z, n, book, page));
        }
    }

    #[test]
    fn feistel_round_trips() {
        let alpha_len = 29;
        let key = feistel_key(29);
        let mut state = plaintext_from_address(7, -3, 42, 17, 99, 29, alpha_len);
        let orig = state;
        feistel_encrypt(&mut state, key, alpha_len);
        assert_ne!(state, orig);
        feistel_decrypt(&mut state, key, alpha_len);
        assert_eq!(state, orig);
    }

    #[test]
    fn books_in_gallery_differ_substantially() {
        let flat = |s: &str| s.chars().filter(|c| *c != '\n').collect::<String>();
        let a = flat(&page_text(0, 0, 0, 0, 29, 0, None, None));
        let b = flat(&page_text(0, 0, 1, 0, 29, 0, None, None));
        let diff = a.chars().zip(b.chars()).filter(|(x, y)| x != y).count();
        assert!(diff > 1000, "only {diff} chars differ between book 0 and 1");
    }

    #[test]
    fn search_rejects_hyphens_and_quotes() {
        assert!(matches!(
            locate_page("twenty-nine", 29, 0),
            Err(LocateError::InvalidChars(_))
        ));
        assert!(locate_page("twenty nine", 29, 0).is_ok());
        assert!(matches!(
            locate_page("don't", 29, 0),
            Err(LocateError::InvalidChars(_))
        ));
    }

    #[test]
    fn search_normalizes_case() {
        let a = locate_page("Hello World", 29, 0).expect("locate");
        let b = locate_page("hello world", 29, 0).expect("locate");
        assert_eq!(a, b);
    }

    #[test]
    fn locate_is_deterministic() {
        let phrase = "forgive me for i have sinned";
        let a = locate_page(phrase, 29, 0).expect("locate");
        let b = locate_page(phrase, 29, 0).expect("locate");
        assert_eq!(a, b);
    }

    #[test]
    fn search_is_scoped_to_universe() {
        let phrase = "hello world";
        let a = locate_page(phrase, 29, 0).expect("locate");
        let b = locate_page(phrase, 29, 7).expect("locate");
        assert_eq!(a.location.universe_seed, 0);
        assert_eq!(b.location.universe_seed, 7);
        assert_ne!(
            (
                a.location.z,
                a.location.n,
                a.location.book_index,
                a.location.page
            ),
            (
                b.location.z,
                b.location.n,
                b.location.book_index,
                b.location.page
            )
        );
    }

    #[test]
    fn search_spans_consecutive_pages() {
        let phrase: String = "a".repeat(4000);
        let res = locate_page(&phrase, 29, 0).expect("locate");
        assert_eq!(res.page_span, 2);
        assert_eq!(res.char_count, 4000);
        let loc = res.location;
        let hit = Some(loc.page);
        let p0 = page_text(
            loc.z,
            loc.n,
            loc.book_index,
            loc.page,
            29,
            loc.universe_seed,
            Some(&phrase),
            hit,
        );
        let p1 = page_text(
            loc.z,
            loc.n,
            loc.book_index,
            loc.page + 1,
            29,
            loc.universe_seed,
            Some(&phrase),
            hit,
        );
        let flat0: String = p0.chars().filter(|c| *c != '\n').collect();
        let flat1: String = p1.chars().filter(|c| *c != '\n').collect();
        assert_eq!(&flat0[..3200], &phrase[..3200]);
        assert_eq!(&flat1[..800], &phrase[3200..]);
        let concat = format!("{flat0}{flat1}");
        assert_eq!(&concat[..4000], phrase.as_str());
    }

    #[test]
    fn search_embeds_phrase_on_page() {
        let phrase = "sit on a pan otis";
        let loc = locate_page(phrase, 29, 0).expect("locate").location;
        let page = page_text(
            loc.z,
            loc.n,
            loc.book_index,
            loc.page,
            29,
            loc.universe_seed,
            Some(phrase),
            Some(loc.page),
        );
        let flat: String = page.chars().filter(|c| *c != '\n').collect();
        let off = search_offset(phrase, phrase.len());
        assert_eq!(&flat[off..off + phrase.len()], phrase);
    }

    #[test]
    fn generator_version_is_frozen_in_tests() {
        assert_eq!(GENERATOR_VERSION, 6);
    }
}
