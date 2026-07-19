//! Scramble constants `(C, I, N)` — cache, Hensel inverse, baked book blob.

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

use num_bigint::{BigInt, BigUint};
use num_integer::Integer;
use num_traits::{One, Pow, Signed, Zero};

use crate::config::{BOOK_CONTENT_SYMBOLS, GENERATOR_VERSION};

pub(crate) fn modulus(alpha_len: u32, len: usize) -> BigUint {
    BigUint::from(alpha_len).pow(len as u32)
}

pub(crate) fn mod_inverse(a: &BigUint, m: &BigUint) -> BigUint {
    let a_mod = a % m;
    let mut r0 = BigInt::from(m.clone());
    let mut r1 = BigInt::from(a_mod);
    let mut s0 = BigInt::zero();
    let mut s1 = BigInt::one();
    while !r1.is_zero() {
        let (q, r2) = r0.div_rem(&r1);
        r0 = r1;
        r1 = r2;
        let s2 = &s0 - &q * &s1;
        s0 = s1;
        s1 = s2;
    }
    debug_assert_eq!(r0, BigInt::one(), "C must be coprime to N");
    let mut inv = s0 % BigInt::from(m.clone());
    if inv.is_negative() {
        inv += BigInt::from(m.clone());
    }
    inv.to_biguint().expect("inverse fits in BigUint")
}

/// `a⁻¹ mod α^len` via Newton/Hensel lifting (extended-gcd on α^len is intractable at book size).
///
/// Requires `gcd(a, α) = 1`. Our scramble constant satisfies `C ≡ 1 (mod α)`.
fn mod_inverse_alpha_pow(a: &BigUint, alpha_len: u32, len: usize) -> BigUint {
    debug_assert!(len >= 1);
    debug_assert!((2..=4096).contains(&alpha_len));
    let alpha = BigUint::from(alpha_len);
    let mut i = mod_inverse(a, &alpha);
    let mut lifted = 1usize;
    while lifted < len {
        let next = lifted.saturating_mul(2).min(len);
        let m = modulus(alpha_len, next);
        let ai = (a * &i) % &m;
        let two = BigUint::from(2u32);
        let t = if two >= ai { two - ai } else { &m + two - ai };
        i = (&i * t) % &m;
        lifted = next;
    }
    debug_assert!({
        let n = modulus(alpha_len, len);
        (a * &i) % &n == BigUint::one()
    });
    i
}

/// `(C, I, N)` for a block of `len` symbols — cached (N = α^len is expensive).
pub(crate) fn scramble_params(
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
    len: usize,
) -> (BigUint, BigUint, BigUint) {
    type ScrambleKey = (u64, u32, u32, usize);
    type ScrambleTriple = (BigUint, BigUint, BigUint);
    static CACHE: OnceLock<Mutex<HashMap<ScrambleKey, ScrambleTriple>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    let key = (universe_seed, alphabet_id, alpha_len, len);
    if let Ok(guard) = cache.lock()
        && let Some(hit) = guard.get(&key)
    {
        return hit.clone();
    }
    // Default universe + Basile book map: load from the baked blob (no Hensel warm).
    let computed =
        if let Some(baked) = baked_book_scramble(universe_seed, alphabet_id, alpha_len, len) {
            baked
        } else {
            scramble_params_uncached(universe_seed, alphabet_id, alpha_len, len)
        };
    if let Ok(mut guard) = cache.lock() {
        guard.insert(key, computed.clone());
    }
    computed
}

fn scramble_params_uncached(
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
    len: usize,
) -> (BigUint, BigUint, BigUint) {
    // Full-book modulus is fine in release WASM; in `cargo test` (debug) it looks
    // "stuck" for minutes. Unit tests must use smaller `len` or avoid book Basile.
    assert!(
        !(cfg!(test) && len == BOOK_CONTENT_SYMBOLS),
        "test tried to scramble BOOK_CONTENT_SYMBOLS ({len}) — that hangs debug CI; \
         use a medium length or do not call book_symbols_at / invert_book / locate_page / book_image from unit tests"
    );
    let n = modulus(alpha_len, len);
    let mut h = blake3::Hasher::new();
    h.update(b"lob:basile:C");
    h.update(&GENERATOR_VERSION.to_le_bytes());
    h.update(&universe_seed.to_le_bytes());
    h.update(&alphabet_id.to_le_bytes());
    h.update(&alpha_len.to_le_bytes());
    h.update(&(len as u64).to_le_bytes());
    let digest = h.finalize();
    let mut expand = blake3::Hasher::new();
    expand.update(b"lob:basile:C:xof");
    expand.update(digest.as_bytes());
    let mut xof = expand.finalize_xof();
    let need = (n.bits() / 8).saturating_add(64) as usize;
    let mut buf = vec![0u8; need.max(64)];
    xof.fill(&mut buf);
    let mut h_int = BigUint::from_bytes_le(&buf);
    let n_div = &n / alpha_len;
    if n_div.is_zero() {
        h_int = BigUint::zero();
    } else {
        h_int %= &n_div;
    }
    let c = h_int * alpha_len + BigUint::one();
    let i = mod_inverse_alpha_pow(&c, alpha_len, len);
    (c, i, n)
}

const SCRAMBLE_BLOB_MAGIC: &[u8; 8] = b"LOBSCRv1";

/// Encode `(C, I, N)` for the book map into a portable LE blob (host gen tool).
#[must_use]
pub fn encode_book_scramble_blob(
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
    c: &BigUint,
    i: &BigUint,
    n: &BigUint,
) -> Vec<u8> {
    let c_b = c.to_bytes_le();
    let i_b = i.to_bytes_le();
    let n_b = n.to_bytes_le();
    let mut out = Vec::with_capacity(40 + c_b.len() + i_b.len() + n_b.len());
    out.extend_from_slice(SCRAMBLE_BLOB_MAGIC);
    out.extend_from_slice(&GENERATOR_VERSION.to_le_bytes());
    out.extend_from_slice(&universe_seed.to_le_bytes());
    out.extend_from_slice(&alphabet_id.to_le_bytes());
    out.extend_from_slice(&alpha_len.to_le_bytes());
    out.extend_from_slice(&(BOOK_CONTENT_SYMBOLS as u64).to_le_bytes());
    out.extend_from_slice(&(c_b.len() as u32).to_le_bytes());
    out.extend_from_slice(&(i_b.len() as u32).to_le_bytes());
    out.extend_from_slice(&(n_b.len() as u32).to_le_bytes());
    out.extend_from_slice(&c_b);
    out.extend_from_slice(&i_b);
    out.extend_from_slice(&n_b);
    out
}

/// Compute book-map `(C, I, N)` and encode (used by `gen_basile_scramble`).
///
/// # Panics
///
/// Same as uncached scramble for book length under `cfg(test)`.
#[must_use]
pub fn export_book_scramble_blob(universe_seed: u64, alphabet_id: u32, alpha_len: u32) -> Vec<u8> {
    let (c, i, n) =
        scramble_params_uncached(universe_seed, alphabet_id, alpha_len, BOOK_CONTENT_SYMBOLS);
    encode_book_scramble_blob(universe_seed, alphabet_id, alpha_len, &c, &i, &n)
}

#[cfg(not(test))]
fn decode_book_scramble_blob(
    bytes: &[u8],
) -> Option<(u64, u32, u32, usize, BigUint, BigUint, BigUint)> {
    if bytes.len() < 40 || &bytes[0..8] != SCRAMBLE_BLOB_MAGIC {
        return None;
    }
    let mut o = 8;
    let read_u32 = |buf: &[u8], o: &mut usize| -> Option<u32> {
        let v = u32::from_le_bytes(buf.get(*o..*o + 4)?.try_into().ok()?);
        *o += 4;
        Some(v)
    };
    let read_u64 = |buf: &[u8], o: &mut usize| -> Option<u64> {
        let v = u64::from_le_bytes(buf.get(*o..*o + 8)?.try_into().ok()?);
        *o += 8;
        Some(v)
    };
    let gen_ver = read_u32(bytes, &mut o)?;
    if gen_ver != GENERATOR_VERSION {
        return None;
    }
    let universe_seed = read_u64(bytes, &mut o)?;
    let alphabet_id = read_u32(bytes, &mut o)?;
    let alpha_len = read_u32(bytes, &mut o)?;
    let len = read_u64(bytes, &mut o)? as usize;
    let c_len = read_u32(bytes, &mut o)? as usize;
    let i_len = read_u32(bytes, &mut o)? as usize;
    let n_len = read_u32(bytes, &mut o)? as usize;
    if bytes.len() < o + c_len + i_len + n_len {
        return None;
    }
    let c = BigUint::from_bytes_le(&bytes[o..o + c_len]);
    o += c_len;
    let i = BigUint::from_bytes_le(&bytes[o..o + i_len]);
    o += i_len;
    let n = BigUint::from_bytes_le(&bytes[o..o + n_len]);
    Some((universe_seed, alphabet_id, alpha_len, len, c, i, n))
}

/// Baked default: universe `0` + Basile book map (`mise run gen-basile-scramble`).
#[cfg(not(test))]
static BAKED_DEFAULT_BOOK_SCRAMBLE: &[u8] =
    include_bytes!("../../data/basile_book_scramble_u0.bin");

fn baked_book_scramble(
    universe_seed: u64,
    alphabet_id: u32,
    alpha_len: u32,
    len: usize,
) -> Option<(BigUint, BigUint, BigUint)> {
    // Host unit tests never ship the multi‑MiB blob; WASM/release does.
    #[cfg(test)]
    {
        let _ = (universe_seed, alphabet_id, alpha_len, len);
        None
    }
    #[cfg(not(test))]
    {
        if len != BOOK_CONTENT_SYMBOLS {
            return None;
        }
        let (blob_universe, blob_alphabet, blob_alpha_len, blob_len, factor_c, inv, modulus) =
            decode_book_scramble_blob(BAKED_DEFAULT_BOOK_SCRAMBLE)?;
        if blob_universe == universe_seed
            && blob_alphabet == alphabet_id
            && blob_alpha_len == alpha_len
            && blob_len == len
        {
            Some((factor_c, inv, modulus))
        } else {
            None
        }
    }
}

/// Precompute and cache `(C, I, N)` for the full-book Basile map.
///
/// Default universe + Basile loads from the baked blob (instant). Other
/// `(universe, alphabet)` pairs still compute on demand (can take minutes).
pub fn warm_book_scramble(universe_seed: u64, alphabet_id: u32, alpha_len: u32) {
    let _ = scramble_params(universe_seed, alphabet_id, alpha_len, BOOK_CONTENT_SYMBOLS);
}
