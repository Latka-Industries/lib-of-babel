
import { en } from "../../js/lib/locales/en.js";
import { de } from "../../js/lib/locales/de.js";
import { nl } from "../../js/lib/locales/nl.js";
import {
  MBIT_SCALE_SAMPLES,
  mbitScaleTier,
  mbitScaleVars,
} from "../../js/lib/mbit-scale.js";
import {
  WINDOW_MAX,
  PAGES_PER_BOOK,
  DEFAULT_ALPHABET_ID,
  TITLE_LEN,
  MAX_SEARCH_CHARS,
  MAX_BOOK_SEARCH_CHARS,
  alphabetEntry,
} from "../../js/lib/constants.js";
import { alphabetPickerLabel } from "../../js/chrome/alphabet-picker.js";
import { startLoadingTypewriter } from "../../js/chrome/loading-wave.js";
import {
  formatCoordDisplay,
  formatCoordFull,
  formatUniverseLabel,
  findActionRow,
  escapeHtml,
} from "../../js/lib/util.js";
import { formatBitMagnitude } from "../../js/lib/coords.js";
import { setLocale, applyI18n } from "../../js/lib/i18n.js";
import {
  renderAboutAlphabets,
  renderAboutScale,
} from "../../js/about/about.js";

const CATALOGS = { en, de, nl };

function tCatalog(catalog, key, vars = {}) {
  let s = catalog[key] ?? en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

/** Label + title for page-scope escape buttons (minimap + Mbit notice). */
function paintToPageButton(id, translate) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = translate("gallery.mbitNotice.toPageScope");
  node.title = translate("gallery.mbitNotice.toPageScopeTitle");
}

/**
 * WASM-free stand-in for `formatAlphabetSymbolLabel` (real one calls into
 * the WASM `alphabet_symbols_json` via `alphabetCells`, which this sheet
 * never initializes). Registry ids double as glyph counts (e.g. 29 for
 * Basile a-z), so the sample label is accurate without loading WASM.
 */
function sheetAlphabetSymbolLabel(alphabetId, translate) {
  const entry = alphabetEntry(alphabetId);
  return translate("alphabet.symbolLabel", {
    name: entry.native || entry.name,
    n: alphabetId,
  });
}

/** Walk nested CSSRuleList (supports @media / @supports wrapping theme rules). */
function* iterCssRules(rules) {
  if (!rules) return;
  for (const rule of rules) {
    yield rule;
    if (rule.cssRules?.length) yield* iterCssRules(rule.cssRules);
  }
}

function* iterStyleSheets() {
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin
    }
    yield* iterCssRules(rules);
  }
}

/** Custom props declared on :root / [data-theme] in loaded stylesheets. */
function collectThemeCustomProps() {
  const names = new Set();
  for (const rule of iterStyleSheets()) {
    if (!(rule instanceof CSSStyleRule)) continue;
    const sel = rule.selectorText || "";
    if (!/(?:^|,)\s*:root\b|\[data-theme\b/.test(sel)) continue;
    for (let i = 0; i < rule.style.length; i++) {
      const name = rule.style.item(i);
      if (name?.startsWith("--")) names.add(name);
    }
  }
  return [...names].sort();
}

/** Declared value on :root (hex / color-mix), not computed rgb(). */
function tokenDeclared(cssVar) {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim() || "—"
  );
}

function isPaintToken(name, declared) {
  if (name.startsWith("--font")) return false;
  if (name === "--noise") return false;
  if (name.startsWith("--book-") || name === "--page-max") return false;
  if (name.startsWith("--atmosphere-corners")) return false;
  if (/^(-?\d|clamp|min\(|max\(|calc\()/i.test(declared)) return false;
  return (
    /^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color-mix|color\(|rgba|hsla|transparent)/i.test(
      declared,
    ) ||
    /--(bg|panel|ink|muted|accent|line|page-ink|hover|vignette|backdrop|mm-fill|panel-tinted)/.test(
      name,
    )
  );
}

function paintSwatches() {
  const root = document.getElementById("tokenSwatches");
  const misc = document.getElementById("tokenMisc");
  if (!root) return;
  const tokens = collectThemeCustomProps();
  const paint = [];
  const other = [];
  for (const cssVar of tokens) {
    const declared = tokenDeclared(cssVar);
    if (isPaintToken(cssVar, declared)) paint.push({ cssVar, declared });
    else other.push({ cssVar, declared });
  }
  root.innerHTML = paint
    .map(
      ({ cssVar, declared }) => `<figure class="sheet-swatch">
      <div class="sheet-swatch-chip" style="background:var(${cssVar})"></div>
      <figcaption>
        <code>${cssVar}</code>
        <span class="sheet-swatch-val">${declared}</span>
      </figcaption>
    </figure>`,
    )
    .join("");
  if (misc) {
    if (!other.length) {
      misc.hidden = true;
      misc.innerHTML = "";
    } else {
      misc.hidden = false;
      misc.innerHTML = other
        .map(
          ({ cssVar, declared }) => `<div class="sheet-token-misc-row">
        <code>${cssVar}</code>
        <span class="sheet-swatch-val">${declared}</span>
      </div>`,
        )
        .join("");
    }
  }
}

/**
 * Chip variants from live CSS: plain .ui, .ui.ui-*, button.about-goto-tab.
 * New modifiers in dialogs.css show up here without editing this page.
 */
function discoverChipVariants() {
  const byClass = new Map();
  for (const rule of iterStyleSheets()) {
    if (!(rule instanceof CSSStyleRule)) continue;
    for (const part of (rule.selectorText || "").split(",")) {
      const s = part.trim();
      if (/\.about-goto-tab\b/.test(s)) {
        byClass.set("ui about-goto-tab", {
          tag: "button",
          className: "ui about-goto-tab",
          label: "About transfer",
          sample: "ENGINES",
          attrs: 'type="button" data-about-tab="aboutTab-engines"',
        });
        continue;
      }
      const m = s.match(
        /(?:^|[\s>+~])(?:button\.)?\.ui((?:\.[a-zA-Z_][\w-]*)*)/,
      );
      if (!m) continue;
      const extras = m[1].split(".").filter(Boolean);
      // Skip pseudo-ish / hover-only if we only matched button.ui alone — still control.
      const className = ["ui", ...extras].join(" ");
      if (byClass.has(className)) continue;
      const isTab = extras.includes("ui-tab");
      byClass.set(className, {
        tag: "span",
        className,
        label: isTab
          ? "Tab chip"
          : extras.length
            ? `Chip · ${extras.join(".")}`
            : "Control chip",
        sample: isTab
          ? "Babelgram"
          : extras.length
            ? extras[extras.length - 1]
            : "search…",
        attrs: "",
      });
    }
  }
  // Stable order: control → tabs/modifiers → transfer
  const rank = (v) => {
    if (v.className === "ui") return 0;
    if (v.className.includes("about-goto-tab")) return 2;
    return 1;
  };
  return [...byClass.values()].sort(
    (a, b) => rank(a) - rank(b) || a.className.localeCompare(b.className),
  );
}

/** Path recipes (control → tab / control → control) scraped from locale HTML. */
function chipRecipesFromCatalog(catalog) {
  const seen = new Set();
  const recipes = [];
  const arrowRe =
    /<span class="ui(?: ui-tab)?">[^<]+<\/span>\s*→\s*<span class="ui(?: ui-tab)?">[^<]+<\/span>/g;
  for (const v of Object.values(catalog)) {
    if (typeof v !== "string") continue;
    if (!v.includes("class=") || !v.includes("→")) continue;
    const html = v.replace(/\\"/g, '"');
    for (const m of html.matchAll(arrowRe)) {
      const snippet = m[0];
      if (seen.has(snippet)) continue;
      seen.add(snippet);
      const hasTab = /ui-tab/.test(snippet);
      recipes.push({
        html: snippet,
        note: hasTab
          ? "search / dialog tab path"
          : "control path (e.g. save menu)",
      });
    }
  }
  return recipes;
}

function paintChips(locale = "en") {
  const mount = document.getElementById("chipMount");
  if (!mount) return;
  const variants = discoverChipVariants();
  const catalog = CATALOGS[locale] || en;
  const recipes = chipRecipesFromCatalog(catalog);
  const kinds = variants.length
    ? `<div class="sheet-chip-kinds">${variants
        .map((v) => {
          const el =
            v.tag === "button"
              ? `<button ${v.attrs} class="${v.className}">${v.sample}</button>`
              : `<span class="${v.className}">${v.sample}</span>`;
          return `<span class="sheet-chip-kind">${el}<span class="sheet-chip-meta"><code>.${v.className.replaceAll(" ", ".")}</code> · ${v.label}</span></span>`;
        })
        .join("")}</div>`
    : `<p class="find-dim">No <code>.ui</code> chip rules found in loaded stylesheets.</p>`;
  const recipeBlock = recipes.length
    ? `<div class="sheet-chip-recipes">${recipes
        .map(
          (r) => `<div class="sheet-chip-recipe about-body find-dim">
        <span class="sheet-chip-meta">${r.note}</span>
        ${r.html}
      </div>`,
        )
        .join("")}</div>`
    : "";
  mount.innerHTML = `${kinds}${recipeBlock}`;
}

/** Text content search · page + book bands — head/meta/hint/count from live locale. */
function paintSearchBook(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const findLabel = translate("search.find");

  const pageHead = document.getElementById("sheetSearchPageHead");
  const pageMeta = document.getElementById("sheetSearchPageMeta");
  const pageHint = document.getElementById("sheetSearchPageHint");
  const pageFind = document.getElementById("sheetSearchPageFind");
  const pageCount = document.getElementById("sheetSearchPageCount");
  if (pageHead) pageHead.textContent = translate("search.headContent");
  if (pageMeta) pageMeta.innerHTML = translate("search.metaContent");
  if (pageHint) pageHint.innerHTML = translate("search.hintContent");
  if (pageFind) pageFind.textContent = findLabel;
  if (pageCount) {
    pageCount.textContent = translate("search.count", {
      n: (0).toLocaleString(locale),
      max: MAX_SEARCH_CHARS.toLocaleString(locale),
    });
  }

  const head = document.getElementById("sheetSearchHead");
  const meta = document.getElementById("searchMeta");
  const hint = document.getElementById("searchHint");
  const handoff = document.getElementById("sheetSearchHandoff");
  const findBtn = document.getElementById("sheetSearchFind");
  const count = document.getElementById("sheetSearchCount");
  if (head) head.textContent = translate("search.headContentBook");
  if (meta) meta.innerHTML = translate("search.metaContentBook");
  if (hint) hint.innerHTML = translate("search.hintContentBook");
  if (handoff) handoff.innerHTML = translate("search.result.bookHandoffNote");
  if (findBtn) findBtn.textContent = findLabel;
  if (count) {
    count.textContent = translate("search.count", {
      n: (MAX_SEARCH_CHARS + 101).toLocaleString(locale),
      max: MAX_BOOK_SEARCH_CHARS.toLocaleString(locale),
    });
  }
}

/**
 * Header / footer / book nav from live locale + real coord formatters.
 * Sample book-scale axes: bit-width just over page-map ceiling (head…tail),
 * not a fake `(≈6.4 Mbit, ≈6.4 Mbit)` label — Mbit lives in tooltips / notices.
 */
const SHEET_SAMPLE_STEPS = 12;
const SHEET_SAMPLE_PAGE = 12;
/** Just above PAGE_MAP_MAX_BITS so display uses head…tail preview. */
const SHEET_SAMPLE_HUGE = 1n << 50_000n;

function paintChrome(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const setText = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };
  const setTitle = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.title = text;
  };

  setTitle("sheetLogo", translate("header.aboutTitle"));
  const uni = document.getElementById("sheetUniverse");
  if (uni) {
    uni.value = translate("header.universePlaceholder");
    uni.title = translate("header.universeTitle");
    uni.placeholder = translate("header.universePlaceholder");
  }
  setText("sheetAlphabet", alphabetPickerLabel(DEFAULT_ALPHABET_ID));
  setTitle("sheetAlphabet", translate("header.alphabetTitle"));
  setText("sheetActionsLabel", translate("actions.placeholder"));
  setTitle("sheetActionsTrig", translate("header.actionsTitle"));

  const wander = translate("footer.wanderings", {
    n: String(SHEET_SAMPLE_STEPS),
    max: String(WINDOW_MAX),
  });
  setText("sheetHistoryBtn", wander);
  setText("sheetControlsHistory", wander);
  setText("sheetGalleryLabel", translate("footer.gallery"));
  setText("sheetHashLabel", translate("footer.hash"));
  setText("sheetStepsLabel", translate("footer.steps"));
  setText("sheetSteps", String(SHEET_SAMPLE_STEPS));
  setText("sheetHash", "a1b2c3d4e5f6");
  setTitle("sheetHash", translate("footer.hashTitle"));

  const pageCoords = formatCoordDisplay(0n, -12n);
  const bookCoords = formatCoordDisplay(SHEET_SAMPLE_HUGE, SHEET_SAMPLE_HUGE);
  const bookFull = formatCoordFull(SHEET_SAMPLE_HUGE, SHEET_SAMPLE_HUGE);
  setText("sheetCoord", bookCoords);
  setTitle(
    "sheetCoord",
    translate("gallery.coordsHuge.title", {
      scope: "book-linked",
      coords: bookFull,
    }),
  );
  const note = document.getElementById("sheetCoordNote");
  if (note) {
    note.innerHTML =
      `Footer sample is <b>book-scale</b> display (<code>head…tail</code>), not Mbit chips. ` +
      `Page-scale would read <code>${pageCoords}</code>. ` +
      `Tooltip magnitude uses real formatter (e.g. ${formatBitMagnitude(6_400_000)}).`;
  }
  const typeCoords = document.getElementById("sheetTypeCoords");
  if (typeCoords) {
    typeCoords.textContent = `hash a1b2c3d4 · page ${pageCoords} · book ${bookCoords}`;
  }

  setText("sheetHelpLabel", translate("footer.help"));
  setText("sheetControlsHelpLabel", translate("footer.help"));
  setTitle("sheetHelpBtn", translate("footer.helpTitle"));
  setTitle("sheetControlsHelp", translate("footer.helpTitle"));

  setText("sheetViewToggle", translate("book.viewColor"));
  setText("sheetClearMark", translate("book.clearSearch"));
  setText("sheetPrev", translate("book.prev"));
  setText("sheetNext", translate("book.next"));
  setText(
    "sheetPageInd",
    translate("book.pageInd", {
      page: String(SHEET_SAMPLE_PAGE),
      total: String(PAGES_PER_BOOK),
    }),
  );
  setText("sheetPageTotal", `/ ${PAGES_PER_BOOK}`);
  setText("sheetPageGo", translate("common.go"));
  const pageJump = document.getElementById("sheetPageJump");
  if (pageJump) {
    pageJump.max = String(PAGES_PER_BOOK);
    pageJump.value = String(SHEET_SAMPLE_PAGE);
    pageJump.placeholder = translate("book.pagePlaceholder");
    pageJump.setAttribute("aria-label", translate("book.pagePlaceholder"));
  }
}

/** Fake spine titles — cosmetic only, not locale text; built once. */
const SHEET_WALL_SPINES = [
  ["OTIS", "PANE", "RUTH", "SILO", "ACRE", "VEIN", "MOTH", "GLEN", "DUSK", "FERN", "IVEN", "COVE"],
  ["ELMO", "GRIT", "NOVA", "PLUM", "QUAY", "RIFT", "SAGE", "TARN", "URNS", "VOID", "WISP", "YARE"],
];

/** Stage: minimap + wall labels from live locale; spines built once (fake). */
function paintStage(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const setText = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };
  const setTitle = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.title = text;
  };

  setText("sheetMinimapTitle", translate("minimap.here"));
  setTitle("sheetSigil", translate("minimap.sigilTitle"));
  setText("sheetMinimapHint", translate("minimap.hint"));
  paintToPageButton("sheetMinimapToPage", translate);
  const mm = document.getElementById("sheetMinimap");
  if (mm) mm.textContent = translate("gallery.coordsHuge.minimapShort");
  setText("sheetWallHead1", translate("book.wall", { n: "1" }));
  setText("sheetWallHead2", translate("book.wallBook", { n: "2", book: "7" }));
  startLoadingTypewriter(translate("loading.building"));

  ["sheetShelfTrack1", "sheetShelfTrack2"].forEach((trackId, wallIdx) => {
    const track = document.getElementById(trackId);
    if (!track || track.childElementCount) return; // fake spines, build once
    track.innerHTML = SHEET_WALL_SPINES[wallIdx]
      .map((title, i) => {
        const hue = (wallIdx * 12 + i) * 41;
        const picked = wallIdx === 0 && i === 3 ? " last-picked-up" : "";
        return `<div class="book${picked}" title="${title}" style="background: linear-gradient(180deg, hsl(${hue} 48% 44%), hsl(${hue} 52% 22%))">${title}</div>`;
      })
      .join("");
  });
}

/** Controls: full actions/save dropdown items, about tabs, search kind, link button. */
function paintControlsMenus(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const setText = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };
  const setTitle = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.title = text;
  };

  setText("sheetDdCopy", translate("actions.copy"));
  setText("sheetDdSearch", translate("actions.search"));
  setText("sheetDdExport", translate("actions.export"));
  setText("sheetDdVerify", translate("actions.verify"));
  setText("sheetDdReset", translate("actions.reset"));

  setText("sheetSaveLabel", translate("book.savePlaceholder"));
  setTitle("sheetSaveTrig", translate("book.saveTitle"));
  setText("sheetSaveBorrow", translate("book.borrow"));
  setText("sheetSaveImage", translate("book.image"));

  setText("sheetLinkLabel", translate("common.link"));
  setTitle("sheetLinkBtn", translate("book.linkTitle"));
  document.getElementById("sheetLinkBtn")?.setAttribute("aria-label", translate("common.link"));

  setText("sheetSearchKindLabel", translate("search.label"));
  document
    .getElementById("sheetSearchKindSelect")
    ?.setAttribute("title", translate("search.kindTitle"));
  setText("sheetKindContentOpt", translate("search.kindContent"));
  setText("sheetKindTitleOpt", translate("search.kindTitleOpt"));

  document.querySelectorAll("#sheetAboutTabs [data-key]").forEach((btn) => {
    btn.textContent = translate(btn.dataset.key);
  });
}

/** Mode band cards (default / title / photo / babel). Page + book content use the dialog mocks above. */
const SHEET_SEARCH_BAND_SPECS = [
  { key: "default", label: "default", head: "search.head", meta: "search.metaText" },
  {
    key: "title",
    label: "title",
    head: "search.headTitle",
    meta: "search.metaTitle",
    hint: "search.hintTitle",
    hintVars: { n: String(TITLE_LEN) },
  },
  { key: "photo", label: "photo mosaic", head: "search.headMosaic", meta: "search.metaMosaic" },
  {
    key: "babel",
    label: "Babelgram",
    head: "search.headBabel",
    meta: "search.metaBabel",
    honesty: "search.babel.honesty",
  },
];

function paintSearchBands(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const mount = document.getElementById("sheetSearchBands");
  if (!mount) return;
  mount.innerHTML = SHEET_SEARCH_BAND_SPECS.map((spec) => {
    const head = translate(spec.head);
    const meta = translate(spec.meta);
    const hint = spec.hint ? translate(spec.hint, spec.hintVars) : "";
    const honesty = spec.honesty
      ? translate(spec.honesty, { go: translate("search.go"), copy: translate("actions.copy") })
      : "";
    return `<article class="sheet-mbit-card sheet-band-card">
      <header>
        <code>${spec.key}</code>
        <span class="sheet-mbit-meta">${spec.label}</span>
      </header>
      <h3 style="margin: 0 0 0.15rem; font-size: 0.92rem">${head}</h3>
      <p class="find-dim sheet-search-meta" style="margin: 0">${meta}</p>
      ${hint ? `<p class="find-dim" style="margin: 0.4rem 0 0; font-size: 0.75rem">${hint}</p>` : ""}
      ${honesty ? `<p class="find-dim" style="margin: 0.4rem 0 0; font-size: 0.75rem">${honesty}</p>` : ""}
    </article>`;
  }).join("");
}

/** Search editor samples — valid field + invalid-character highlight. */
function paintSearchEditors(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const sample = translate("search.placeholderContent");

  const ta1 = document.getElementById("sheetSearchEditorInput");
  const bd1 = document.getElementById("sheetSearchBackdrop");
  if (ta1) {
    ta1.placeholder = sample;
    ta1.value = sample;
  }
  if (bd1) bd1.textContent = sample;

  const invalidChar = "9";
  const ta2 = document.getElementById("sheetSearchEditorInvalidInput");
  const bd2 = document.getElementById("sheetSearchBackdrop2");
  if (ta2) ta2.value = `${sample}${invalidChar}`;
  if (bd2) {
    bd2.innerHTML = `${escapeHtml(sample)}<mark class="search-invalid">${escapeHtml(invalidChar)}</mark>`;
  }

  const err = document.getElementById("sheetSearchErrorSample");
  if (err) {
    err.textContent = translate("search.error.invalid", {
      alphabet: sheetAlphabetSymbolLabel(DEFAULT_ALPHABET_ID, translate),
      shown: `"${invalidChar}"`,
    });
  }
}

/** Mosaic honesty / palette / warm-progress copy + the "best mosaic match" hit card. */
function paintSearchMosaicSample(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const setText = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };

  setText("sheetMosaicHonesty", translate("search.metaBabel"));
  setText("sheetMosaicPaletteNote", translate("search.mosaic.progressPalette"));
  setText(
    "sheetWarmLabel",
    translate("search.mosaic.progressWarm", { slow: translate("search.canTakeAFew") }),
  );

  const elapsed = translate("search.mosaic.elapsedMinSec", { m: "4", s: "57" });
  setText("sheetHitIntro", `${translate("search.mosaic.resultsIntroBest")} · ${elapsed}`);
  setText("sheetHitThumbCap", translate("search.mosaic.thumbMosaic"));

  const rms = document.getElementById("sheetHitRms");
  if (rms) {
    rms.textContent = translate("search.babel.metric.rms", { n: "99.97" });
    rms.dataset.tip = translate("search.mosaic.tip.rms");
  }
  const mae = document.getElementById("sheetHitMae");
  if (mae) {
    mae.textContent = translate("search.babel.metric.mae", { n: "0.012" });
    mae.dataset.tip = translate("search.mosaic.tip.mae");
  }
  const corr = document.getElementById("sheetHitCorr");
  if (corr) {
    corr.textContent = translate("search.babel.metric.corr", { n: "1.0000" });
    corr.dataset.tip = translate("search.mosaic.tip.corr");
  }
  const exact = document.getElementById("sheetHitExact");
  if (exact) {
    exact.textContent = translate("search.mosaic.exactOk");
    exact.dataset.tip = translate("search.mosaic.tip.exactOk");
  }

  const galleryLine = document.getElementById("sheetHitGalleryLine");
  if (galleryLine) {
    galleryLine.innerHTML =
      `${translate("search.result.gallery", { coords: formatCoordDisplay(0n, -12n) })} · ` +
      `${translate("search.mosaic.hitBook", { book: "12" })} · ` +
      `${sheetAlphabetSymbolLabel(DEFAULT_ALPHABET_ID, translate)}`;
  }

  setText("sheetHitGo", translate("search.go"));
  setText("sheetHitCopy", translate("actions.copy"));
  setText("sheetHitCheckDiff", translate("search.babel.compare.checkDiff"));
  setText("sheetHitCompareLetters", translate("search.mosaic.compare.checkDiff"));

  // Babelgram Mbit universe-shift sample (exact-book path after session follows stamp).
  const shiftUni = "wonderland";
  const shiftSeed = "0x9f8e7d6c5b4a";
  const shiftNote = document.getElementById("sheetBabelShiftNote");
  if (shiftNote) {
    shiftNote.innerHTML = translate("search.babel.universeShifted", {
      universe: escapeHtml(formatUniverseLabel(shiftUni)),
      seed: escapeHtml(shiftSeed),
    });
  }
  const babelIntro = document.getElementById("sheetBabelIntroSame");
  if (babelIntro) {
    babelIntro.textContent = translate("search.babel.resultsIntroSame", {
      universe: formatUniverseLabel(shiftUni),
      seed: shiftSeed,
    });
  }
  setText("sheetBabelVerifyOk", translate("search.babel.verifyOk"));
  const babelGal = document.getElementById("sheetBabelGalleryLine");
  if (babelGal) {
    babelGal.innerHTML =
      `${translate("search.result.gallery", { coords: formatCoordDisplay(SHEET_SAMPLE_HUGE, SHEET_SAMPLE_HUGE) })} · ` +
      `${translate("search.mosaic.hitBook", { book: "14" })} · ` +
      `${sheetAlphabetSymbolLabel(DEFAULT_ALPHABET_ID, translate)}`;
  }
  setText("sheetBabelGo", translate("search.go"));
  setText("sheetBabelCopy", translate("actions.copy"));
}

/** Text-hit result card (`.find-result.show`) — book-scope hit, same builder as production. */
function paintSearchHit(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const box = document.getElementById("sheetSearchHitResult");
  if (!box) return;
  const alphabet = sheetAlphabetSymbolLabel(DEFAULT_ALPHABET_ID, translate);
  const chars = translate("search.result.chars", { n: (842).toLocaleString(locale) });
  const pages = translate("search.result.page", { n: "205" });
  const detail = translate("search.result.detailContentBook", { pages, chars, alphabet });
  box.innerHTML =
    `<div class="find-big" title="${formatCoordFull(SHEET_SAMPLE_HUGE, SHEET_SAMPLE_HUGE)}">${translate(
      "search.result.gallery",
      { coords: formatCoordDisplay(SHEET_SAMPLE_HUGE, SHEET_SAMPLE_HUGE) },
    )}</div>` +
    `<div class="find-dim">${translate("search.result.coords", {
      universe: `<b>${formatUniverseLabel("")}</b>`,
      wall: "2",
      shelf: "3",
      book: "14",
      detail,
    })}</div>` +
    `<p class="find-dim">${translate("search.result.bookHandoffNote")}</p>` +
    findActionRow([
      { id: "go", label: translate("search.go") },
      { id: "link", label: translate("actions.copy") },
    ]);
}

/** Sample wanderings rows — fake trail, real `.hrow` grid + copy-button label from locale. */
const SHEET_HISTORY_SAMPLE = [
  { step: 126, coords: "(1234, -87)", move: "▷", uni: "default", alpha: "a–z · Basile", hash: "a1b2c3d4e5f6", current: true },
  { step: 125, coords: "(1233, -87)", move: "▲", uni: "default", alpha: "a–z · Basile", hash: "9f8e7d6c5b4a", current: false },
  { step: 124, coords: "(1233, -88)", move: "◇", uni: "wonderland", alpha: "de · Deutsch", hash: "0011223344ff", current: false },
];

function paintHistoryRows(translate) {
  const list = document.getElementById("sheetHistoryList");
  if (!list) return;
  const copyLabel = translate("common.link");
  list.innerHTML = SHEET_HISTORY_SAMPLE.map(
    (row) => `<div class="hrow${row.current ? " current" : ""}">
      <span class="step">${row.step}</span>
      <span class="coord">${row.coords}</span>
      <span class="move">${row.move}</span>
      <span class="uni">${row.uni}</span>
      <span class="alpha">${row.alpha}</span>
      <span class="hh">${row.hash}</span>
      <button type="button" class="copy">${copyLabel}</button>
    </div>`,
  ).join("");
}

/** Dialogs: mbit-notice fixed CTAs, wait variants, history, verify, alphabet picker, jump, book reader, legacy. */
function paintDialogsInventory(locale = "en") {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const setText = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };
  const setHtml = (id, html) => {
    const node = document.getElementById(id);
    if (node) node.innerHTML = html;
  };

  setHtml("sheetMbitTitle", translate("gallery.mbitNotice.title"));
  setHtml("sheetMbitBody", translate("gallery.mbitNotice.body"));
  setText("sheetMbitHashLabel", translate("gallery.mbitNotice.hashLabel"));
  setText("sheetMbitCoordsLabel", translate("gallery.mbitNotice.coordsLabel"));
  setText("sheetMbitDigitsLabel", translate("gallery.mbitNotice.digitsLabel"));
  setText("sheetMbitGotIt", translate("gallery.mbitNotice.gotIt"));
  paintToPageButton("sheetMbitToPage", translate);
  setText("sheetMbitEngines", translate("gallery.mbitNotice.engines"));
  setText("sheetMbitClose", translate("common.close"));

  setHtml("sheetWaitBook", translate("book.waitMbit"));
  setHtml("sheetWaitImage", translate("book.waitMbitImage"));
  setHtml("sheetWaitBorrow", translate("book.waitMbitBorrow"));

  setText("sheetHistoryTitle", translate("history.title"));
  setText("sheetHistoryMeta", translate("history.meta", { shown: "3", total: "128" }));
  paintHistoryRows(translate);

  setText("sheetVerifyTitle", translate("verify.title"));
  setText("sheetVerifyMeta", translate("verify.meta"));
  const alphaLabel = sheetAlphabetSymbolLabel(DEFAULT_ALPHABET_ID, translate);
  setText("sheetVerifyAlphaOk", alphaLabel);
  setText("sheetVerifyAlphaBad", alphaLabel);

  setText("sheetAlphaPickerH", translate("alphabet.picker.h"));
  setText("sheetAlphaPickerSub", translate("alphabet.picker.sub"));
  setText("sheetAlphaFamily1", translate("alphabet.group.Latin base"));
  setText("sheetAlphaFamily2", translate("alphabet.group.Romance"));
  setText("sheetAlphaFamily3", translate("alphabet.group.Germanic"));

  setText("sheetJumpTitle", translate("jump.title"));
  setText("sheetJumpSubtitle", translate("jump.subtitle"));
  setText("sheetJumpGo", translate("common.go"));

  setText("sheetBookReaderTitle", translate("search.mosaic.hitBook", { book: "12" }));
  setText(
    "sheetBookReaderMeta",
    translate("book.pageInd", { page: "205", total: String(PAGES_PER_BOOK) }),
  );
  setText("sheetBookSaveLabel", translate("book.savePlaceholder"));
  setText("sheetBookSaveBorrow", translate("book.borrow"));
  setText("sheetBookSaveImage", translate("book.image"));
  setText("sheetBookLinkLabel", translate("common.link"));
  setText("sheetViewColorLabel", translate("book.viewColor"));

  setText("sheetLegacyTitle", translate("legacy.gv.title"));
  setText("sheetLegacyBody", translate("legacy.gv.bodyJourney", { old: "3", cur: "4" }));
  setText("sheetLegacyContinue", translate("legacy.gv.continue"));
  setText("sheetLegacyWipe", translate("legacy.gv.wipe"));
  setText("sheetLegacySkip", translate("legacy.gv.skipSession"));
}

/** Paints every dynamic sample on the sheet for one locale — called on load + locale tab clicks. */
function paintInventory(locale = "en") {
  setLocale(locale);
  paintChrome(locale);
  paintSearchBook(locale);
  paintChips(locale);
  paintStage(locale);
  paintControlsMenus(locale);
  paintSearchBands(locale);
  paintSearchEditors(locale);
  paintSearchMosaicSample(locale);
  paintSearchHit(locale);
  paintDialogsInventory(locale);
  paintAboutGuide(locale);
}

/** Full LIB·OF·BABEL guide — same locale keys + scale/alphabet renderers as production. */
function paintAboutGuide(locale = "en") {
  setLocale(locale);
  const modal = document.getElementById("aboutModal");
  if (!modal) return;
  applyI18n(modal);
  renderAboutScale();
  renderAboutAlphabets();
}

function paintMbit(locale) {
  const catalog = CATALOGS[locale] || en;
  const translate = (key, vars) => tCatalog(catalog, key, vars);
  const mount = document.getElementById("mbitScaleMount");
  if (!mount) return;
  const body = translate("gallery.mbitNotice.body");
  const cards = MBIT_SCALE_SAMPLES.map(({ tier, bits, note }) => {
    const got = mbitScaleTier(bits);
    const vars = mbitScaleVars(bits, { locale, t: translate });
    const html = translate(`gallery.mbitNotice.scale.${tier}`, vars);
    const warn =
      got !== tier
        ? ` <em style="color:#c45c5c">(tier fn → ${got})</em>`
        : "";
    return `<article class="sheet-mbit-card">
      <header>
        <code>${tier}</code>
        <span class="sheet-mbit-meta">${note} · ${bits.toLocaleString("en-US")} bit${warn}</span>
      </header>
      <div class="sheet-mbit-vars">
        <code>{mbit}=${vars.mbit}</code>
        <code>{digits}=${vars.digits}</code>
        <code>{mb}=${vars.mb}</code>
        <code>{recite}=${vars.recite}</code>
      </div>
      <div class="copy">${html}</div>
    </article>`;
  }).join("");
  mount.innerHTML = `<div class="sheet-panel" style="margin-bottom:0.75rem">${body}</div>${cards}`;
}

/** Fake reproject (warm mosaic) ↔ near-black diff wipe — same cut as production. */
function paintSheetCompare(t) {
  const canvas = document.getElementById("sheetCompareCanvas");
  if (!canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const cut = Math.round(Math.min(1, Math.max(0, t)) * w);
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x < cut) {
        // reproject: warm stamp noise
        const n = ((x * 17 + y * 31) & 31) / 31;
        d[i] = 90 + n * 80;
        d[i + 1] = 55 + n * 40;
        d[i + 2] = 35 + ((x + y) & 15);
        d[i + 3] = 255;
      } else {
        // diff: near-black with faint residual
        const n = (x * 13 + y * 7) & 7;
        d[i] = n;
        d[i + 1] = n;
        d[i + 2] = n;
        d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  // Hairline at wipe edge (matches production).
  if (cut > 0 && cut < w) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(cut - 0.5, 0, 1, h);
  }
}



export {
  paintInventory,
  paintMbit,
  paintSwatches,
  paintSheetCompare,
  collectThemeCustomProps,
  discoverChipVariants,
};
