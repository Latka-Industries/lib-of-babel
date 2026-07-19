/** English UI — source of truth (Basile / Borges / unmapped lenses). */
export const en = {
  "header.aboutTitle": "About — what this is & how to wander (opens a guide)",
  "header.universePlaceholder": "default universe",
  "header.universeTitle":
    "universe — name a parallel library (blank = the default). Enter to travel.",
  "header.universeRandomTitle": "jump to a random universe",
  "header.alphabetTitle":
    "alphabet lens — same room hash, other spines and pages (not translation)",
  "alphabet.picker.h": "Alphabet lens",
  "alphabet.picker.sub": "same room hash · other spines and pages",
  "header.actionsTitle": "copy link · export · verify · search · new walk",
  "header.themeToLight": "switch to light mode",
  "header.themeToDark": "switch to dark mode",
  "header.menuOpenTitle": "open menu",
  "header.menuCloseTitle": "close menu",
  "header.menuUniverse": "universe",
  "header.menuAlphabet": "alphabet",
  "header.menuActions": "actions",
  "header.menuTheme": "theme",
  "actions.placeholder": "actions…",
  "actions.copy": "copy link",
  "actions.search": "search…",
  "actions.export": "export journey",
  "actions.verify": "verify journey",
  "actions.reset": "new walk",

  "minimap.here": "you are here",
  "minimap.sigilTitle": "this gallery's sigil — click to download the SVG",
  "minimap.hint": "click an exit to move",
  "loading.building": "building library",
  "loading.failed": "failed to load: {err}",

  "footer.wanderings": "wanderings · {n}/{max}",
  "footer.gallery": "gallery",
  "footer.coordTitle": "click for room details (Mbit) or jump",
  "footer.hash": "hash",
  "footer.hashTitle": "click to copy this gallery's full hash",
  "footer.steps": "steps",
  "footer.help": "- Help",
  "footer.helpTitle": "Help — open the guide (?)",

  "common.close": "close",
  "common.go": "go",
  "common.link": "link",
  "common.copied": "copied!",

  "about.subtitle": "a walkable Library of Babel",
  "about.tab.overview": "overview",
  "about.tab.alphabets": "alphabets",
  "about.tab.wander": "wander",
  "about.tab.books": "books",
  "about.tab.search": "search",
  "about.tab.engines": "engines",
  "about.tab.scale": "scale",
  "about.tab.url": "url",
  "about.tab.more": "more",
  "about.tabsLabel": "About sections",
  "gallery.coordsHuge.hint":
    "Mbit-space room (book-linked) — spines and color map work; hallway wander and jump are off. Full book text / color map can take minutes the first time.",
  "gallery.coordsHuge.title":
    "{scope} · Mbit-space {coords} — not hallway-wanderable",
  "gallery.coordsHuge.minimap":
    "Mbit-space room — lattice exits disabled. See LIB-OF-BABEL → SCALE.",
  "gallery.coordsHuge.minimapShort": "Mbit · no exits",
  "gallery.mbitNotice.title": "MBIT space",
  "gallery.mbitNotice.body":
    "This gallery uses the <b>book-linked</b> map. Spines and color maps still work. Hallway arrows and jump are off. <span class=\"unit-mbit\">Mbit</span> rooms cannot be stored in a URL — open any book here, save a Babelgram, then <span class=\"ui\">search…</span> → <span class=\"ui ui-tab\">Babelgram</span> to verify and open that room. Opening or borrowing a book can take a few.",
  "gallery.mbitNotice.scale.slim":
    "<b>Scale</b> — ≈{mbit} <span class=\"unit-mbit\">Mbit</span> ({mag}). Past every familiar combinatorial count — shuffled decks (~10^68), atoms in the universe (~10^80), a <i>googol</i> (10^100), chess games (~10^120), Go positions (~10^170). One digit per second: {recite}.",
  "gallery.mbitNotice.scale.mid":
    "<b>Scale</b> — ≈{mbit} <span class=\"unit-mbit\">Mbit</span> ({mag}). ≈{digits} digits. For reference, a short-to-typical novel is roughly 100 000–a few hundred thousand <i>letters</i>. One digit per second: {recite}.",
  "gallery.mbitNotice.scale.book":
    "<b>Scale</b> — ≈{mbit} <span class=\"unit-mbit\">Mbit</span> per axis — Basile book-map (~6.4). ≈{digits} digits. For reference, one of this library’s 410‑page books holds ~1.3 M <i>letters</i>; a Bible is ~3 M. One digit per second: {recite}.",
  "gallery.mbitNotice.scale.fat":
    "<b>Scale</b> — ≈{mbit} <span class=\"unit-mbit\">Mbit</span> ({mag}). Just storing the room number takes ≈{mb} MB — JPEG‑photo / short‑MP3 size. One digit per second: {recite}.",
  "gallery.mbitNotice.scale.titan":
    "<b>Scale</b> — ≈{mbit} <span class=\"unit-mbit\">Mbit</span> ({mag}). The coordinate alone is ≈{mb} MB on disk — long MP3 / small app‑download size, for one room address. One digit per second: {recite}.",
  "gallery.mbitNotice.recite.minutes": "~{n} minutes",
  "gallery.mbitNotice.recite.hours": "~{n} hours",
  "gallery.mbitNotice.recite.days": "~{n} days",
  "gallery.mbitNotice.recite.weeks": "~{n} weeks",
  "gallery.mbitNotice.recite.months": "~{n} months",
  "gallery.mbitNotice.recite.years": "~{n} years",
  "gallery.mbitNotice.hashLabel": "Room hash",
  "gallery.mbitNotice.coordsLabel": "Axes (magnitude)",
  "gallery.mbitNotice.digitsLabel": "Digits (z, n)",
  "gallery.mbitNotice.gotIt": "Got it",
  "gallery.mbitNotice.engines": "LIB-OF-BABEL → SCALE",
  "gallery.mbitNotice.mute": "Don't show again",

  "about.scale.col.band": "Band",
  "about.scale.col.scalar": "Scalar",
  "about.scale.col.bytes": "Bytes",
  "about.scale.col.comparison": "Comparison",
  "about.scale.col.recite": "Recite (1 digit/s)",
  "about.scale.band.slim": "slim",
  "about.scale.band.mid": "mid",
  "about.scale.band.book": "book",
  "about.scale.band.fat": "fat",
  "about.scale.band.titan": "titan",
  "about.scale.comparison.slim": "past Go’s position count (~10^170)",
  "about.scale.comparison.mid":
    "≈{digits} digits · ref: novella–paperback ~100 000–a few hundred thousand letters",
  "about.scale.comparison.book":
    "≈{digits} digits · ref: library book ~1.3 M / Bible ~3 M letters",
  "about.scale.comparison.fat": "JPEG / short MP3 size",
  "about.scale.comparison.titan": "long MP3 / small app download",
  "about.scale.intro": `
<h4>MBIT scale</h4>
<p class="dim">
Room addresses are integers. When an axis is wider than the page map, the footer shows
first/last five digits (<code>12345…67890</code>); hover adds scientific form and bit width
in megabits (1 <span class="unit-mbit">Mbit</span> = <code>10^6</code> bits). Click
<span class="ui">gallery (z, n)</span> for the room notice — Axes preview plus
Digits (z, n) counts. The table’s <b>Comparison</b> column is analogy
only (combinatorial landmarks, text lengths, JPEG/MP3/app sizes). Recite times assume <b>one digit per second</b> spoken aloud.
</p>
<p class="dim">
<span class="ui">search…</span> → <span class="ui ui-tab">photo</span> / <span class="ui ui-tab">Babelgram</span> under Basile land in the <b>book</b> band (≈3–6 <span class="unit-mbit">Mbit</span> per axis).
Larger alphabets (Thai, Chinese, …) make those addresses a bit bigger — still book, not fat or titan.
Those modes do not reach <b>fat</b> / <b>titan</b> with today’s book length.
<span class="unit-mbit">Mbit</span> rooms cannot be stored in a URL. Open any book in that room, save a Babelgram, then
<span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span> to verify the file and open the stamped room.
How the two maps work:
&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-engines">ENGINES</button>
</p>`,
  "about.scale.outro": `
Storage size is for the <i>coordinate integer alone</i> (not the book text).
Comparison cells are landmarks and file-size analogies beside the digit estimate. See also
<button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-engines">ENGINES</button>.
`,

  "about.alphabets.h": "Alphabet lenses",
  "about.alphabets.intro":
    "Each preset is a <b>symbol law</b> for spines and pages — not a separate universe. Same room hash and sigil; <i>a new sort of translation</i>. Search and titles only accept symbols from the active lens. Browse by family below. An <b>interface · …</b> mark means menus and labels switch to that language too. <b>Sources</b> under each family blurb link to overview articles.",
  "about.alphabets.indexLabel": "Family",
  "about.alphabets.refs": "Sources",
  "about.alphabet.meta": "{n} glyphs · &amp;a={id}",
  "about.alphabet.uiPack": "interface · {name}",

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
<li><b>Alphabet lens</b> — switches the symbol set for spines and pages under the
<b>same</b> hash and sigil; your trail stays. See the <b>alphabets</b> tab
for each preset (and which ones also change the site language).</li>
</ul>
<h4>Inspiration</h4>
<p class="dim">
<a href="https://en.wikipedia.org/wiki/The_Library_of_Babel"
target="_blank" rel="noopener noreferrer">Jorge Luis Borges, “The Library of Babel” (1941).</a><br />
<a href="https://libraryofbabel.info/" target="_blank" rel="noopener noreferrer">Jonathan Basile, <i>libraryofbabel.info</i></a>
</p>`,

  "about.wander": `
<h4>How to wander</h4>
<ul>
<li><kbd>LIB·OF·BABEL</kbd>, <kbd>?&nbsp;-&nbsp;Help</kbd>, or <kbd>?</kbd> open this guide anytime.</li>
<li>The header <span class="ui">theme</span> control (sun/moon) switches light and dark; the choice is remembered in this browser.</li>
<li>Use the <b>minimap</b> — click an exit hash to move. <kbd>arrow keys</kbd> walk hallways and stairs (unless a dialog is open).</li>
<li>Click <span class="ui">gallery&nbsp;(z,&nbsp;n)</span> to jump anywhere on the lattice — only in the <b>page-linked</b> (wanderable) range.</li>
<li><span class="ui">search…</span> → <span class="ui ui-tab">photo</span> / <span class="ui ui-tab">Babelgram</span> can land you in the <b><span class="unit-mbit">Mbit</span> space</b> (book-linked): spines work, hallway wander does not.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-engines">ENGINES</button></li>
<li>Each gallery has a <b>sigil</b> — an emblem from its <b>room</b> hash. Same place, same sigil (lens does not change it); click to download the <b>SVG</b>.</li>
<li>Type a <span class="ui">universe</span> name or roll <span class="ui">&#9860;</span> for a random one; blank returns to default. Same coordinates, new library — trail stays.</li>
<li>The <span class="ui">alphabet</span> menu switches the <b>lens only</b> — new spines and text; hash, sigil, and trail stay.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-alphabets">ALPHABETS</button></li>
<li>Click any colored spine on a wall to open a book.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-books">BOOKS</button></li>
<li><span class="ui">actions…</span> → <span class="ui">copy link</span> (or click the footer <span class="ui">hash</span>) for a permalink.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-url">URL</button></li>
<li><span class="ui">actions…</span> → <span class="ui">search…</span> — <span class="ui ui-tab">text</span>, <span class="ui ui-tab">photo</span>, or <span class="ui ui-tab">Babelgram</span>; jump there.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-search">SEARCH</button></li>
<li><span class="ui">wanderings</span> (footer, last {max}) revisits recent steps — shows universe + alphabet per visit; <span class="ui">export journey</span> saves the full path as JSON.</li>
</ul>`,

  "about.books": `
<h4>Reading a book</h4>
<ul>
<li>Click any colored spine to open it; <kbd>←</kbd> <kbd>→</kbd> turn pages while the reader is open.</li>
<li>The spine you last closed is outlined in <b>red</b> so you can find it again on this shelf.</li>
<li><span class="ui">color</span> redraws the page as a character-color map — each symbol a square, tinted by the gallery hash.</li>
<li><span class="ui">link</span> copies a permalink to this book at the current page (page-map only — <span class="unit-mbit">Mbit</span> rooms cannot be stored in a URL).</li>
<li><span class="ui">save…</span> → <span class="ui">borrow book</span> — full text export (~1.3&nbsp;MB .txt)</li>
<li><span class="ui">save…</span> → <span class="ui">Babelgram</span> — whole-book color map PNG with a seal; for <span class="unit-mbit">Mbit</span> rooms, <span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span> verifies it and opens the stamped room</li>
</ul>`,

  "about.search": `
<h4>by content</h4>
<p class="dim">
In <span class="ui">actions…</span> → <span class="ui">search…</span>, stay on the <span class="ui ui-tab">text</span> tab with
<span class="ui ui-tab">content</span>. Paste any phrase (up to one page — 3200 characters)
and the library returns the gallery, shelf, book, and page where it already
lives — then opens it. Search uses the <b>current alphabet lens</b> and stays in the
universe you are standing in. Invalid characters are highlighted in red.
</p>
<h4>by title</h4>
<p class="dim">
Same <span class="ui ui-tab">text</span> tab — choose <span class="ui ui-tab">title</span> instead of <span class="ui ui-tab">content</span>. Enter up to
<b>24 characters</b> (active lens rules). That string is treated as a
<b>spine label</b>: the library jumps to the gallery and shelf where that
title sits under the current alphabet, shows it on that book’s spine, and
opens page&nbsp;1.
</p>
<h4>by Babelgram</h4>
<p class="dim">
<span class="ui ui-tab">Babelgram</span> tab: upload a stamped PNG from <span class="ui">save…</span> → <span class="ui">Babelgram</span>.
<span class="unit-mbit">Mbit</span> rooms cannot be stored in a URL — this tab verifies the seal and, if it passes, opens the exact room in the stamp.
<b>Same universe</b> as the export → that exact book (after verify).
<b>Other universe</b> → same print at a new address, different book contents (seal still checked).
<span class="ui">go there</span> / <span class="ui">copy link</span> stash a short <code>#bo=</code> handoff in <b>this</b> browser’s storage — not a shareable URL. Another device needs a Babelgram.
<span class="ui">check diff</span> compares reproject vs diff — exact decode → near-black diff.
</p>
<h4>by photo mosaic</h4>
<p class="dim">
<span class="ui ui-tab">photo</span> tab: upload any image (optional brightness / contrast). It is
stretched to the full-book grid and projected with <b>this gallery’s room letter colors</b>
onto the active alphabet. That mosaic <b>is</b> one virgin book under the
<b>book-linked</b> bijection (usually a <span class="unit-mbit">Mbit</span> room — no hallway wander).
The top palette strip is this gallery; after Find, a second strip shows the hit gallery’s palette.
<span class="ui">go there</span> / <span class="ui">copy link</span> use a short <code>#bo=</code> handoff in <b>this</b> browser only — not shareable across devices.
To keep the room elsewhere: open any book there, save a Babelgram, then <span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span> to verify and reopen it.
</p>`,

  "about.engines": `
<h4>Shorthand</h4>
<p class="dim">
<code>Σ</code> — active alphabet (glyph set). <code>|Σ|</code> — its size
(Basile default <code>|Σ|=29</code>).<br>
<code>PAGE</code> — symbols per page = <code>40×80 = 3200</code>.<br>
<code>BOOK</code> — symbols per book = <code>PAGE × 410 = 1,312,000</code>.<br>
<code>|Σ|^PAGE</code> — page-map modulus (how many distinct pages).<br>
<code>|Σ|^BOOK</code> — book-map modulus (how many distinct full books).<br>
<span class="unit-mbit">Mbit</span> — megabit = <code>10^6</code> bits (bit width of an integer).
Per 1 <span class="unit-mbit">Mbit</span> of width the number is about
<code>2^(10^6) ≈ 10^(3.01×10^5)</code> (~301 000 decimal digits).
Basile book-map: <code>BOOK · log₂(29) ≈ 6.4</code> <span class="unit-mbit">Mbit</span> → about
<code>(10^301 030)^6.4 ≈ 10^(1.9×10^6)</code> per axis.
</p>
<h4>Two bijection scopes</h4>
<p class="dim">
One address shape <code>(z, n, book[, page])</code>, two maps. Same shelf index under
different scopes → <b>different virgin content</b>.
</p>
<h4>Page-linked</h4>
<p class="dim">
Bijection over <code>|Σ|^PAGE</code>. Every page exists once. Wandering, spines, page turns,
<span class="ui ui-tab">text</span> search (≤ one page). Lattice arrows / jump stay here.
</p>
<h4>Book-linked</h4>
<p class="dim">
Bijection over <code>|Σ|^BOOK</code>. Every full book exists once.
<span class="ui ui-tab">photo</span> and <span class="ui ui-tab">Babelgram</span> identity:
the letter mosaic <b>is</b> that book.
</p>
<h4>MBIT space</h4>
<p class="dim">
When axes are book-map sized (Basile ≈ 3–6 <span class="unit-mbit">Mbit</span> per axis after unpack), the UI calls that
the <b><span class="unit-mbit">Mbit</span> space</b>: footer shows first/last five digits; hover adds scientific form + bit width;
click <span class="ui">gallery (z, n)</span> for Axes + Digits (z, n) in the room notice. No full decimal;
no hallway arrows / minimap exits / jump. Spines, open book, color map, lens, universe still work.
A full <code>z</code>/<code>n</code> is about a megabyte each — too large for a URL.
The address bar omits those axes. <span class="unit-mbit">Mbit</span> rooms cannot be stored in a URL: open any book in the room, save a Babelgram, then
<span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span> to verify the seal and open the stamped room.
Same-browser after verify: <code>#bo=</code> from <span class="ui">go there</span> / <span class="ui">copy link</span> is a local handoff (this browser’s storage), not a portable <span class="unit-mbit">Mbit</span> URL — use a Babelgram to share across devices.
<span class="ui">new walk</span> or a page-linked permalink to roam again.
Comparative bands:
&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-scale">SCALE</button>
</p>
<h4>How coordinates are shown</h4>
<p class="dim">
Footer <span class="ui">gallery (z, n)</span>: page-map → scientific notation when long;
book-map / <span class="unit-mbit">Mbit</span> space → first/last five digits (<code>12345…67890</code>); hover shows
scientific form and bit magnitude. Click opens the room notice with per-axis digit counts.
Wire form <code>c…</code> (base64url) when axes outgrow short decimals.
</p>
<h4>Babelgram stamps</h4>
<p class="dim">
<span class="ui">save…</span> → <span class="ui">Babelgram</span> writes a PNG with a <code>lob:babel</code> text chunk:
universe, alphabet, full compact <code>z</code>/<code>n</code>, book index, <code>scope=page|book</code>,
plus a <b>content seal</b> and <b>room hash</b> so the file can be checked for tampering.
<span class="unit-mbit">Mbit</span> rooms cannot be stored in a URL — save a Babelgram from any book in the room, then
<span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span>: verify passes → open that exact stamped room.
Wander exports are page-linked; book-map exports are book-linked. Grid must be exact book size.
</p>`,

  "about.url": `
<h4>Permalink shape</h4>
<p class="dim">
Everything after <code>#</code> is a room or search address for <b>page-linked</b> (wanderable) coords
and text search. Same address → same room forever (under the same generator). Short flags are listed
<b>before</b> large <code>z</code>/<code>n</code> so a truncated paste can still open a book.
<span class="unit-mbit">Mbit</span>-space axes are <b>not</b> put in the URL — they are too large. <span class="unit-mbit">Mbit</span> rooms cannot be stored in a URL: save a Babelgram from any book in the room, then <span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span> to verify and open it.
&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-engines">ENGINES</button>
</p>
<h4>Room flags</h4>
<ul>
<li><code>z</code> / <code>n</code> — gallery coordinates (short decimal, or compact <code>c…</code> when large but still page-map sized). Omitted in <span class="unit-mbit">Mbit</span> space.</li>
<li><code>h</code> — 16-hex prefix of the room <b>BLAKE3</b> hash (proof token; not reversible to coords).</li>
<li><code>a</code> — alphabet lens id (restores the shelf language).</li>
<li><code>u</code> — universe name (omitted or blank → default).</li>
<li><code>gv</code> — generator version; mismatch opens the migrate warning.</li>
<li><code>b</code> — book shelf index (0–699) to open on load.</li>
<li><code>p</code> — 1-based page inside that book.</li>
<li><code>img=1</code> — open the color-map image for that book.</li>
</ul>
<h4>Search shares</h4>
<ul>
<li><code>q</code> — phrase to find (soft-capped; content ≤ one page in the UI).</li>
<li><code>find=content|title</code> — which locate to run on boot (re-locate; no huge coords in the hash).</li>
</ul>
<h4>MBIT rooms — no URL</h4>
<p class="dim">
Book-linked axes are roughly megabyte-scale as <code>c…</code>. Browsers will not carry them in a hash.
<span class="unit-mbit">Mbit</span> rooms cannot be stored in a URL. Open any book in that room, save a Babelgram, then
<span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span> to verify the seal and open the stamped room.
Same browser after verify: <code>#bo=</code> / <code>#be=</code> from <span class="ui">go there</span> / <span class="ui">copy link</span> are local IndexedDB handoffs — not shareable across devices.
</p>
<h4>Same-browser handoffs</h4>
<ul>
<li><code>bo</code> — short IndexedDB id (coords + optional color map). Not a cross-device share.</li>
<li><code>be</code> — short-lived Babelgram print flat for other-universe rematch (also local).</li>
</ul>
<p class="dim">
Bijection <b>scope</b> (<code>page</code> vs <code>book</code>) travels in the handoff / PNG stamp,
not as a public URL flag. Prefer <code>#q=&amp;find=</code> for text search shares.
</p>`,

  "about.more": `
<h4>The numbers in the footer</h4>
<p class="dim">
<span class="ui">gallery (z, n)</span> is your coordinate — scientific on the page map, bit magnitude
on the book map (see <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-scale">SCALE</button>).
<span class="ui">hash</span> is the room's <b>BLAKE3</b> fingerprint — a permalink proof for this
place in this universe. It does <b>not</b> change when you switch alphabet; the lens only
rewrites what the shelves say. <span class="ui">wanderings</span> keeps your last
{max} steps (universe + alphabet lens frozen per visit) — including
<span class="ui">universe</span> switches at the same gallery (◇), with no hallway move;
every step's room hash lives in the full trail.
</p>
<h4>Journey export &amp; verify</h4>
<p class="dim">
<span class="ui">actions…</span> → <span class="ui">export journey</span> downloads your full path as JSON
(rooms, hashes, universes, lenses). <span class="ui">verify journey</span> re-walks an exported
file and proves each step still matches. <span class="ui">new walk</span> clears the trail and
starts fresh in this browser.
</p>
<h4>What stays in this browser</h4>
<p class="dim">
The Library itself is never downloaded — only your <b>path</b>, <span class="ui">theme</span>
preference, and a “seen the guide” flag live here. Photo / Babelgram
<span class="ui">go there</span> and <span class="ui">copy link</span> stash a short-lived <code>#bo=</code> handoff
in <b>this</b> browser’s IndexedDB — useful for a new tab here, not a link you can paste on another device.
Cross-device reopen for <span class="unit-mbit">Mbit</span> rooms: save a Babelgram, then <span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span>.
</p>
<h4>Sharing</h4>
<p class="dim">
Page-linked rooms and text search: URL flags under
<button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-url">URL</button>.
<span class="unit-mbit">Mbit</span> rooms cannot be stored in a URL. Open any book in that room, save a Babelgram, then
<span class="ui">search…</span> → <span class="ui ui-tab">Babelgram</span> to verify and open the stamped room.
</p>`,

  "about.githubTitle": "GitHub — Latka-Industries/lib-of-babel",
  "about.emailTitle": "Email — tlon@lib-of-babel.xyz",

  "history.title": "wanderings",
  "history.meta": "{shown} of {total} steps · newest first",

  "verify.title": "verify journey",
  "verify.meta": "drop in an exported journey to re-walk and prove it",
  "verify.openLastRoom": "Open last room in current library",

  "legacy.gv.title": "older library link",
  "legacy.gv.bodyAddress":
    "This link is from an older library version. Page text at these coordinates is not the same — we kept the same shelf address in the current library.",
  "legacy.gv.bodyQuery":
    "This link is from an older library version. We can place the same search phrase under the current generator (it may live on a different shelf).",
  "legacy.gv.bodyRelocated":
    "This link is from an older library version. We re-located your search phrase under the current generator — same words, possibly a new shelf.",
  "legacy.gv.bodyJourney":
    "This browser still has wanderings from generator v{old}. Room hashes and page text may not match v{cur}. Continue keeps this shelf and starts a fresh trail, or wipe local data and reload.",
  "legacy.gv.continue": "Continue",
  "legacy.gv.wipe": "Wipe local data & refresh",
  "legacy.gv.skipSession": "Don't show again this session",

  "search.head": "search",
  "search.headContent": "search by content",
  "search.headContentBook": "search by content (whole book)",
  "search.headTitle": "search by title",
  "search.headMosaic": "search by color mosaic",
  "search.metaText":
    "Find a phrase, match a photo mosaic, or open a Babelgram.",
  "search.metaContent":
    "Type a phrase — page-linked invert finds the page where those glyphs already live (padded to a full page).",
  "search.metaContentBook":
    "Longer than one page — book-map invert (same pipeline as <span class=\"ui\">search…</span> → <span class=\"ui ui-tab\">photo</span>). Hit is usually an <span class=\"unit-mbit\">Mbit</span> room: no URL; save a Babelgram to reopen. First <span class=\"ui\">find</span> may need a warm + wait.",
  "search.metaTitle":
    "Type a spine title — the library finds the gallery and shelf where it belongs.",
  "search.metaMosaic":
    "Upload a photo → full-book letter mosaic → locate. Size and wait time are on the Find row.",
  "search.tabsLabel": "Search mode",
  "search.tab.text": "text",
  "search.tab.photo": "photo",
  "search.tab.babel": "Babelgram",
  "search.tab.image": "photo",
  "search.headBabel": "search by Babelgram",
  "search.metaBabel":
    "Same universe → exact export book. Other universe → same Babelgram print, different contents.",
  "search.hintBabel": "",
  "search.babel.honesty":
    "Upload a Babelgram from <span class=\"ui\">save…</span> → <span class=\"ui\">Babelgram</span>. The stamp is verified (content seal + room hash). If it passes, <span class=\"ui\">{go}</span> opens the exact stamped room. <span class=\"unit-mbit\">Mbit</span> rooms cannot be stored in a URL — this is how you reopen them. Same universe → that book. Other universe → same print, new address. <span class=\"ui\">{go}</span> / <span class=\"ui\">{copy}</span> use a short <code>#bo=</code> handoff in this browser (not shareable); another device needs the Babelgram PNG.",
  "search.babel.find": "find book",
  "search.babel.progress": "decoding Babelgram",
  "search.babel.upload": "upload Babelgram PNG",
  "search.babel.original": "Babelgram export",
  "search.babel.gridHint":
    "Needs a stamped lossless PNG at exactly {w}×{h} (<span class=\"ui\">save…</span> → <span class=\"ui\">Babelgram</span>).",
  "search.babel.fileMeta": "{name} · exact {w}×{h} Babelgram grid",
  "search.babel.stampV3": "stamp v3 (sealed)",
  "search.babel.stampV2": "stamp v2 (no seal)",
  "search.babel.stampV1": "stamp v1 (no seal)",
  "search.babel.sizeMismatch":
    "Wrong size ({sw}×{sh}). Babelgrams must be exactly {w}×{h} — re-export from <span class=\"ui\">save…</span> → <span class=\"ui\">Babelgram</span>.",
  "search.babel.needExact": "upload an exact {w}×{h} Babelgram PNG first",
  "search.babel.notBabel":
    "Not a Babelgram PNG. Re-export from <span class=\"ui\">save…</span> → <span class=\"ui\">Babelgram</span>.",
  "search.babel.nameMismatch":
    "filename coords do not match the PNG stamp",
  "search.babel.originLine":
    "export origin · {universe} (seed {u}) · gallery {coords} · book {book} · {alphabet}",
  "search.babel.universeUnknown": "seed {seed}",
  "search.babel.originNote":
    "Locate destination differs from export origin by design (same cells → new coords; other universe → other coords).",
  "search.babel.originNoteSame":
    "Same universe as the export — this is the exact book. <span class=\"ui\">{go}</span> opens it in a new tab.",
  "search.babel.originNoteOther":
    "Other universe — same Babelgram print at a new address, different book contents. <span class=\"ui\">{go}</span> / <span class=\"ui\">{copy}</span> use a local <code>#bo=</code> handoff (this browser only). <span class=\"unit-mbit\">Mbit</span> rooms: keep the Babelgram, then <span class=\"ui\">search…</span> → <span class=\"ui ui-tab\">Babelgram</span> to verify and reopen elsewhere.",
  "search.babel.resultsIntro":
    "Babelgram locate in {universe} (seed {seed}) — exact accent decode:",
  "search.babel.resultsIntroSame":
    "Exact book in {universe} (seed {seed}) — same universe as the export:",
  "search.babel.resultsIntroOther":
    "Same Babelgram print in {universe} (seed {seed}):",
  "search.babel.universeShifted":
    "Switched session to stamped <span class=\"unit-mbit\">Mbit</span> export universe <b>{universe}</b> (seed {seed}) — header <span class=\"ui\">universe</span> updated.",
  "search.babel.thumbAlt": "uploaded Babelgram",
  "search.babel.diffAlt": "decode difference (|upload − reproject|)",
  "search.babel.exactOk": "exact decode",
  "search.babel.verifyOk": "verified — stamp matches print",
  "search.babel.verifyFail": "tamper check failed — stamp does not match print",
  "search.babel.verifyLegacy": "legacy stamp — no seal (re-export to verify)",
  "search.babel.verifyBlocked": "go / copy blocked until the stamp verifies",
  "search.babel.seal": "content seal {seal}",
  "search.babel.diffCaption": "diff",
  "search.babel.compare.title": "compare",
  "search.babel.compare.hint":
    "wipe reproject ↔ diff — exact decode makes the diff side near-black",
  "search.babel.compare.result": "reproject",
  "search.babel.compare.diff": "diff",
  "search.babel.compare.sliderAria": "wipe between reproject and diff",
  "search.babel.compare.checkDiff": "check diff",
  "search.mosaic.compare.title": "compare",
  "search.mosaic.compare.hint":
    "wipe library book ↔ difference — near-black = same letters. The found babelgram uses the match gallery’s colours; the preview above still uses this gallery’s.",
  "search.mosaic.compare.shelf": "library book",
  "search.mosaic.compare.diff": "difference",
  "search.mosaic.compare.sliderAria": "wipe between library book and letter difference",
  "search.mosaic.compare.checkDiff": "compare letters",
  "search.mosaic.thumbMosaic": "found babelgram",
  "search.mosaic.thumbShelf": "library book",
  "search.mosaic.thumbMosaicAlt": "found babelgram at the match gallery",
  "search.mosaic.thumbShelfAlt": "how that book looks in the library",
  "search.mosaic.exactOk": "exact letters",
  "search.mosaic.tip.exactOk":
    "Same letters as the preview mosaic. Colours can differ: preview = this gallery’s palette; the found babelgram = the match gallery’s palette.",
  "search.mosaic.tip.rms":
    "RMS fit of letter mosaic vs library book map (match-gallery colours). Ideal ≈ 100%.",
  "search.mosaic.tip.mae":
    "Mean absolute error of letter mosaic vs library book map. Ideal ≈ 0.",
  "search.mosaic.tip.corr":
    "Correlation of letter mosaic vs library book map. Ideal ≈ 1.",
  "search.babel.metric.rms": "rms {n}%",
  "search.babel.metric.mae": "mae {n}",
  "search.babel.metric.corr": "corr {n}",
  "search.babel.tip.rms":
    "Root-mean-square RGB fit of upload vs mosaic/reproject. fit% = 100 × (1 − √(mean((ΔR²+ΔG²+ΔB²)/3) / 255²)). Ideal ≈ 100%.",
  "search.babel.tip.mae":
    "Mean absolute RGB error: mean((|ΔR|+|ΔG|+|ΔB|)/3) on a 0–255 scale. Ideal ≈ 0.",
  "search.babel.tip.corr":
    "Pearson correlation of paired RGB samples between upload and mosaic/reproject. Ideal ≈ 1.",
  "search.babel.tip.diff":
    "Pixelwise |upload − reproject| under the stamp accent. Ideal: near-black (all zeros).",
  "search.babel.tip.seal":
    "Short SHA-256 of the decoded book text. Same print ⇒ same seal in every universe. Stamped on save; compared on find.",
  "search.babel.tip.verifyOk":
    "Stamp seal and room hash match this file. go uses the exact stamped room.",
  "search.babel.tip.verifyFail":
    "Pixels or stamp were changed. Seal or room hash no longer match — go is blocked.",
  "search.babel.tip.verifyLegacy":
    "Older Babelgram without seal/hash. Re-export from <span class=\"ui\">save…</span> → <span class=\"ui\">Babelgram</span> to enable tamper checks.",
  "search.babel.tip.exactOk":
    "Decode looks exact: rms ≥ 99.9%, mae < 0.5, and corr ≥ 0.999.",
  "search.babel.confirmHint":
    "Pics are noisy — trust verify (seal + room hash), rms % (~100), mae (~0), corr (~1), and near-black diff wipe.",
  "search.label": "search",
  "search.kindTitle": "search spine titles or page content",
  "search.kindContent": "content",
  "search.kindTitleOpt": "title",
  "search.placeholderContent": "sit on a pan otis",
  "search.placeholderTitle": "crimson spine",
  "search.find": "find",
  "search.count": "{n} / {max}",
  "search.countTip": "{n} alphabet cells of {max} allowed",
  "search.hintContent":
    "uses the current alphabet lens · ≤3,200 = page · past that → book / <span class=\"unit-mbit\">Mbit</span> space",
  "search.hintContentBook":
    "book-map / <span class=\"unit-mbit\">Mbit</span> space",
  "search.hintTitle":
    "uses the current alphabet lens · up to {n} spine-title cells",
  "search.canTakeAFew": "can take a few",
  "search.hintMosaic":
    "{pages} pages · {cells} cells · address magnitude {mag} — first <span class=\"ui\">{find}</span> {slow}",
  "search.mosaic.find": "find match",
  "search.mosaic.searching": "searching…",
  "search.mosaic.progress": "finding book",
  "search.mosaic.progressProject": "projecting photo to letters",
  "search.mosaic.progressWarm":
    "warming book map (first search attempt {slow})",
  "search.mosaic.progressInvert": "finding book address",
  "search.mosaic.progressConstruct": "constructing color map",
  "search.mosaic.progressScoreProof": "scoring proof vs virgin book map",
  "search.mosaic.progressPalette":
    "current palette for this gallery at this alphabet lens + universe",
  "search.mosaic.resultPalette":
    "color palette for the resulting gallery (alphabet lens + universe)",
  "search.mosaic.handoff": "preparing color map handoff…",
  "search.mosaic.progressPacks": "scanning palette packs…",
  "search.mosaic.progressLocate": "locating pack {i} / {n}…",
  "search.mosaic.progressClimb":
    "round {i} · best {pct}% · no gain {stale}/{staleMax}…",
  "search.mosaic.progressScore": "scoring book map {i} / {n}…",
  "search.mosaic.upload": "upload image",
  "search.mosaic.honesty":
    "Letter mosaic uses this gallery’s colours (palette strip above). <span class=\"ui\">{find}</span> looks up those letters; the hit may sit in another gallery — a second palette strip under <span class=\"ui\">{go}</span> / <span class=\"ui\">{copy}</span> shows that gallery’s colours. Hits are usually <span class=\"unit-mbit\">Mbit</span> rooms (no URL). <span class=\"ui\">{go}</span> / <span class=\"ui\">{copy}</span> stash a short <code>#bo=</code> handoff in this browser only — not shareable. To reopen elsewhere: save a Babelgram there, then <span class=\"ui\">search…</span> → <span class=\"ui ui-tab\">Babelgram</span> to verify.",
  "search.mosaic.bookTextIntro":
    "Book text ({n} chars). Copy, or put it in content search and hit find.",
  "search.mosaic.toSearch": "put in content search",
  "search.mosaic.noText": "could not build book text from that image",
  "search.mosaic.noHits": "no mosaic matches for that image",
  "search.mosaic.resultsIntro":
    "Top {n} alphabet-mosaic matches (ranked by rms / mae / corr):",
  "search.mosaic.resultsIntroBest": "Best mosaic match:",
  "search.mosaic.elapsedSec": "took {n}s",
  "search.mosaic.elapsedMinSec": "took {m}m {s}s",
  "search.mosaic.thumbAlt": "book color map at match",
  "search.mosaic.original": "your photo",
  "search.mosaic.preview": "letter mosaic · this gallery",
  "search.mosaic.fitPct": "projection fit {n}%",
  "search.mosaic.previewError": "preview failed",
  "search.mosaic.fileMeta": "{name} · {sw}×{sh} → stretched to {w}×{h} book grid",
  "search.mosaic.gridHint":
    "Any image is stretched to the full-book color grid ({w}×{h}).",
  "search.mosaic.badImage": "could not decode that image",
  "search.mosaic.palette": "palette",
  "search.mosaic.palette.glyph": "letters",
  "search.mosaic.tip.palette":
    "Letters = Babelgram-style per-glyph colors.",
  "search.mosaic.dither": "dither",
  "search.mosaic.brightness": "brightness",
  "search.mosaic.contrast": "contrast",
  "search.mosaic.hue": "hue",
  "search.mosaic.chroma": "chroma",
  "search.mosaic.light": "light",
  "search.mosaic.space": "space",
  "search.mosaic.knobsSource": "original image",
  "search.mosaic.knobsMosaic": "mosaic palette",
  "search.mosaic.tip.brightness":
    "Brighten or darken the upload before it is mosaiced.",
  "search.mosaic.tip.contrast":
    "Raise or lower contrast of the upload before mosaicing.",
  "search.mosaic.tip.hue":
    "Rotates this hex’s letter-color wheel (same accent law as Babelgrams).",
  "search.mosaic.tip.chroma":
    "How vivid letter colors are on this hex’s wheel.",
  "search.mosaic.tip.light":
    "Lightness of letter colors on this hex’s wheel.",
  "search.mosaic.tip.space":
    "Pixels darker than this luminance become the space glyph when mosaicing.",
  "search.mosaic.tip.dither":
    "Floyd–Steinberg dither spreads color error for a softer, grainier mosaic.",
  "search.mosaic.needImage": "upload an image first",
  "search.mosaic.hitBook": "book {book}",
  "search.go": "go there",
  "search.result.gallery": "gallery {coords}",
  "search.result.coords":
    "universe {universe} · wall {wall} · shelf {shelf} · book {book} · {detail}",
  "search.result.page": "page {n}",
  "search.result.pages": "pages {start}–{end}",
  "search.result.chars": "{n} chars",
  "search.result.detailContent": "{pages} · {chars} · alphabet {alphabet}",
  "search.result.detailContentBook":
    "{pages} · {chars} · alphabet {alphabet} · book-map",
  "search.result.bookHandoffNote":
    "<span class=\"unit-mbit\">Mbit</span> room — copy uses a local <code>#bo=</code> handoff (this browser). Save a Babelgram to reopen elsewhere.",
  "search.result.detailTitle": "title {query} · {chars} · alphabet {alphabet}",
  "search.error.invalid":
    "invalid character for this alphabet ({alphabet} only): {shown}",
  "search.error.invalidPlural":
    "invalid characters for this alphabet ({alphabet} only): {shown}",
  "search.error.invalidGeneric": "invalid characters for this alphabet",
  "search.error.moreKinds": " (+{n} more kinds)",
  "search.error.empty": "search text is empty",
  "search.error.tooLong": "text too long (max {n} characters — one page)",
  "search.error.tooLongBook": "text too long (max {n} characters — one book)",
  "search.error.tooShortBook":
    "book locate needs more than {n} characters (one page) — shorten to page search or paste more",
  "search.error.titleTooLong": "title too long (max {n} characters)",
  "search.error.pageRoom":
    "text needs {need} pages but only {room} remain in this book — try a shorter phrase",
  "search.error.badResponse": "invalid response from generator",
  "search.error.unknown": "search failed",

  "jump.title": "jump to a gallery",
  "jump.subtitle":
    "type any coordinates — the lattice is vast, so leap as far as you like.",

  "book.saveTitle": "take this book home",
  "book.savePlaceholder": "save…",
  "book.borrow": "borrow book",
  "book.image": "Babelgram",
  "book.linkTitle": "copy a link to this book at this page",
  "book.viewTitle": "switch between text and a character-color view of the page",
  "book.viewColor": "color",
  "book.viewText": "text",
  "book.clearSearch": "clear mark",
  "book.clearSearchTitle": "clear the search highlight — the page text stays",
  "book.prev": "‹ prev",
  "book.next": "next ›",
  "book.pageInd": "page {page} / {total}",
  "book.pagePlaceholder": "page",
  "book.waitMbit":
    "<span class=\"unit-mbit\">Mbit</span> space — building this book. Can take a few.",
  "book.waitMbitImage":
    "<span class=\"unit-mbit\">Mbit</span> space — building the color map. Can take a few.",
  "book.waitMbitBorrow":
    "<span class=\"unit-mbit\">Mbit</span> space — writing the full book text. Can take a few.",
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
  "alphabet.group.Slavic": "Slavic",
  "alphabet.group.Baltic": "Baltic",
  "alphabet.group.Albanian": "Albanian",
  "alphabet.group.Celtic": "Celtic",
  "alphabet.group.Basque": "Basque",
  "alphabet.group.Maltese": "Maltese",
  "alphabet.group.Caucasian": "Caucasian",
  "alphabet.group.Semitic": "Semitic",
  "alphabet.group.West African": "West African",
  "alphabet.group.Ethiopic": "Ethiopic",
  "alphabet.group.African Latin": "African Latin",
  "alphabet.group.Berber": "Berber",
  "alphabet.group.CJK": "CJK",
  "alphabet.group.Indic": "Indic",
  "alphabet.group.Mongolic": "Mongolic",
  "alphabet.group.Southeast Asian": "Southeast Asian",

  "alphabet.blurb.Latin base":
    "The project’s starting alphabets: Borges’s restricted Latin set from the 1941 story (a–v), Basile’s web library a–z, then Basile++ / Basile# adding digits and punctuation.",
  "alphabet.blurb.Romance":
    "From Vulgar Latin in the former Roman west, regional vernaculars became Spanish, Portuguese, French, Italian, Romanian, and Catalan. Accents and a few extra letters were added as print and schooling fixed spelling to local sounds (nasals, palatals, stress).",
  "alphabet.blurb.Germanic":
    "Early Germanic languages used runes; Latin letters arrived with Christian literacy. Later print and schooling fixed German, Dutch, and Scandinavian Latin orthographies — including umlaut vowels, æ/ø/å, and Icelandic þ/ð for dental fricatives.",
  "alphabet.blurb.Uralic":
    "A non-Indo-European root family: Finnic languages around the Baltic, Hungarian carried west with the Magyars. All three here use modern Latin orthographies; Finnish and Estonian remained closely related, while Hungarian branched early and has a larger vowel inventory.",
  "alphabet.blurb.Turkic":
    "Turkic languages span Anatolia to Central Asia. Ottoman Turkish used Arabic script for centuries until the 1928 Latin reform; Soviet-era Latin and Cyrillic waves followed for Azerbaijani, Kazakh, Uzbek, Turkmen, and Kyrgyz. This shelf mixes modern Latin and Cyrillic school orthographies.",
  "alphabet.blurb.Hellenic":
    "Greek letters continue from antiquity. This lens is monotonic modern Greek (official from 1982): one accent mark instead of the older polytonic system, with the same α–ω inventory plus final sigma.",
  "alphabet.blurb.Slavic":
    "After Christianization, Slavic literacy followed two church traditions: Glagolitic/Cyrillic in much of the Orthodox east and south; Latin in the Catholic west and Adriatic. The lenses here follow that historical script split.",
  "alphabet.blurb.Baltic":
    "Latvian and Lithuanian are Baltic Indo-European languages. Both took Latin letters after Christianization; modern spellings, with many vowel and consonant diacritics, settled mainly in the nineteenth–twentieth centuries.",
  "alphabet.blurb.Albanian":
    "Written attestation is late (15th c. onward). Several alphabet proposals were in use until the 1908 Congress of Manastir adopted a Latin standard, including ç and ë for sounds not covered by plain a–z.",
  "alphabet.blurb.Celtic":
    "Insular Celtic languages used Latin letters through monastery and print after earlier Ogham. Modern Welsh and Irish spelling reforms kept Latin type; this shelf uses those standard orthographies (circumflexes in Welsh, fada vowels in Irish).",
  "alphabet.blurb.Basque":
    "Spoken in the western Pyrenees since before Roman times; a language isolate with no proven relatives. Written mainly in Latin from the early modern period; twentieth-century standardization fixed ñ and ç in the school orthography.",
  "alphabet.blurb.Maltese":
    "Developed from medieval Siculo-Arabic on Malta, later in contact with Italian and English. It is Semitic in structure but uses a Latin alphabet (standardized 1924), with extra letters for consonants English a–z does not write.",
  "alphabet.blurb.Caucasian":
    "Armenian letters are traditionally ascribed to Mesrop Mashtots (c. 405) for vernacular scripture; Georgian Mkhedruli comes from medieval Georgian literary tradition. Both are independent left-to-right alphabets, not Latin or Cyrillic.",
  "alphabet.blurb.Semitic":
    "Hebrew, Arabic, and Persian write right-to-left. Letters are stored as abstract Unicode characters; the browser (with Noto) shapes joining forms for Arabic and Persian. Hebrew includes final letter forms as distinct glyphs.",
  "alphabet.blurb.West African":
    "N’Ko is a right-to-left alphabet invented in 1949 by Solomana Kanté for Manding languages. It is indigenous West African writing — not Latin or Arabic — still taught and printed across the region.",
  "alphabet.blurb.Ethiopic":
    "Geʿez (Ethiopic) script is an abugida: each character is a consonant–vowel syllable. Amharic, Ethiopia’s working language, uses a large fidel inventory; this lens is a curated set of common syllabographs under the alphabet soft cap.",
  "alphabet.blurb.African Latin":
    "Many African languages use Latin orthographies shaped by missionaries, colonial schooling, and later national reforms. Extra letters (ɓɗƙ, ẹọṣ, ịụ, …) mark sounds plain a–z cannot write. Swahili often needs no extras beyond a–z.",
  "alphabet.blurb.Berber":
    "Tifinagh (Neo-Tifinagh / IRCAM) is the modern official Amazigh alphabet in Morocco, revived from older Libyco-Berber signs. Letters here are left-to-right geometric forms distinct from Latin and Arabic.",
  "alphabet.blurb.CJK":
    "East Asian pages under the soft cell cap (4096): Japanese kana (gojūon, no dakuten), curated Hangul syllables, and Simplified + Traditional Chinese frequent-character packs. Full Unihan or full Hangul is still impossible as one lens.",
  "alphabet.blurb.Indic":
    "Brahmic abugidas of India as grapheme-cluster cells: independent vowels and consonants, plus curated consonant–matra units (no lone combining marks). A single lens still cannot store full conjunct akshara tables; pages are cluster noise, not composed orthography.",
  "alphabet.blurb.Mongolic":
    "Mongolic languages of the steppe. Modern Khalkha Mongolian in Mongolia uses a Cyrillic alphabet with ө and ү for front rounded vowels — same civil-script family as Russian, different lens inventory.",
  "alphabet.blurb.Southeast Asian":
    "Mainland and maritime Southeast Asia: Filipino and Vietnamese in Latin (ñ; đ and tone-marked vowels), Thai and Khmer as clustered abugida cells (base + attached marks; Noto faces). Pages are glyph projections, not syllable orthography.",
  // Per-lens blurbs (stable registry ids).
  "alphabet.lensBlurb.25":
    "From Borges’s 1941 story: twenty-two letters (a–v) plus space, comma, and period — the alphabet the fiction assigns to the Library.",
  "alphabet.lensBlurb.29":
    "From Basile’s libraryofbabel.info: English a–z plus space, comma, and period.",
  "alphabet.lensBlurb.48":
    "Basile’s a–z plus digits and common punctuation, so titles and pages can include numerals and sentence marks.",
  "alphabet.lensBlurb.60":
    "Basile++ plus symbols used in URLs and code (@, #, &, brackets, and similar).",
  "alphabet.lensBlurb.35":
    "Castilian spelling was systematized around Nebrija (1492). ñ writes the palatal nasal /ɲ/ (as in año), historically from Latin nn.",
  "alphabet.lensBlurb.41":
    "Portuguese orthography grew with Atlantic expansion and later spelling reforms. ã/õ mark nasal vowels; cedilla ç marks /s/ before a/o/u.",
  "alphabet.lensBlurb.45":
    "French accents were fixed through print and Académie spelling norms. They mark vowel quality, historical s (â/ê), and open vs closed e; œ and ç come from Latin and older scribal conventions.",
  "alphabet.lensBlurb.32":
    "Italian stayed close to the Latin letter inventory. Accents mainly mark which syllable is stressed when that would otherwise be ambiguous.",
  "alphabet.lensBlurb.36":
    "Romanian returned to Latin letters in the 19th century after a long period of Cyrillic for church and state. ă/â/î/ș/ț mark central vowels and the consonants /ʃ/ and /ts/.",
  "alphabet.lensBlurb.62":
    "Catalan’s nineteenth-century literary revival fixed a modern Latin norm. The middot in l·l marks a double /l/ (geminate), distinct from single l or Spanish ll.",
  "alphabet.lensBlurb.33":
    "German ä/ö/ü mark fronted vowels from historical umlaut (i-mutation). ß (Eszett) comes from a long-s + z ligature and writes /s/ after long vowels and diphthongs.",
  "alphabet.lensBlurb.34":
    "Dutch standardized through the Statenbijbel and later spelling laws. This lens adds accented vowels é/ë/ï/ö/ü used for stress or vowel quality in loanwords and a few native forms.",
  "alphabet.lensBlurb.37":
    "Danish and Bokmål Norwegian share æ/ø/å for front and rounded vowels that plain a/o/a did not cover once Latin replaced runes in Scandinavia.",
  "alphabet.lensBlurb.38":
    "Swedish uses ä/ö/å for the same broad Nordic vowel needs as Danish/Norwegian, but with ä/ö instead of æ/ø — a spelling split settled in early modern print.",
  "alphabet.lensBlurb.49":
    "Icelandic keeps þ and ð for the voiceless and voiced dental fricatives (/θ/, /ð/) inherited from Old Norse; most other Nordic languages replaced those letters.",
  "alphabet.lensBlurb.40":
    "Finnish literacy spreads from Reformation primers (Agricola). ä/ö mark front vowels; doubled letters mark length, which is contrastive in Finnish.",
  "alphabet.lensBlurb.43":
    "Estonian orthography was modernized in the 19th century alongside Finnish. õ writes a mid back unrounded vowel (/ɤ/) that Finnish does not use the same way.",
  "alphabet.lensBlurb.44":
    "Hungarian took Latin letters in the Middle Ages. ő/ű mark long front rounded vowels; digraphs such as sz/cs/ty write consonants single Latin letters could not cover cleanly.",
  "alphabet.lensBlurb.39":
    "The 1928 reform replaced Ottoman Arabic script with Latin letters chosen to match Turkish vowel harmony — including dotted i and dotless ı as separate phonemes.",
  "alphabet.lensBlurb.46":
    "The Greek alphabet is continuous from antiquity. The 1982 monotonic reform reduced accent marks to a single tonos while keeping α–ω and final sigma (ς).",
  "alphabet.lensBlurb.47":
    "Polish kept Latin under western church literacy. ą/ę mark historical nasal vowels; ł is /w/; ć/ń/ś/ź/ż write palatal or postalveolar consonants.",
  "alphabet.lensBlurb.52":
    "Czech háček letters (č/ř/š/ž and kin) go back to Jan Hus’s reforms, adding marks so Latin could write Slavic palatals and ř without digraph clutter.",
  "alphabet.lensBlurb.57":
    "Slovak spelling was standardized in the nineteenth century beside Czech. ô writes the diphthong /ʊɔ/; ľ writes palatal /ʎ/.",
  "alphabet.lensBlurb.42":
    "Gaj’s nineteenth-century Latin (“Gajica”) gives Croatian and Serbian Latin one letter (or digraph) per sound, including č/ć/đ/š/ž for the affricates and fricatives.",
  "alphabet.lensBlurb.53":
    "Slovenian used Latin under Habsburg schooling. č/š/ž write the postalveolar consonants shared with neighboring South Slavic Latin orthographies.",
  "alphabet.lensBlurb.54":
    "Russian Cyrillic descends from Church Slavonic. Peter’s civil-script reform and later updates produced the modern set, including ё and the hard/soft signs.",
  "alphabet.lensBlurb.55":
    "Ukrainian Cyrillic marks sounds that differ from Russian spelling: ї /ji/, є /je/, and ґ /g/ (distinct from г /ɦ/).",
  "alphabet.lensBlurb.58":
    "Belarusian Cyrillic was standardized in the twentieth century. ў writes a short /w/-like vowel (as in воўк), absent from Russian orthography.",
  "alphabet.lensBlurb.56":
    "Bulgarian was an early literary center for Cyrillic. Modern spelling uses ъ as a full vowel and no longer includes several older Slavic letters.",
  "alphabet.lensBlurb.59":
    "Macedonian standard Cyrillic was codified after WWII. ѓ/ќ (and similar letters) write palatal stops that neighboring standards spell differently.",
  "alphabet.lensBlurb.61":
    "Vuk Karadžić’s Serbian Cyrillic is mapped one-to-one with Latin Gajica — the same phonemic inventory in the other historical script.",
  "alphabet.lensBlurb.50":
    "Latvian’s modern Latin orthography solidified around 1908–1922. Macrons (ā/ē/ī/ū) mark long vowels; ģ/ķ/ļ/ņ mark palatals.",
  "alphabet.lensBlurb.51":
    "Lithuanian has used Latin print for centuries. ą/ę/į/ų reflect historical nasal vowels; ė and ū/ų help mark vowel quality and length still contrastive in the language.",
  "alphabet.lensBlurb.31":
    "The 1908 Congress of Manastir adopted today’s Latin standard for Albanian. ç and ë write /tʃ/ and the mid central vowel /ə/.",
  "alphabet.lensBlurb.64":
    "Welsh has a continuous Latin literary tradition from the Middle Ages. Circumflexes (â/ê/î/ô/û/ŵ/ŷ) mark long vowels, including on w and y when they function as vowels.",
  "alphabet.lensBlurb.65":
    "Irish moved from Ogham and later Gaelic type to a simplified Latin orthography. The fada (á/é/í/ó/ú) marks long vowels.",
  "alphabet.lensBlurb.63":
    "Basque has been written in Latin letters since the late Middle Ages. ñ writes /ɲ/; ç appears in established spellings such as Frantses borrowings and some names.",
  "alphabet.lensBlurb.66":
    "Maltese standardized a Latin alphabet in the 1920s. ċ/ġ/ż write affricates and /z/; ħ writes a voiceless pharyngeal fricative from its Arabic-derived consonant set.",
  "alphabet.lensBlurb.67":
    "Mesrop Mashtots is traditionally credited with creating Armenian letters c. 405 so scripture and liturgy could be written in Armenian rather than only Greek or Syriac.",
  "alphabet.lensBlurb.68":
    "Mkhedruli is the modern Georgian letter forms used for ordinary writing. The alphabet is indigenous to Georgian, developed separately from Latin and Cyrillic.",
  "alphabet.lensBlurb.30":
    "Hebrew square script, right-to-left. Final forms (ך/ם/ן/ף/ץ) are separate glyphs — the usual printed inventory plus space, comma, and period.",
  "alphabet.lensBlurb.69":
    "Arabic abjad letters as abstract Unicode characters. Browser shaping (Noto Sans Arabic) joins them when the page is set right-to-left; hamza is included as a free glyph.",
  "alphabet.lensBlurb.70":
    "Persian (Farsi) extends Arabic with پ چ ژ گ. Same RTL joining behaviour as the Arabic lens; the lens id differs so shelves are a different projection.",
  "alphabet.lensBlurb.71":
    "N’Ko letters for Manding. Right-to-left and shaped by Noto Sans NKo — an African alphabet invented in the twentieth century, not a Latin transcription.",
  "alphabet.lensBlurb.234":
    "Amharic fidel: curated Geʿez syllabographs (common consonant–vowel orders). One character is one syllable cell — not Latin letters.",
  "alphabet.lensBlurb.72":
    "Kiswahili commonly writes with plain a–z. Same glyphs as Basile, different lens id — a parallel alphabet lens for the coastal lingua franca.",
  "alphabet.lensBlurb.73":
    "Afrikaans Latin orthography adds several vowel accents (ê/ë/ô/…) used in standard spelling.",
  "alphabet.lensBlurb.74":
    "Hausa Latin (Boko) includes hooked letters ɓ ɗ ƙ and ƴ for sounds English a–z does not write.",
  "alphabet.lensBlurb.75":
    "Yoruba Latin marks open vowels ẹ/ọ, ṣ, and common tone-bearing accented vowels without combining marks.",
  "alphabet.lensBlurb.76":
    "Igbo Latin includes dotted vowels ị ọ ụ and ñ from the Onwu orthography tradition.",
  "alphabet.lensBlurb.77":
    "Wolof Latin uses ë, ñ, and a few accented vowels from Senegalese school orthography.",
  "alphabet.lensBlurb.78":
    "Neo-Tifinagh (IRCAM range): left-to-right Amazigh letters. Distinct from both Arabic and Latin shelves.",
  "alphabet.lensBlurb.95":
    "Japanese kana gojūon — hiragana and katakāna (ゐ/ゑ omitted) plus space, comma, period. No dakuten, handakuten, or small kana; kanji is a separate backlog.",
  "alphabet.lensBlurb.250":
    "Korean Hangul as precomposed syllables (not jamo soup). Top 247 syllables by token frequency from a Korean word-frequency list, plus space, comma, period.",
  "alphabet.lensBlurb.255":
    "Simplified Chinese frequent characters (Jun Da modern list, top 997) plus space, comma, period — 1000 cells under frozen id 255.",
  "alphabet.lensBlurb.1000":
    "Traditional Chinese frequent characters (Jun Da modern list converted with OpenCC s2tw, top 997) plus space, comma, period — 1000 cells; id 1000.",
  "alphabet.lensBlurb.99":
    "Hindi (Devanagari): Independent vowels, consonants, and common consonant–matra clusters (no lone matras). Shared shelf for Marathi/Sanskrit/Nepali orthography.",
  "alphabet.lensBlurb.100":
    "Bengali: Independent vowels, consonants, and common consonant–matra clusters (no lone hasanta).",
  "alphabet.lensBlurb.101":
    "Tamil: Uyir, mei, and curated uyir-mei clusters — not the full table, and no lone pulli tiles.",
  "alphabet.lensBlurb.102":
    "Telugu: Independent vowels, consonants (incl. ళ), and common consonant–matra clusters.",
  "alphabet.lensBlurb.103":
    "Kannada: Independent vowels, consonants (incl. ಳ), and common consonant–matra clusters.",
  "alphabet.lensBlurb.104":
    "Malayalam: Vowels, consonants (incl. ള/ഴ/റ), chillu letters, and common consonant–matra clusters.",
  "alphabet.lensBlurb.105":
    "Gujarati: Independent vowels, consonants (incl. ળ), and common consonant–matra clusters.",
  "alphabet.lensBlurb.106":
    "Punjabi (Gurmukhi): Independent vowels, consonants (incl. ੜ), and common consonant–matra clusters.",
  "alphabet.lensBlurb.107":
    "Odia: Independent vowels, consonants (incl. ଳ), and common consonant–matra clusters.",
  "alphabet.lensBlurb.88":
    "Azerbaijani Latin: ə/ğ/x/ı/ö/ü and kin — the modern school alphabet (no w).",
  "alphabet.lensBlurb.89":
    "Kazakh Latin (modern orthography): ä/ğ/ñ/ū and related letters for Turkic vowels and ŋ.",
  "alphabet.lensBlurb.90":
    "Uzbek Latin: a–z plus modifier letter turned comma ʻ (U+02BB) used in oʻ/gʻ spellings.",
  "alphabet.lensBlurb.91":
    "Turkmen Latin: ä/ň/ž/ý/ö/ü and related letters from the post-Soviet Latin standard.",
  "alphabet.lensBlurb.92":
    "Kyrgyz Cyrillic: Russian base plus ң/ө/ү for ŋ and front rounded vowels.",
  "alphabet.lensBlurb.93":
    "Mongolian Cyrillic (Khalkha): Russian-shaped inventory with ө/ү; no ң.",
  "alphabet.lensBlurb.94":
    "Filipino (modern Latin): a–z plus ñ from Spanish-influenced orthography.",
  "alphabet.lensBlurb.96":
    "Vietnamese Latin: a–z, đ, and precomposed tone vowels (no combining marks).",
  "alphabet.lensBlurb.108":
    "Thai: all consonants × combining vowels/tones as grapheme clusters, plus spacing vowels/signs (no lone combining marks; Noto Sans Thai).",
  "alphabet.lensBlurb.109":
    "Khmer: all consonants × curated dependent vowels as grapheme clusters, plus independent vowels (no lone coeng/marks; Noto Sans Khmer).",
};
