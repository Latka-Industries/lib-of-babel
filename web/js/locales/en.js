/** English UI — source of truth (Basile / Borges / unmapped lenses). */
export const en = {
  "header.aboutTitle": "About — what this is & how to wander (opens a guide)",
  "header.gallery": "gallery",
  "header.coordTitle": "click to jump to any gallery",
  "header.hash": "hash",
  "header.hashTitle": "click to copy this gallery's full hash",
  "header.steps": "steps",
  "header.universePlaceholder": "default universe",
  "header.universeTitle":
    "universe — name a parallel library (blank = the default). Enter to travel.",
  "header.universeRandomTitle": "jump to a random universe",
  "header.alphabetTitle":
    "alphabet lens — same room hash, different spines and pages (not translation)",
  "header.actionsTitle": "copy link · export · verify · search · new walk",
  "actions.placeholder": "actions…",
  "actions.copy": "copy link",
  "actions.search": "search…",
  "actions.export": "export journey",
  "actions.verify": "verify journey",
  "actions.reset": "new walk",

  "minimap.here": "you are here",
  "minimap.sigilTitle": "this gallery's sigil — click to download the SVG",
  "minimap.hint": "click an exit to move",
  "loading.building": "building library…",
  "loading.failed": "failed to load: {err}",

  "footer.wanderings": "wanderings · {n}/{max}",
  "footer.trail":
    "trail {nodes} nodes · universe {universe} · {alphabet} · gen v{gv}",

  "common.close": "close",
  "common.go": "go",
  "common.link": "link",
  "common.you": "you",
  "common.copied": "copied!",

  "about.subtitle": "a walkable Library of Babel",
  "about.tab.overview": "overview",
  "about.tab.alphabets": "alphabets",
  "about.tab.wander": "wander",
  "about.tab.books": "books",
  "about.tab.more": "more",
  "about.tabsLabel": "About sections",
  "about.alphabets.h": "Alphabet lenses",
  "about.alphabets.intro":
    "Each preset is a <b>symbol law</b> for spines and pages — not a separate universe. Same room hash and sigil; a new sort of translation. Search and titles only accept symbols from the active lens. The header menu switches among these sets.",
  "about.alphabet.meta": "{n} glyphs · &amp;a={id}",

  "about.overview": `
<p>An endless library you can walk. Each hexagonal gallery has
<b>four walls of bookshelves</b> (700 books) and <b>two hallways</b> to the next
gallery, plus a <b>staircase</b> up and down — four moves from anywhere.</p>
<p>Nothing is stored. Every gallery is <b>generated on the spot</b> from its
address, so the Library is infinite yet weighs almost nothing: only your
<i>path</i> is remembered in the browser.</p>
<h4>Three things in the address</h4>
<ul>
<li><b>Universe</b> — parallel infinite libraries. Name one in the header (blank =
default). Same room numbers, wholly different books. Your wanderings keep
going across universes.</li>
<li><b>Room</b> — <b>gallery (z,&nbsp;n)</b> plus its <b>hash</b> and <b>sigil</b>.
The hash names the room itself (not the text on the shelves). Same universe +
same coordinates → same fingerprint, forever.</li>
<li><b>Alphabet lens</b> — Borges, Basile, Basile++ / Basile#, or a language set
(see the <b>alphabets</b> tab: Romance, Germanic, Uralic, Turkic, Hellenic, …).
Flip it and every spine and page rewrites under the <b>same</b> hash and sigil.
Your trail stays put.
<i>Not translation.</i> The same room, different tongue. The site chrome
speaks that tongue when a language pack exists (German, Dutch, …).</li>
</ul>
<h4>Inspiration</h4>
<p class="dim">
<a href="https://sites.evergreen.edu/politicalshakespeares/wp-content/uploads/sites/226/2015/12/Borges-The-Library-of-Babel.pdf"
target="_blank" rel="noopener noreferrer">Jorge Luis Borges, “The Library of Babel” (1941).</a><br />
<a href="https://libraryofbabel.info/" target="_blank" rel="noopener noreferrer">Jonathan Basile, <i>libraryofbabel.info</i></a>
</p>`,

  "about.wander": `
<h4>How to wander</h4>
<ul>
<li><b>LIB·OF·BABEL</b> (header) opens this guide anytime.</li>
<li>Use the <b>minimap</b> — click an exit hash to move. <kbd>arrow keys</kbd> walk hallways and stairs (unless a dialog is open).</li>
<li>Click <b>gallery&nbsp;(z,&nbsp;n)</b> to <b>jump</b> anywhere on the lattice.</li>
<li>Each gallery has a <b>sigil</b> — an emblem from its <b>room</b> hash. Same place, same sigil (lens does not change it); click to download the <b>SVG</b>.</li>
<li>Type a <b>universe</b> name or roll <b>&#9860;</b> for a random one; blank returns to default. Same coordinates, new library — trail stays.</li>
<li>The <b>alphabet</b> menu switches the <b>lens only</b> — new spines and text; hash, sigil, and trail stay. Language lenses also switch the site language when a pack exists.</li>
<li><b>actions…</b> → <b>copy link</b> (or click the header <b>hash</b>) for a permalink; <code>&amp;a=</code> restores the lens you were using.</li>
<li><b>actions…</b> → <b>search…</b> — pick <b>content</b> or <b>title</b>, find coordinates, jump there (see <b>more</b> tab).</li>
<li><b>wanderings</b> (footer, last {max}) revisits recent steps — shows universe + alphabet per visit; <b>export journey</b> saves the full path as JSON.</li>
</ul>`,

  "about.books": `
<h4>Reading a book</h4>
<ul>
<li>Click any colored spine to open it; <kbd>←</kbd> <kbd>→</kbd> turn pages while the reader is open.</li>
<li>The spine you last closed is outlined in <b>red</b> so you can find it again on this shelf.</li>
<li><b>color</b> redraws the page as a character-colour map — each symbol a square, tinted by the gallery hash.</li>
<li><b>link</b> copies a permalink to this book at the current page.</li>
<li><b>save…</b> → <b>borrow book</b> — full text export (~1.3&nbsp;MB .txt)</li>
<li><b>save…</b> → <b>book image</b> — whole book as a PNG colour map</li>
</ul>`,

  "about.more": `
<h4>The numbers in the header</h4>
<p class="dim">
<b>gallery (z, n)</b> is your coordinate. <b>hash</b> is the room's
<b>BLAKE3</b> fingerprint — a permalink and proof for this place in this
universe. It does <b>not</b> change when you switch alphabet; the lens only
rewrites what the shelves say. <b>Wanderings</b> keeps your last
{max} steps (universe + alphabet lens frozen per visit);
every step's room hash lives in the full trail. <b>actions…</b> also
offers <b>verify journey</b> and <b>new walk</b>.
</p>
<h4>Search by content</h4>
<p class="dim">
In <b>actions…</b> → <b>search…</b>, leave the dropdown on
<b>content</b>. Paste any phrase (up to one full book — ~1.3&nbsp;million
characters) and the library returns the gallery, shelf, book, and page(s) where
it already lives — then opens it. Long phrases span consecutive pages in the
same volume. Search uses the <b>current alphabet lens</b> and stays in the
universe you are standing in. Invalid characters are highlighted in red.
</p>
<h4>Search by title</h4>
<p class="dim">
Same search dialog — choose <b>title</b> instead of <b>content</b>. Type a spine
title (up to <b>24 characters</b>, same lens rules). The library finds the
gallery and shelf where that title belongs under the active alphabet, embeds it
on the canonical spine, and jumps you there. Useful when you remember a spine
label, not a page of text.
</p>`,

  "history.title": "wanderings",
  "history.meta": "{shown} of {total} steps · newest first",

  "verify.title": "verify journey",
  "verify.meta": "drop in an exported journey to re-walk and prove it",

  "search.headContent": "search by content",
  "search.headTitle": "search by title",
  "search.metaContent":
    "Type a phrase — the library finds where it already exists (space-padded to a full page).",
  "search.metaTitle":
    "Type a spine title — the library finds the gallery and shelf where it belongs.",
  "search.label": "search",
  "search.kindTitle": "search spine titles or page content",
  "search.kindContent": "content",
  "search.kindTitleOpt": "title",
  "search.placeholderContent": "forgive me for i have sinned",
  "search.placeholderTitle": "crimson spine",
  "search.find": "find",
  "search.hintContent":
    "uses the current alphabet lens · up to ~1.3M characters (one book)",
  "search.hintTitle":
    "uses the current alphabet lens · up to {n} characters (spine title)",

  "jump.title": "jump to a gallery",
  "jump.subtitle":
    "type any coordinates — the lattice is vast, so leap as far as you like.",

  "book.saveTitle": "take this book home",
  "book.savePlaceholder": "save…",
  "book.borrow": "borrow book",
  "book.image": "book image",
  "book.linkTitle": "copy a link to this book at this page",
  "book.viewTitle": "switch between text and a character-color view of the page",
  "book.viewColor": "color",
  "book.viewText": "text",
  "book.prev": "‹ prev",
  "book.next": "next ›",
  "book.pageInd": "page {page} / {total}",
  "book.pagePlaceholder": "page",
  "book.wall": "Wall {n}",
  "book.wallBook": "Wall {n} · book {book}",

  "image.save": "save png",
  "image.saveTitle": "save this whole-book color map as a PNG",

  "alphabet.symbolLabel": "{name} · {n} glyphs",
  "alphabet.group.Latin base": "Latin base",
  "alphabet.group.Romance": "Romance",
  "alphabet.group.Germanic": "Germanic",
  "alphabet.group.Uralic": "Uralic",
  "alphabet.group.Turkic": "Turkic",
  "alphabet.group.Hellenic": "Hellenic",
};
