//! Basile unit tests — no full-book scramble (that hangs debug `cargo test`).

use num_bigint::{BigInt, BigUint};
use num_traits::Pow;

use crate::config::{BOOKS_PER_GALLERY, PAGE_CONTENT_SYMBOLS};

use super::digits::{digits_to_int, int_to_digits};
use super::pairing::{PageKey, pack_page_index, pair_gallery, pair_gallery_mod, unpack_page_index};
use super::scramble::scramble_params;
use super::{
    invert_page_symbols, invert_title_symbols, page_symbols_at, title_symbols_at,
    title_symbols_for_gallery,
};

#[test]
fn page_round_trip_basile29() {
    let key = PageKey {
        universe_seed: 0,
        z: BigInt::from(3),
        n: BigInt::from(-7),
        book_index: 42,
        page: 17,
        alphabet_id: 29,
    };
    let alpha = 29u32;
    let symbols = page_symbols_at(&key, alpha);
    let back = invert_page_symbols(&symbols, 0, 29, alpha);
    assert_eq!(back, key);
}

#[test]
fn title_round_trip() {
    let alpha = 29u32;
    let z = BigInt::from(2);
    let n = BigInt::from(-3);
    let book = 15u32;
    let syms = title_symbols_at(&z, &n, book, 0, 29, alpha);
    let back = invert_title_symbols(&syms, 0, 29, alpha);
    assert_eq!(back, (z, n, book));
}

#[test]
fn pair_gallery_mod_matches_full_pair() {
    let coords = [
        (BigInt::from(0), BigInt::from(0)),
        (BigInt::from(12), BigInt::from(-7)),
        (BigInt::from(-1), BigInt::from(1)),
        (
            BigInt::parse_bytes(b"999999999999999999999999999999", 10).unwrap(),
            BigInt::from(-42),
        ),
    ];
    // Odd moduli (2 invertible) and one even fallback.
    let moduli = [
        BigUint::from(29u32).pow(24u32),
        BigUint::from(10007u32),
        BigUint::from(64u32),
    ];
    for (z, n) in &coords {
        for m in &moduli {
            assert_eq!(
                pair_gallery_mod(z, n, m),
                pair_gallery(z, n) % m,
                "z={z} n={n} m={m}"
            );
        }
    }
}

#[test]
fn gallery_titles_match_per_book_at_huge_coords() {
    let z = BigInt::parse_bytes(b"9223372036854775808", 10).unwrap();
    let n = BigInt::from(-42);
    let batch = title_symbols_for_gallery(&z, &n, 0, 29, 29);
    assert_eq!(batch.len(), BOOKS_PER_GALLERY as usize);
    for (i, row) in batch.iter().enumerate() {
        let one = title_symbols_at(&z, &n, i as u32, 0, 29, 29);
        assert_eq!(row, &one, "book {i}");
    }
    let titles = crate::gallery::gallery_titles(&z, &n, 29, 0, None);
    let spine0 = crate::search::spine_title_at(&z, &n, 0, 29, 0);
    assert_eq!(titles[0], spine0);
}

#[test]
fn pack_unpack_page_index_bigint() {
    let cases = [
        (BigInt::from(0), BigInt::from(0), 0u32, 0u32),
        (BigInt::from(1), BigInt::from(-1), 699, 409),
        (BigInt::from(-50), BigInt::from(12), 3, 7),
        // Beyond i64 — must not truncate on unpack.
        (
            BigInt::parse_bytes(b"9223372036854775808", 10).unwrap(),
            BigInt::from(-3),
            1,
            2,
        ),
    ];
    for (z, n, b, p) in cases {
        let x = pack_page_index(&z, &n, b, p);
        let (z2, n2, b2, p2) = unpack_page_index(x);
        assert_eq!((z2, n2, b2, p2), (z, n, b, p));
    }
}

#[test]
fn digits_round_trip() {
    let mut page = [0u16; PAGE_CONTENT_SYMBOLS];
    for (i, slot) in page.iter_mut().enumerate() {
        *slot = (i % 29) as u16;
    }
    let x = digits_to_int(&page, 29);
    let back = int_to_digits(x, 29, PAGE_CONTENT_SYMBOLS);
    assert_eq!(page.as_slice(), back.as_slice());
}

#[test]
fn mul_inverse_on_arbitrary() {
    let mut page = [0u16; PAGE_CONTENT_SYMBOLS];
    for (i, slot) in page.iter_mut().enumerate() {
        *slot = ((i * 7 + 3) % 29) as u16;
    }
    let (c, i, n) = scramble_params(0, 29, 29, PAGE_CONTENT_SYMBOLS);
    let content = digits_to_int(&page, 29) % &n;
    let addr = (&content * &i) % &n;
    let content2 = (&addr * &c) % &n;
    assert_eq!(content, content2, "C*I not identity");
    let regen = int_to_digits(content2, 29, PAGE_CONTENT_SYMBOLS);
    assert_eq!(page.as_slice(), regen.as_slice());
}

#[test]
fn hensel_inverse_medium_round_trip() {
    // Book-shaped map at a small length — never BOOK_CONTENT_SYMBOLS in CI.
    let len = 6_400usize;
    let alpha = 29u32;
    let (c, i, n) = scramble_params(0, 29, alpha, len);
    assert_eq!((&c * &i) % &n, BigUint::from(1u32));
    let mut digits = vec![0u16; len];
    for (idx, slot) in digits.iter_mut().enumerate() {
        *slot = ((idx * 7 + 3) % 29) as u16;
    }
    let content = digits_to_int(&digits, alpha) % &n;
    let addr = (&content * &i) % &n;
    let back = (&addr * &c) % &n;
    assert_eq!(content, back);
    assert_eq!(int_to_digits(back, alpha, len), digits);
}
