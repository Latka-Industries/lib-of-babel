/** Dutch UI — alphabet lens id 34. */
export const nl = {
  "header.aboutTitle": "Over — wat dit is & hoe je dwaalt (opent de gids)",
  "header.universePlaceholder": "standaarduniversum",
  "header.universeTitle":
    "universum — geef een parallelle bibliotheek een naam (leeg = standaard). Enter om te reizen.",
  "header.universeRandomTitle": "spring naar een willekeurig universum",
  "header.alphabetTitle":
    "alfabetlens —zelfde kamer-hash, andere rugtitels en pagina’s (geen vertaling)",
  "alphabet.picker.h": "Alfabetlens",
  "alphabet.picker.sub": "zelfde kamer-hash · andere rugtitels en pagina’s",
  "header.actionsTitle": "link kopiëren · exporteren · controleren · zoeken · nieuwe tocht",
  "header.themeToLight": "overschakelen naar lichte modus",
  "header.themeToDark": "overschakelen naar donkere modus",
  "header.menuOpenTitle": "menu openen",
  "header.menuCloseTitle": "menu sluiten",
  "header.menuUniverse": "universum",
  "header.menuAlphabet": "alfabet",
  "header.menuActions": "acties",
  "header.menuTheme": "thema",
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
  "footer.gallery": "galerij",
  "footer.coordTitle": "klik om naar een willekeurige galerij te springen",
  "footer.hash": "hash",
  "footer.hashTitle": "klik om de volledige hash van deze galerij te kopiëren",
  "footer.steps": "stappen",
  "footer.help": "- Help",
  "footer.helpTitle": "Help — open de gids (?)",

  "common.close": "sluiten",
  "common.go": "gaan",
  "common.link": "link",
  "common.copied": "gekopieerd!",

  "about.subtitle": "een bewandelbare Bibliotheek van Babel",
  "about.tab.overview": "overzicht",
  "about.tab.alphabets": "alfabetten",
  "about.tab.wander": "dwalen",
  "about.tab.books": "boeken",
  "about.tab.search": "zoeken",
  "about.tab.more": "meer",
  "about.tabsLabel": "Gidssecties",
  "about.alphabets.h": "Alfabetlenzen",
  "about.alphabets.intro":
    "Elke set is een <b>symbolenwet</b> voor rugtitels en pagina’s — geen apart universum. Dezelfde kamer-hash en zegel; <i>een nieuwe soort vertaling</i>. Zoeken en titels accepteren alleen symbolen van de actieve lens. Blader hieronder per familie. Een markering <b>interface · …</b> betekent dat menu’s en labels mee wisselen. <b>Bronnen</b> onder elke familieblurb linken naar overzichtsartikelen.",
  "about.alphabets.indexLabel": "Familie",
  "about.alphabets.refs": "Bronnen",
  "about.alphabet.meta": "{n} glyphs · &amp;a={id}",
  "about.alphabet.uiPack": "interface · {name}",

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
<li><b>Alfabetlens</b> — wisselt de symbolenset voor ruggen en pagina’s onder
dezelfde hash en zegel; je spoor blijft. Zie het tabblad <b>alfabetten</b>
voor elk preset (en welke ook de sitetaal wisselen).</li>
</ul>
<h4>Inspiratie</h4>
<p class="dim">
<a href="https://sites.evergreen.edu/politicalshakespeares/wp-content/uploads/sites/226/2015/12/Borges-The-Library-of-Babel.pdf"
target="_blank" rel="noopener noreferrer">Jorge Luis Borges, „De Bibliotheek van Babel” (1941).</a><br />
<a href="https://libraryofbabel.info/" target="_blank" rel="noopener noreferrer">Jonathan Basile, <i>libraryofbabel.info</i></a>
</p>`,

  "about.wander": `
<h4>Zo dwaal je</h4>
<ul>
<li><kbd>LIB·OF·BABEL</kbd>, <kbd>?&nbsp;-&nbsp;Help</kbd> of <kbd>?</kbd> openen deze gids altijd.</li>
<li>De kop-<span class="ui">thema</span>knop (zon/maan) wisselt licht en donker; de keuze blijft in deze browser.</li>
<li>Gebruik de <b>minikaart</b> — klik een uitgangs-hash. <kbd>pijltjestoetsen</kbd> lopen gangen en trappen (tenzij een dialoog open is).</li>
<li>Klik <span class="ui">galerij&nbsp;(z,&nbsp;n)</span> om ergens te springen.</li>
<li>Elke galerij heeft een <b>zegel</b> — een embleem uit de <b>kamer</b>-hash. Zelfde plek, zelfde zegel; klik om de <b>SVG</b> te laden.</li>
<li>Typ een <span class="ui">universum</span>naam of gooi <span class="ui">&#9860;</span>; leeg is standaard. Zelfde coördinaten, nieuwe bibliotheek — spoor blijft.</li>
<li>Het <span class="ui">alfabet</span>menu wisselt alleen de <b>lens</b> — nieuwe ruggen en tekst; hash, zegel en spoor blijven.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-alphabets">ALFABETTEN</button></li>
<li>Klik een gekleurde rug op een wand om een boek te openen.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-books">BOEKEN</button></li>
<li><span class="ui">acties…</span> → <span class="ui">link kopiëren</span> (of voet-<span class="ui">hash</span>) voor een permalink; <code>&amp;a=</code> herstelt je lens.</li>
<li><span class="ui">acties…</span> → <span class="ui">zoeken…</span> — <span class="ui">tekst</span>, <span class="ui">foto</span> of <span class="ui">Babelgram</span>; spring ernaartoe.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-search">ZOEKEN</button></li>
<li><span class="ui">dwaaltochten</span> (voet, laatste {max}) — recente stappen met universum + alfabet; <span class="ui">tocht exporteren</span> bewaart het hele pad als JSON.</li>
</ul>`,

  "about.books": `
<h4>Een boek lezen</h4>
<ul>
<li>Klik een gekleurde rug; <kbd>←</kbd> <kbd>→</kbd> bladeren zolang de lezer open is.</li>
<li>De rug die je laatst sloot is <b>rood</b> omlijnd, zodat je hem terugvindt.</li>
<li><span class="ui">kleur</span> tekent de pagina als een teken-kleurenkaart — elk symbool een vierkant, getint door de galerij-hash.</li>
<li><span class="ui">link</span> kopieert een permalink naar dit boek op deze pagina.</li>
<li><span class="ui">opslaan…</span> → <span class="ui">boek lenen</span> — volledige tekst (~1,3&nbsp;MB .txt)</li>
<li><span class="ui">opslaan…</span> → <span class="ui">boekbeeld</span> — heel boek als PNG-kleurenkaart</li>
</ul>`,

  "about.search": `
<h4>op inhoud</h4>
<p class="dim">
Onder <span class="ui">acties…</span> → <span class="ui">zoeken…</span> blijf op het tabblad <span class="ui">tekst</span> met
<span class="ui">inhoud</span>. Plak een zin (tot één heel boek — ~1,3&nbsp;miljoen
tekens); de bibliotheek noemt galerij, plank, boek en pagina(’s) waar die al leeft —
en opent hem. Lange zinnen lopen door opeenvolgende pagina’s.
Zoeken gebruikt de <b>huidige alfabetlens</b> en blijft in het universum waar je staat.
Ongeldige tekens worden rood gemarkeerd.
</p>
<h4>op titel</h4>
<p class="dim">
Zelfde <span class="ui">tekst</span>-tab — kies <span class="ui">titel</span> i.p.v. <span class="ui">inhoud</span>. Voer tot
<b>24 tekens</b> (actieve lensregels). Die tekenreeks is een
<b>ruglabel</b>: de bibliotheek springt naar de galerij en plank waar die
titel onder het huidige alfabet hoort, toont hem op de rug, en opent
pagina&nbsp;1.
</p>
<h4>op Babelgram</h4>
<p class="dim">
Tab <span class="ui">Babelgram</span>: gestempelde PNG van <span class="ui">opslaan…</span> → <span class="ui">boekbeeld</span>.
<b>Zelfde universum</b> als de export → dat <b>exacte boek</b>.
<b>Ander universum</b> → dezelfde <b>Babelgram-afdruk</b> op een nieuw adres,
maar <b>andere boekinhoud</b>. <span class="ui">ga erheen</span> opent een nieuw tabblad.
<span class="ui">check diff</span> veegt <b>reprojectie</b> (stempel-accentdecode) tegen
<b>diff</b> (|upload − reprojectie|) — bij exacte decode is de diff-kant bijna zwart.
</p>
<h4>op fotomozaïek</h4>
<p class="dim">
Tab <span class="ui">foto</span>: upload een willekeurig beeld. Het wordt uitgerekt naar het
volboek-kleurrooster, geprojecteerd op de <b>huidige alfabetlens</b> — de
<b>letterkleurenkaart</b> (Babelgram-stijl) of een <b>luma-helling</b> — en gerankt op
<b>rms % / mae / corr</b>. Kies een treffer —
<span class="ui">ga erheen</span> opent een nieuw tabblad.
</p>`,

  "about.more": `
<h4>De cijfers in de voet</h4>
<p class="dim">
<span class="ui">galerij (z, n)</span> is je coördinaat. <span class="ui">hash</span> is de
<b>BLAKE3</b>-vingerafdruk van de kamer — permalink en bewijs voor deze plek in dit
universum. Hij verandert <b>niet</b> als je van alfabet wisselt; de lens herschrijft
alleen wat de planken zeggen. <span class="ui">dwaaltochten</span> houdt je laatste
{max} stappen (universum + alfabetlens bevroren) — ook
<span class="ui">universum</span>-wissels in dezelfde galerij (◇), zonder gangzet;
de kamer-hash van elke stap leeft in het volledige spoor.
</p>
<h4>Tocht exporteren &amp; controleren</h4>
<p class="dim">
<span class="ui">acties…</span> → <span class="ui">tocht exporteren</span> downloadt je hele pad als JSON
(kamers, hashes, universums, lenzen). <span class="ui">tocht controleren</span> loopt een
geëxporteerd bestand na en bewijst elke stap. <span class="ui">nieuwe tocht</span> wist het spoor
en begint opnieuw in deze browser.
</p>
<h4>Wat in deze browser blijft</h4>
<p class="dim">
De Bibliotheek zelf wordt nooit gedownload — alleen je <b>pad</b>,
<span class="ui">thema</span>-voorkeur, en een “gids gezien”-vlag blijven hier. Babelgram-<span class="ui">ga erheen</span>
naar een ander universum kan de afdruk kort lokaal in <b>deze</b> browser
doorgeven zodat het nieuwe tabblad hem opent; <span class="ui">link kopiëren</span> blijft
alleen het adres.
</p>
<h4>Links delen</h4>
<p class="dim">
Een permalink bevat galerij <b>(z,&nbsp;n)</b>, kamer-<b>hash</b>, alfabet
<code>&amp;a=</code>, optioneel universum <code>&amp;u=</code>, soms boekpagina
of een zoekzin. Zelfde adres → altijd dezelfde kamer. De lens wisselen houdt
de hash; alleen de planken herschrijven zich.
</p>`,

  "about.githubTitle": "GitHub — Latka-Industries/lib-of-babel",

  "history.title": "dwaaltochten",
  "history.meta": "{shown} van {total} stappen · nieuwste eerst",

  "verify.title": "tocht controleren",
  "verify.meta": "zet een geëxporteerde tocht neer om hem na te lopen en te bewijzen",
  "verify.openLastRoom": "Laatste kamer openen in de huidige bibliotheek",

  "legacy.gv.title": "oudere bibliotheeklink",
  "legacy.gv.bodyAddress":
    "Deze link komt uit een oudere bibliotheekversie. De paginatekst op deze coördinaten is niet hetzelfde — we houden hetzelfde plankadres in de huidige bibliotheek.",
  "legacy.gv.bodyQuery":
    "Deze link komt uit een oudere bibliotheekversie. We kunnen dezelfde zoekzin onder de huidige generator plaatsen (mogelijk een andere plank).",
  "legacy.gv.bodyRelocated":
    "Deze link komt uit een oudere bibliotheekversie. We hebben je zoekzin opnieuw gelokaliseerd onder de huidige generator — dezelfde woorden, mogelijk een nieuwe plank.",
  "legacy.gv.bodyJourney":
    "Deze browser heeft nog wandelingen van generator v{old}. Kamerhashes en paginatekst kunnen afwijken van v{cur}. Doorgaan houdt deze plank en start een nieuw spoor, of wis lokale data en herlaad.",
  "legacy.gv.continue": "Doorgaan",
  "legacy.gv.wipe": "Lokale data wissen & herladen",
  "legacy.gv.skipSession": "Niet meer tonen deze sessie",

  "search.head": "zoeken",
  "search.headContent": "zoeken op inhoud",
  "search.headTitle": "zoeken op titel",
  "search.headMosaic": "zoeken op kleurenmozaïek",
  "search.metaText":
    "Vind een zin, match een fotomozaïek, of open een Babelgram-boekbeeld.",
  "search.metaContent":
    "Typ een zin — de bibliotheek vindt waar die al bestaat (opgevuld met spaties tot een volle pagina).",
  "search.metaTitle":
    "Typ een rugtitel — de bibliotheek vindt galerij en plank.",
  "search.metaMosaic":
    "Upload een beeld → alfabetmozaïek → boeken ranken op rms / mae / corr.",
  "search.tabsLabel": "Zoekmodus",
  "search.tab.text": "tekst",
  "search.tab.photo": "foto",
  "search.tab.babel": "Babelgram",
  "search.tab.image": "foto",
  "search.headBabel": "zoeken op Babelgram",
  "search.metaBabel":
    "Zelfde universum → exact exportboek. Ander universum → dezelfde Babelgram-afdruk, andere inhoud.",
  "search.hintBabel": "",
  "search.babel.honesty":
    "Upload een gestempelde PNG van opslaan → boekbeeld (1:1-rooster + lob:babel). Zelfde universum als de export → dat exacte boek. Ander universum → dezelfde Babelgram-afdruk op een nieuw adres, maar andere boekinhoud. ga erheen opent een nieuw tabblad. Kopieerlink is alleen het adres (geen afdruk-handoff).",
  "search.babel.find": "boek vinden",
  "search.babel.progress": "Babelgram decoderen…",
  "search.babel.upload": "Babelgram-PNG uploaden",
  "search.babel.original": "Babelgram-export",
  "search.babel.gridHint":
    "Vereist een gestempelde verliesvrije PNG van precies {w}×{h} (opslaan → boekbeeld).",
  "search.babel.fileMeta": "{name} · exact {w}×{h} Babelgram-rooster",
  "search.babel.sizeMismatch":
    "Verkeerde maat ({sw}×{sh}). Babelgrams moeten precies {w}×{h} zijn — opnieuw exporteren via opslaan → boekbeeld.",
  "search.babel.needExact": "upload eerst een exacte {w}×{h} Babelgram-PNG",
  "search.babel.notBabel":
    "Geen Babelgram-boekbeeld-PNG. Opnieuw exporteren via opslaan → boekbeeld.",
  "search.babel.nameMismatch":
    "bestandsnaam-coördinaten komen niet overeen met de PNG-stempel",
  "search.babel.originLine":
    "export-oorsprong · {universe} (seed {u}) · galerij {coords} · boek {book} · {alphabet}",
  "search.babel.universeUnknown": "seed {seed}",
  "search.babel.originNote":
    "Locate-bestemming verschilt van de export-oorsprong (zelfde cellen → nieuwe coördinaten; ander universum → andere coördinaten).",
  "search.babel.originNoteSame":
    "Zelfde universum als de export — dit is het exacte boek. ga erheen opent een nieuw tabblad.",
  "search.babel.originNoteOther":
    "Ander universum — dezelfde Babelgram-afdruk op een nieuw adres, andere boekinhoud. ga erheen opent een nieuw tabblad met die afdruk. Kopieerlink is alleen het adres.",
  "search.babel.resultsIntro":
    "Babelgram-locate in {universe} (seed {seed}) — exacte accentdecode:",
  "search.babel.resultsIntroSame":
    "Exact boek in {universe} (seed {seed}) — zelfde universum als de export:",
  "search.babel.resultsIntroOther":
    "Zelfde Babelgram-afdruk in {universe} (seed {seed}):",
  "search.babel.thumbAlt": "geüploade Babelgram",
  "search.babel.diffAlt": "decode-verschil (|upload − reprojectie|)",
  "search.babel.exactOk": "exacte decode",
  "search.babel.seal": "inhoudszegel {seal}",
  "search.babel.diffCaption": "diff",
  "search.babel.compare.title": "vergelijken",
  "search.babel.compare.hint":
    "veeg reprojectie ↔ diff — bij exacte decode is de diff-kant bijna zwart",
  "search.babel.compare.result": "reprojectie",
  "search.babel.compare.diff": "diff",
  "search.babel.compare.sliderAria": "veeg tussen reprojectie en diff",
  "search.babel.compare.checkDiff": "check diff",
  "search.babel.metric.rms": "rms {n}%",
  "search.babel.metric.mae": "mae {n}",
  "search.babel.metric.corr": "corr {n}",
  "search.babel.tip.rms":
    "Root-mean-square RGB-fit van upload vs. stempel-accent-reprojectie. fit% = 100 × (1 − √(gemiddelde((ΔR²+ΔG²+ΔB²)/3) / 255²)). Ideaal ≈ 100%.",
  "search.babel.tip.mae":
    "Gemiddelde absolute RGB-fout: gemiddelde((|ΔR|+|ΔG|+|ΔB|)/3) op schaal 0–255. Ideaal ≈ 0.",
  "search.babel.tip.corr":
    "Pearson-correlatie van gepaarde RGB-samples tussen upload en reprojectie. Ideaal ≈ 1.",
  "search.babel.tip.diff":
    "Pixelgewijs |upload − reprojectie| onder stempelaccent. Ideaal: bijna zwart (alles nul).",
  "search.babel.tip.seal":
    "Korte SHA-256 van de gedecodeerde boektekst. Zelfde afdruk ⇒ zelfde zegel in elk universum.",
  "search.babel.tip.exactOk":
    "Decode lijkt exact: rms ≥ 99,9%, mae < 0,5 en corr ≥ 0,999.",
  "search.babel.confirmHint":
    "Beelden zijn ruizig — vertrouw rms % (~100), mae (~0), corr (~1), bijna-zwarte diff-veeg en inhoudszegel.",
  "search.label": "zoeken",
  "search.kindTitle": "zoek rugtitels of pagina-inhoud",
  "search.kindContent": "inhoud",
  "search.kindTitleOpt": "titel",
  "search.placeholderContent": "een meetsysteem nee",
  "search.placeholderTitle": "karmozijnen rug",
  "search.find": "vinden",
  "search.count": "{n} / {max}",
  "search.countTip": "{n} alfabetcellen van {max} toegestaan",
  "search.hintContent":
    "gebruikt de huidige alfabetlens · tot één vol boek",
  "search.hintTitle":
    "gebruikt de huidige alfabetlens · tot {n} rugtitel-cellen",
  "search.hintMosaic":
    "volboek-kleurrooster · huidig alfabet → mozaïek → toptreffers op rms / mae / corr",
  "search.mosaic.find": "treffers vinden",
  "search.mosaic.searching": "zoeken…",
  "search.mosaic.progress": "mozaïeken projecteren + ranken…",
  "search.mosaic.progressPacks": "paletpakketten scannen…",
  "search.mosaic.progressLocate": "pakket {i} / {n} lokaliseren…",
  "search.mosaic.progressScore": "boekkaart {i} / {n} scoren…",
  "search.mosaic.upload": "beeld uploaden",
  "search.mosaic.honesty":
    "Zet de foto op het huidige alfabetmozaïek (letterkleuren of luma-helling), rank bestemmingen dan op rms % (~100), mae (~0) en corr (~1).",
  "search.mosaic.bookTextIntro":
    "Boektekst ({n} tekens). Kopieer, of zet in inhoudzoeken en klik vinden.",
  "search.mosaic.toSearch": "zet in inhoudzoeken",
  "search.mosaic.noText": "kon geen boektekst maken van dat beeld",
  "search.mosaic.noHits": "geen mozaïektreffers voor dat beeld",
  "search.mosaic.resultsIntro":
    "Top {n} alfabetmozaïek-treffers (gesorteerd op rms / mae / corr):",
  "search.mosaic.resultsIntroBest": "Beste mozaïektreffer:",
  "search.mosaic.thumbAlt": "boekkleurenkaart bij treffer",
  "search.mosaic.original": "origineel (boekrooster)",
  "search.mosaic.preview": "mozaïekvoorbeeld",
  "search.mosaic.fitPct": "passing {n}%",
  "search.mosaic.previewError": "voorbeeld mislukt",
  "search.mosaic.fileMeta": "{name} · {sw}×{sh} → uitgerekt naar {w}×{h} boekrooster",
  "search.mosaic.gridHint":
    "Elk beeld wordt uitgerekt naar het volboek-kleurrooster ({w}×{h}).",
  "search.mosaic.badImage": "beeld kon niet worden gelezen",
  "search.mosaic.palette": "palet",
  "search.mosaic.palette.glyph": "letters",
  "search.mosaic.palette.luma": "luma-helling",
  "search.mosaic.tip.palette":
    "Letters = Babelgram-glyfkleuren. Luma-helling = helderheidstrap (structuur eerst).",
  "search.mosaic.dither": "dither",
  "search.mosaic.brightness": "helderheid",
  "search.mosaic.contrast": "contrast",
  "search.mosaic.hue": "tint",
  "search.mosaic.chroma": "chroma",
  "search.mosaic.light": "licht",
  "search.mosaic.space": "spatie",
  "search.mosaic.knobsSource": "origineel beeld",
  "search.mosaic.knobsMosaic": "mozaïekpalet",
  "search.mosaic.tip.brightness":
    "Upload lichter of donkerder maken vóór het mozaïek.",
  "search.mosaic.tip.contrast":
    "Contrast van de upload verhogen of verlagen vóór het mozaïek.",
  "search.mosaic.tip.hue":
    "Tint van de helderheidshelling (fotomozaïek mapt helderheid op het alfabet).",
  "search.mosaic.tip.chroma":
    "Hoeveel tint vs grijs op de luma-helling — laag is bijna grijstinten.",
  "search.mosaic.tip.light":
    "Centreert de helderheidshelling (donker↔licht) voor het fotomozaïek.",
  "search.mosaic.tip.space":
    "Pixels donkerder dan deze luminantie worden de spatieteken bij mozaïeken.",
  "search.mosaic.tip.dither":
    "Floyd–Steinberg-dither spreidt kleurfout voor een zachter, korreliger mozaïek.",
  "search.mosaic.needImage": "upload eerst een beeld",
  "search.mosaic.hitBook": "boek {book}",
  "search.go": "ga erheen",
  "search.result.gallery": "galerij {coords}",
  "search.result.coords":
    "universum {universe} · wand {wall} · plank {shelf} · boek {book} · {detail}",
  "search.result.page": "pagina {n}",
  "search.result.pages": "pagina’s {start}–{end}",
  "search.result.chars": "{n} tekens",
  "search.result.detailContent": "{pages} · {chars} · alfabet {alphabet}",
  "search.result.detailTitle": "titel {query} · {chars} · alfabet {alphabet}",
  "search.error.invalid":
    "ongeldig teken voor dit alfabet (alleen {alphabet}): {shown}",
  "search.error.invalidPlural":
    "ongeldige tekens voor dit alfabet (alleen {alphabet}): {shown}",
  "search.error.invalidGeneric": "ongeldige tekens voor dit alfabet",
  "search.error.moreKinds": " (+{n} andere soorten)",
  "search.error.empty": "zoektekst is leeg",
  "search.error.tooLong": "tekst te lang (max. {n} tekens — één boek)",
  "search.error.titleTooLong": "titel te lang (max. {n} tekens)",
  "search.error.pageRoom":
    "tekst heeft {need} pagina’s nodig, maar er blijven er maar {room} in dit boek — probeer een kortere zin",
  "search.error.badResponse": "ongeldig antwoord van de generator",
  "search.error.unknown": "zoeken mislukt",

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
  "book.clearSearch": "markering weg",
  "book.clearSearchTitle": "zoekmarkering wissen — de paginatekst blijft",
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
  "alphabet.group.Celtic": "Keltisch",
  "alphabet.group.Basque": "Baskisch",
  "alphabet.group.Maltese": "Maltees",
  "alphabet.group.Caucasian": "Kaukasisch",
  "alphabet.group.Semitic": "Semitisch",
  "alphabet.group.West African": "West-Afrikaans",
  "alphabet.group.Ethiopic": "Ethiopisch",
  "alphabet.group.African Latin": "Afrikaans Latijn",
  "alphabet.group.Berber": "Berbers",
  "alphabet.group.CJK": "CJK",
  "alphabet.group.Indic": "Indisch",
  "alphabet.group.Mongolic": "Mongools",
  "alphabet.group.Southeast Asian": "Zuidoost-Azië",

  "alphabet.blurb.Latin base":
    "De startalfabetten van het project: Borges’ beperkte Latijnse set uit het verhaal van 1941 (a–v), Basiles web-bibliotheek a–z, daarna Basile++ / Basile# met cijfers en leestekens.",
  "alphabet.blurb.Romance":
    "Uit het Volkslatijn van het vroegere Romeinse westen werden regionale volkstaalvormen Spaans, Portugees, Frans, Italiaans, Roemeens en Catalaans. Accenten en enkele extra letters kwamen bij drukpers en school om lokale klanken (nasalen, palatalen, klemtoon) te schrijven.",
  "alphabet.blurb.Germanic":
    "Vroege Germaanse talen gebruikten runen; Latijnse letters kwamen met christelijke geletterdheid. Latere druk en schooling fixeerden Duitse, Nederlandse en Scandinavische Latijnse orthografieën — inclusief umlautklinkers, æ/ø/å en IJslandse þ/ð voor dentale fricatieven.",
  "alphabet.blurb.Uralic":
    "Een niet-Indo-Europese wortelfamilie: Finseltalen rond de Oostzee, Hongaars westwaarts met de Magyaren. Alle drie hier gebruiken moderne Latijnse orthografieën; Fins en Estisch bleven nauw verwant, terwijl Hongaars vroeg vertakte en een grotere klinkervoorrad heeft.",
  "alphabet.blurb.Turkic":
    "Turkse talen van Anatolië tot Centraal-Azië. Ottomaans Turks gebruikte eeuwenlang Arabisch schrift tot de Latijnse hervorming van 1928; Sovjet-tijdperk Latijnse en Cyrillische golven volgden voor Azerbeidzjaans, Kazachs, Oezbeeks, Turkmeens en Kirgizisch. Deze plank mengt moderne Latijnse en Cyrillische schoolorthografieën.",
  "alphabet.blurb.Hellenic":
    "Griekse letters lopen door vanaf de oudheid. Deze lens is monotoon modern Grieks (officieel vanaf 1982): één accentteken in plaats van het oudere polytonische systeem, met dezelfde α–ω-voorraad plus eind-sigma.",
  "alphabet.blurb.Slavic":
    "Na kerstening volgde Slavische geletterdheid twee kerktradities: Glagolitisch/Cyrillisch in veel van het orthodoxe oosten en zuiden; Latijn in het katholieke westen en langs de Adriatische kust. De lenzen hier volgen die historische schriftsplitsing.",
  "alphabet.blurb.Baltic":
    "Lets en Litouws zijn Baltische Indo-Europese talen. Beide namen Latijnse letters over na kerstening; moderne spellingen met veel klinker- en medeklinkerdiakritische tekens vestigden zich vooral in de 19e–20e eeuw.",
  "alphabet.blurb.Albanian":
    "Schriftelijke attestatie is laat (vanaf de 15e eeuw). Er waren meerdere alfabetvoorstellen in gebruik tot het Congres van Manastir (1908) een Latijnse standaard aannam, inclusief ç en ë voor klanken buiten gewoon a–z.",
  "alphabet.blurb.Celtic":
    "Eiland-Keltische talen gebruikten na eerder Ogham Latijnse letters via klooster en druk. Moderne Welshe en Ierse spellingshervormingen hielden Latijn; deze plank volgt die standaardorthografieën (circumflexen in Welsh, fada-klinkers in Iers).",
  "alphabet.blurb.Basque":
    "Gesproken in de westelijke Pyreneeën sinds vóór Romeinse tijd; een taalisolaat zonder bewezen verwanten. Schrift vooral Latijn vanaf de vroegmoderne tijd; twintigste-eeuwse standaardisatie vastigde ñ en ç in de schoolorthografie.",
  "alphabet.blurb.Maltese":
    "Ontwikkeld uit middeleeuws Siciliaans-Arabisch op Malta, later in contact met Italiaans en Engels. Semitisch van bouw, maar met een Latijns alfabet (gestandaardiseerd 1924) en extra letters voor medeklinkers die Engels a–z niet schrijft.",
  "alphabet.blurb.Caucasian":
    "Armeense letters worden traditioneel aan Mesrop Masjtots (c. 405) toegeschreven voor volkstaalschrift; Georgisch Mkhedruli komt uit de middeleeuwse Georgische literaire traditie. Beide zijn zelfstandige links-naar-rechts-alfabetten, noch Latijn noch Cyrillisch.",
  "alphabet.blurb.Semitic":
    "Hebreeuws, Arabisch en Perzisch schrijven van rechts naar links. Letters zijn abstracte Unicode-tekens; de browser (met Noto) vormt Arabische en Perzische verbindingen. Hebreeuws heeft finale lettervormen als aparte glyphs.",
  "alphabet.blurb.West African":
    "N’Ko is een rechts-naar-links-alfabet, in 1949 bedacht door Solomana Kanté voor Manding-talen — eigen West-Afrikaans schrift, geen Latijn of Arabisch.",
  "alphabet.blurb.Ethiopic":
    "Het Geʿez-/Ethiopische schrift is een abugida: elk teken is een medeklinker–klinker-lettergreep. Amhaars gebruikt een grote fidel-voorraad; deze lens is een gecureerde selectie onder de Feistel-limiet.",
  "alphabet.blurb.African Latin":
    "Veel Afrikaanse talen gebruiken Latijnse orthografieën uit missie, koloniale school en latere hervormingen. Extra letters (ɓɗƙ, ẹọṣ, ịụ, …) markeren klanken die gewoon a–z niet schrijft. Swahili heeft vaak geen extras nodig.",
  "alphabet.blurb.Berber":
    "Tifinagh (Neo-Tifinagh / IRCAM) is het moderne officiële Amazigh-alfabet in Marokko, herleefd uit oudere Libisch-Berberse tekens. Geometrische links-naar-rechts-letters, los van Latijn en Arabisch.",
  "alphabet.blurb.CJK":
    "Oost-Aziatische pagina’s onder het Feistel softcap (4096 cellen): Japans kana (gojūon, geen dakuten), gecureerde Hangul-lettergrepen en een vereenvoudigd Chinees frequentiepakket. Vol Unihan of vol Hangul past niet in één lens.",
  "alphabet.blurb.Indic":
    "Brahmische abugida’s van India als Unicode-atomen (klinkers, medeklinkers, matras, virama/tekens) plus spatie, komma, punt. Feistel kan geen conjunct-tabellen; pagina’s zijn letterruis, geen spelling.",
  "alphabet.blurb.Mongolic":
    "Mongoolse talen van de steppe. Modern Khalkha-Mongools in Mongolië gebruikt een Cyrillisch alfabet met ө en ү voor voorste geronde klinkers — dezelfde civiele-schriftfamilie als Russisch, andere Feistel-voorraad.",
  "alphabet.blurb.Southeast Asian":
    "Vasteland- en maritiem Zuidoost-Azië: Filipino en Vietnamees in Latijn (ñ; đ en toonklinkers), Thai en Khmer als Brahmisch-afstammende abugida’s met zelfgehoste Noto-fonts. Pagina’s zijn glyfprojecties, geen lettergreeporthografie.",

  "alphabet.lensBlurb.25":
    "Uit Borges’ verhaal uit 1941: tweeëntwintig letters (a–v) plus spatie, komma en punt — het alfabet dat de fictie aan de Bibliotheek toekent.",
  "alphabet.lensBlurb.29":
    "Uit Basiles libraryofbabel.info: Engels a–z plus spatie, komma en punt.",
  "alphabet.lensBlurb.48":
    "Basiles a–z plus cijfers en gangbare leestekens, zodat titels en pagina’s cijfers en zin-tekens kunnen bevatten.",
  "alphabet.lensBlurb.60":
    "Basile++ plus symbolen uit URL’s en code (@, #, &, haken en vergelijkbare).",
  "alphabet.lensBlurb.35":
    "Castiliaanse spelling werd rond Nebrija (1492) gesystematiseerd. ñ schrijft de palatale nasaal /ɲ/ (zoals in año), historisch uit Latijn nn.",
  "alphabet.lensBlurb.41":
    "Portugese orthografie groeide met de Atlantische expansie en latere spellingshervormingen. ã/õ markeren nasale klinkers; cedille ç markeert /s/ voor a/o/u.",
  "alphabet.lensBlurb.45":
    "Franse accenten werden vastgelegd via drukpers en Académie-spellingnormen. Ze markeren klinker kwaliteit, historische s (â/ê) en open vs. gesloten e; œ en ç komen uit het Latijn en oudere schrijfconventies.",
  "alphabet.lensBlurb.32":
    "Italiaans bleef dicht bij de Latijnse lettervoorraad. Accenten markeren vooral welke lettergreep beklemtoond is wanneer dat anders onduidelijk zou zijn.",
  "alphabet.lensBlurb.36":
    "Roemeens keerde in de 19e eeuw terug naar Latijnse letters na een lange periode van Cyrillisch voor kerk en staat. ă/â/î/ș/ț markeren centrale klinkers en de medeklinkers /ʃ/ en /ts/.",
  "alphabet.lensBlurb.62":
    "De Catalaanse literaire opleving in de 19e eeuw vastigde een moderne Latijnse norm. De middot in l·l markeert dubbele /l/ (geminaat), onderscheiden van enkele l of Spaanse ll.",
  "alphabet.lensBlurb.33":
    "Duitse ä/ö/ü markeren voorwaartse klinkers uit historische umlaut (i-mutatie). ß (Eszett) komt uit een ligatuur van lange-s + z en schrijft /s/ na lange klinkers en diftongen.",
  "alphabet.lensBlurb.34":
    "Nederlands standaardiseerde via de Statenbijbel en latere spellingswetten. Deze lens voegt geaccentueerde klinkers é/ë/ï/ö/ü toe voor klemtoon of klinker kwaliteit in leenwoorden en enkele inheemse vormen.",
  "alphabet.lensBlurb.37":
    "Deens en Bokmål-Noors delen æ/ø/å voor voorwaartse en geronde klinkers die gewoon a/o niet dekte nadat Latijn in Scandinavië de runen verving.",
  "alphabet.lensBlurb.38":
    "Zweeds gebruikt ä/ö/å voor dezelfde brede Noordse klinkerbehoeften als Deens/Noors, maar met ä/ö in plaats van æ/ø — een spellingssplitsing uit de vroegmoderne druk.",
  "alphabet.lensBlurb.49":
    "IJslands bewaart þ en ð voor de stemloze en stemhebbende dentale fricatieven (/θ/, /ð/) uit het Oudnoors; de meeste andere Noordse talen vervingen die letters.",
  "alphabet.lensBlurb.40":
    "Finse geletterdheid verspreidde zich via reformatieprimers (Agricola). ä/ö markeren voorklinkers; verdubbelde letters markeren lengte, die in het Fins contrastief is.",
  "alphabet.lensBlurb.43":
    "Estische orthografie werd in de 19e eeuw gemoderniseerd naast het Fins. õ schrijft een mid-achter ongegronde klinker (/ɤ/) die Fins zo niet gebruikt.",
  "alphabet.lensBlurb.44":
    "Hongaars nam in de middeleeuwen Latijnse letters over. ő/ű markeren lange voorwaartse geronde klinkers; digrafen zoals sz/cs/ty schrijven medeklinkers die enkele Latijnse letters niet netjes dekten.",
  "alphabet.lensBlurb.39":
    "De hervorming van 1928 verving Ottomaans-Arabisch schrift door Latijnse letters gekozen bij Turkse klinkerharmonie — inclusief gepunte i en ongepuite ı als aparte fonemen.",
  "alphabet.lensBlurb.46":
    "Het Griekse alfabet loopt door vanaf de oudheid. De monotonische hervorming van 1982 bracht accenten terug tot één tonos en hield α–ω plus eind-sigma (ς).",
  "alphabet.lensBlurb.47":
    "Pools hield Latijn onder westerse kerkelijke geletterdheid. ą/ę markeren historische nasale klinkers; ł is /w/; ć/ń/ś/ź/ż schrijven palatale of postalveolaire medeklinkers.",
  "alphabet.lensBlurb.52":
    "Tsjechische háček-letters (č/ř/š/ž en verwanten) gaan terug op Jan Hus — tekens zodat Latijn Slavische palatalen en ř kon schrijven zonder digraaf-gedoe.",
  "alphabet.lensBlurb.57":
    "Slowaakse spelling werd in de 19e eeuw gestandaardiseerd naast Tsjechisch. ô schrijft de diftong /ʊɔ/; ľ schrijft palataal /ʎ/.",
  "alphabet.lensBlurb.42":
    "Gajs negentiende-eeuwse Latijn (“Gajica”) geeft Kroatisch en Servisch Latijn één letter (of digraaf) per klank, inclusief č/ć/đ/š/ž voor affricaten en fricatieven.",
  "alphabet.lensBlurb.53":
    "Sloveens gebruikte Latijn onder Habsburgs onderwijs. č/š/ž schrijven de postalveolaire medeklinkers gedeeld met naburige Zuid-Slavische Latijnse orthografieën.",
  "alphabet.lensBlurb.54":
    "Russisch Cyrillisch stamt van Kerkslavisch. Peters civiel schrift en latere updates gaven de moderne set, inclusief ё en de harde/zachte tekens.",
  "alphabet.lensBlurb.55":
    "Oekraïens Cyrillisch markeert klanken die van Russische spelling verschillen: ї /ji/, є /je/ en ґ /g/ (onderscheiden van г /ɦ/).",
  "alphabet.lensBlurb.58":
    "Wit-Russisch Cyrillisch werd in de twintigste eeuw gestandaardiseerd. ў schrijft een korte /w/-achtige klinker (zoals in воўк), die Russische orthografie niet heeft.",
  "alphabet.lensBlurb.56":
    "Bulgaars was een vroeg literair centrum voor Cyrillisch. Moderne spelling gebruikt ъ als volle klinker en bevat enkele oudere Slavische letters niet meer.",
  "alphabet.lensBlurb.59":
    "Macedonisch standaard-Cyrillisch werd na WO II gecodificeerd. ѓ/ќ (en soortgelijke letters) schrijven palatale plosieven die buurstandaarden anders spellen.",
  "alphabet.lensBlurb.61":
    "Vuk Karadžićs Servische Cyrillisch is één-op-één gekoppeld aan Latijnse Gajica — dezelfde fonemische voorraad in het andere historische schrift.",
  "alphabet.lensBlurb.50":
    "Letse moderne Latijnse orthografie verhardt rond 1908–1922. Macra (ā/ē/ī/ū) markeren lange klinkers; ģ/ķ/ļ/ņ markeren palatalen.",
  "alphabet.lensBlurb.51":
    "Litouws gebruikt al eeuwen Latijnse druk. ą/ę/į/ų weerspiegelen historische nasale klinkers; ė en ū/ų helpen klinker kwaliteit en lengte te markeren die in de taal nog contrastief zijn.",
  "alphabet.lensBlurb.31":
    "Het Congres van Manastir (1908) nam de huidige Latijnse standaard voor Albanees aan. ç en ë schrijven /tʃ/ en de mid-centrale klinker /ə/.",
  "alphabet.lensBlurb.64":
    "Welsh heeft een doorlopende Latijnse literaire traditie vanaf de middeleeuwen. Circumflexen (â/ê/î/ô/û/ŵ/ŷ) markeren lange klinkers, ook op w en y wanneer die als klinkers fungeren.",
  "alphabet.lensBlurb.65":
    "Iers ging van Ogham en later Gaelisch lettertype naar een vereenvoudigde Latijnse orthografie. De fada (á/é/í/ó/ú) markeert lange klinkers.",
  "alphabet.lensBlurb.63":
    "Baskisch wordt sinds de late middeleeuwen in Latijnse letters geschreven. ñ schrijft /ɲ/; ç komt voor in gevestigde spellingen zoals Franse ontleningen en sommige namen.",
  "alphabet.lensBlurb.66":
    "Maltees standaardiseerde in de jaren 1920 een Latijns alfabet. ċ/ġ/ż schrijven affricaten en /z/; ħ schrijft een stemloze faryngale fricatief uit zijn Arabisch-afgeleide medeklinkerset.",
  "alphabet.lensBlurb.67":
    "Mesrop Masjtots krijgt traditioneel de creatie van Armeense letters c. 405 toegeschreven zodat schrift en liturgie in het Armeens konden, niet alleen in Grieks of Syrisch.",
  "alphabet.lensBlurb.68":
    "Mkhedruli zijn de moderne Georgische lettervormen voor gewoon schrift. Het alfabet is inheems aan het Georgisch en ontstond los van Latijn en Cyrillisch.",
};

