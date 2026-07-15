# lib-of-babel

**A living, walkable Library of Babel.** Start in a random hexagonal gallery, read the
books, take a hallway or a staircase, and keep walking. Every gallery is generated
deterministically from its coordinate — infinite space, almost nothing stored. What you
keep is the **journey**: the path and a cryptographic fingerprint of each room.

![A grid of per-gallery sigils — generative emblems drawn deterministically from each gallery's hash](assets/sigils.svg)

<sub>Each gallery has a **sigil** from its room hash. Same coordinate + universe → same sigil (alphabet is a lens and does not change it). The 24 above are real default-universe galleries — see [`assets/sigils.json`](assets/sigils.json) (`node scripts/make-sigil-sheet.mjs` to redraw).</sub>

Live: [lib-of-babel.xyz](https://lib-of-babel.xyz)

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
- [ ] Colour-mosaic search — photo → alphabet mosaic → invert to book

## License

[GPLv3](LICENSE). © 2026 Alexander Hurowitz / Latka Industries.

Bundled fonts (Overpass Mono, Lato, Noto …) stay under the [SIL Open Font License](web/fonts/OFL.txt).
