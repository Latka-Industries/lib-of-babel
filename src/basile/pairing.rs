//! Gallery pairing (Cantor) and page/book address pack/unpack.

use num_bigint::{BigInt, BigUint, Sign};
use num_traits::{One, Zero};

use crate::config::{BOOKS_PER_GALLERY, PAGES_PER_BOOK};

use super::scramble::mod_inverse;

/// One page address in a universe + alphabet lens.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct PageKey {
    pub universe_seed: u64,
    pub z: BigInt,
    pub n: BigInt,
    pub book_index: u32,
    pub page: u32,
    pub alphabet_id: u32,
}

/// Zigzag: non-negative → `2n`, negative → `2|n|-1` (arbitrary-precision).
#[inline]
fn zigzag(i: &BigInt) -> BigUint {
    match i.sign() {
        Sign::Minus => (i.magnitude().clone() << 1) - BigUint::one(),
        Sign::NoSign | Sign::Plus => i.to_biguint().unwrap_or_default() << 1,
    }
}

#[inline]
fn unzigzag(u: &BigUint) -> BigInt {
    if u.bit(0) {
        -BigInt::from((u + BigUint::one()) >> 1)
    } else {
        BigInt::from(u >> 1)
    }
}

pub(crate) fn pair_gallery(z: &BigInt, n: &BigInt) -> BigUint {
    let zz = zigzag(z);
    let nn = zigzag(n);
    let sum = &zz + &nn;
    (&sum * (&sum + BigUint::one())) / BigUint::from(2u32) + nn
}

/// `pair_gallery(z, n) % m` without building the full Cantor square when `m` is odd.
///
/// Content-search rooms have multi-thousand-digit `(z, n)`. Pairing those 700× for
/// spines is the gallery lag; reducing mod the (small) title modulus once is enough.
pub(crate) fn pair_gallery_mod(z: &BigInt, n: &BigInt, m: &BigUint) -> BigUint {
    if m.is_zero() {
        return BigUint::zero();
    }
    // T(s)=s(s+1)/2 mod m is determined by s mod m only when 2 is invertible (m odd).
    if m.bit(0) {
        let zz = zigzag_mod(z, m);
        let nn = zigzag_mod(n, m);
        let sum = (&zz + &nn) % m;
        let inv2 = mod_inverse(&BigUint::from(2u32), m);
        let tri = ((&sum * (&sum + BigUint::one())) % m * inv2) % m;
        (tri + nn) % m
    } else {
        pair_gallery(z, n) % m
    }
}

fn zigzag_mod(i: &BigInt, m: &BigUint) -> BigUint {
    match i.sign() {
        Sign::Minus => {
            let mag = i.magnitude() % m;
            let two_mag = (BigUint::from(2u32) * mag) % m;
            if two_mag.is_zero() {
                m - BigUint::one()
            } else {
                two_mag - BigUint::one()
            }
        }
        Sign::NoSign | Sign::Plus => {
            let z = i.to_biguint().unwrap_or_default() % m;
            (BigUint::from(2u32) * z) % m
        }
    }
}

fn unpair_gallery(idx: &BigUint) -> (BigInt, BigInt) {
    let disc = BigUint::from(8u32) * idx + BigUint::one();
    let root = disc.sqrt();
    let triangle = (root - BigUint::one()) / BigUint::from(2u32);
    let base = (&triangle * (&triangle + BigUint::one())) / BigUint::from(2u32);
    let nn = idx - &base;
    let zz = &triangle - &nn;
    (unzigzag(&zz), unzigzag(&nn))
}

pub(crate) fn u64_from_big(x: &BigUint) -> u64 {
    x.to_u64_digits().first().copied().unwrap_or(0)
}

#[inline]
fn pages_books_big() -> (BigUint, BigUint) {
    (
        BigUint::from(PAGES_PER_BOOK),
        BigUint::from(BOOKS_PER_GALLERY),
    )
}

/// `page + PAGES * (book + BOOKS * g)`.
#[inline]
pub(crate) fn pack_page_addr(book_index: u32, page: u32, g: &BigUint) -> BigUint {
    let (pages, books) = pages_books_big();
    let book = BigUint::from(book_index % BOOKS_PER_GALLERY);
    let page = BigUint::from(page % PAGES_PER_BOOK);
    page + pages * (book + books * g)
}

/// `book + BOOKS * g`.
#[inline]
pub(crate) fn pack_book_addr_g(book_index: u32, g: &BigUint) -> BigUint {
    let (_, books) = pages_books_big();
    BigUint::from(book_index % BOOKS_PER_GALLERY) + books * g
}

/// Linear page index: `page + PAGES * (book + BOOKS * pair(z,n))`.
///
/// Used by page-linked invert. Hot forward paths use [`pair_gallery_mod`]
/// so huge coordinates stay cheap.
#[must_use]
#[cfg(test)]
pub fn pack_page_index(z: &BigInt, n: &BigInt, book_index: u32, page: u32) -> BigUint {
    pack_page_addr(book_index, page, &pair_gallery(z, n))
}

#[must_use]
pub fn unpack_page_index(mut x: BigUint) -> (BigInt, BigInt, u32, u32) {
    let (pages, books) = pages_books_big();
    let page = (u64_from_big(&(&x % &pages)) as u32) % PAGES_PER_BOOK;
    x /= &pages;
    let book = (u64_from_big(&(&x % &books)) as u32) % BOOKS_PER_GALLERY;
    x /= &books;
    let (z, n) = unpair_gallery(&x);
    (z, n, book, page)
}

/// Book address: `book + BOOKS * pair(z,n)` (no page — pages are slices of the book).
pub(crate) fn book_addr(z: &BigInt, n: &BigInt, book_index: u32, n_mod: &BigUint) -> BigUint {
    pack_book_addr_g(book_index, &pair_gallery_mod(z, n, n_mod))
}

pub(crate) fn unpack_book_addr(mut addr: BigUint) -> (BigInt, BigInt, u32) {
    let (_, books) = pages_books_big();
    let book = (u64_from_big(&(&addr % &books)) as u32) % BOOKS_PER_GALLERY;
    addr /= &books;
    let (z, n) = unpair_gallery(&addr);
    (z, n, book)
}
