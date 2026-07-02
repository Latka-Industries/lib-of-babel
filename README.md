# lib-of-babel

**A living, walkable Library of Babel.** Start in a random hexagonal gallery, read the
books on its shelves, choose a hallway or a staircase, and walk forever. Every gallery
is generated deterministically from its coordinate, so the Library is infinite yet stores
almost nothing. Your **journey** is the only thing that is real enough to keep: the path
you walked and a cryptographic fingerprint of what each gallery held.

![A grid of per-gallery sigils — generative emblems drawn deterministically from each gallery's hash](assets/sigils.svg)

<sub>Each gallery has a **sigil**: a strange star-polygon emblem derived from its hash. Same coordinate + universe + alphabet → same sigil, forever. The 24 above are **real galleries** in the default universe — their coordinates, hashes, and permalinks are recorded in [`assets/sigils.json`](assets/sigils.json) (redraw with `node scripts/make-sigil-sheet.mjs`).</sub>

---

## Concept

Borges' Library is an indefinite number of **hexagonal galleries**. Each hexagon has six
sides: **four walls of bookshelves**, and **two opposite open sides** that lead into a
**hallway/vestibule** containing a **spiral staircase** running up and down. So from any
gallery you have **four moves**: two horizontal hallways, plus stairs up and stairs down.

Canonical dimensions we honor:

- 4 walls × 5 shelves × 35 books = **700 books per gallery**
- each book: **410 pages**, **40 lines/page**, **~80 chars/line**
- alphabet: **selectable** — Borges' **25** (22 letters `a–v` + space, comma, period) or Basile-style **29** (`a–z` + space, comma, period); default 29. The alphabet is **an axis of the universe** (folded into the seed), so each choice is a *distinct* library with its own text and fingerprints.
- universe: **the outermost axis** — name a `universe` and you cross into an entirely separate infinite library (same rooms, wholly different books). Blank = the **default** universe. There are infinitely many, each reproducible from its name: a **multiverse**.

## Core design decisions

| Topic | Decision |
| --- | --- |
| **Topology** | `(z, n)` lattice. Hallways = `n ± 1`, staircase = `z ± 1`. Four moves per gallery. |
| **Books** | 700 deterministic spines/titles per gallery; full 410-page text generated **lazily** only when a book is opened; per-page **text** or **colour** view in the reader. |
| **Determinism** | Content is a pure function of address. `(universe, z, n, alphabet) → gallery_seed → 700 book_seeds → text`. Nothing is stored. |
| **Hashing** | `node_hash` = **BLAKE3-256** over the canonical book identities (+ universe, version, alphabet, coordinate). The header shows the 64-bit prefix; the full 256-bit value is exposed for exports/proofs. A permalink / integrity proof, **not** a dedup key. |
| **History** | Bounded **50-node window** (history popup, newest-first) + append-on-step trail so the full path survives. |
| **Alphabet** | Selectable (Borges 25 / Basile 29), folded into the gallery seed so each is a separate library. Carried in permalinks (`&a=`) and exports. |
| **Universe** | A named seed (`""` = default / seed 0) folded into the gallery seed as the outermost axis → infinitely many parallel libraries. Set once as WASM global state; carried in permalinks (`&u=`) and exports. Names map to seeds via BLAKE3 so the mapping has one source of truth. |
| **Permalinks** | URL encodes `(z, n)` + universe (`u`, omitted when default) + alphabet (`a`) (+ optional `book`/`page`) with the gallery hash as a proof token; opening a link reproduces the exact view. |
| **Stack** | Rust → WebAssembly generator core + a static web frontend. |
| **Persistence** | Trail persisted to **IndexedDB**; export the **path** (addresses + moves) and **per-node hash** as JSON. Tessera `.tes` later. |

## The generation chain (never store text)

```text
(universe, z, n, alphabet)    ──hash──▶  gallery_seed
gallery_seed + wall/shelf/i   ──hash──▶  book_seed
book_seed + page              ──Feistel──▶  one page (3200 symbols; invertible)
410 pages                     ──join──▶  the full book
700 book identities           ─BLAKE3─▶  node_hash  (the gallery's 256-bit fingerprint)
```

Visit `(z, n)` today, next year, or from another machine → identical seed → identical
books, character for character. Open a book → generate on the fly → render → discard.

**The generator is the schema.** Alphabet, PRNG, hash function, page dimensions, and
seeding order must be **frozen and versioned**. Every export stamps a `generator_version`;
changing the core function invalidates previously exported paths/hashes.

## What gets stored (it's tiny)

Per step: `z` (8B) + `n` (8B) + `move` (1B) + `node_hash` (≤32B) ≈ **~50 bytes**. At human
pace (~1 gallery/sec) an hour of wandering is ~180 KB; a million steps is ~50 MB. The text
is never stored because it is always regenerable.

## Architecture

```text
lib-of-babel/
├── src/                 Rust → WASM generator core (deterministic, reversible-by-design)
│   ├── lib.rs           crate root, re-exports, integration tests
│   ├── config.rs        frozen dimensions, alphabets, GENERATOR_VERSION
│   ├── prng.rs          SplitMix64 mixer + deterministic title stream
│   ├── universe.rs      active universe seed (WASM global state)
│   ├── gallery.rs       gallery/book seeds, titles, BLAKE3 fingerprint, lattice moves
│   ├── feistel.rs       reversible page PRP + address embedding
│   ├── page.rs          lazy page/book text generation + search embed
│   ├── search.rs        reverse lookup, validation, multi-page span planning
│   ├── color.rs         whole-book RGBA preview image
│   └── wasm_api.rs      wasm-bindgen JSON/string exports for the frontend
├── web/                 static frontend: gallery + minimap + sigil, book reader, history, permalinks, export, verifier
│   ├── index.html       layout + styles
│   ├── main.js          boot + event wiring (the controller)
│   ├── js/              ES modules: constants · wasm · util · db · state · url · book · view · nav · verify · sigil · search
│   └── pkg/             wasm-pack output (generated; gitignored)
└── .mise.toml           local-dev toolchain + tasks (build / serve / dev / test)
```

The core is a **reversible mapping** between coordinate space and page content:
a Feistel permutation over each page's 3200 symbols, so **search-by-content**
(`text → coordinates`) is the inverse of reading (`coordinates → text`).

### WASM API (frontend ↔ core)

| Export | Purpose |
| --- | --- |
| `generator_version()` | Schema stamp — must match on verify/export |
| `set_universe` / `get_universe` / `universe_seed_for` | Multiverse axis |
| `gallery_titles_json(z, n, a, title_embed)` | 700 spine titles; optional embed flat string for title-search hits |
| `node_hash_hex` / `node_hash_full_hex` | 64-bit prefix / full BLAKE3-256 fingerprint |
| `page_text_for(…, search_query, search_start_page)` | One page; pass `-1` for no search embed |
| `locate_page_json(text, a)` | Reverse lookup (page content) → JSON hit or validation errors |
| `locate_title_json(text, a)` | Reverse lookup (spine title, max 24 chars) → JSON hit or validation errors |
| `search_page_span_for` / `search_page_embed_for` | Multi-page layout helpers |
| `book_text_for` / `book_image` | Full book text or RGBA colour map |
| `neighbor_json(z, n, mv)` | Lattice step (0=left, 1=right, 2=up, 3=down) |

## Search (`generator_version` 6)

**actions… → search…** opens a dialog with a **content / title** dropdown. Both modes use the alphabet selected in the header and stay in the universe you are standing in (no auto-hop to another library).

### Search by content

Paste a phrase in the **Search** modal ( **content** selected) → the core finds where it *already lives* in the current universe.

**How it works:**

1. **Validate** — only characters in the active alphabet are allowed (Borges `a–v` or Basile `a–z`, plus space, comma, period). Invalid characters are highlighted in red; there is no auto-sanitize.
2. **Hash → address** — the normalized flat phrase is BLAKE3-hashed with universe + alphabet + version to get `(z, n, book, page)`.
3. **Embed** — the phrase is written into the generated page text at a deterministic offset (Basile-style: real surrounding text, not a padded overlay). Phrases longer than one page span consecutive pages contiguously: page 0 from the computed offset, continuation pages from column 0.
4. **Go there** — opens the book at the hit; permalink encodes coordinates + book/page + `q=` for the phrase.

**Limits:** up to one full book (~1.3M characters); must fit in the remaining pages of the resolved book. Multi-page hits show `page … page_end` in the result panel.

### Search by title

Choose **title** in the same dialog. Type a spine label (up to **24 characters**, same alphabet rules).

1. **Validate** — same alphabet rules as content search.
2. **Hash → address** — normalized title → `(z, n, book)` in the current universe.
3. **Embed** — the title is written onto the canonical spine for that book in the gallery (passed to `gallery_titles_json` as an embed string).
4. **Go there** — jumps to the gallery and opens the book at page 1 with the searched title on the spine.

```text
content:  user phrase  ──validate──▶  flat text  ──BLAKE3──▶  (z, n, book, page)  ──embed──▶  page text
title:    user title   ──validate──▶  flat text  ──BLAKE3──▶  (z, n, book)         ──embed──▶  spine label
```

## Run it locally (dev)

Tooling is managed by [mise](https://mise.jdx.dev/) (Rust + wasm-pack + uv). Activating it
puts its shims first on `PATH`, which sidesteps a Homebrew `rustc` shadowing rustup (the
`wasm32` target lives in the rustup toolchain, pinned by `rust-toolchain.toml`).

```bash
mise trust && mise install   # one-time: install the pinned toolchain
mise run dev                 # build the wasm core into web/pkg, then serve
```

Then open <http://127.0.0.1:8777/index.html>.

Other tasks:

- `mise run build` — release WASM build into `web/pkg`
- `mise run dev-fast` — faster debug build, then serve
- `mise run serve` — just serve `web/` (after a build); keeps running until you stop it
- `mise run test` — host unit tests (`cargo test`)
- `mise run check` — fmt + clippy + tests
- `cargo doc --open` — Rust API docs (host build; WASM-only items are still documented)

The trail lives in the browser's IndexedDB (per-device), so it survives reloads. **export**
downloads it as JSON; **new walk** clears it and drops you somewhere random.

**Permalink query params:** `z`, `n` (required), optional `u` (universe name), `a` (alphabet id: 25 or 29), `book`, `page`, and `q` (search phrase when opened via content search).

Click **LIB·OF·BABEL** in the header for a tabbed in-app guide (overview, wander, books, more).

## Roadmap (mirrored as Linear issues)

**Shipped (v1):**

1. ✅ **Generator core (Rust→WASM)** — `(z,n)` → gallery seed → 700 book spines; lazy book text; node hash; frozen `generator_version`.
2. ✅ **The walk** — 4 walls / shelves / color-coded spines, four move controls, keyboard nav, random start.
3. ✅ **Open a book** — lazily generated 410-page text with prev/next/jump paging; "borrow book" `.txt` download.
4. ✅ **History + export** — 50-node window popup (newest-first, click to revisit), append-on-step trail in IndexedDB, JSON export.
5. ✅ **Orientation + sharing** — hexagon minimap previewing each exit's hash; URL permalinks for a gallery and an open book/page; copy-link and copy-hash.
6. ✅ **Alphabets** — selectable Borges 25 / Basile 29, folded into the seed; carried in permalinks (`&a=`) and exports.

**v2 — the multiverse:**

7. ✅ **BLAKE3 fingerprint** — `node_hash` is now BLAKE3-256 over the canonical book identities; 64-bit prefix shown, full 256-bit exposed for proofs.
8. ✅ **Multiverse** — named `universe` seed as the outermost axis → infinitely many parallel libraries; permalinks (`&u=`), export, persistence.
9. ✅ **Journey verifier** — import an exported path, re-walk it in WASM, and prove every hash (rejects tampering, wrong universe, or wrong `generator_version`).
10. ✅ **Per-gallery sigil** — a generative emblem (irregular star-polygon glyph) drawn deterministically from the gallery hash; shown in the "you are here" panel, click to download the SVG.
11. ✅ **Reverse lookup** — search-by-content via Feistel page mapping + Basile-style embed (`generator_version` 6). Paste a phrase → coordinates + deep-link; multi-page phrases, universe-scoped, strict alphabet validation.
12. ✅ **Search by title** — same search dialog with a content/title dropdown; up to 24 characters; embeds the title on the canonical spine and jumps to `(z, n, book)`.
13. **Custom / multi-language alphabets** — European, then non-Latin & complex scripts.

**Later:**

- **Living membrane** — persisted discovery log ("coral growth"), wear paths.
- **Tessera export** — write the journey as a `.tes` document once Tessera ships.
- **Generative audio** per gallery (deferred).

Repo: <https://github.com/Latka-Industries/lib-of-babel>

## Relation to sibling projects

- **[Tessera](../tessera)** (`.tes`) — open document format; the planned home for exported journeys.
- **Tetration** (`.tet`) — numeric tensors; optional, only if we want per-gallery float fingerprints.

## License

Private / unpublished. © Latka Industries.
