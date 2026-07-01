//! Batch rarity prospecting — scan many random galleries for leading-zero hash bits.

use crate::gallery::node_fingerprint;
use crate::prng::splitmix64;

/// Leading zero bits of a 64-bit gallery fingerprint (matches JS `leadingZeroBits` on `{:016x}`).
#[must_use]
pub fn leading_zero_bits_fingerprint(fp: u64) -> u32 {
    let mut bits = 0u32;
    for shift in (0..64).step_by(4).rev() {
        let nibble = (fp >> shift) & 0xf;
        if nibble == 0 {
            bits += 4;
            continue;
        }
        bits += match nibble {
            1 => 3,
            2 | 3 => 2,
            4..=7 => 1,
            _ => 0,
        };
        break;
    }
    bits
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ProspectHit {
    pub z: i64,
    pub n: i64,
    pub fingerprint: u64,
    pub bits: u32,
}

/// Scan `samples` random galleries starting at global index `start_index`.
#[must_use]
pub fn prospect_batch(
    samples: u32,
    seed: u64,
    start_index: u64,
    alphabet_id: u32,
    universe_seed: u64,
) -> (Option<ProspectHit>, u32) {
    let mut best: Option<ProspectHit> = None;
    for i in 0..samples {
        let idx = start_index.wrapping_add(u64::from(i));
        let mut r = splitmix64(seed.wrapping_add(idx.wrapping_mul(0x9E37_79B9_7F4A_7C15)));
        let z = r as i64;
        r = splitmix64(r);
        let n = r as i64;
        let fp = node_fingerprint(z, n, alphabet_id, universe_seed);
        let bits = leading_zero_bits_fingerprint(fp);
        if best.as_ref().is_none_or(|b| bits > b.bits) {
            best = Some(ProspectHit {
                z,
                n,
                fingerprint: fp,
                bits,
            });
        }
    }
    (best, samples)
}

/// JSON `{ best: { z, n, hash, bits } | null, scanned }` for WASM / workers.
#[must_use]
pub fn prospect_batch_json(
    samples: u32,
    seed: u64,
    start_index: u64,
    alphabet_id: u32,
    universe_seed: u64,
) -> String {
    let (best, scanned) = prospect_batch(samples, seed, start_index, alphabet_id, universe_seed);
    match best {
        Some(h) => format!(
            concat!(
                r#"{{"best":{{"z":"{}","n":"{}","hash":"{:016x}","bits":{}}},"#,
                r#""scanned":{}}}"#
            ),
            h.z, h.n, h.fingerprint, h.bits, scanned
        ),
        None => format!(r#"{{"best":null,"scanned":{scanned}}}"#),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn leading_zero_bits_matches_hex_example() {
        assert_eq!(leading_zero_bits_fingerprint(0x0002_2549_d928_5ab9), 14);
    }

    #[test]
    fn leading_zero_bits_all_zero_is_64() {
        assert_eq!(leading_zero_bits_fingerprint(0), 64);
    }

    #[test]
    fn batch_is_deterministic() {
        let a = prospect_batch(100, 42, 0, 29, 0);
        let b = prospect_batch(100, 42, 0, 29, 0);
        assert_eq!(a, b);
    }
}
