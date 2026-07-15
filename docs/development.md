# Development

Build, serve, and talk to the WASM core. Concept and search live in [design.md](design.md);
alphabet ids in [alphabets.md](alphabets.md).

## Layout

```text
lib-of-babel/
├── src/          Rust → WASM generator
│                 (config, Feistel, gallery, page, search, color, universe, wasm_api)
├── web/          static UI (css/, js/, fonts/, pkg/ from wasm-pack)
├── docs/         design, development, alphabets
├── scripts/      size guards, sigil sheet helpers
└── .mise.toml    toolchain + build / serve / test tasks
```

## Run locally

[mise](https://mise.jdx.dev/) pins Rust + wasm-pack + uv (avoids Homebrew `rustc` shadowing rustup).

```bash
mise trust && mise install   # one-time
mise run dev                 # release build → web/pkg, then serve
```

Open <http://127.0.0.1:8777/index.html>.

| Task | What |
| --- | --- |
| `mise run build` | release WASM → `web/pkg` |
| `mise run build-dev` / `dev-fast` | debug WASM (faster iterate) / build-dev + serve |
| `mise run serve` | serve `web/` only (no rebuild) |
| `mise run test` | `cargo test` |
| `mise run check` | fmt + clippy (`-D warnings`) + tests + config-size guard |
| `mise run clean` | remove `target/` and `web/pkg` |

Trail is IndexedDB (survives reload). **export** → JSON; **new walk** clears and restarts.
Permalinks: `z`, `n` required; optional `u`, `a`, `book`, `page`, `q`.

## UI notes

- In-app guide: click **LIB·OF·BABEL**
- Chrome: Overpass Mono; About prose: Lato
- Mobile header sheet ≤860px; footer = wanderings + gallery/hash/steps
- Theme toggle remembers preference (OS default if unset)

## WASM API (frontend ↔ core)

Exports from `src/wasm_api.rs` (+ `book_image` in `src/color.rs`). Signatures abbreviated.

| Export | Purpose |
| --- | --- |
| `generator_version()` | Schema stamp for verify/export (currently **8**) |
| `books_per_gallery()` | Constant `700` |
| `default_alphabet()` | Default lens id (`29` = Basile) |
| `max_title_len()` | Spine title length cap (`24`) |
| `set_universe` / `get_universe` / `universe_seed_for` | Multiverse axis (`""` / blank → `0`) |
| `gallery_titles_json(z, n, a, title_embed)` | 700 spines; optional title-search embed |
| `node_hash_hex` / `node_hash_full_hex` | 64-bit prefix / full BLAKE3-256 |
| `page_text_for(…, search_query, search_start_page)` | One page (`search_start_page = -1` = no embed) |
| `locate_page_json` / `locate_title_json` | Reverse lookup → hit or validation errors |
| `search_page_span_for` / `search_page_embed_for` | Multi-page layout helpers |
| `book_text_for` / `book_image` | Full text or RGBA colour map |
| `neighbor_json(z, n, mv)` | Lattice step (`mv` 0–3) → `[z, n]` |
