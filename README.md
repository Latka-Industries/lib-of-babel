# lib-of-babel

[![Site](https://img.shields.io/badge/site-lib--of--babel.xyz-c9a227?style=flat-square&labelColor=0b0b0d)](https://lib-of-babel.xyz)
[![CI](https://github.com/Latka-Industries/lib-of-babel/actions/workflows/check.yml/badge.svg)](https://github.com/Latka-Industries/lib-of-babel/actions/workflows/check.yml)
[![Pages](https://github.com/Latka-Industries/lib-of-babel/actions/workflows/deploy.yml/badge.svg)](https://github.com/Latka-Industries/lib-of-babel/actions/workflows/deploy.yml)
[![License: GPL v3](https://img.shields.io/badge/license-GPLv3-blue?style=flat-square)](LICENSE)

**A living, walkable Library of Babel.** Start in a random hexagonal gallery, read the
books, take a hallway or a staircase, and keep walking. Every gallery is generated
deterministically from its coordinate — infinite space, almost nothing stored. What you
keep is the **journey**: the path and a cryptographic fingerprint of each room.

![A grid of per-gallery sigils — generative emblems drawn deterministically from each gallery's hash](assets/sigils.svg)

<sub>Each gallery has a **sigil** from its room hash. Same coordinate + universe → same sigil (alphabet is a lens and does not change it). The 24 above are real default-universe galleries — see [`assets/sigils.json`](assets/sigils.json) (`node scripts/make-sigil-sheet.mjs` to redraw).</sub>

## Quick start

[mise](https://mise.jdx.dev/) pins Rust + wasm-pack + uv.

```bash
mise trust && mise install   # one-time
mise run dev                 # build wasm → web/pkg, then serve
```

Open <http://127.0.0.1:8777/index.html>. More tasks and the WASM surface → [docs/development.md](docs/development.md).

## Docs

| Doc | What’s in it |
| --- | --- |
| [docs/design.md](docs/design.md) | Concept, design decisions, generation chain, storage, search |
| [docs/development.md](docs/development.md) | Layout, mise tasks, WASM API, UI notes |
| [docs/alphabets.md](docs/alphabets.md) | Alphabet lens table (ids, glyph counts, UI packs) |

## Inspiration

- [Jorge Luis Borges, “The Library of Babel” (1941)](https://en.wikipedia.org/wiki/The_Library_of_Babel)
- [Jonathan Basile, libraryofbabel.info](https://libraryofbabel.info/) — default Basile glyph set

## To Do

- [x] Grapheme-cluster alphabet cells — fix dotted-circle combining marks
- [ ] Punct mode axis — optional punctuation richness as a second axis on every language lens
- [ ] Custom alphabet picker — user-defined glyph sets beyond the built-in registry
- [ ] More UI locale packs — es/fr/… beyond DE/NL
- [ ] Generative audio per gallery
- [x] Babelgram search — stamped PNG (`lob:babel` v3 seal+room-hash) → verify → locate; same-universe stamped room / other-universe rematch; go/copy gated on verify; `&bo=` / `&be=` same-browser IndexedDB handoffs (not portable URLs); Mbit reopen via Babelgram
- [x] Photo→mosaic search (alphabet lens + rms / mae / corr; this-gallery + hit-gallery palette strips; `&bo=` handoff caches scored book RGBA)
- [x] Parallel virgin `book_image` via Web Workers (`book_image_pages` strips → stitch; main-thread chunk fallback)
- [x] Photo Find (`mosaic_find_book`) off the UI thread (`mosaic-find-worker` + pool; main-thread fallback)

## License

[GPLv3](LICENSE). © 2026 Alexander Hurowitz / Latka Industries.

Bundled fonts (Overpass Mono, Lato, Noto …) stay under the [SIL Open Font License](web/fonts/OFL.txt).
