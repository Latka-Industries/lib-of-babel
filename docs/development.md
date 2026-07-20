# Development

Build, serve, and talk to the WASM core. Concept and search live in [design.md](design.md);
alphabet ids in [alphabets.md](alphabets.md).

## Layout

```text
lib-of-babel/
├── src/          Rust → WASM generator
│                 (config, basile, gallery, page, search, color, mosaic/, universe, wasm_api)
├── web/
│   ├── assets/   favicon + OG share cards (svg sources + png)
│   ├── health.json  deploy stamp (gitignored; CI / mise run health)
│   ├── css/      chrome + reader styles
│   ├── fonts/
│   ├── pkg/      wasm-pack output
│   ├── asset-sheet/  dev UI inventory (index + sections + paint; stripped from Pages)
│   ├── main.js   boot
│   └── js/       static ESM UI
│       ├── lib/      util, color, lattice, wasm, db, constants, i18n
│       ├── chrome/   controls, dropdown, theme, favicon, alphabet-picker, loading-wave
│       ├── gallery/  view, nav, state, url, sigil, migrate
│       ├── reader/   book, search, search-query, mosaic-search, book-handoff, verify
│       └── about/    About / Help guide
├── docs/         design, development, alphabets
├── data/         alphabet packs + baked Basile scramble blob — see [data/README.md](../data/README.md)
├── scripts/      size guards, sigil sheet, OG share cards (`make-og.mjs`)
└── .mise.toml    toolchain + build / serve / test tasks
```

## Run locally

[mise](https://mise.jdx.dev/) pins Rust + wasm-pack + uv (avoids Homebrew `rustc` shadowing rustup).

```bash
mise trust && mise install   # one-time
mise run dev                 # release build → web/pkg, then serve
```

Open <http://127.0.0.1:8777/index.html>.

| Task                              | What                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `mise run build`                  | release WASM → `web/pkg`                                                                                       |
| `mise run build-dev` / `dev-fast` | debug WASM (faster iterate) / build-dev + serve                                                                |
| `mise run serve`                  | serve `web/` only (no rebuild)                                                                                 |
| `mise run test`                   | `cargo test`                                                                                                   |
| `mise run test-js`                | Node checks: `png-babel` stamp round-trip + page-scope fold                                                    |
| `mise run check`                  | fmt + clippy (`-D warnings`) + tests + JS helpers + alphabet-pack drift + baked scramble warm                  |
| `mise run gen-alphabets`          | regenerate Rust packs from `data/alphabets/*.txt`                                                              |
| `mise run check-alphabets`        | fail if generated Rust packs drift from the `.txt` sources                                                     |
| `mise run gen-basile-scramble`    | bake `data/basile_book_scramble_u0.bin` (universe 0 + Basile; slow once) — [data/README.md](../data/README.md) |
| `mise run verify-basile-scramble` | warm via baked blob (`--verify-warm`; fails if slow / missing)                                                 |
| `mise run asset-sheet`            | prints URL for `web/asset-sheet/` (dev UI inventory via `mise run serve`; stripped from Pages)                 |
| `mise run health`                 | write `web/health.json` (local stamp; production one is written in the Deploy workflow)                        |
| `mise run clean`                  | remove `target/` and `web/pkg`                                                                                 |

Trail is IndexedDB (survives reload). **export** → JSON; **new walk** clears and restarts.
Universe renames / dice rolls at the same `(z, n)` append a wander step (`◇`).
Permalinks: room links need `z`/`n` (compact `c…` encoding when huge) plus optional
`u`, `a`, `book`, `page`, `img=1`, `gv`. Page-band text shares use `#q=&find=content|title`
(boot re-locates; no huge coords in the hash). Shareable `&q=` is soft-capped;
mosaic / full-book flats stay out of the URL. Photo / whole-book text / Babelgram
**go there** and **copy link** prefer short same-browser `&bo=` (IndexedDB: Basile coords +
optional RGBA cache + letter `flat` so open/save can seal without re-projecting; text book
go opens a new tab). That handoff is local to this browser — not a shareable Mbit URL;
cross-device reopen is Babelgram verify. Babelgram go/copy run only after stamp verify
(or legacy unsealed v1/v2). Other-universe Babelgram **go there** may also add short-lived
`&be=` for the print flat. Param order puts `bo` / `img` / `b` before huge `z`/`n` so
truncation still opens the book. Legacy / missing `gv` opens the migrate modal.

## UI notes

- In-app guide: brand **LIB·OF·BABEL**, footer **? · Help**, or keyboard **?** (first visit opens About once)
- About tabs: **overview → wander → engines → scale → alphabets → books → search → url → more** (engines hosts dual maps + Mbit UI; **scale** is the band table). Wander deep-links via accent chips (**ALPHABETS** / **BOOKS** / **SEARCH** / **URL** / **SCALE**). Control names use panel chips (`.ui`); search/dialog tab names use `.ui.ui-tab` (caps); About section jumpers stay `button.about-goto-tab`. Megabit as a unit in body/HTML copy uses `.unit-mbit` (sharp uppercase chip); section titles stay plain `MBIT` / `MBIT range`. Footer/tooltips stay plain text (`≈6.4 Mbit`) because they use `title` / `textContent`. The asset sheet discovers tokens + chip kinds from CSS / locale recipes.
- Mbit rooms: footer `12345…67890`; hover = scientific + bit width; click **gallery (z, n)** → notice with Axes + Digits + **Jump to nearest page-scope** (also under the minimap when in Mbit). About → scale table **Comparison** column is analogy only (not “digit count equals book length”). Scalar cells show `≈N` + `.unit-mbit` then `10^…` on a second line.
- Search → photo / Babelgram: stamped PNG on the photo upload auto-switches to the Babelgram tab; each tab keeps its own upload slot so a Babelgram never becomes the photo Find input.
- Link previews (GitHub Pages): static Open Graph / Twitter meta in `web/index.html`. Two canvases from `node scripts/make-og.mjs` (needs ImageMagick) into `web/assets/`: **`og.png`** — sigil fills the frame (Open Graph / Slack / iMessage thumbnails); **`og-large.png`** — sigil + wordmark + tagline (`twitter:image`). Crawlers do not pick by preview size; this is a platform split, not responsive media.
- Deploy health: CI runs `node scripts/write-health.mjs` → `web/health.json` (`ok`, `sha`, `ref`, `built_at`, `generator_version`). Check: `curl -sS https://lib-of-babel.xyz/health.json` (local: `mise run health` then curl `http://127.0.0.1:8777/health.json`).
- Header **actions…** and book **save…** are vanilla dropdowns (`web/js/chrome/dropdown.js`), not native `<select>`
- Search modes shipped in UI: **text** (content ≤ one page / 3200 cells **or** whole-book book-map when longer; title ≤ 24), **photo** (alphabet mosaic ranked by rms / mae / corr; glyph palette; this-gallery + hit-gallery palette strips), **Babelgram** (exact-size stamped book-image PNG → verify seal+hash → locate; metrics + **go there** / copy link gated on verify)
- Whole-book text locate: WASM `locate_book_json` off the UI thread (`mosaic-find-pool` / worker); UI in `search.js`; `#bo=` via `book-handoff.js` (`bookOpenHandoffUrl`). Babelgram from that hit paints `contentFlat` with `book_image_from_flat` (`book.js`)
- Babelgram stamp/verify: `web/js/lib/png-babel.js` (`lob:babel` v3 `seal` + `h`); save seals from on-screen pixels + current room accent (`book.js`); locate/UI in `mosaic-search.js`. Book-scope Find auto-applies stamp universe when the session differs (`search.babel.universeShifted`). Go/copy stash letter `flat` in `&bo=` (and `&be=` cross-universe page-scope rematch). Compact axes shorten in download filenames (`c…`). Round-trip: `node scripts/test-png-babel.mjs`
- Mbit → page-scope escape: `foldToPageScopeCoord` in `web/js/lib/coords.js` (deterministic low i64 bits); UI in Mbit notice + minimap. Unit check: `node scripts/test-fold-page-scope.mjs` (also `mise run test-js`)
- Virgin `book_image` (wander): **page-linked** paint — worker page-range strips are fine again. Search → photo proof uses book-linked paint inside `mosaic_find_book`.
- Search → photo: WASM `mosaic_find_book` off the UI thread (`mosaic-find-worker.js` + pool; main-thread fallback) — letter mosaic → book-linked invert → book-scope virgin RGBA; handoff stores compact `c…` coords + `scope=book`
- Dev asset sheet: `web/asset-sheet/` (`mise run asset-sheet` → `/asset-sheet/`); section HTML partials + `js/paint.js` (find / Babelgram shift sample, full LIB·OF·BABEL guide, dialogs, mbit); sections dropdown from `SHEET_NAV` in `boot.js`; WASM init for alphabet glyphs; stripped from Pages (`rm -rf web/asset-sheet`)
- About → **more**: GitHub + `mailto:tlon@lib-of-babel.xyz` icon row (`.about-links`)
- Photo tab flag: `PHOTO_SEARCH_TAB_ENABLED` in `web/js/reader/search.js` (on)
- Lens registry for the UI lives in `web/js/lib/constants.js` (kept in sync with Rust via tests)
- Chrome: Overpass Mono; About prose: Lato
- Mobile header sheet ≤860px; footer = wanderings (last 1000) + gallery/hash/steps
- Theme toggle remembers preference (OS default if unset)

## WASM API (frontend ↔ core)

Exports from `src/wasm_api.rs` (+ `book_image` in `src/color.rs`). Signatures abbreviated.

| Export                                                                                                               | Purpose                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `generator_version()`                                                                                                | Schema stamp for verify/export/permalinks (currently **11** — dual bijection scopes) |
| `books_per_gallery()`                                                                                                | Constant `700`                                                                       |
| `default_alphabet()`                                                                                                 | Default lens id (`29` = Basile)                                                      |
| `alphabet_symbols_json(a)` / `alphabet_len(a)`                                                                       | Alphabet cell list / count (UI cache)                                                |
| `max_title_len()`                                                                                                    | Spine title length cap (`24`)                                                        |
| `set_universe` / `get_universe` / `universe_seed_for`                                                                | Multiverse axis (`""` / blank → `0`)                                                 |
| `gallery_titles_json(z, n, a, title_embed)`                                                                          | 700 spines (`z`/`n` decimal or compact `c…`)                                         |
| `node_hash_hex` / `node_hash_full_hex`                                                                               | 64-bit prefix / full BLAKE3-256                                                      |
| `page_text_for` / `page_text_book_scope_for`                                                                         | Page-linked / book-linked virgin page                                                |
| `locate_page_json` / `locate_title_json`                                                                             | Page-linked content locate (max one page) / title locate (`scope` in JSON)           |
| `search_page_span_for` / `search_page_embed_for`                                                                     | Highlight helpers (content locate itself is one page)                                |
| `book_text_for` / `book_text_book_scope_for` / `book_image` / `book_image_pages` / `book_image_dims` / `room_accent` | Page-linked full text; book-linked full text; page-linked RGBA; strips; grid; accent |
| `mosaic_find_book` / `mosaic_babel_json` / other `mosaic_*`                                                          | Book-linked Find; Babelgram locate; project/preview/packs                            |
| `neighbor_json(z, n, mv)`                                                                                            | Lattice step (`mv` 0–3) → `[z, n]`                                                   |
