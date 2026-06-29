# lib-of-babel

**A living, walkable Library of Babel.** Start in a random hexagonal gallery, read the
books on its shelves, choose a hallway or a staircase, and walk — forever. Every gallery
is generated deterministically from its coordinate, so the Library is infinite yet stores
almost nothing. Your **journey** is the only thing that is real enough to keep: the path
you walked and a cryptographic fingerprint of what each gallery held.

> The Library is eternal and complete; the librarian is mortal. What "lives" here is not
> the space — it is the traversal.

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

## Core design decisions

| Topic | Decision |
| --- | --- |
| **Topology** | `(z, n)` lattice. Hallways = `n ± 1`, staircase = `z ± 1`. Four moves per gallery. |
| **Books** | 700 deterministic spines/titles per gallery; full 410-page text generated **lazily** only when a book is opened. |
| **Determinism** | Content is a pure function of address. `(z,n) → gallery_seed → 700 book_seeds → text`. Nothing is stored. |
| **Hashing** | `node_hash` = fingerprint over the 700 book identities. A permalink / integrity proof, **not** a dedup key — the address already guarantees uniqueness. |
| **History** | Bounded **50-node window** (history popup, newest-first) + append-on-step trail so the full path survives. |
| **Alphabet** | Selectable (Borges 25 / Basile 29), folded into the gallery seed so each is a separate library. Carried in permalinks (`&a=`) and exports — a precursor of the multiverse `universe_seed`. |
| **Permalinks** | URL encodes `(z, n)` + alphabet (`a`) (+ optional `book`/`page`) with the gallery hash as a proof token; opening a link reproduces the exact view. |
| **Stack** | Rust → WebAssembly generator core + a static web frontend. |
| **Persistence** | Trail persisted to **IndexedDB**; export the **path** (addresses + moves) and **per-node hash** as JSON. Tessera `.tes` later. |

## The generation chain (never store text)

```text
(z, n)                        ──hash──▶  gallery_seed
gallery_seed + wall/shelf/i   ──hash──▶  book_seed
book_seed                     ──PRNG──▶  the 410 pages of one book
700 book identities           ──hash──▶  node_hash  (the gallery's fingerprint)
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
│   └── lib.rs           gallery seed, 700 book ids, lazy book text, node hash
├── web/                 static frontend: gallery + minimap, book reader, history, permalinks, export
│   ├── index.html       layout + styles
│   ├── main.js          the librarian: render, move, 50-node window, IndexedDB trail, URLs
│   └── pkg/             wasm-pack output (generated; gitignored)
└── .mise.toml           local-dev toolchain + tasks (build / serve / dev / test)
```

The core is intentionally written as a (future) **reversible mapping** between coordinate
space and content space, so a later **search-by-content** feature ("type a sentence, get
the coordinates where it already exists" — the famous libraryofbabel.info trick) drops in
without a rewrite.

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

The trail lives in the browser's IndexedDB (per-device), so it survives reloads. **export**
downloads it as JSON; **new walk** clears it and drops you somewhere random.

## Roadmap (mirrored as Linear issues)

**Shipped (v1):**

1. ✅ **Generator core (Rust→WASM)** — `(z,n)` → gallery seed → 700 book spines; lazy book text; node hash; frozen `generator_version`.
2. ✅ **The walk** — 4 walls / shelves / color-coded spines, four move controls, keyboard nav, random start.
3. ✅ **Open a book** — lazily generated 410-page text with prev/next/jump paging; "borrow book" `.txt` download.
4. ✅ **History + export** — 50-node window popup (newest-first, click to revisit), append-on-step trail in IndexedDB, JSON export.
5. ✅ **Orientation + sharing** — hexagon minimap previewing each exit's hash; URL permalinks for a gallery and an open book/page; copy-link and copy-hash.

**Later:**

6. **Living membrane** — persisted discovery log ("coral growth"), wear paths.
7. **Puzzle layer** — hash-rarity "treasure" galleries; rare coherent books.
8. **Reverse lookup** — search-by-content via the reversible mapping.
9. **Crypto fingerprint** — replace the 64-bit placeholder with BLAKE3 (256-bit); bump `generator_version`.
10. **Tessera export** — write the journey as a `.tes` document once Tessera ships.

Repo: <https://github.com/Latka-Industries/lib-of-babel>

## Relation to sibling projects

- **[Tessera](../tessera)** (`.tes`) — open document format; the planned home for exported journeys.
- **Tetration** (`.tet`) — numeric tensors; optional, only if we want per-gallery float fingerprints.

## License

Private / unpublished. © Latka Industries.
