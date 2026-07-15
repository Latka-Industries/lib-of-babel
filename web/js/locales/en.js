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
  "loading.building": "building library…",
  "loading.failed": "failed to load: {err}",

  "footer.wanderings": "wanderings · {n}/{max}",
  "footer.gallery": "gallery",
  "footer.coordTitle": "click to jump to any gallery",
  "footer.hash": "hash",
  "footer.hashTitle": "click to copy this gallery's full hash",
  "footer.steps": "steps",

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
<li>The <b>alphabet</b> menu switches the <b>lens only</b> — new spines and text; hash, sigil, and trail stay.</li>
<li><b>actions…</b> → <b>copy link</b> (or click the footer <b>hash</b>) for a permalink; <code>&amp;a=</code> restores the lens you were using.</li>
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
<h4>The numbers in the footer</h4>
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

  "about.githubTitle": "GitHub — Latka-Industries/lib-of-babel",

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
  "search.go": "go there",
  "search.result.gallery": "gallery ({z}, {n})",
  "search.result.coords":
    "universe {universe} · wall {wall} · shelf {shelf} · book {book} · {detail}",
  "search.result.page": "page {n}",
  "search.result.pages": "pages {start}–{end}",
  "search.result.chars": "{n} chars",
  "search.result.detailContent": "{pages} · {chars} · alphabet {alphabet}",
  "search.result.detailTitle": "title {query} · {chars} · alphabet {alphabet}",
  "search.error.invalid":
    "invalid character for this alphabet ({alphabet} only): {shown}",
  "search.error.invalidPlural":
    "invalid characters for this alphabet ({alphabet} only): {shown}",
  "search.error.invalidGeneric": "invalid characters for this alphabet",
  "search.error.moreKinds": " (+{n} more kinds)",
  "search.error.empty": "search text is empty",
  "search.error.tooLong": "text too long (max {n} characters — one book)",
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
  "book.wallBook": "Wall {n} · book {book} · {title}",

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
    "Geʿez (Ethiopic) script is an abugida: each character is a consonant–vowel syllable. Amharic, Ethiopia’s working language, uses a large fidel inventory; this lens is a curated set of common syllabographs under the Feistel size limit.",
  "alphabet.blurb.African Latin":
    "Many African languages use Latin orthographies shaped by missionaries, colonial schooling, and later national reforms. Extra letters (ɓɗƙ, ẹọṣ, ịụ, …) mark sounds plain a–z cannot write. Swahili often needs no extras beyond a–z.",
  "alphabet.blurb.Berber":
    "Tifinagh (Neo-Tifinagh / IRCAM) is the modern official Amazigh alphabet in Morocco, revived from older Libyco-Berber signs. Letters here are left-to-right geometric forms distinct from Latin and Arabic.",
  "alphabet.blurb.CJK":
    "East Asian pages under the Feistel 255-glyph cap: Japanese kana (gojūon, no dakuten), curated Hangul syllables, and a Simplified Chinese frequent-character pack. Full Unihan or full Hangul is impossible as one lens.",
  "alphabet.blurb.Indic":
    "Brahmic abugidas of India as grapheme-cluster cells: independent vowels and consonants, plus curated consonant–matra units (no lone combining marks). Feistel still cannot store full conjunct akshara tables; pages are cluster noise, not composed orthography.",
  "alphabet.blurb.Mongolic":
    "Mongolic languages of the steppe. Modern Khalkha Mongolian in Mongolia uses a Cyrillic alphabet with ө and ү for front rounded vowels — same civil-script family as Russian, different Feistel inventory.",
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
    "Persian (Farsi) extends Arabic with پ چ ژ گ. Same RTL joining behaviour as the Arabic lens; the Feistel key differs so shelves are a different projection.",
  "alphabet.lensBlurb.71":
    "N’Ko letters for Manding. Right-to-left and shaped by Noto Sans NKo — an African alphabet invented in the twentieth century, not a Latin transcription.",
  "alphabet.lensBlurb.234":
    "Amharic fidel: curated Geʿez syllabographs (common consonant–vowel orders). One character is one syllable cell — not Latin letters.",
  "alphabet.lensBlurb.72":
    "Kiswahili commonly writes with plain a–z. Same glyphs as Basile, different lens id — a parallel Feistel alphabet for the coastal lingua franca.",
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
    "Simplified Chinese frequent characters (Jun Da modern list, top 252) plus space, comma, period. Traditional and fuller Unihan packs stay backlog.",
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
    "Thai: consonants, spacing vowels/signs, and curated consonant–vowel/tone clusters (no lone combining marks; Noto Sans Thai).",
  "alphabet.lensBlurb.109":
    "Khmer: consonants, independent vowels, and curated consonant–vowel clusters (no lone coeng/marks; Noto Sans Khmer).",
};
