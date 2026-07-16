/** German UI — alphabet lens id 33. Formal address (Sie). */
export const de = {
  "header.aboutTitle":
    "Über — was dies ist und wie Sie wandern (öffnet den Leitfaden)",
  "header.universePlaceholder": "Standarduniversum",
  "header.universeTitle":
    "Universum — benennen Sie eine parallele Bibliothek (leer = Standard). Eingabe zum Reisen.",
  "header.universeRandomTitle": "Zu einem zufälligen Universum springen",
  "header.alphabetTitle":
    "Alphabet-Linse — gleicher Raum-Hash, andere Rücken und Seiten (keine Übersetzung)",
  "alphabet.picker.h": "Alphabet-Linse",
  "alphabet.picker.sub": "gleicher Raum-Hash · andere Rücken und Seiten",
  "header.actionsTitle":
    "Link kopieren · exportieren · prüfen · suchen · neuer Gang",
  "header.themeToLight": "Zum Hellmodus wechseln",
  "header.themeToDark": "Zum Dunkelmodus wechseln",
  "header.menuOpenTitle": "Menü öffnen",
  "header.menuCloseTitle": "Menü schließen",
  "header.menuUniverse": "Universum",
  "header.menuAlphabet": "Alphabet",
  "header.menuActions": "Aktionen",
  "header.menuTheme": "Thema",
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
  "footer.gallery": "Galerie",
  "footer.coordTitle": "Klicken Sie, um zu einer beliebigen Galerie zu springen",
  "footer.hash": "Hash",
  "footer.hashTitle":
    "Klicken Sie, um den vollständigen Hash dieser Galerie zu kopieren",
  "footer.steps": "Schritte",
  "footer.help": "- Hilfe",
  "footer.helpTitle": "Hilfe — Leitfaden öffnen (?)",

  "common.close": "Schließen",
  "common.go": "Los",
  "common.link": "Link",
  "common.copied": "Kopiert!",

  "about.subtitle": "eine begehbare Bibliothek von Babel",
  "about.tab.overview": "Überblick",
  "about.tab.alphabets": "Alphabete",
  "about.tab.wander": "Wandern",
  "about.tab.books": "Bücher",
  "about.tab.search": "Suche",
  "about.tab.more": "Mehr",
  "about.tabsLabel": "Abschnitte",
  "about.alphabets.h": "Alphabet-Linsen",
  "about.alphabets.intro":
    "Jeder Satz ist ein <b>Symbolgesetz</b> für Rücken und Seiten — kein eigenes Universum. Gleicher Raum-Hash und Siegel; <i>eine neue Art von Übersetzung</i>. Suche und Titel akzeptieren nur Symbole der aktiven Linse. Unten nach Familie stöbern. Ein Hinweis <b>Oberfläche · …</b> heißt: Menüs und Beschriftungen wechseln mit. <b>Quellen</b> unter dem Familien-Blurb verweisen auf Überblickstexte.",
  "about.alphabets.indexLabel": "Familie",
  "about.alphabets.refs": "Quellen",
  "about.alphabet.meta": "{n} Glyphen · &amp;a={id}",
  "about.alphabet.uiPack": "Oberfläche · {name}",

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
<li><b>Alphabet-Linse</b> — wechselt den Zeichensatz für Rücken und Seiten unter
dem <b>gleichen</b> Hash und Siegel; Ihre Spur bleibt. Im Tab <b>Alphabete</b>
stehen die Presets (inkl. welche auch die Oberflächen-Sprache wechseln).</li>
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
<li><kbd>LIB·OF·BABEL</kbd>, <kbd>?&nbsp;-&nbsp;Hilfe</kbd> oder <kbd>?</kbd> öffnen diesen Leitfaden jederzeit.</li>
<li>Die Kopfzeilen-<span class="ui">Thema</span>-Schaltfläche (Sonne/Mond) wechselt Hell- und Dunkelmodus; die Wahl bleibt in diesem Browser.</li>
<li>Nutzen Sie die <b>Minikarte</b> — klicken Sie auf einen Ausgangs-Hash. Mit den <kbd>Pfeiltasten</kbd> gehen Sie Flure und Treppen (außer bei offenem Dialog).</li>
<li>Klicken Sie auf <span class="ui">Galerie&nbsp;(z,&nbsp;n)</span>, um irgendwohin zu springen.</li>
<li>Jede Galerie hat ein <b>Siegel</b> — ein Emblem aus dem <b>Raum</b>-Hash. Gleicher Ort, gleiches Siegel; klicken Sie, um das <b>SVG</b> herunterzuladen.</li>
<li>Geben Sie einen <span class="ui">Universum</span>-Namen ein oder würfeln Sie mit <span class="ui">&#9860;</span>; leer ist Standard. Gleiche Koordinaten, neue Bibliothek — die Spur bleibt.</li>
<li>Das <span class="ui">Alphabet</span>-Menü wechselt nur die <b>Linse</b> — neue Rücken und Texte; Hash, Siegel und Spur bleiben.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-alphabets">ALPHABETE</button></li>
<li>Klicken Sie auf einen farbigen Rücken an einer Wand, um ein Buch zu öffnen.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-books">BÜCHER</button></li>
<li><span class="ui">Aktionen…</span> → <span class="ui">Link kopieren</span> (oder Fußzeilen-<span class="ui">Hash</span>) für einen Permalink; <code>&amp;a=</code> stellt die Linse wieder her.</li>
<li><span class="ui">Aktionen…</span> → <span class="ui">Suchen…</span> — <span class="ui">Text</span>, <span class="ui">Foto</span> oder <span class="ui">Babelgram</span>; hinspringen.&nbsp;&nbsp;&nbsp; <button type="button" class="ui about-goto-tab" data-about-tab="aboutTab-search">SUCHE</button></li>
<li><span class="ui">Wanderungen</span> (Fußzeile, letzte {max}) — kürzliche Schritte mit Universum + Alphabet; <span class="ui">Reise exportieren</span> speichert den gesamten Weg als JSON.</li>
</ul>`,

  "about.books": `
<h4>Ein Buch lesen</h4>
<ul>
<li>Klicken Sie auf einen farbigen Rücken; mit <kbd>←</kbd> <kbd>→</kbd> blättern Sie, solange der Leser offen ist.</li>
<li>Der zuletzt geschlossene Rücken ist <b>rot</b> umrandet, damit Sie ihn wiederfinden.</li>
<li><span class="ui">Farbe</span> zeichnet die Seite als Zeichen-Farbkarte — jedes Symbol ein Quadrat, getönt vom Galerie-Hash.</li>
<li><span class="ui">Link</span> kopiert einen Permalink zu diesem Buch auf dieser Seite.</li>
<li><span class="ui">Speichern…</span> → <span class="ui">Buch ausleihen</span> — voller Text (~1,3&nbsp;MB .txt)</li>
<li><span class="ui">Speichern…</span> → <span class="ui">Buchbild</span> — ganzes Buch als PNG-Farbkarte</li>
</ul>`,

  "about.search": `
<h4>nach Inhalt</h4>
<p class="dim">
Unter <span class="ui">Aktionen…</span> → <span class="ui">Suchen…</span> bleiben Sie auf dem Tab <span class="ui">Text</span> mit
<span class="ui">Inhalt</span>. Fügen Sie eine Phrase ein (bis zu einem ganzen Buch — ~1,3&nbsp;Millionen
Zeichen); die Bibliothek nennt Galerie, Regal, Buch und Seite(n), wo sie
bereits lebt — und öffnet sie. Lange Phrasen spannen aufeinanderfolgende Seiten.
Die Suche nutzt die <b>aktuelle Alphabet-Linse</b> und bleibt im Universum, in dem Sie stehen.
Ungültige Zeichen werden rot markiert.
</p>
<h4>nach Titel</h4>
<p class="dim">
Derselbe <span class="ui">Text</span>-Tab — wählen Sie <span class="ui">Titel</span> statt <span class="ui">Inhalt</span>. Geben Sie bis zu
<b>24 Zeichen</b> ein (aktive Linsenregeln). Die Zeichenkette gilt als
<b>Rückenbeschriftung</b>: die Bibliothek springt zur Galerie und zum Regal, wo
dieser Titel unter dem aktuellen Alphabet sitzt, zeigt ihn auf dem Buchrücken und
öffnet Seite&nbsp;1.
</p>
<h4>nach Babelgram</h4>
<p class="dim">
Tab <span class="ui">Babelgram</span>: gestempeltes PNG von <span class="ui">Speichern…</span> → <span class="ui">Buchbild</span>.
<b>Gleiches Universum</b> wie der Export → genau <b>dieses Buch</b>.
<b>Anderes Universum</b> → gleicher <b>Babelgram-Druck</b> an neuer Adresse,
aber <b>anderer Buchinhalt</b>. <span class="ui">Dorthin</span> öffnet einen neuen Tab.
<span class="ui">Diff prüfen</span> wischt <b>Reprojektion</b> (Stempel-Akzent-Dekodierung)
gegen <b>Diff</b> (|Upload − Reprojektion|) — bei exakter Dekodierung ist die Diff-Seite
nahezu schwarz.
</p>
<h4>nach Foto-Mosaik</h4>
<p class="dim">
Tab <span class="ui">Foto</span>: beliebiges Bild hochladen. Es wird auf das Ganzbuch-Farbgitter
gestreckt, auf die <b>aktuelle Alphabet-Linse</b> projiziert — entweder die
<b>Buchstaben-Farbkarte</b> (Babelgram-Stil) oder eine <b>Luma-Rampe</b> — und nach
<b>rms % / mae / korr</b> gerankt. Treffer wählen —
<span class="ui">Dorthin</span> öffnet einen neuen Tab.
</p>`,

  "about.more": `
<h4>Die Zahlen in der Fußzeile</h4>
<p class="dim">
<span class="ui">Galerie (z, n)</span> ist Ihre Koordinate. <span class="ui">Hash</span> ist der
<b>BLAKE3</b>-Fingerabdruck des Raums — Permalink und Beweis für diesen Ort in diesem
Universum. Er ändert sich <b>nicht</b>, wenn Sie das Alphabet wechseln; die Linse schreibt
nur um, was die Regale sagen. <span class="ui">Wanderungen</span> hält Ihre letzten
{max} Schritte (Universum + Alphabet-Linse eingefroren) — auch
<span class="ui">Universum</span>-Wechsel in derselben Galerie (◇), ohne Flurzug;
der Raum-Hash jedes Schritts lebt in der vollen Spur.
</p>
<h4>Reise exportieren &amp; prüfen</h4>
<p class="dim">
<span class="ui">Aktionen…</span> → <span class="ui">Reise exportieren</span> speichert Ihren ganzen Weg als JSON
(Räume, Hashes, Universen, Linsen). <span class="ui">Reise prüfen</span> geht eine exportierte
Datei nach und beweist jeden Schritt. <span class="ui">Neuer Gang</span> löscht die Spur und
beginnt in diesem Browser neu.
</p>
<h4>Was in diesem Browser bleibt</h4>
<p class="dim">
Die Bibliothek selbst wird nie heruntergeladen — nur Ihr <b>Weg</b>, die
<span class="ui">Thema</span>-Einstellung und ein „Leitfaden gesehen“-Flag bleiben hier.
Babelgram-<span class="ui">Dorthin</span> in ein anderes Universum kann den Druck kurz lokal in
<b>diesem</b> Browser übergeben, damit der neue Tab ihn öffnet; <span class="ui">Link kopieren</span>
bleibt nur die Adresse.
</p>
<h4>Links teilen</h4>
<p class="dim">
Ein Permalink enthält Galerie <b>(z,&nbsp;n)</b>, Raum-<b>Hash</b>, Alphabet
<code>&amp;a=</code>, optional Universum <code>&amp;u=</code>, manchmal Buchseite
oder eine Suchphrase. Gleiche Adresse → immer derselbe Raum. Die Linse zu wechseln
hält den Hash; nur die Regale schreiben sich um.
</p>`,

  "about.githubTitle": "GitHub — Latka-Industries/lib-of-babel",

  "history.title": "Wanderungen",
  "history.meta": "{shown} von {total} Schritten · neueste zuerst",

  "verify.title": "Reise prüfen",
  "verify.meta":
    "Legen Sie eine exportierte Reise ab, um sie nachzugehen und zu prüfen",
  "verify.openLastRoom": "Letzten Raum in der aktuellen Bibliothek öffnen",

  "legacy.gv.title": "Älterer Bibliothekslink",
  "legacy.gv.bodyAddress":
    "Dieser Link stammt aus einer älteren Bibliotheksversion. Der Seitentext an diesen Koordinaten ist nicht derselbe — die Regaladresse in der aktuellen Bibliothek bleibt gleich.",
  "legacy.gv.bodyQuery":
    "Dieser Link stammt aus einer älteren Bibliotheksversion. Wir können dieselbe Suchphrase unter dem aktuellen Generator platzieren (möglicherweise ein anderes Regal).",
  "legacy.gv.bodyRelocated":
    "Dieser Link stammt aus einer älteren Bibliotheksversion. Wir haben Ihre Suchphrase unter dem aktuellen Generator neu verortet — dieselben Worte, möglicherweise ein neues Regal.",
  "legacy.gv.bodyJourney":
    "In diesem Browser liegen noch Wanderungen von Generator v{old}. Raum-Hashes und Seitentext können von v{cur} abweichen. Weiter behält dieses Regal und startet eine neue Spur — oder lokale Daten löschen und neu laden.",
  "legacy.gv.continue": "Weiter",
  "legacy.gv.wipe": "Lokale Daten löschen & neu laden",
  "legacy.gv.skipSession": "Diese Sitzung nicht mehr anzeigen",

  "search.head": "Suche",
  "search.headContent": "Suche nach Inhalt",
  "search.headTitle": "Suche nach Titel",
  "search.headMosaic": "Suche nach Farbmosaik",
  "search.metaText":
    "Eine Phrase finden, ein Foto-Mosaik matchen oder ein Babelgram-Buchbild öffnen.",
  "search.metaContent":
    "Geben Sie eine Phrase ein — die Bibliothek findet, wo sie bereits existiert (mit Leerzeichen auf eine volle Seite aufgefüllt).",
  "search.metaTitle":
    "Geben Sie einen Rücken-Titel ein — die Bibliothek findet Galerie und Regal.",
  "search.metaMosaic":
    "Bild hochladen → Alphabet-Mosaik → Bücher nach rms / mae / korr ranken.",
  "search.tabsLabel": "Suchmodus",
  "search.tab.text": "Text",
  "search.tab.photo": "Foto",
  "search.tab.babel": "Babelgram",
  "search.tab.image": "Foto",
  "search.headBabel": "Suche nach Babelgram",
  "search.metaBabel":
    "Gleiches Universum → genau das Export-Buch. Anderes Universum → gleicher Babelgram-Druck, anderer Inhalt.",
  "search.hintBabel": "",
  "search.babel.honesty":
    "Laden Sie ein gestempeltes PNG von Speichern → Buchbild hoch (1:1-Gitter + lob:babel). Gleiches Universum wie der Export → genau dieses Buch. Anderes Universum → gleicher Babelgram-Druck an neuer Adresse, aber anderer Buchinhalt. Dorthin öffnet einen neuen Tab. Kopierter Link ist nur die Adresse (kein Druck-Handoff).",
  "search.babel.find": "Buch finden",
  "search.babel.progress": "Babelgram wird dekodiert…",
  "search.babel.upload": "Babelgram-PNG hochladen",
  "search.babel.original": "Babelgram-Export",
  "search.babel.gridHint":
    "Braucht ein gestempeltes verlustfreies PNG genau {w}×{h} (Speichern → Buchbild).",
  "search.babel.fileMeta": "{name} · exakt {w}×{h} Babelgram-Gitter",
  "search.babel.sizeMismatch":
    "Falsche Größe ({sw}×{sh}). Babelgrams müssen exakt {w}×{h} sein — neu exportieren unter Speichern → Buchbild.",
  "search.babel.needExact": "zuerst ein exaktes {w}×{h} Babelgram-PNG hochladen",
  "search.babel.notBabel":
    "Kein Babelgram-Buchbild-PNG. Neu exportieren unter Speichern → Buchbild.",
  "search.babel.nameMismatch":
    "Dateiname-Koordinaten stimmen nicht mit dem PNG-Stempel überein",
  "search.babel.originLine":
    "Export-Ursprung · {universe} (Seed {u}) · Galerie {coords} · Buch {book} · {alphabet}",
  "search.babel.universeUnknown": "Seed {seed}",
  "search.babel.originNote":
    "Locate-Ziel weicht vom Export-Ursprung ab (gleiche Zellen → neue Koordinaten; anderes Universum → andere Koordinaten).",
  "search.babel.originNoteSame":
    "Gleiches Universum wie der Export — genau dieses Buch. Dorthin öffnet einen neuen Tab.",
  "search.babel.originNoteOther":
    "Anderes Universum — gleicher Babelgram-Druck an neuer Adresse, anderer Buchinhalt. Dorthin öffnet einen neuen Tab mit diesem Druck. Kopierter Link ist nur die Adresse.",
  "search.babel.resultsIntro":
    "Babelgram-Locate in {universe} (Seed {seed}) — exakte Akzent-Dekodierung:",
  "search.babel.resultsIntroSame":
    "Genaues Buch in {universe} (Seed {seed}) — gleiches Universum wie der Export:",
  "search.babel.resultsIntroOther":
    "Gleicher Babelgram-Druck in {universe} (Seed {seed}):",
  "search.babel.thumbAlt": "hochgeladenes Babelgram",
  "search.babel.diffAlt": "Dekodierungsdifferenz (|Upload − Reprojektion|)",
  "search.babel.exactOk": "exakte Dekodierung",
  "search.babel.seal": "Inhalts-Siegel {seal}",
  "search.babel.diffCaption": "Diff",
  "search.babel.compare.title": "Vergleich",
  "search.babel.compare.hint":
    "Wischer Reprojektion ↔ Diff — bei exakter Dekodierung ist die Diff-Seite nahezu schwarz",
  "search.babel.compare.result": "Reprojektion",
  "search.babel.compare.diff": "Diff",
  "search.babel.compare.sliderAria": "Wischer zwischen Reprojektion und Diff",
  "search.babel.compare.checkDiff": "Diff prüfen",
  "search.babel.metric.rms": "rms {n}%",
  "search.babel.metric.mae": "mae {n}",
  "search.babel.metric.corr": "korr {n}",
  "search.babel.tip.rms":
    "Quadratischer Mittelwert (RMS) der RGB-Abweichung Upload vs. Stempel-Akzent-Reprojektion. fit% = 100 × (1 − √(Mittel((ΔR²+ΔG²+ΔB²)/3) / 255²)). Ideal ≈ 100%.",
  "search.babel.tip.mae":
    "Mittlerer absoluter RGB-Fehler: Mittel((|ΔR|+|ΔG|+|ΔB|)/3) auf Skala 0–255. Ideal ≈ 0.",
  "search.babel.tip.corr":
    "Pearson-Korrelation gepaarter RGB-Proben zwischen Upload und Reprojektion. Ideal ≈ 1.",
  "search.babel.tip.diff":
    "Pixelweise |Upload − Reprojektion| unter Stempel-Akzent. Ideal: nahezu schwarz (alles null).",
  "search.babel.tip.seal":
    "Kurzer SHA-256 des dekodierten Buchtexts. Gleicher Druck ⇒ gleiches Siegel in jedem Universum.",
  "search.babel.tip.exactOk":
    "Dekodierung wirkt exakt: rms ≥ 99,9 %, mae < 0,5 und korr ≥ 0,999.",
  "search.babel.confirmHint":
    "Bilder sind verrauscht — vertrauen Sie rms % (~100), MAE (~0), Korr (~1), nahezu schwarzem Diff-Wischer und Inhalts-Siegel.",
  "search.label": "Suche",
  "search.kindTitle": "Rücken-Titel oder Seiteninhalt suchen",
  "search.kindContent": "Inhalt",
  "search.kindTitleOpt": "Titel",
  "search.placeholderContent": "ein reittier nie",
  "search.placeholderTitle": "Karmesinrücken",
  "search.find": "Finden",
  "search.count": "{n} / {max}",
  "search.countTip": "{n} Alphabet-Zellen von {max} erlaubt",
  "search.hintContent":
    "nutzt die aktuelle Alphabet-Linse · bis ein ganzes Buch",
  "search.hintTitle":
    "nutzt die aktuelle Alphabet-Linse · bis {n} Rückentitel-Zellen",
  "search.hintMosaic":
    "Ganzbuch-Farbgitter · aktuelles Alphabet → Mosaik → Top-Treffer nach rms / mae / korr",
  "search.mosaic.find": "Treffer finden",
  "search.mosaic.searching": "suche…",
  "search.mosaic.progress": "Mosaike projizieren + ranken…",
  "search.mosaic.progressPacks": "Paletten-Packs scannen…",
  "search.mosaic.progressLocate": "Pack {i} / {n} lokalisieren…",
  "search.mosaic.progressScore": "Buchkarte {i} / {n} bewerten…",
  "search.mosaic.upload": "Bild hochladen",
  "search.mosaic.honesty":
    "Bild auf das aktuelle Alphabet-Mosaik legen (Buchstabenfarben oder Luma-Rampe), dann Ziele nach rms % (~100), mae (~0) und korr (~1) ranken.",
  "search.mosaic.bookTextIntro":
    "Buchtext ({n} Zeichen). Kopieren, oder in die Inhaltssuche legen und Finden.",
  "search.mosaic.toSearch": "in Inhaltssuche legen",
  "search.mosaic.noText": "Buchtext aus diesem Bild nicht erzeugbar",
  "search.mosaic.noHits": "keine Mosaik-Treffer für dieses Bild",
  "search.mosaic.resultsIntro":
    "Top {n} Alphabet-Mosaik-Treffer (sortiert nach rms / mae / korr):",
  "search.mosaic.resultsIntroBest": "Bester Mosaik-Treffer:",
  "search.mosaic.thumbAlt": "Buch-Farbkarte am Treffer",
  "search.mosaic.original": "Original (Buchgitter)",
  "search.mosaic.preview": "Mosaik-Vorschau",
  "search.mosaic.fitPct": "Passung {n}%",
  "search.mosaic.previewError": "Vorschau fehlgeschlagen",
  "search.mosaic.fileMeta": "{name} · {sw}×{sh} → gestreckt auf {w}×{h} Buchgitter",
  "search.mosaic.gridHint":
    "Jedes Bild wird auf das Ganzbuch-Farbgitter ({w}×{h}) gestreckt.",
  "search.mosaic.badImage": "Bild konnte nicht gelesen werden",
  "search.mosaic.palette": "Palette",
  "search.mosaic.palette.glyph": "Buchstaben",
  "search.mosaic.palette.luma": "Luma-Rampe",
  "search.mosaic.tip.palette":
    "Buchstaben = Babelgram-Glyphenfarben. Luma-Rampe = Helligkeitsleiter (strukturtreu).",
  "search.mosaic.dither": "Dither",
  "search.mosaic.brightness": "Helligkeit",
  "search.mosaic.contrast": "Kontrast",
  "search.mosaic.hue": "Farbton",
  "search.mosaic.chroma": "Chroma",
  "search.mosaic.light": "Hellton",
  "search.mosaic.space": "Leerzeichen",
  "search.mosaic.knobsSource": "Originalbild",
  "search.mosaic.knobsMosaic": "Mosaik-Palette",
  "search.mosaic.tip.brightness":
    "Upload aufhellen oder abdunkeln, bevor er zum Mosaik wird.",
  "search.mosaic.tip.contrast":
    "Kontrast des Uploads vor dem Mosaikieren.",
  "search.mosaic.tip.hue":
    "Färbung der Helligkeitsrampe (Foto-Mosaik mappt Helligkeit aufs Alphabet).",
  "search.mosaic.tip.chroma":
    "Wie viel Farbton vs. Grau auf der Luma-Rampe — niedrig ≈ Graustufen.",
  "search.mosaic.tip.light":
    "Zentriert die Helligkeitsrampe (dunkel↔hell) für das Foto-Mosaik.",
  "search.mosaic.tip.space":
    "Dunklere Pixel als diese Luminanz werden beim Mosaikieren zum Leerzeichen.",
  "search.mosaic.tip.dither":
    "Floyd–Steinberg-Dither streut Farbfehler für ein weicheres, körnigeres Mosaik.",
  "search.mosaic.needImage": "zuerst ein Bild hochladen",
  "search.mosaic.hitBook": "Buch {book}",
  "search.go": "Dorthin",
  "search.result.gallery": "Galerie {coords}",
  "search.result.coords":
    "Universum {universe} · Wand {wall} · Regal {shelf} · Buch {book} · {detail}",
  "search.result.page": "Seite {n}",
  "search.result.pages": "Seiten {start}–{end}",
  "search.result.chars": "{n} Zeichen",
  "search.result.detailContent": "{pages} · {chars} · Alphabet {alphabet}",
  "search.result.detailTitle": "Titel {query} · {chars} · Alphabet {alphabet}",
  "search.error.invalid":
    "Ungültiges Zeichen für dieses Alphabet (nur {alphabet}): {shown}",
  "search.error.invalidPlural":
    "Ungültige Zeichen für dieses Alphabet (nur {alphabet}): {shown}",
  "search.error.invalidGeneric": "Ungültige Zeichen für dieses Alphabet",
  "search.error.moreKinds": " (+{n} weitere Arten)",
  "search.error.empty": "Suchtext ist leer",
  "search.error.tooLong": "Text zu lang (max. {n} Zeichen — ein Buch)",
  "search.error.titleTooLong": "Titel zu lang (max. {n} Zeichen)",
  "search.error.pageRoom":
    "Text braucht {need} Seiten, aber nur {room} bleiben in diesem Buch — kürzere Phrase versuchen",
  "search.error.badResponse": "Ungültige Antwort vom Generator",
  "search.error.unknown": "Suche fehlgeschlagen",

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
  "book.clearSearch": "Markierung weg",
  "book.clearSearchTitle": "Suchmarkierung entfernen — der Seitentext bleibt",
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
  "alphabet.group.Slavic": "Slawisch",
  "alphabet.group.Baltic": "Baltisch",
  "alphabet.group.Albanian": "Albanisch",
  "alphabet.group.Celtic": "Keltisch",
  "alphabet.group.Basque": "Baskisch",
  "alphabet.group.Maltese": "Maltesisch",
  "alphabet.group.Caucasian": "Kaukasisch",
  "alphabet.group.Semitic": "Semitisch",
  "alphabet.group.West African": "Westafrikanisch",
  "alphabet.group.Ethiopic": "Äthiopisch",
  "alphabet.group.African Latin": "Afrikanisches Latein",
  "alphabet.group.Berber": "Berberisch",
  "alphabet.group.CJK": "CJK",
  "alphabet.group.Indic": "Indisch",
  "alphabet.group.Mongolic": "Mongolisch",
  "alphabet.group.Southeast Asian": "Südostasien",

  "alphabet.blurb.Latin base":
    "Die Ausgangsalphabete des Projekts: Borges’ eingeschränkter lateinischer Satz aus der Erzählung von 1941 (a–v), Basiles Web-Bibliothek a–z, dann Basile++ / Basile# mit Ziffern und Satzzeichen.",
  "alphabet.blurb.Romance":
    "Aus dem Vulgärlatein des früheren römischen Westens wurden regionale Volkssprachen zu Spanisch, Portugiesisch, Französisch, Italienisch, Rumänisch und Katalanisch. Akzente und wenige Zusatzbuchstaben kamen mit Druck und Schule, um lokale Laute (Nasale, Palatale, Wortakzent) zu schreiben.",
  "alphabet.blurb.Germanic":
    "Frühgermanische Sprachen nutzten Runen; lateinische Buchstaben kamen mit christlicher Schriftlichkeit. Späterer Druck und Schule fixierten deutsche, niederländische und skandinavische lateinische Orthographien — samt Umlautvokalen, æ/ø/å und isländischem þ/ð für Dentalfrikative.",
  "alphabet.blurb.Uralic":
    "Eine nicht-indogermanische Wurzelfamilie: finnische Sprachen an der Ostsee, Ungarisch westwärts mit den Magyaren. Alle drei hier nutzen moderne lateinische Orthographien; Finnisch und Estnisch blieben eng verwandt, während Ungarisch früh abzweigte und ein größeres Vokalinventar hat.",
  "alphabet.blurb.Turkic":
    "Turksprachen von Anatolien bis Zentralasien. Osmanisches Türkisch nutzte jahrhundertelang arabische Schrift bis zur lateinischen Reform 1928; sowjetische Latein- und Kyrillisch-Wellen folgten für Aserbaidschanisch, Kasachisch, Usbekisch, Turkmenisch und Kirgisisch. Dieses Regal mischt moderne lateinische und kyrillische Schulorthographien.",
  "alphabet.blurb.Hellenic":
    "Griechische Buchstaben seit der Antike. Diese Linse ist monotonisches Neugriechisch (amtlich ab 1982): ein Akzentzeichen statt des älteren polytonischen Systems, gleiches α–ω-Inventar plus Schluss-Sigma.",
  "alphabet.blurb.Slavic":
    "Nach der Christianisierung folgte die slawische Schriftlichkeit zwei Kirchtraditionen: Glagolitisch/Kyrillisch im weitgehend orthodoxen Osten und Süden; Latein im katholischen Westen und an der Adria. Die Linsen hier folgen dieser historischen Schriftteilung.",
  "alphabet.blurb.Baltic":
    "Lettisch und Litauisch sind baltische indogermanische Sprachen. Beide übernahmen lateinische Buchstaben nach der Christianisierung; moderne Schreibungen mit vielen Vokal- und Konsonantendiakritika festigten sich vor allem im 19./20. Jahrhundert.",
  "alphabet.blurb.Albanian":
    "Schriftliche Bezeugung ist spät (ab dem 15. Jh.). Mehrere Alphabetvorschläge waren in Gebrauch, bis der Kongress von Manastir 1908 einen lateinischen Standard annahm, inklusive ç und ë für Laute außerhalb von a–z.",
  "alphabet.blurb.Celtic":
    "Inselkeltische Sprachen nutzten nach früherem Ogham lateinische Buchstaben durch Kloster und Druck. Moderne walisische und irische Rechtschreibreformen behielten Latein; dieses Regal folgt diesen Standardorthographien (Zirkumflexe im Walisischen, Fada-Vokale im Irischen).",
  "alphabet.blurb.Basque":
    "In den Westpyrenäen seit vorromischer Zeit gesprochen; Isolat ohne gesicherte Verwandte. Schrift vor allem lateinisch seit der Frühen Neuzeit; die Standardisierung im 20. Jahrhundert fixierte ñ und ç in der Schulorthographie.",
  "alphabet.blurb.Maltese":
    "Aus mittelalterlichem Sizilianisch-Arabisch auf Malta, später in Kontakt mit Italienisch und Englisch. Semitisch im Bau, aber mit lateinischem Alphabet (standardisiert 1924) und Zusatzbuchstaben für Konsonanten, die englisches a–z nicht schreibt.",
  "alphabet.blurb.Caucasian":
    "Armenische Buchstaben werden traditionell Mesrop Maschtoz (um 405) für volkssprachliche Schrift zugeschrieben; georgisches Mchedruli stammt aus der mittelalterlichen georgischen Literatursprache. Beides sind eigenständige Links-nach-rechts-Alphabete, weder Latein noch Kyrillisch.",
  "alphabet.blurb.Semitic":
    "Hebräisch, Arabisch und Persisch schreiben von rechts nach links. Buchstaben liegen als abstrakte Unicode-Zeichen; der Browser (mit Noto) formt arabische und persische Verbindungen. Hebräisch führt Schlussformen als eigene Glyphen.",
  "alphabet.blurb.West African":
    "N’Ko ist ein von rechts nach links laufendes Alphabet, 1949 von Solomana Kanté für Mandingsprachen geschaffen — eigenständige westafrikanische Schrift, weder Latein noch Arabisch.",
  "alphabet.blurb.Ethiopic":
    "Die Geʿez-/äthiopische Schrift ist eine Abugida: jedes Zeichen ist eine Konsonant–Vokal-Silbe. Amharisch nutzt ein großes Fidel-Inventar; diese Linse ist eine kuratierte Auswahl unter dem Feistel-Größenlimit.",
  "alphabet.blurb.African Latin":
    "Viele afrikanische Sprachen nutzen lateinische Orthographien aus Mission, Kolonialschule und späteren Reformen. Zusatzbuchstaben (ɓɗƙ, ẹọṣ, ịụ, …) markieren Laute, die einfaches a–z nicht schreibt. Swahili braucht oft keine Extras.",
  "alphabet.blurb.Berber":
    "Tifinagh (Neo-Tifinagh / IRCAM) ist das moderne offizielle Amazigh-Alphabet in Marokko, wiederbelebt aus älteren libysch-berberischen Zeichen. Geometrische Links-nach-rechts-Buchstaben, getrennt von Latein und Arabisch.",
  "alphabet.blurb.CJK":
    "Ostasiatische Seiten unter dem Feistel-Softcap (4096 Zellen): japanisches Kana (Gojūon, ohne Dakuten), kuratierte Hangul-Silben und ein vereinfachtes Chinesisch-Frequenzpaket. Volles Unihan oder volles Hangul geht nicht als eine Linse.",
  "alphabet.blurb.Indic":
    "Brahmische Abugidas Indiens als Unicode-Atome (Vokale, Konsonanten, Matras, Virama/Zeichen) plus Leerzeichen, Komma, Punkt. Feistel speichert keine Konjunkt-Tabellen; Seiten sind Buchstabenrauschen, keine Orthographie.",
  "alphabet.blurb.Mongolic":
    "Mongolische Sprachen der Steppe. Modernes Khalkha-Mongolisch in der Mongolei nutzt ein kyrillisches Alphabet mit ө und ү für vordere gerundete Vokale — dieselbe Zivilschriftfamilie wie Russisch, anderes Feistel-Inventar.",
  "alphabet.blurb.Southeast Asian":
    "Festland- und See-Südostasien: Filipino und Vietnamesisch in Latein (ñ; đ und Tonvokale), Thai und Khmer als brahmischstämmige Abugidas mit selbst gehosteten Noto-Schriften. Seiten sind Glyphenprojektionen, keine Silbenorthographie.",

  "alphabet.lensBlurb.25":
    "Aus Borges’ Erzählung von 1941: zweiundzwanzig Buchstaben (a–v) sowie Leerzeichen, Komma und Punkt — das Alphabet, das die Fiktion der Bibliothek zuweist.",
  "alphabet.lensBlurb.29":
    "Aus Basiles libraryofbabel.info: englisches a–z sowie Leerzeichen, Komma und Punkt.",
  "alphabet.lensBlurb.48":
    "Basiles a–z plus Ziffern und gängige Satzzeichen, damit Titel und Seiten Ziffern und Satzzeichen enthalten können.",
  "alphabet.lensBlurb.60":
    "Basile++ plus Symbole aus URLs und Code (@, #, &, Klammern und Ähnliches).",
  "alphabet.lensBlurb.35":
    "Kastilische Schreibung wurde um Nebrija (1492) systematisiert. ñ schreibt den palatalen Nasal /ɲ/ (wie in año), historisch aus lateinischem nn.",
  "alphabet.lensBlurb.41":
    "Portugiesische Orthographie wuchs mit der atlantischen Expansion und späteren Rechtschreibreformen. ã/õ markieren Nasalvokale; Cedille ç markiert /s/ vor a/o/u.",
  "alphabet.lensBlurb.45":
    "Französische Akzente wurden durch Druck und Académie-Normen festgelegt. Sie markieren Vokalqualität, historisches s (â/ê) und offenes vs. geschlossenes e; œ und ç stammen aus dem Lateinischen und älteren Schreibkonventionen.",
  "alphabet.lensBlurb.32":
    "Italienisch blieb nah am lateinischen Buchstabenbestand. Akzente markieren vor allem die betonte Silbe, wenn das sonst unklar wäre.",
  "alphabet.lensBlurb.36":
    "Rumänisch kehrte im 19. Jahrhundert zu lateinischen Buchstaben zurück nach langer kyrillischer Nutzung in Kirche und Staat. ă/â/î/ș/ț markieren Zentralvokale sowie die Konsonanten /ʃ/ und /ts/.",
  "alphabet.lensBlurb.62":
    "Katalaniens literarische Erneuerung im 19. Jahrhundert fixierte eine moderne lateinische Norm. Der Punkt in l·l markiert doppeltes /l/ (geminat), unterschieden von einfachem l oder spanischem ll.",
  "alphabet.lensBlurb.33":
    "Deutsche ä/ö/ü markieren vorderzungenige Vokale aus historischem Umlaut (i-Umlaut). ß (Eszett) stammt aus einer Ligatur aus langem s + z und schreibt /s/ nach langen Vokalen und Diphthongen.",
  "alphabet.lensBlurb.34":
    "Niederländisch standardisierte sich über die Statenbijbel und spätere Rechtschreibgesetze. Diese Linse ergänzt akzentuierte Vokale é/ë/ï/ö/ü für Betonung oder Vokalqualität in Lehnwörtern und einigen nativen Formen.",
  "alphabet.lensBlurb.37":
    "Dänisch und Bokmål-Norwegisch teilen æ/ø/å für vordere und gerundete Vokale, die bloßes a/o nicht abdeckte, nachdem Latein in Skandinavien die Runen ablöste.",
  "alphabet.lensBlurb.38":
    "Schwedisch nutzt ä/ö/å für dieselben nordischen Vokalbedürfnisse wie Dänisch/Norwegisch, aber mit ä/ö statt æ/ø — eine Schreibspaltung der Frühen Neuzeit.",
  "alphabet.lensBlurb.49":
    "Isländisch behält þ und ð für die stimmlosen und stimmhaften Dentalfrikative (/θ/, /ð/) aus dem Altnordischen; die meisten anderen nordischen Sprachen ersetzten diese Buchstaben.",
  "alphabet.lensBlurb.40":
    "Finnische Schriftlichkeit verbreitete sich mit reformatorischen Fibeln (Agricola). ä/ö markieren Vorderzungenvokale; verdoppelte Buchstaben markieren Länge, die im Finnischen bedeutungsunterscheidend ist.",
  "alphabet.lensBlurb.43":
    "Estnische Orthographie wurde im 19. Jahrhundert neben dem Finnischen modernisiert. õ schreibt einen mittleren hinteren ungerundeten Vokal (/ɤ/), den Finnisch so nicht verwendet.",
  "alphabet.lensBlurb.44":
    "Ungarisch übernahm im Mittelalter lateinische Buchstaben. ő/ű markieren lange vordere gerundete Vokale; Digraphen wie sz/cs/ty schreiben Konsonanten, die einzelne lateinische Buchstaben nicht sauber abdeckten.",
  "alphabet.lensBlurb.39":
    "Die Reform von 1928 ersetzte osmanisch-arabische Schrift durch lateinische Buchstaben, gewählt passend zur türkischen Vokalharmonie — inklusive punktiertem i und punktlosem ı als getrennte Phoneme.",
  "alphabet.lensBlurb.46":
    "Das griechische Alphabet besteht seit der Antike fort. Die monotonische Reform von 1982 reduzierte die Akzente auf einen einzigen Tonos und behielt α–ω sowie Schluss-Sigma (ς).",
  "alphabet.lensBlurb.47":
    "Polnisch behielt Latein unter westlicher kirchlicher Schriftlichkeit. ą/ę markieren historische Nasalvokale; ł ist /w/; ć/ń/ś/ź/ż schreiben palatale oder postalveolare Konsonanten.",
  "alphabet.lensBlurb.52":
    "Tschechische Háček-Buchstaben (č/ř/š/ž und Verwandte) gehen auf Jan Hus zurück — Zusatzzeichen, damit Latein slawische Palatale und ř ohne Digraphen-Wust schreiben konnte.",
  "alphabet.lensBlurb.57":
    "Slowakische Schreibung wurde im 19. Jahrhundert neben dem Tschechischen standardisiert. ô schreibt den Diphthong /ʊɔ/; ľ schreibt palatales /ʎ/.",
  "alphabet.lensBlurb.42":
    "Gajs lateinische Schrift des 19. Jahrhunderts („Gajica“) gibt kroatischem und serbischem Latein einen Buchstaben (oder Digraphen) pro Laut, inklusive č/ć/đ/š/ž für Affrikaten und Frikative.",
  "alphabet.lensBlurb.53":
    "Slowenisch nutzte Latein unter habsburgischer Schule. č/š/ž schreiben die postalveolaren Konsonanten, die mit benachbarten südslawischen Lateinorthographien geteilt werden.",
  "alphabet.lensBlurb.54":
    "Russisches Kyrillisch stammt vom Kirchenslawischen. Peters Zivilschrift und spätere Anpassungen ergaben den modernen Satz, inklusive ё sowie hartem und weichem Zeichen.",
  "alphabet.lensBlurb.55":
    "Ukrainisches Kyrillisch markiert Laute, die von der russischen Schreibung abweichen: ї /ji/, є /je/ und ґ /g/ (unterscheidet sich von г /ɦ/).",
  "alphabet.lensBlurb.58":
    "Belarussisches Kyrillisch wurde im 20. Jahrhundert standardisiert. ў schreibt einen kurzen /w/-ähnlichen Vokal (wie in воўк), den die russische Orthographie nicht hat.",
  "alphabet.lensBlurb.56":
    "Bulgarisch war ein frühes literarisches Zentrum für Kyrillisch. Die moderne Schreibung nutzt ъ als Vollvokal und enthält mehrere ältere slawische Buchstaben nicht mehr.",
  "alphabet.lensBlurb.59":
    "Mazedonisches Standard-Kyrillisch wurde nach dem Zweiten Weltkrieg kodifiziert. ѓ/ќ (und ähnliche Buchstaben) schreiben palatale Verschlusslaute, die Nachbarstandards anders schreiben.",
  "alphabet.lensBlurb.61":
    "Vuk Karadžićs serbisches Kyrillisch ist eins zu eins der lateinischen Gajica zugeordnet — dasselbe phonemische Inventar in der anderen historischen Schrift.",
  "alphabet.lensBlurb.50":
    "Lettische moderne lateinische Orthographie festigte sich um 1908–1922. Makra (ā/ē/ī/ū) markieren lange Vokale; ģ/ķ/ļ/ņ markieren Palatale.",
  "alphabet.lensBlurb.51":
    "Litauisch nutzt seit Jahrhunderten lateinischen Druck. ą/ę/į/ų spiegeln historische Nasalvokale; ė und ū/ų helfen, Vokalqualität und -länge zu markieren, die in der Sprache noch bedeutungsunterscheidend sind.",
  "alphabet.lensBlurb.31":
    "Der Kongress von Manastir 1908 nahm den heutigen lateinischen Standard für Albanisch an. ç und ë schreiben /tʃ/ und den mittleren Zentralvokal /ə/.",
  "alphabet.lensBlurb.64":
    "Walisisch hat eine durchgehende lateinische Literatursprache seit dem Mittelalter. Zirkumflexe (â/ê/î/ô/û/ŵ/ŷ) markieren lange Vokale, auch auf w und y, wenn sie als Vokale fungieren.",
  "alphabet.lensBlurb.65":
    "Irisch ging von Ogham und späterer gälischer Schrift zu einer vereinfachten lateinischen Orthographie. Der Fada (á/é/í/ó/ú) markiert lange Vokale.",
  "alphabet.lensBlurb.63":
    "Baskisch wird seit dem späten Mittelalter in lateinischen Buchstaben geschrieben. ñ schreibt /ɲ/; ç erscheint in etablierten Schreibungen wie französischen Entlehnungen und manchen Namen.",
  "alphabet.lensBlurb.66":
    "Maltesisch standardisierte in den 1920ern ein lateinisches Alphabet. ċ/ġ/ż schreiben Affrikaten und /z/; ħ schreibt einen stimmlosen pharyngalen Frikativ aus seinem arabischstämmigen Konsonantensatz.",
  "alphabet.lensBlurb.67":
    "Mesrop Maschtoz wird traditionell die Schaffung armenischer Buchstaben um 405 zugeschrieben, damit Schrift und Liturgie auf Armenisch statt nur auf Griechisch oder Syrisch möglich wurden.",
  "alphabet.lensBlurb.68":
    "Mchedruli sind die modernen georgischen Buchstabenformen für den Alltag. Das Alphabet ist der georgischen Sprache eigen und entstand unabhängig von Latein und Kyrillisch.",
};

