/** Dutch UI — alphabet lens id 34. */
export const nl = {
  "header.aboutTitle": "Over — wat dit is & hoe je dwaalt (opent de gids)",
  "header.gallery": "galerij",
  "header.coordTitle": "klik om naar een willekeurige galerij te springen",
  "header.hash": "hash",
  "header.hashTitle": "klik om de volledige hash van deze galerij te kopiëren",
  "header.steps": "stappen",
  "header.universePlaceholder": "standaarduniversum",
  "header.universeTitle":
    "universum — geef een parallelle bibliotheek een naam (leeg = standaard). Enter om te reizen.",
  "header.universeRandomTitle": "spring naar een willekeurig universum",
  "header.alphabetTitle":
    "alfabetlens —zelfde kamer-hash, andere rugtitels en pagina’s (geen vertaling)",
  "header.actionsTitle": "link kopiëren · exporteren · controleren · zoeken · nieuwe tocht",
  "actions.placeholder": "acties…",
  "actions.copy": "link kopiëren",
  "actions.search": "zoeken…",
  "actions.export": "tocht exporteren",
  "actions.verify": "tocht controleren",
  "actions.reset": "nieuwe tocht",

  "minimap.here": "je bent hier",
  "minimap.sigilTitle": "zegel van deze galerij — klik om de SVG te downloaden",
  "minimap.hint": "klik een uitgang om te bewegen",
  "loading.building": "bibliotheek wordt gebouwd…",
  "loading.failed": "laden mislukt: {err}",

  "footer.wanderings": "dwaaltochten · {n}/{max}",
  "footer.trail":
    "spoor {nodes} knopen · universum {universe} · {alphabet} · gen v{gv}",

  "common.close": "sluiten",
  "common.go": "gaan",
  "common.link": "link",
  "common.you": "jij",
  "common.copied": "gekopieerd!",

  "about.subtitle": "een bewandelbare Bibliotheek van Babel",
  "about.tab.overview": "overzicht",
  "about.tab.alphabets": "alfabetten",
  "about.tab.wander": "dwalen",
  "about.tab.books": "boeken",
  "about.tab.more": "meer",
  "about.tabsLabel": "Gidssecties",
  "about.alphabets.h": "Alfabetlenzen",
  "about.alphabets.intro":
    "Elke set is een <b>symbolenwet</b> voor rugtitels en pagina’s — geen apart universum. Dezelfde kamer-hash en zegel; een nieuwe soort vertaling. Zoeken en titels accepteren alleen symbolen van de actieve lens. Het menu in de kop wisselt tussen deze sets.",
  "about.alphabet.meta": "{n} glyphs · &amp;a={id}",

  "about.overview": `
<p>Een eindeloze bibliotheek om door te lopen. Elke zeshoekige galerij heeft
<b>vier wanden met boekenplanken</b> (700 boeken) en <b>twee gangen</b> naar de volgende
galerij, plus een <b>trap</b> omhoog en omlaag — vier zetten vanaf overal.</p>
<p>Er wordt niets bewaard. Elke galerij wordt <b>ter plekke gegenereerd</b> uit haar
adres; de Bibliotheek is oneindig en bijna gewichtloos: alleen jouw
<i>pad</i> blijft in de browser.</p>
<h4>Drie dingen in het adres</h4>
<ul>
<li><b>Universum</b> — parallelle oneindige bibliotheken. Geef er een een naam in de kop (leeg =
standaard). Dezelfde kamernummers, geheel andere boeken. Je dwaaltochten gaan
door over universums.</li>
<li><b>Kamer</b> — <b>galerij (z,&nbsp;n)</b> plus <b>hash</b> en <b>zegel</b>.
De hash noemt de kamer zelf (niet de tekst op de planken). Zelfde universum +
zelfde coördinaten → altijd dezelfde vingerafdruk.</li>
<li><b>Alfabetlens</b> — Borges, Basile, Basile++ / Basile# of een taalset
(zie <b>alfabetten</b>: Romaans, Germaans, Oeraals, Turkse talen, Helleens, …).
Wisselen herschrijft elke rug en pagina onder dezelfde hash en zegel. Je spoor blijft.
<i>Geen vertaling.</i> Dezelfde kamer, andere tong. De interface spreekt die tong
wanneer er een taalpakket bestaat (Duits, Nederlands, …).</li>
</ul>
<h4>Inspiratie</h4>
<p class="dim">
<a href="https://en.wikipedia.org/wiki/The_Library_of_Babel"
target="_blank" rel="noopener noreferrer">Jorge Luis Borges, „De Bibliotheek van Babel” (1941).</a><br />
<a href="https://libraryofbabel.info/" target="_blank" rel="noopener noreferrer">Jonathan Basile, <i>libraryofbabel.info</i></a>
</p>`,

  "about.wander": `
<h4>Zo dwaal je</h4>
<ul>
<li><b>LIB·OF·BABEL</b> (kop) opent deze gids altijd.</li>
<li>Gebruik de <b>minikaart</b> — klik een uitgangs-hash. <kbd>pijltjestoetsen</kbd> lopen gangen en trappen (tenzij een dialoog open is).</li>
<li>Klik <b>galerij&nbsp;(z,&nbsp;n)</b> om ergens te <b>springen</b>.</li>
<li>Elke galerij heeft een <b>zegel</b> — een embleem uit de <b>kamer</b>-hash. Zelfde plek, zelfde zegel; klik om de <b>SVG</b> te laden.</li>
<li>Typ een <b>universum</b>naam of gooi <b>&#9860;</b>; leeg is standaard. Zelfde coördinaten, nieuwe bibliotheek — spoor blijft.</li>
<li>Het <b>alfabet</b>menu wisselt alleen de <b>lens</b> — nieuwe ruggen en tekst; hash, zegel en spoor blijven. Taallenzen wisselen ook de interface als er een pakket is.</li>
<li><b>acties…</b> → <b>link kopiëren</b> (of kop-<b>hash</b>) voor een permalink; <code>&amp;a=</code> herstelt je lens.</li>
<li><b>acties…</b> → <b>zoeken…</b> — kies <b>inhoud</b> of <b>titel</b>, vind coördinaten, spring ernaartoe (zie <b>meer</b>).</li>
<li><b>dwaaltochten</b> (voet, laatste {max}) — recente stappen met universum + alfabet; <b>tocht exporteren</b> bewaart het hele pad als JSON.</li>
</ul>`,

  "about.books": `
<h4>Een boek lezen</h4>
<ul>
<li>Klik een gekleurde rug; <kbd>←</kbd> <kbd>→</kbd> bladeren zolang de lezer open is.</li>
<li>De rug die je laatst sloot is <b>rood</b> omlijnd, zodat je hem terugvindt.</li>
<li><b>kleur</b> tekent de pagina als een teken-kleurenkaart — elk symbool een vierkant, getint door de galerij-hash.</li>
<li><b>link</b> kopieert een permalink naar dit boek op deze pagina.</li>
<li><b>opslaan…</b> → <b>boek lenen</b> — volledige tekst (~1,3&nbsp;MB .txt)</li>
<li><b>opslaan…</b> → <b>boekbeeld</b> — heel boek als PNG-kleurenkaart</li>
</ul>`,

  "about.more": `
<h4>De cijfers in de kop</h4>
<p class="dim">
<b>galerij (z, n)</b> is je coördinaat. <b>hash</b> is de
<b>BLAKE3</b>-vingerafdruk van de kamer — permalink en bewijs voor deze plek in dit
universum. Hij verandert <b>niet</b> als je van alfabet wisselt; de lens herschrijft
alleen wat de planken zeggen. <b>Dwaaltochten</b> houdt je laatste
{max} stappen (universum + alfabetlens bevroren);
de kamer-hash van elke stap leeft in het volledige spoor. <b>acties…</b> biedt ook
<b>tocht controleren</b> en <b>nieuwe tocht</b>.
</p>
<h4>Zoeken op inhoud</h4>
<p class="dim">
Onder <b>acties…</b> → <b>zoeken…</b> laat de keuzelijst op
<b>inhoud</b>. Plak een zin (tot één heel boek — ~1,3&nbsp;miljoen
tekens); de bibliotheek noemt galerij, plank, boek en pagina(’s) waar die al leeft —
en opent hem. Lange zinnen lopen door opeenvolgende pagina’s.
Zoeken gebruikt de <b>huidige alfabetlens</b> en blijft in het universum waar je staat.
Ongeldige tekens worden rood gemarkeerd.
</p>
<h4>Zoeken op titel</h4>
<p class="dim">
Zelfde dialoog — kies <b>titel</b> i.p.v. <b>inhoud</b>. Typ een rugtitel
(tot <b>24 tekens</b>, dezelfde lensregels). De bibliotheek vindt galerij en plank
onder het actieve alfabet, zet de titel op de canonieke rug en springt ernaartoe.
Handig als je een rug kent, geen pagina.
</p>`,

  "history.title": "dwaaltochten",
  "history.meta": "{shown} van {total} stappen · nieuwste eerst",

  "verify.title": "tocht controleren",
  "verify.meta": "zet een geëxporteerde tocht neer om hem na te lopen en te bewijzen",

  "search.headContent": "zoeken op inhoud",
  "search.headTitle": "zoeken op titel",
  "search.metaContent":
    "Typ een zin — de bibliotheek vindt waar die al bestaat (opgevuld met spaties tot een volle pagina).",
  "search.metaTitle":
    "Typ een rugtitel — de bibliotheek vindt galerij en plank.",
  "search.label": "zoeken",
  "search.kindTitle": "zoek rugtitels of pagina-inhoud",
  "search.kindContent": "inhoud",
  "search.kindTitleOpt": "titel",
  "search.placeholderContent": "vergeef me want ik heb gezondigd",
  "search.placeholderTitle": "karmozijnen rug",
  "search.find": "vinden",
  "search.hintContent":
    "gebruikt de huidige alfabetlens · tot ~1,3M tekens (één boek)",
  "search.hintTitle":
    "gebruikt de huidige alfabetlens · tot {n} tekens (rugtitel)",

  "jump.title": "spring naar een galerij",
  "jump.subtitle":
    "typ willekeurige coördinaten — het rooster is enorm; spring zo ver je wilt.",

  "book.saveTitle": "neem dit boek mee",
  "book.savePlaceholder": "opslaan…",
  "book.borrow": "boek lenen",
  "book.image": "boekbeeld",
  "book.linkTitle": "kopieer een link naar dit boek op deze pagina",
  "book.viewTitle": "wisselen tussen tekst en teken-kleurweergave van de pagina",
  "book.viewColor": "kleur",
  "book.viewText": "tekst",
  "book.prev": "‹ vorige",
  "book.next": "volgende ›",
  "book.pageInd": "pagina {page} / {total}",
  "book.pagePlaceholder": "pagina",
  "book.wall": "Wand {n}",
  "book.wallBook": "Wand {n} · boek {book}",

  "image.save": "png opslaan",
  "image.saveTitle": "sla deze kleurenkaart van het hele boek op als PNG",

  "alphabet.symbolLabel": "{name} · {n} glyphs",
  "alphabet.group.Latin base": "Latijnse basis",
  "alphabet.group.Romance": "Romaans",
  "alphabet.group.Germanic": "Germaans",
  "alphabet.group.Uralic": "Oeraals",
  "alphabet.group.Turkic": "Turkse talen",
  "alphabet.group.Hellenic": "Helleens",
  "alphabet.group.Slavic": "Slavisch",
  "alphabet.group.Baltic": "Baltisch",
  "alphabet.group.Albanian": "Albanees",
};
