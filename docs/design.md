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
| **Wanderings** | Last 1000 steps in UI; full trail in IndexedDB (universe + lens frozen per visit). Universe switches at the same gallery count as steps (`◇`); hallway/stair/jump unchanged. |
| **Alphabet** | View lens (`&a=` in permalinks; soft cap 4096 cells). DE/NL lenses also switch UI locale. See [alphabets.md](alphabets.md). |
| **Colour map** | Glyphs → OKLCH: letters on an accent-seeded wheel, punct/digits muted opposite, space near-black. |
| **Universe** | Named seed (`""` = 0) as outermost axis; WASM global; `&u=` + exports. |
| **Permalinks** | Room: compact `(z, n)` (`c…` base64url when huge) + optional `u` / `a` / `book` / `page` / `img=1` / `gv`. Search shares: short `#q=&find=content\|title` (re-locate on boot). Mosaic / Babelgram go+copy: short `&bo=` (IndexedDB coords + optional RGBA; same-browser). Other-universe Babelgram print: `&be=` (IndexedDB). |
| **Stack** | Rust → WASM core + static web frontend. |
| **Persistence** | IndexedDB trail (+ brief `&bo=` / `&be=` handoffs); JSON export of path + per-node hashes. |

## The generation chain (never store text)

```text
(universe, z, n)              ──hash──▶  gallery_seed   (room identity)
gallery_seed + wall/shelf/i   ──hash──▶  book_seed (titles / room hash only)
(universe, z, n, book, page)  ──Basile──▶  one page (3200 symbols; invertible)
410 pages                     ──join──▶  the full book
700 book-slot seeds           ─BLAKE3─▶  node_hash  (room fingerprint; alphabet-free)
```

Same inputs forever → same books. Open a book → generate → render → discard.

**The generator is the schema.** Alphabet, PRNG, hash, dimensions, and seeding order are
frozen and versioned. Exports and permalinks stamp `generator_version` / `&gv=` (currently
**9**); a core change invalidates old proofs. Missing or mismatched `gv` on a deep link
triggers a migrate warning (closest equivalent: re-locate if `&q=`, else keep coords).

## What gets stored (it's tiny)

Per step ≈ **50 bytes** (`z`, `n`, `move`, `node_hash`). An hour of walking is ~180 KB;
a million steps ~50 MB. Text is never stored.

## Search (`generator_version` 9)

**actions… → search…** — **text** (content / title), **photo** (alphabet mosaic ranked
by rms / mae / corr), or **Babelgram** (stamped book-image PNG), under the active
alphabet and universe.

**Content (true Basile):** pad the phrase into a full page (deterministic offset + filler)
→ invert the page integer (`content × I mod |Σ|^3200`) → virgin page at those coords
**is** the padded phrase (no post-hoc embed). Highlight is UI-only (**clear mark** drops
`&q=` without changing glyphs). Multi-page: virgin page 0 holds the start (page-level
map; consecutive book-level bijection deferred). Coordinates are unbounded `BigInt`;
the UI shows scientific notation for huge axes. Share links prefer `#q=&find=content`
(boot re-locates) so the hash stays short.

**Title:** pad to **24** cells → invert title map → virgin spine contains the phrase →
jump and open at page 1.

**Babelgram:** stamped PNG from save → book image (exact colour grid, `tEXt lob:babel`
plus optional universe name). Exact accent decode reports **rms % / mae / corr** (and a
diff thumb). Locate inverts virgin page 0 of the projected flat. **go there** / **copy link**
use a short same-browser `&bo=` handoff (coords + cached RGBA in IndexedDB so open skips
virgin `book_image`). Other-universe **go there** also stashes the print flat under `&be=`.

**Photo mosaic:** stretch any image to the full-book colour grid → project onto the
active alphabet (**letter** colours or **luma ramp**) → coarse pack sweep → locate →
re-rank the virgin book colour map vs upload by **rms / mae / corr**. **go there** /
**copy link** use the same `&bo=` handoff and cache the scored book RGBA (skip regenerating
`book_image` on open). Cold virgin maps still pay full generation — see THI-144 for worker
parallelization. Live knobs use a downsampled preview; Find runs the full search.

```text
content:  phrase  ──pad──▶  page digits  ──invert──▶  (z, n, book, page)  ──virgin──▶  page text
title:    title   ──pad──▶  spine digits ──invert──▶  (z, n, book)         ──virgin──▶  spine
babel:    PNG     ──stamp+palette──▶  flat  ──locate──▶  (z, n, book)
photo:    image   ──mosaic packs──▶  flat  ──locate──▶  (z, n, book)  ──re-rank──▶  best fit
```

Page generation is the reverse of search: `content = (addr × C) mod |Σ|^3200`.
WASM entry points: `locate_page_json` / `locate_title_json` / `mosaic_*` (see [development.md](development.md)).
