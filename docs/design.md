# Design

How the library is shaped — topology, determinism, and search. For local build and the
WASM surface, see [development.md](development.md). For lenses, see [alphabets.md](alphabets.md).

## Concept

Borges imagined **hexagonal galleries**: four walls of shelves, two open sides into a
vestibule with a spiral stair. So four moves from any room — two hallways, stairs up,
stairs down.

Canonical dimensions:

- 4 walls × 5 shelves × 35 books = **700 books per gallery**
- each book: **410 pages**, **40 lines/page**, **~80 chars/line**
- alphabet: **selectable lens** — Borges / Basile (default) / Basile++ / Basile# plus language presets ([full table](alphabets.md)); same room hash/sigil, new spines and pages (*a new sort of translation*)
- universe: name a parallel infinite library (`""` = default); infinitely many, reproducible from the name

## Core design decisions

| Topic | Decision |
| --- | --- |
| **Topology** | `(z, n)` lattice. Hallways = `n ± 1`, stairs = `z ± 1`. |
| **Books** | 700 deterministic spines per gallery; full text **lazy** on open; text or colour page view. |
| **Determinism** | `(universe, z, n) → gallery_seed → 700 book_seeds → node_hash`; alphabet projects spines/pages. Nothing stored. |
| **Hashing** | BLAKE3-256 **room** fingerprint (universe, version, coordinate, book-slot seeds). Alphabet out of the digest. Footer shows a 64-bit prefix. |
| **Wanderings** | Last 500 steps in UI; full trail in IndexedDB (universe + lens frozen per visit). |
| **Alphabet** | View lens (`&a=` in permalinks; soft cap 4096 cells). DE/NL lenses also switch UI locale. See [alphabets.md](alphabets.md). |
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
frozen and versioned. Exports stamp `generator_version` (currently **8**); a core change
invalidates old proofs.

## What gets stored (it's tiny)

Per step ≈ **50 bytes** (`z`, `n`, `move`, `node_hash`). An hour of walking is ~180 KB;
a million steps ~50 MB. Text is never stored.

## Search (`generator_version` 8)

**actions… → search…** — content or title, under the active alphabet and universe.

**Content:** validate → BLAKE3 to `(z, n, book, page)` → Basile-style embed (long phrases
span pages) → open. Up to one full book (~1.3M characters).

**Title:** same rules, max **24** characters → `(z, n, book)` → embed on the canonical
spine → jump and open at page 1.

```text
content:  phrase  ──validate──▶  flat  ──BLAKE3──▶  (z, n, book, page)  ──embed──▶  page text
title:    title   ──validate──▶  flat  ──BLAKE3──▶  (z, n, book)         ──embed──▶  spine
```

Feistel page mapping is invertible, so **search-by-content** is the reverse of reading.
WASM entry points: `locate_page_json` / `locate_title_json` (see [development.md](development.md)).
