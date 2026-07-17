//! Generate the baked default book-map scramble blob (universe 0 + Basile).
//!
//! Run: `mise run gen-basile-scramble` (release — can take a few minutes).
//! Verify load path: `cargo run --release --bin gen_basile_scramble -- --verify-warm`

use std::env;
use std::fs;
use std::path::PathBuf;
use std::time::Instant;

use lib_of_babel::{DEFAULT_ALPHABET, alphabet, export_book_scramble_blob, warm_book_scramble};

fn main() {
    let alphabet_id = DEFAULT_ALPHABET;
    let alpha_len = u32::try_from(alphabet(alphabet_id).len()).expect("alphabet len fits u32");
    let universe_seed = 0u64;

    if env::args().any(|a| a == "--verify-warm") {
        eprintln!("warm_book_scramble (baked path if blob matches)…");
        let t0 = Instant::now();
        warm_book_scramble(universe_seed, alphabet_id, alpha_len);
        eprintln!("warm done in {:.3}s", t0.elapsed().as_secs_f64());
        return;
    }

    let out = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data/basile_book_scramble_u0.bin");

    eprintln!(
        "baking book scramble · universe={universe_seed} alphabet={alphabet_id} α={alpha_len} → {}",
        out.display()
    );
    let t0 = Instant::now();
    let blob = export_book_scramble_blob(universe_seed, alphabet_id, alpha_len);
    eprintln!(
        "done in {:.1}s · {} bytes ({:.2} MiB)",
        t0.elapsed().as_secs_f64(),
        blob.len(),
        blob.len() as f64 / (1024.0 * 1024.0)
    );
    if let Some(parent) = out.parent() {
        fs::create_dir_all(parent).expect("create data/");
    }
    fs::write(&out, &blob).expect("write scramble blob");
    eprintln!("wrote {}", out.display());
}
