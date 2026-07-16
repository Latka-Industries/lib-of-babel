# Development

Build, serve, and talk to the WASM core. Concept and search live in [design.md](design.md);
alphabet ids in [alphabets.md](alphabets.md).

## Layout

```text
lib-of-babel/
├── src/          Rust → WASM generator
│                 (config, basile, gallery, page, search, color, mosaic/, universe, wasm_api)
├── web/
│   ├── css/      chrome + reader styles
│   ├── fonts/
│   ├── pkg/      wasm-pack output
│   ├── main.js   boot
│   └── js/       static ESM UI
│       ├── lib/      util, color, lattice, wasm, db, constants, i18n
│       ├── chrome/   controls, dropdown, theme, favicon, alphabet-picker
│       ├── gallery/  view, nav, state, url, sigil, migrate
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
Universe renames / dice rolls at the same `(z, n)` append a wander step (`◇`).
Permalinks: room links need `z`/`n` (compact `c…` encoding when huge) plus optional
`u`, `a`, `book`, `page`, `img=1`, `gv`. Search shares use `#q=&find=content|title`
(boot re-locates; no huge coords in the hash). Shareable `&q=` is soft-capped;
mosaic / full-book flats stay out of the URL. Photo / Babelgram **go there** and
**copy link** prefer short same-browser `&bo=` (IndexedDB: Basile coords + optional
RGBA cache so open skips virgin `book_image`). Other-universe Babelgram **go there**
may also add short-lived `&be=` for the print flat. Param order puts `bo` / `img` /
`b` before huge `z`/`n` so truncation still opens the book. Legacy / missing `gv`
opens the migrate modal.

## UI notes

- In-app guide: brand **LIB·OF·BABEL**, footer **? · Help**, or keyboard **?** (first visit opens About once)
- About tabs: **overview → wander → alphabets → books → search → more**. Wander deep-links via accent chips (**ALPHABETS** / **BOOKS** / **SEARCH**). Control names in the prose use panel chips (`.ui`).
- Header **actions…** and book **save…** are vanilla dropdowns (`web/js/chrome/dropdown.js`), not native `<select>`
- Search modes shipped in UI: **text** (content / title), **photo** (alphabet mosaic ranked by rms / mae / corr; letters or luma ramp), **Babelgram** (exact-size stamped book-image PNG → locate; metrics + **go there** / copy link)
- Photo tab flag: `PHOTO_SEARCH_TAB_ENABLED` in `web/js/reader/search.js` (on)
- Lens registry for the UI lives in `web/js/lib/constants.js` (kept in sync with Rust via tests)
- Chrome: Overpass Mono; About prose: Lato
- Mobile header sheet ≤860px; footer = wanderings (last 1000) + gallery/hash/steps
- Theme toggle remembers preference (OS default if unset)

## WASM API (frontend ↔ core)

Exports from `src/wasm_api.rs` (+ `book_image` in `src/color.rs`). Signatures abbreviated.

| Export | Purpose |
| --- | --- |
| `generator_version()` | Schema stamp for verify/export/permalinks (currently **9**) |
| `books_per_gallery()` | Constant `700` |
| `default_alphabet()` | Default lens id (`29` = Basile) |
| `alphabet_symbols_json(a)` / `alphabet_len(a)` | Alphabet cell list / count (UI cache) |
| `max_title_len()` | Spine title length cap (`24`) |
| `set_universe` / `get_universe` / `universe_seed_for` | Multiverse axis (`""` / blank → `0`) |
| `gallery_titles_json(z, n, a, title_embed)` | 700 spines (virgin Basile titles; `title_embed` ignored) |
| `node_hash_hex` / `node_hash_full_hex` | 64-bit prefix / full BLAKE3-256 |
| `page_text_for(…, search_query, search_start_page)` | One virgin page (`search_*` args ignored; highlight is UI-only) |
| `locate_page_json` / `locate_title_json` | Reverse lookup → hit or validation errors |
| `search_page_span_for` / `search_page_embed_for` | Multi-page highlight helpers |
| `book_text_for` / `book_image` / `book_image_search` / `book_image_dims` / `room_accent` | Full text, RGBA colour map (search flat ignored), grid size, or origin-room OKLCH knobs |
| `mosaic_project` / `mosaic_project_preview` / `mosaic_flat_for` / `mosaic_candidate_packs_json` / `mosaic_candidate_eval_json` / `mosaic_babel_json` | Full / downsampled preview; flat; chunked candidate packs + eval (rms/mae/corr); exact Babelgram locate (`BabelLocateResult`) |
| `neighbor_json(z, n, mv)` | Lattice step (`mv` 0–3) → `[z, n]` |
