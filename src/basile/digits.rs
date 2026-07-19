//! Digit ↔ integer codec for alphabet symbol streams.

use num_bigint::BigUint;
use num_integer::Integer;
use num_traits::{Pow, Zero};

use crate::config::PAGE_CONTENT_SYMBOLS;

use super::pairing::u64_from_big;

/// Digits little-endian (index 0 = least significant) → big integer.
///
/// Skips leading/trailing zero digits so short zero-padded book searches stay cheap.
#[must_use]
pub fn digits_to_int(digits: &[u16], alpha_len: u32) -> BigUint {
    debug_assert!(digits.iter().all(|&d| u32::from(d) < alpha_len));
    let Some(start) = digits.iter().position(|&d| d != 0) else {
        return BigUint::zero();
    };
    let end = digits
        .iter()
        .rposition(|&d| d != 0)
        .map_or(start, |i| i + 1);
    let slice = &digits[start..end];
    let body = digits_to_int_dense(slice, alpha_len);
    if start == 0 {
        body
    } else {
        body * BigUint::from(alpha_len).pow(start as u32)
    }
}

fn digits_to_int_dense(digits: &[u16], alpha_len: u32) -> BigUint {
    if (2..=256).contains(&alpha_len) {
        let raw: Vec<u8> = digits.iter().map(|&d| d as u8).collect();
        BigUint::from_radix_le(&raw, alpha_len).unwrap_or_else(BigUint::zero)
    } else {
        let mut n = BigUint::zero();
        let base = BigUint::from(alpha_len);
        for &d in digits.iter().rev() {
            n = n * &base + BigUint::from(u32::from(d));
        }
        n
    }
}

/// Big integer → `len` little-endian digits (padded with zeros).
#[must_use]
pub fn int_to_digits(mut n: BigUint, alpha_len: u32, len: usize) -> Vec<u16> {
    if alpha_len <= 256 {
        let mut digits = n.to_radix_le(alpha_len);
        digits.resize(len, 0);
        digits.truncate(len);
        digits.into_iter().map(u16::from).collect()
    } else {
        let base = BigUint::from(alpha_len);
        let mut out = vec![0u16; len];
        for slot in &mut out {
            if n.is_zero() {
                break;
            }
            let (q, r) = n.div_rem(&base);
            *slot = u64_from_big(&r) as u16;
            n = q;
        }
        out
    }
}

pub(crate) fn digits_u16_to_page(digits: &[u16]) -> [u16; PAGE_CONTENT_SYMBOLS] {
    let mut out = [0u16; PAGE_CONTENT_SYMBOLS];
    let n = digits.len().min(PAGE_CONTENT_SYMBOLS);
    out[..n].copy_from_slice(&digits[..n]);
    out
}
