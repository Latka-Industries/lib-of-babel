//! Active universe seed — global WASM state so JS call signatures stay coordinate-only.

use core::sync::atomic::{AtomicU64, Ordering};

static UNIVERSE: AtomicU64 = AtomicU64::new(0);

/// Current universe seed used by WASM exports (default `0`).
#[inline]
pub fn universe() -> u64 {
    UNIVERSE.load(Ordering::Relaxed)
}

/// Set the active universe for subsequent generator calls.
pub fn set_universe(universe_seed: u64) {
    UNIVERSE.store(universe_seed, Ordering::Relaxed);
}

/// Alias for [`universe`] — matches the WASM export name.
pub fn get_universe() -> u64 {
    universe()
}

/// Map a memorable universe name to a stable seed. Empty/whitespace → `0`.
pub fn universe_seed_for(name: &str) -> u64 {
    let t = name.trim();
    if t.is_empty() {
        return 0;
    }
    if let Some(hex) = t.strip_prefix("0x").or_else(|| t.strip_prefix("0X")) {
        if let Ok(v) = u64::from_str_radix(hex, 16) {
            return v;
        }
    }
    let b = blake3::hash(t.as_bytes());
    u64::from_be_bytes(b.as_bytes()[..8].try_into().unwrap())
}
