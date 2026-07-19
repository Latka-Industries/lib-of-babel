//! Small shared helpers: `SplitMix64` PRNG + JSON string escaping.

use core::fmt::Write;

/// `SplitMix64` — small, fast, deterministic mixer.
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

/// Append `s` as a JSON string literal (quotes + escapes).
pub fn push_json_string(out: &mut String, s: &str) {
    out.push('"');
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

/// Incremental `{ "k": v, … }` writer — avoids duplicated `concat!` format templates.
pub struct JsonObject<'a> {
    out: &'a mut String,
    first: bool,
}

impl<'a> JsonObject<'a> {
    pub fn begin(out: &'a mut String) -> Self {
        out.push('{');
        Self { out, first: true }
    }

    fn key(&mut self, key: &str) {
        if !self.first {
            self.out.push(',');
        }
        self.first = false;
        self.out.push('"');
        self.out.push_str(key);
        self.out.push_str("\":");
    }

    pub fn f64(&mut self, key: &str, v: f64, prec: usize) {
        self.key(key);
        let _ = write!(self.out, "{v:.prec$}");
    }

    pub fn u32(&mut self, key: &str, v: u32) {
        self.key(key);
        let _ = write!(self.out, "{v}");
    }

    pub fn usize(&mut self, key: &str, v: usize) {
        self.key(key);
        let _ = write!(self.out, "{v}");
    }

    pub fn bool(&mut self, key: &str, v: bool) {
        self.key(key);
        self.out.push_str(if v { "true" } else { "false" });
    }

    /// JSON string value (escaped).
    pub fn str(&mut self, key: &str, v: &str) {
        self.key(key);
        push_json_string(self.out, v);
    }

    /// Unquoted JSON literal (e.g. `0`, `null`, already-built fragment).
    pub fn raw(&mut self, key: &str, literal: &str) {
        self.key(key);
        self.out.push_str(literal);
    }

    pub fn finish(self) {
        self.out.push('}');
    }
}
