//! `SplitMix64` mixer and deterministic symbol stream.

use crate::config::TITLE_LEN;

/// `SplitMix64` — small, fast, deterministic. Used as both mixer and PRNG step.
#[inline]
pub fn splitmix64(mut x: u64) -> u64 {
    x = x.wrapping_add(0x9E37_79B9_7F4A_7C15);
    let mut z = x;
    z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
    z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
    z ^ (z >> 31)
}

/// Combine two values into one seed deterministically.
#[inline]
pub fn mix2(a: u64, b: u64) -> u64 {
    splitmix64(a ^ splitmix64(b).wrapping_add(0x1234_5678_9ABC_DEF0))
}

/// A simple deterministic PRNG stream from a seed.
pub struct Prng(u64);

impl Prng {
    /// Seed the stream (mixed with a fixed constant).
    #[inline]
    pub fn new(seed: u64) -> Self {
        Prng(seed ^ 0xDEAD_BEEF_CAFE_F00D)
    }

    /// Next `u64` in the deterministic stream.
    #[inline]
    pub fn next_u64(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        splitmix64(self.0)
    }

    /// Draw one symbol from `alphabet`.
    #[inline]
    pub fn next_symbol<'a>(&mut self, alphabet: &[&'a str]) -> &'a str {
        alphabet[(self.next_u64() % alphabet.len() as u64) as usize]
    }
}

/// Deterministic spine title for a book seed (drawn from the given alphabet).
pub fn book_title(book_seed: u64, alphabet: &[&str]) -> String {
    let mut p = Prng::new(book_seed);
    let mut out = String::with_capacity(TITLE_LEN * 4);
    for _ in 0..TITLE_LEN {
        out.push_str(p.next_symbol(alphabet));
    }
    out.trim().to_string()
}
