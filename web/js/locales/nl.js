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
  "header.themeToLight": "overschakelen naar lichte modus",
  "header.themeToDark": "overschakelen naar donkere modus",
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
    "Elke set is een <b>symbolenwet</b> voor rugtitels en pagina’s — geen apart universum. Dezelfde kamer-hash en zegel; <i>geen vertaling</i>. Zoeken en titels accepteren alleen symbolen van de actieve lens. Blader hieronder per familie. Een markering <b>interface · …</b> betekent dat menu’s en labels mee wisselen. <b>Bronnen</b> onder elke familieblurb linken naar overzichtsartikelen.",
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
<li>Het <b>alfabet</b>menu wisselt alleen de <b>lens</b> — nieuwe ruggen en tekst; hash, zegel en spoor blijven.</li>
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
  "search.go": "ga erheen",
  "search.result.gallery": "galerij ({z}, {n})",
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
  "book.prev": "‹ vorige",
  "book.next": "volgende ›",
  "book.pageInd": "pagina {page} / {total}",
  "book.pagePlaceholder": "pagina",
  "book.wall": "Wand {n}",
  "book.wallBook": "Wand {n} · boek {book} · {title}",

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

  "alphabet.blurb.Latin base":
    "De startalfabetten van het project: Borges’ beperkte Latijnse set uit het verhaal van 1941 (a–v), Basiles web-bibliotheek a–z, daarna Basile++ / Basile# met cijfers en leestekens.",
  "alphabet.blurb.Romance":
    "Uit het Volkslatijn van het vroegere Romeinse westen werden regionale volkstaalvormen Spaans, Portugees, Frans, Italiaans, Roemeens en Catalaans. Accenten en enkele extra letters kwamen bij drukpers en school om lokale klanken (nasalen, palatalen, klemtoon) te schrijven.",
  "alphabet.blurb.Germanic":
    "Vroege Germaanse talen gebruikten runen; Latijnse letters kwamen met christelijke geletterdheid. Latere druk en schooling fixeerden Duitse, Nederlandse en Scandinavische Latijnse orthografieën — inclusief umlautklinkers, æ/ø/å en IJslandse þ/ð voor dentale fricatieven.",
  "alphabet.blurb.Uralic":
    "Een niet-Indo-Europese wortelfamilie: Finseltalen rond de Oostzee, Hongaars westwaarts met de Magyaren. Alle drie hier gebruiken moderne Latijnse orthografieën; Fins en Estisch bleven nauw verwant, terwijl Hongaars vroeg vertakte en een grotere klinkervoorrad heeft.",
  "alphabet.blurb.Turkic":
    "Ottomaans Turks gebruikte eeuwenlang Arabisch schrift. In 1928 nam de Republiek een Latijns alfabet aan dat Turkse klinkers (inclusief gepunte/ongepuite i) directer volgt dan Arabische spelling deed.",
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

