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
| **Permalinks** | Room: compact `(z, n)` (`c…` when large) + `u` / `a` / `b` / `p` / `img=1` / `gv` / `h`. Search: `#q=&find=content|title` (re-locate on boot). Mosaic / Babelgram: `#bo=` (+ optional `#be=` print) via IndexedDB — local handoff only; cross-device reopen is Babelgram PNG. In-app flag guide: About → **url**. Site-wide Open Graph card (`og.png`) is static — same preview for every hash URL. |
| **Stack** | Rust → WASM core + static web frontend (GitHub Pages). |
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
**11**); a core change invalidates old proofs. Missing or mismatched `gv` on a deep link
triggers a migrate warning (closest equivalent: re-locate if `&q=`, else keep coords).

## What gets stored (it's tiny)

Per step ≈ **50 bytes** (`z`, `n`, `move`, `node_hash`). An hour of walking is ~180 KB;
a million steps ~50 MB. Text is never stored.

## Search (`generator_version` 11 — dual bijection scopes)

**actions… → search…** — **text** (content / title), **photo** (alphabet mosaic → one virgin
book), or **Babelgram** (stamped book-image PNG), under the active alphabet and universe.

Two universes of math share the same address labels `(z, n, book[, page])`:

- **Page-linked** — every possible *page* exists once (`content = (addr × C) mod |Σ|^3200`).
  Wander, spines, text search (≤ one page), reader `book_image`.
- **Book-linked** — every possible *full book* exists once
  (`content = ((addr + 1) × C) mod |Σ|^BOOK`). Search → photo / Babelgram identity.
  Addresses are **Mbit-range** (~millions of bits per axis); UI shows first/last five
  digits in the footer (hover: scientific + bit width as plain `≈N Mbit` text), Digits (z, n)
  in the gallery notice (body copy uses the `.unit-mbit` mark), spines + colour map, but not
  lattice wander (see About → engines / scale).

Same shelf numbers under different scopes are different virgin content. Handoff and
`lob:babel` stamps carry `scope=page|book`.

**Content (page-linked):** query capped at one page (3200 cells); pad into page 0
(offset + filler) → invert → virgin page contains the padded phrase. Highlight is
UI-only. Share links prefer `#q=&find=content` (boot re-locates).

**Title:** pad to **24** cells → invert title map → virgin spine contains the phrase →
jump and open at page 1.

**Babelgram** (tamper-checked colour-map PNG):

1. **Save** → Babelgram writes a lossless book-grid PNG with `tEXt lob:babel`.
2. **Search** → Babelgram uploads that PNG, decodes the print, verifies the stamp,
   then **go there** opens the stamped room (same universe) or a rematch (other universe).

Stamp wire (`web/js/lib/png-babel.js`):

| Version | Payload |
| --- | --- |
| **v3** (current) | `u`, `a`, compact `z`/`n`, `b`, `scope=page\|book`, `name`, plus `seal` (12-hex SHA-256 of letter flat) and `h` (16-hex `node_hash_hex` under stamped universe) |
| **v2** | same address fields, no seal — locate shows *legacy*; go still allowed |
| **v1** | address only, no `scope` (treated as `page`) |

Verify on locate: recompute seal from decoded flat + room hash under stamp `u`; both must
match. **Fail** → go / copy blocked (check-diff still works). **Pass** (same universe) →
**go there** uses stamp `z`/`n`/`b`, not a rematch guess. Other universe → rematch print; seal still
checked before go. **go there** / **copy link** stash a short same-browser `&bo=` handoff in
IndexedDB (coords + print RGBA + letter `flat`) — useful for a new tab *here*, not a portable
URL. Other-universe go also stashes `&be=`. Cross-device reopen: Babelgram PNG → search → verify.
Re-export seals from on-screen pixels under the *current* room accent (matches verify;
safe after other-universe rematch where the print still uses export colours).

Filename hint (not authoritative — stamp wins):
`babel-u{seedHex}-z{z}-n{n}-b{book}-a{alphabet}-s{page\|book}-colors.png`
(compact / long axes shorten to `c…` in the name; stamp keeps full coords).

Mbit rooms cannot live in a URL — save any book’s Babelgram, then **search → Babelgram**
to verify and reopen that exact stamped room.

**Photo mosaic:** WASM `mosaic_find_book` — project onto letter colours → book-linked
invert → that mosaic **is** one virgin book. Proof pixels use book-linked paint.
UI shows this gallery’s palette strip under the Find copy; after a hit, a second strip under
**go there** / **copy link** shows the result gallery’s palette.
**go there** / **copy link** use `&bo=` + virgin RGBA (same-browser IndexedDB handoff, not
shareable). Huge coords stay compact (`c…`); never JS-decimal-expand into the hash.
To keep an Mbit hit across devices: save a Babelgram there, then search → Babelgram to verify.

```text
content:  phrase  ──pad──▶  page digits  ──invert──▶  (z, n, book, page)  [scope=page]
title:    title   ──pad──▶  spine digits ──invert──▶  (z, n, book)
babel:    PNG     ──decode──▶  flat  ──verify seal+h──▶  trust stamp coords / rematch
photo:    image   ──letter mosaic──▶  text  ──invert──▶  (z, n, book)  [scope=book]
```

WASM entry points: `locate_page_json` / `locate_title_json` / `mosaic_*` /
`page_text_book_scope_for` / `book_text_book_scope_for` (see [development.md](development.md)).
