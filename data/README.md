# data/

Committed artifacts the Rust core embeds or generates from.

| Path | What |
| --- | --- |
| [`alphabets/`](alphabets/) | Lens source packs (`.txt`) — see [`alphabets/README.md`](alphabets/README.md) |
| `basile_book_scramble_u0.bin` | Baked book-map scramble for **universe 0 + Basile** (~2.3 MiB) |

## `basile_book_scramble_u0.bin`

Opaque blob of the book-map bijection factors (C / I / N) for the default universe and
Basile alphabet. Release / WASM builds `include_bytes!` it so the first book-linked warm
does not recompute that ~megabit modulus work in the browser.

- **Do not hand-edit.** Regenerate only.
- **Regen:** `mise run gen-basile-scramble` (release binary; can take a few minutes).
- **Smoke check:** `cargo run --release --bin gen_basile_scramble -- --verify-warm`
- Host `cargo test` skips the blob (`cfg(test)`); WASM / normal builds load it.

Other universes / alphabets still compute scramble on demand when needed.
