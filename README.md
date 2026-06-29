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
- alphabet: **25 symbols** (22 letters + space, comma, period)

## Core design decisions

| Topic | Decision |
| --- | --- |
| **Topology** | `(z, n)` lattice. Hallways = `n ± 1`, staircase = `z ± 1`. Four moves per gallery. |
| **Books** | 700 deterministic spines/titles per gallery; full 410-page text generated **lazily** only when a book is opened. |
| **Determinism** | Content is a pure function of address. `(z,n) → gallery_seed → 700 book_seeds → text`. Nothing is stored. |
| **Hashing** | `node_hash` = fingerprint over the 700 book identities. A permalink / integrity proof, **not** a dedup key — the address already guarantees uniqueness. |
| **History** | Bounded ring buffer for the live breadcrumb + append-on-step export log so the full path survives. |
| **Stack** | Rust → WebAssembly generator core + a static web frontend. |
| **Persistence** | Export the **path** (addresses + moves) and **per-node hash**. JSON first; Tessera `.tes` later. |

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
├── web/                 static frontend: render gallery, walk hallways, history, export
├── scripts/
│   └── check-config-sizes.sh   supply-chain guard: caps toolchain config file sizes
└── .github/workflows/
    └── config-integrity.yml    CI runs the config-size guard on every push/PR
```

The core is intentionally written as a (future) **reversible mapping** between coordinate
space and content space, so a later **search-by-content** feature ("type a sentence, get
the coordinates where it already exists" — the famous libraryofbabel.info trick) drops in
without a rewrite.

## Roadmap (mirrored as Linear issues)

1. **Generator core (Rust→WASM)** — `(z,n)` → gallery seed → 700 book spines; lazy book text; node hash. Frozen `generator_version`.
2. **Web frontend — the walk** — render a gallery (4 walls / shelves / spines), four move controls, random start.
3. **Open a book** — lazily generate and render a book's pages from its seed.
4. **History + export** — bounded breadcrumb ring buffer; append-on-step path log; export JSON (`{ generator_version, steps: [{z,n,move,node_hash}] }`).
5. **Living membrane (later)** — persisted discovery log ("coral growth"), wear paths.
6. **Puzzle layer (later)** — hash-rarity "treasure" galleries; rare coherent books.
7. **Reverse lookup (later)** — search-by-content via the reversible mapping.
8. **Tessera export (later)** — write the journey as a `.tes` document once Tessera ships.

## Supply-chain guard

`scripts/check-config-sizes.sh` enforces byte-size limits on toolchain config files
(vite, eslint, postcss, tsconfig, etc.) as defense-in-depth: a config that suddenly grows
may have malware appended to it. CI (`config-integrity.yml`) fails the build if any config
exceeds its limit. Ported from VerifyLocal. Run locally:

```bash
sh scripts/check-config-sizes.sh
```

Repo: <https://github.com/Latka-Industries/lib-of-babel>

## Relation to sibling projects

- **[Tessera](../tessera)** (`.tes`) — open document format; the planned home for exported journeys.
- **Tetration** (`.tet`) — numeric tensors; optional, only if we want per-gallery float fingerprints.

## License

Private / unpublished. © Latka Industries.
