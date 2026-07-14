/** German UI — alphabet lens id 33. Formal address (Sie). */
export const de = {
  "header.aboutTitle":
    "Über — was dies ist und wie Sie wandern (öffnet den Leitfaden)",
  "header.gallery": "Galerie",
  "header.coordTitle": "Klicken Sie, um zu einer beliebigen Galerie zu springen",
  "header.hash": "Hash",
  "header.hashTitle":
    "Klicken Sie, um den vollständigen Hash dieser Galerie zu kopieren",
  "header.steps": "Schritte",
  "header.universePlaceholder": "Standarduniversum",
  "header.universeTitle":
    "Universum — benennen Sie eine parallele Bibliothek (leer = Standard). Eingabe zum Reisen.",
  "header.universeRandomTitle": "Zu einem zufälligen Universum springen",
  "header.alphabetTitle":
    "Alphabet-Linse — gleicher Raum-Hash, andere Rücken und Seiten (keine Übersetzung)",
  "header.actionsTitle":
    "Link kopieren · exportieren · prüfen · suchen · neuer Gang",
  "actions.placeholder": "Aktionen…",
  "actions.copy": "Link kopieren",
  "actions.search": "Suchen…",
  "actions.export": "Reise exportieren",
  "actions.verify": "Reise prüfen",
  "actions.reset": "Neuer Gang",

  "minimap.here": "Sie sind hier",
  "minimap.sigilTitle":
    "Siegel dieser Galerie — klicken Sie, um das SVG herunterzuladen",
  "minimap.hint": "Klicken Sie auf einen Ausgang, um zu gehen",
  "loading.building": "Bibliothek wird gebaut…",
  "loading.failed": "Laden fehlgeschlagen: {err}",

  "footer.wanderings": "Wanderungen · {n}/{max}",
  "footer.trail":
    "Spur {nodes} Knoten · Universum {universe} · {alphabet} · Gen v{gv}",

  "common.close": "Schließen",
  "common.go": "Los",
  "common.link": "Link",
  "common.you": "Sie",
  "common.copied": "Kopiert!",

  "about.subtitle": "eine begehbare Bibliothek von Babel",
  "about.tab.overview": "Überblick",
  "about.tab.alphabets": "Alphabete",
  "about.tab.wander": "Wandern",
  "about.tab.books": "Bücher",
  "about.tab.more": "Mehr",
  "about.tabsLabel": "Abschnitte",
  "about.alphabets.h": "Alphabet-Linsen",
  "about.alphabets.intro":
    "Jeder Satz ist ein <b>Symbolgesetz</b> für Rücken und Seiten — kein eigenes Universum. Gleicher Raum-Hash und Siegel; eine neue Art von Übersetzung. Suche und Titel akzeptieren nur Symbole der aktiven Linse. Das Menü in der Kopfzeile wechselt zwischen diesen Sätzen.",
  "about.alphabet.meta": "{n} Glyphen · &amp;a={id}",

  "about.overview": `
<p>Eine endlose Bibliothek zum Durchwandern. Jede sechseckige Galerie hat
<b>vier Wände mit Regalen</b> (700 Bücher) und <b>zwei Flure</b> zur nächsten
Galerie, plus eine <b>Treppe</b> auf und ab — vier Züge von überall.</p>
<p>Nichts wird gespeichert. Jede Galerie wird <b>sofort erzeugt</b> aus ihrer
Adresse; die Bibliothek ist unendlich und doch fast gewichtslos: nur Ihr
<i>Weg</i> bleibt im Browser.</p>
<h4>Drei Dinge in der Adresse</h4>
<ul>
<li><b>Universum</b> — parallele unendliche Bibliotheken. Benennen Sie eine in der Kopfzeile (leer =
Standard). Dieselben Raumnummern, völlig andere Bücher. Ihre Wanderungen gehen
über Universen weiter.</li>
<li><b>Raum</b> — <b>Galerie (z,&nbsp;n)</b> plus <b>Hash</b> und <b>Siegel</b>.
Der Hash benennt den Raum selbst (nicht den Text in den Regalen). Gleiches Universum +
gleiche Koordinaten → immer derselbe Fingerabdruck.</li>
<li><b>Alphabet-Linse</b> — Borges, Basile, Basile++ / Basile# oder ein Sprachsatz
(siehe <b>Alphabete</b>: Romanisch, Germanisch, Uralisch, Turkisch, Hellenisch, …).
Umschalten schreibt jedes Rückenschild und jede Seite unter dem <b>gleichen</b>
Hash und Siegel um. Ihre Spur bleibt.
<i>Keine Übersetzung.</i> Derselbe Raum, andere Zunge. Die Oberfläche spricht
diese Zunge, wenn ein Sprachpaket existiert (Deutsch, Niederländisch, …).</li>
</ul>
<h4>Inspiration</h4>
<p class="dim">
<a href="https://sites.evergreen.edu/politicalshakespeares/wp-content/uploads/sites/226/2015/12/Borges-The-Library-of-Babel.pdf"
target="_blank" rel="noopener noreferrer">Jorge Luis Borges, „Die Bibliothek von Babel“ (1941).</a><br />
<a href="https://libraryofbabel.info/" target="_blank" rel="noopener noreferrer">Jonathan Basile, <i>libraryofbabel.info</i></a>
</p>`,

  "about.wander": `
<h4>So wandern Sie</h4>
<ul>
<li><b>LIB·OF·BABEL</b> (Kopfzeile) öffnet diesen Leitfaden jederzeit.</li>
<li>Nutzen Sie die <b>Minikarte</b> — klicken Sie auf einen Ausgangs-Hash. Mit den <kbd>Pfeiltasten</kbd> gehen Sie Flure und Treppen (außer bei offenem Dialog).</li>
<li>Klicken Sie auf <b>Galerie&nbsp;(z,&nbsp;n)</b>, um irgendwohin zu <b>springen</b>.</li>
<li>Jede Galerie hat ein <b>Siegel</b> — ein Emblem aus dem <b>Raum</b>-Hash. Gleicher Ort, gleiches Siegel; klicken Sie, um das <b>SVG</b> herunterzuladen.</li>
<li>Geben Sie einen <b>Universum</b>-Namen ein oder würfeln Sie mit <b>&#9860;</b>; leer ist Standard. Gleiche Koordinaten, neue Bibliothek — die Spur bleibt.</li>
<li>Das <b>Alphabet</b>-Menü wechselt nur die <b>Linse</b> — neue Rücken und Texte; Hash, Siegel und Spur bleiben. Sprachlinsen wechseln auch die Oberflächensprache, wenn ein Paket vorhanden ist.</li>
<li><b>Aktionen…</b> → <b>Link kopieren</b> (oder Kopfzeilen-<b>Hash</b>) für einen Permalink; <code>&amp;a=</code> stellt die Linse wieder her.</li>
<li><b>Aktionen…</b> → <b>Suchen…</b> — <b>Inhalt</b> oder <b>Titel</b>, Koordinaten finden, hinspringen (siehe <b>Mehr</b>).</li>
<li><b>Wanderungen</b> (Fußzeile, letzte {max}) — kürzliche Schritte mit Universum + Alphabet; <b>Reise exportieren</b> speichert den gesamten Weg als JSON.</li>
</ul>`,

  "about.books": `
<h4>Ein Buch lesen</h4>
<ul>
<li>Klicken Sie auf einen farbigen Rücken; mit <kbd>←</kbd> <kbd>→</kbd> blättern Sie, solange der Leser offen ist.</li>
<li>Der zuletzt geschlossene Rücken ist <b>rot</b> umrandet, damit Sie ihn wiederfinden.</li>
<li><b>Farbe</b> zeichnet die Seite als Zeichen-Farbkarte — jedes Symbol ein Quadrat, getönt vom Galerie-Hash.</li>
<li><b>Link</b> kopiert einen Permalink zu diesem Buch auf dieser Seite.</li>
<li><b>Speichern…</b> → <b>Buch ausleihen</b> — voller Text (~1,3&nbsp;MB .txt)</li>
<li><b>Speichern…</b> → <b>Buchbild</b> — ganzes Buch als PNG-Farbkarte</li>
</ul>`,

  "about.more": `
<h4>Die Zahlen in der Kopfzeile</h4>
<p class="dim">
<b>Galerie (z, n)</b> ist Ihre Koordinate. <b>Hash</b> ist der
<b>BLAKE3</b>-Fingerabdruck des Raums — Permalink und Beweis für diesen Ort in diesem
Universum. Er ändert sich <b>nicht</b>, wenn Sie das Alphabet wechseln; die Linse schreibt
nur um, was die Regale sagen. <b>Wanderungen</b> hält Ihre letzten
{max} Schritte (Universum + Alphabet-Linse eingefroren);
der Raum-Hash jedes Schritts lebt in der vollen Spur. <b>Aktionen…</b> bietet auch
<b>Reise prüfen</b> und <b>Neuer Gang</b>.
</p>
<h4>Suche nach Inhalt</h4>
<p class="dim">
Unter <b>Aktionen…</b> → <b>Suchen…</b> belassen Sie die Auswahl auf
<b>Inhalt</b>. Fügen Sie eine Phrase ein (bis zu einem ganzen Buch — ~1,3&nbsp;Millionen
Zeichen); die Bibliothek nennt Galerie, Regal, Buch und Seite(n), wo sie
bereits lebt — und öffnet sie. Lange Phrasen spannen aufeinanderfolgende Seiten.
Die Suche nutzt die <b>aktuelle Alphabet-Linse</b> und bleibt im Universum, in dem Sie stehen.
Ungültige Zeichen werden rot markiert.
</p>
<h4>Suche nach Titel</h4>
<p class="dim">
Denselben Dialog — wählen Sie <b>Titel</b> statt <b>Inhalt</b>. Geben Sie einen Rücken-Titel ein
(bis <b>24 Zeichen</b>, dieselben Linsenregeln). Die Bibliothek findet Galerie und Regal
unter dem aktiven Alphabet, schreibt den Titel auf den kanonischen Rücken und springt hin.
Nützlich, wenn Sie einen Rücken kennen, keine Seite.
</p>`,

  "history.title": "Wanderungen",
  "history.meta": "{shown} von {total} Schritten · neueste zuerst",

  "verify.title": "Reise prüfen",
  "verify.meta":
    "Legen Sie eine exportierte Reise ab, um sie nachzugehen und zu prüfen",

  "search.headContent": "Suche nach Inhalt",
  "search.headTitle": "Suche nach Titel",
  "search.metaContent":
    "Geben Sie eine Phrase ein — die Bibliothek findet, wo sie bereits existiert (mit Leerzeichen auf eine volle Seite aufgefüllt).",
  "search.metaTitle":
    "Geben Sie einen Rücken-Titel ein — die Bibliothek findet Galerie und Regal.",
  "search.label": "Suche",
  "search.kindTitle": "Rücken-Titel oder Seiteninhalt suchen",
  "search.kindContent": "Inhalt",
  "search.kindTitleOpt": "Titel",
  "search.placeholderContent": "Verzeihen Sie mir, denn ich habe gesündigt",
  "search.placeholderTitle": "Karmesinrücken",
  "search.find": "Finden",
  "search.hintContent":
    "nutzt die aktuelle Alphabet-Linse · bis ~1,3M Zeichen (ein Buch)",
  "search.hintTitle":
    "nutzt die aktuelle Alphabet-Linse · bis {n} Zeichen (Rückentitel)",

  "jump.title": "Zu einer Galerie springen",
  "jump.subtitle":
    "Beliebige Koordinaten — das Gitter ist weit; springen Sie so weit Sie möchten.",

  "book.saveTitle": "Dieses Buch mitnehmen",
  "book.savePlaceholder": "Speichern…",
  "book.borrow": "Buch ausleihen",
  "book.image": "Buchbild",
  "book.linkTitle": "Link zu diesem Buch auf dieser Seite kopieren",
  "book.viewTitle": "Zwischen Text und Zeichen-Farbansicht der Seite wechseln",
  "book.viewColor": "Farbe",
  "book.viewText": "Text",
  "book.prev": "‹ Zurück",
  "book.next": "Weiter ›",
  "book.pageInd": "Seite {page} / {total}",
  "book.pagePlaceholder": "Seite",
  "book.wall": "Wand {n}",
  "book.wallBook": "Wand {n} · Buch {book}",

  "image.save": "PNG speichern",
  "image.saveTitle": "Diese Farbkarte des ganzen Buchs als PNG speichern",

  "alphabet.symbolLabel": "{name} · {n} Glyphen",
  "alphabet.group.Latin base": "Lateinische Basis",
  "alphabet.group.Romance": "Romanisch",
  "alphabet.group.Germanic": "Germanisch",
  "alphabet.group.Uralic": "Uralisch",
  "alphabet.group.Turkic": "Turkisch",
  "alphabet.group.Hellenic": "Hellenisch",
};
