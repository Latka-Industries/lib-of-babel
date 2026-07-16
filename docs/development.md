# Development

Build, serve, and talk to the WASM core. Concept and search live in [design.md](design.md);
alphabet ids in [alphabets.md](alphabets.md).

## Layout

```text
lib-of-babel/
├── src/          Rust → WASM generator
│                 (config, Feistel, gallery, page, search, color, mosaic/, universe, wasm_api)
├── web/
│   ├── css/      chrome + reader styles
│   ├── fonts/
│   ├── pkg/      wasm-pack output
│   ├── main.js   boot
│   └── js/       static ESM UI
│       ├── lib/      util, color, lattice, wasm, db, constants, i18n
│       ├── chrome/   controls, dropdown, theme, favicon, alphabet-picker
│       ├── gallery/  view, nav, state, url, sigil
│       ├── reader/   book, search, search-query, mosaic-search, verify
│       └── about/    About / Help guide
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
| `mise run check` | fmt + clippy (`-D warnings`) + tests + alphabet-pack drift |
| `mise run gen-alphabets` | regenerate Rust packs from `data/alphabets/*.txt` |
| `mise run check-alphabets` | fail if generated Rust packs drift from the `.txt` sources |
| `mise run clean` | remove `target/` and `web/pkg` |

Trail is IndexedDB (survives reload). **export** → JSON; **new walk** clears and restarts.
Permalinks: `z`, `n` required; optional `u`, `a`, `book`, `page`, `q`, `img=1`.
Shareable `&q=` is soft-capped; mosaic / full-book flats stay out of the URL.

## UI notes

- In-app guide: brand **LIB·OF·BABEL**, footer **? · Help**, or keyboard **?** (first visit opens About once)
- Header **actions…** and book **save…** are vanilla dropdowns (`web/js/chrome/dropdown.js`), not native `<select>`
- Search modes shipped in UI: **text** (content / title), **Babelgram** (exact-size stamped book-image PNG → locate)
- Photo→mosaic tab exists in code but is **off** (`PHOTO_SEARCH_TAB_ENABLED = false` in `web/js/reader/search.js`); core stays in `src/mosaic/`
- Lens registry for the UI lives in `web/js/lib/constants.js` (kept in sync with Rust via tests)
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
| `alphabet_symbols_json(a)` / `alphabet_len(a)` | Feistel cell list / count (UI cache) |
| `max_title_len()` | Spine title length cap (`24`) |
| `set_universe` / `get_universe` / `universe_seed_for` | Multiverse axis (`""` / blank → `0`) |
| `gallery_titles_json(z, n, a, title_embed)` | 700 spines; optional title-search embed |
| `node_hash_hex` / `node_hash_full_hex` | 64-bit prefix / full BLAKE3-256 |
| `page_text_for(…, search_query, search_start_page)` | One page (`search_start_page = -1` = no embed) |
| `locate_page_json` / `locate_title_json` | Reverse lookup → hit or validation errors |
| `search_page_span_for` / `search_page_embed_for` | Multi-page layout helpers |
| `book_text_for` / `book_image` / `book_image_search` / `book_image_dims` / `room_accent` | Full text, RGBA colour map (optionally with search embed), grid size, or origin-room OKLCH knobs |
| `mosaic_project` / `mosaic_flat_for` / `mosaic_candidates_json` / `mosaic_babel_json` | Photo→palette preview / flat / candidate packs (photo UI gated off); exact Babelgram locate |
| `neighbor_json(z, n, mv)` | Lattice step (`mv` 0–3) → `[z, n]` |
