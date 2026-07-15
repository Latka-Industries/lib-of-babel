# lib-of-babel

**A living, walkable Library of Babel.** Start in a random hexagonal gallery, read the
books, take a hallway or a staircase, and keep walking. Every gallery is generated
deterministically from its coordinate — infinite space, almost nothing stored. What you
keep is the **journey**: the path and a cryptographic fingerprint of each room.

![A grid of per-gallery sigils — generative emblems drawn deterministically from each gallery's hash](assets/sigils.svg)

<sub>Each gallery has a **sigil** from its room hash. Same coordinate + universe → same sigil (alphabet is a lens and does not change it). The 24 above are real default-universe galleries — see [`assets/sigils.json`](assets/sigils.json) (`node scripts/make-sigil-sheet.mjs` to redraw).</sub>

---

## Concept

Borges imagined **hexagonal galleries**: four walls of shelves, two open sides into a
vestibule with a spiral stair. So four moves from any room — two hallways, stairs up,
stairs down.

Canonical dimensions:

- 4 walls × 5 shelves × 35 books = **700 books per gallery**
- each book: **410 pages**, **40 lines/page**, **~80 chars/line**
- alphabet: **selectable lens** — Borges / Basile (default) / Basile++ / Basile# plus language presets ([full table](docs/alphabets.md)); same room hash/sigil, new spines and pages (*a new sort of translation*)
- universe: name a parallel infinite library (`""` = default); infinitely many, reproducible from the name

## Core design decisions

| Topic | Decision |
| --- | --- |
| **Topology** | `(z, n)` lattice. Hallways = `n ± 1`, stairs = `z ± 1`. |
| **Books** | 700 deterministic spines per gallery; full text **lazy** on open; text or colour page view. |
| **Determinism** | `(universe, z, n) → gallery_seed → 700 book_seeds → node_hash`; alphabet projects spines/pages. Nothing stored. |
| **Hashing** | BLAKE3-256 **room** fingerprint (universe, version, coordinate, book-slot seeds). Alphabet out of the digest. Footer shows a 64-bit prefix. |
| **Wanderings** | Last 500 steps in UI; full trail in IndexedDB (universe + lens frozen per visit). |
| **Alphabet** | View lens (`&a=` in permalinks). DE/NL lenses also switch UI locale. See [docs/alphabets.md](docs/alphabets.md). |
| **Colour map** | Glyphs → OKLCH: letters on an accent-seeded wheel, punct/digits muted opposite, space near-black. |
| **Universe** | Named seed (`""` = 0) as outermost axis; WASM global; `&u=` + exports. |
| **Permalinks** | `(z, n)` + optional `u` / `a` / `book` / `page` / `q`, with gallery hash as proof. |
| **Stack** | Rust → WASM core + static web frontend. |
| **Persistence** | IndexedDB trail; JSON export of path + per-node hashes. |

## The generation chain (never store text)

```text
(universe, z, n)              ──hash──▶  gallery_seed   (room identity)
gallery_seed + wall/shelf/i   ──hash──▶  book_seed
book_seed + page + alphabet   ──Feistel──▶  one page (3200 symbols; invertible)
410 pages                     ──join──▶  the full book
700 book-slot seeds           ─BLAKE3─▶  node_hash  (room fingerprint; alphabet-free)
```

Same inputs forever → same books. Open a book → generate → render → discard.

**The generator is the schema.** Alphabet, PRNG, hash, dimensions, and seeding order are
frozen and versioned. Exports stamp `generator_version`; a core change invalidates old proofs.

## What gets stored (it's tiny)

Per step ≈ **50 bytes** (`z`, `n`, `move`, `node_hash`). An hour of walking is ~180 KB;
a million steps ~50 MB. Text is never stored.

## Architecture

```text
lib-of-babel/
├── src/          Rust → WASM generator (config, Feistel, gallery, search, color, wasm_api)
├── web/          static UI (css/, js/, pkg/ from wasm-pack)
├── docs/         alphabet lens table and notes
└── .mise.toml    toolchain + build / serve / test tasks
```

Feistel page mapping is invertible, so **search-by-content** is the reverse of reading.

### WASM API (frontend ↔ core)

| Export | Purpose |
| --- | --- |
| `generator_version()` | Schema stamp for verify/export |
| `set_universe` / `get_universe` / `universe_seed_for` | Multiverse axis |
| `gallery_titles_json(z, n, a, title_embed)` | 700 spines; optional title-search embed |
| `node_hash_hex` / `node_hash_full_hex` | 64-bit prefix / full BLAKE3-256 |
| `page_text_for(…, search_query, search_start_page)` | One page (`-1` = no embed) |
| `locate_page_json` / `locate_title_json` | Reverse lookup → hit or validation errors |
| `search_page_span_for` / `search_page_embed_for` | Multi-page layout helpers |
| `book_text_for` / `book_image` | Full text or RGBA colour map |
| `neighbor_json(z, n, mv)` | Lattice step (0–3) |

## Search (`generator_version` 7)

**actions… → search…** — content or title, under the active alphabet and universe.

**Content:** validate → BLAKE3 to `(z, n, book, page)` → Basile-style embed (long phrases
span pages) → open. Up to one full book (~1.3M characters).

**Title:** same rules, max **24** characters → `(z, n, book)` → embed on the canonical
spine → jump and open at page 1.

```text
content:  phrase  ──validate──▶  flat  ──BLAKE3──▶  (z, n, book, page)  ──embed──▶  page text
title:    title   ──validate──▶  flat  ──BLAKE3──▶  (z, n, book)         ──embed──▶  spine
```

## Run it locally (dev)

[mise](https://mise.jdx.dev/) pins Rust + wasm-pack + uv (avoids Homebrew `rustc` shadowing rustup).

```bash
mise trust && mise install   # one-time
mise run dev                 # build wasm → web/pkg, then serve
```

Open <http://127.0.0.1:8777/index.html>.

| Task | What |
| --- | --- |
| `mise run build` / `dev-fast` | release / debug WASM |
| `mise run serve` | serve `web/` only |
| `mise run test` / `check` | tests / fmt+clippy+tests |
| `cargo doc --open` | Rust API docs |

Trail is IndexedDB (survives reload). **export** → JSON; **new walk** clears and restarts.

Permalinks: `z`, `n` required; optional `u`, `a`, `book`, `page`, `q`.

In-app guide: click **LIB·OF·BABEL**. UI: Overpass Mono chrome, Lato About prose; mobile
header sheet ≤860px; footer = wanderings + gallery/hash/steps. Theme toggle remembers
preference (OS default if unset).

## Inspiration

- [Jorge Luis Borges, “The Library of Babel” (1941)](https://en.wikipedia.org/wiki/The_Library_of_Babel)
- [Jonathan Basile, libraryofbabel.info](https://libraryofbabel.info/) — default Basile glyph set
- [Wikipedia: The Library of Babel](https://en.wikipedia.org/wiki/The_Library_of_Babel)

## To Do

- [x] Grapheme-cluster alphabet cells — fix dotted-circle combining marks
- [ ] Punct mode axis — optional punctuation richness as a second axis on every language lens
- [ ] Custom alphabet picker — user-defined glyph sets beyond the built-in registry
- [ ] More UI locale packs — es/fr/… beyond DE/NL
- [ ] Generative audio per gallery
- [ ] Colour-mosaic search — photo → alphabet mosaic → invert to book

## License

[GPLv3](LICENSE). © 2026 Alexander Hurowitz / Latka Industries.

Bundled fonts (Overpass Mono, Lato, Noto …) stay under the [SIL Open Font License](web/fonts/OFL.txt).
