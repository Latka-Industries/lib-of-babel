// The book reader: open a book, page through it, the per-page colour map, and
// taking it home (full text, or the whole-book colour image from WASM).

import {
  S,
  rememberBookIdentity,
  recallBookIdentity,
} from "../gallery/state.js";
import {
  el,
  escapeHtml,
  downloadBlob,
  openModal,
  formatCoordDisplay,
  formatCoordFull,
} from "../lib/util.js";
import { buildAlphabetPalette, SPACE_CELL_HEX, wireRollingPaletteSpin } from "../lib/color.js";
import {
  flattenSearchQuery,
  normalizeSearchQuery,
  segmentText,
  validateSearchQuery,
} from "./search-query.js";
import {
  PAGES_PER_BOOK,
  PAGE_CONTENT_SYMBOLS,
  CHARS_PER_LINE,
  LINES_PER_PAGE,
  alphabetCells,
  alphabetIsRtl,
  alphabetLang,
  alphabetScript,
  syncAlphabetPresentation,
} from "../lib/constants.js";
import { t } from "../lib/i18n.js";
import { syncUrl } from "../gallery/url.js";
import { coordForWasm } from "../lib/coords.js";
import {
  book_image_dims,
  gallery_titles_json,
  book_text_for,
  book_text_book_scope_for,
  page_text_for,
  page_text_book_scope_for,
  search_page_embed_for,
  get_universe,
  node_hash_hex,
  mosaic_flat_for,
  room_accent,
} from "../lib/wasm.js";
import { babelExportFilename, injectBabelChunk, contentSeal } from "../lib/png-babel.js";
import { titleEmbedFlat } from "./search.js";
import { generateBookImageRgba } from "./book-image-pool.js";

/** Bumps when a newer render starts — drop stale worker results. */
let bookImageRenderGen = 0;

// the page's characters rewrapped into the near-square divisor pair (64×50) so
// the colour map reads as a block rather than a 2:1 sliver. Looks like colour
// noise, since the text is maximum-entropy.
function pageGrid(total) {
  let rows = Math.floor(Math.sqrt(total));
  while (total % rows !== 0) rows--;
  return { cols: total / rows, rows };
}

function phraseMatch(pageText, phrase) {
  if (!phrase) return null;
  const needle = phrase.replace(/[\r\n]/g, "");
  const hay = pageText.replace(/\n/g, "");
  const start = hay.indexOf(needle);
  if (!needle || start < 0) return null;
  const before = segmentText(hay.slice(0, start), S.alphabetId).cells.length;
  const mid = segmentText(needle, S.alphabetId).cells.length;
  return { start, len: needle.length, cellStart: before, cellLen: mid };
}

function pageHighlightPhrase(pageText, phrase) {
  const match = phraseMatch(pageText, phrase);
  if (!match) return null;
  const { start, len } = match;
  let html = "";
  let contentIdx = 0;
  for (let i = 0; i < pageText.length; i++) {
    const ch = pageText[i];
    if (ch === "\n") {
      html += "\n";
      continue;
    }
    if (contentIdx === start) html += '<mark class="search-hit">';
    html += escapeHtml(ch);
    if (contentIdx === start + len - 1) html += "</mark>";
    contentIdx++;
  }
  return html;
}

function renderBookCanvas(pageText, highlightStart = -1, highlightLen = 0) {
  const flat = pageText.replace(/\n/g, "");
  const { cells } = segmentText(flat, S.alphabetId);
  const { cols, rows } = pageGrid(cells.length || 1);
  const cellPx = 10;
  const cv = el("bookCanvas");
  cv.width = cols * cellPx;
  cv.height = rows * cellPx;
  const ctx = cv.getContext("2d");
  const alpha = alphabetCells(S.alphabetId);
  const palette = buildAlphabetPalette(
    alpha,
    S.accentHue,
    S.accentChroma,
    S.accentLightness,
  );
  const glyphIndex = new Map(alpha.map((ch, i) => [ch, i]));
  for (let k = 0; k < cells.length; k++) {
    const ch = cells[k];
    const i = glyphIndex.has(ch) ? glyphIndex.get(ch) : -1;
    const x = (k % cols) * cellPx;
    const y = Math.floor(k / cols) * cellPx;
    ctx.fillStyle = ch === " " || i < 0 ? SPACE_CELL_HEX : palette[i];
    ctx.fillRect(x, y, cellPx, cellPx);
    if (
      highlightLen > 0 &&
      k >= highlightStart &&
      k < highlightStart + highlightLen
    ) {
      ctx.fillStyle = "rgba(201, 162, 39, 0.45)";
      ctx.fillRect(x, y, cellPx, cellPx);
      ctx.strokeStyle = "rgba(201, 162, 39, 1)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, cellPx - 1, cellPx - 1);
    }
  }
}

function titleForIndex(i) {
  try {
    return (
      JSON.parse(
        gallery_titles_json(
          coordForWasm(S.z),
          coordForWasm(S.n),
          S.alphabetId,
          titleEmbedFlat(),
        ),
      )[i] || null
    );
  } catch {
    return null;
  }
}

/** Format one page from a full-book letter flat (Find / Babelgram identity). */
function pageTextFromContentFlat(flat, pageIndex, alphabetId) {
  const book = S.currentBook;
  let cells = book?.contentCells;
  if (!cells) {
    cells = segmentText(flat, alphabetId).cells;
    if (book) book.contentCells = cells;
  }
  const start = pageIndex * PAGE_CONTENT_SYMBOLS;
  const slice = cells.slice(start, start + PAGE_CONTENT_SYMBOLS);
  let out = "";
  for (let row = 0; row < LINES_PER_PAGE; row++) {
    for (let col = 0; col < CHARS_PER_LINE; col++) {
      out += slice[row * CHARS_PER_LINE + col] ?? "";
    }
    out += "\n";
  }
  return out;
}

function pageTextForBook(bookIndex, pageIndex, searchQuery = "", searchStartPage = -1) {
  const flat = S.currentBook?.contentFlat;
  if (typeof flat === "string" && flat.length) {
    return pageTextFromContentFlat(flat, pageIndex, S.alphabetId);
  }
  if (S.bijectionScope === "book") {
    // Book-linked Find — first call may materialise the full book (cached).
    return page_text_book_scope_for(
      coordForWasm(S.z),
      coordForWasm(S.n),
      bookIndex,
      pageIndex,
      S.alphabetId,
    );
  }
  return page_text_for(
    coordForWasm(S.z),
    coordForWasm(S.n),
    bookIndex,
    pageIndex,
    S.alphabetId,
    searchQuery || "",
    searchQuery ? searchStartPage : -1,
  );
}

function yieldToUi() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/** Book-linked virgin text needs α^BOOK materialise (minutes the first time). */
function needsMbitBookWait(book = S.currentBook) {
  return (
    S.bijectionScope === "book" &&
    !!book &&
    !book.contentFlat &&
    !book.bookScopeReady
  );
}

function showBookWait(labelKey, { image = false } = {}) {
  const root = el(image ? "imageWait" : "bookWait");
  const label = el(image ? "imageWaitLabel" : "bookWaitLabel");
  if (label) label.textContent = t(labelKey);
  if (!root) return;
  root.hidden = false;
  root.setAttribute("aria-busy", "true");
  // Fresh run+spin each show — transform-only roll keeps moving during WASM.
  const track = root.querySelector(".find-progress-track");
  if (!track) return;
  track.innerHTML = `<span class="find-progress-run"><span class="find-progress-spin"></span></span>`;
  const spin = track.querySelector(".find-progress-spin");
  try {
    const palette = buildAlphabetPalette(
      alphabetCells(S.alphabetId),
      S.accentHue,
      S.accentChroma,
      S.accentLightness,
    );
    wireRollingPaletteSpin(spin, palette);
  } catch {
    /* keep default ink fill */
  }
}

function hideBookWait({ image = false } = {}) {
  const root = el(image ? "imageWait" : "bookWait");
  if (root) {
    root.hidden = true;
    root.setAttribute("aria-busy", "false");
  }
}

/** Paint the wait chrome, then run blocking work so the spinner is visible first. */
async function withBookWait(labelKey, fn, { image = false } = {}) {
  showBookWait(labelKey, { image });
  await yieldToUi();
  await yieldToUi();
  try {
    return await fn();
  } finally {
    hideBookWait({ image });
  }
}

/**
 * Book chrome without `page_text_for` (full-book Basile would freeze the tab).
 * Used when `&bo=` already handed off the colour map.
 */
function renderBookPageShell() {
  if (!S.currentBook) return;
  const p = S.currentBook.page;
  const meta = el("bookMeta");
  // Display 1-based book # to match wall hover ("Wall N · book K").
  meta.textContent =
    `gallery ${formatCoordDisplay(S.z, S.n)} · book ${S.currentBook.index + 1}`;
  meta.title = `gallery ${formatCoordFull(S.z, S.n)} · shelf index ${S.currentBook.index} (0–699)`;
  const clearBtn = el("clearBookSearch");
  if (clearBtn) clearBtn.hidden = true;
  el("pageInd").textContent = t("book.pageInd", {
    page: p + 1,
    total: PAGES_PER_BOOK,
  });
  const jump = el("pageJump");
  if (jump && document.activeElement !== jump) jump.value = String(p + 1);
  const total = el("pageTotal");
  if (total) total.textContent = `/ ${PAGES_PER_BOOK}`;
  const pageEl = el("bookPage");
  pageEl.hidden = false;
  el("bookCanvas").hidden = true;
  pageEl.textContent = "…";
  el("prevPage").disabled = p <= 0;
  el("nextPage").disabled = p >= PAGES_PER_BOOK - 1;
  syncUrl();
}

/** Fill virgin page text only when the user asks (page turn / view toggle).
 * Never auto-run after Find handoff — `page_text_for` freezes the tab. */
export async function hydrateBookPageText() {
  const book = S.currentBook;
  if (!book) return;
  book.deferPageText = false;
  const pageEl = el("bookPage");
  if (pageEl) pageEl.textContent = "…";
  if (S.currentBook !== book) return;
  try {
    await renderBookPage();
  } catch (err) {
    console.error(err);
    if (pageEl) pageEl.textContent = "(page text unavailable — color map is open above)";
  }
}

/** Book-linked materialise is expensive — never warm on the UI thread. */
export function warmPageGenerator() {
  /* intentionally empty */
}

export function openBook(
  bookIndex,
  title,
  startPage = 1,
  searchHighlight = null,
  searchPageSpan = 1,
  {
    viewMode = null,
    imageRgba = null,
    imageW = 0,
    imageH = 0,
    contentFlat = null,
  } = {},
) {
  const page = Math.min(PAGES_PER_BOOK, Math.max(1, startPage)) - 1;
  // Mbit rooms are book-linked — never fall back to the page map on reopen.
  if (S.coordsHuge) S.bijectionScope = "book";
  // Spine reopen after Find: reuse session identity (flat was only on `#bo=` once).
  const cached =
    !(typeof contentFlat === "string" && contentFlat.length) &&
    !imageRgba?.length
      ? recallBookIdentity(bookIndex)
      : null;
  const contentFlatIn =
    typeof contentFlat === "string" && contentFlat.length
      ? contentFlat
      : cached?.flat || null;
  const imageRgbaIn = imageRgba?.length
    ? imageRgba
    : cached?.imageRgba || null;
  const imageWIn = imageRgba?.length ? imageW : cached?.imageW || imageW || 0;
  const imageHIn = imageRgba?.length ? imageH : cached?.imageH || imageH || 0;
  // Full-book letter flat (photo Find) is identity — not a search highlight.
  const handedFlat =
    typeof contentFlatIn === "string" && contentFlatIn.length
      ? contentFlatIn
      : null;
  const raw = !handedFlat && searchHighlight
    ? normalizeSearchQuery(searchHighlight)
    : null;
  const longEmbed = raw != null && raw.length >= PAGE_CONTENT_SYMBOLS;
  // Long embed without contentFlat (legacy Babelgram) still rides as highlight.
  const highlight = handedFlat
    ? null
    : raw
      ? longEmbed
        ? raw
        : flattenSearchQuery(raw, S.alphabetId)
      : null;
  const contentFlatFinal = handedFlat || (longEmbed ? raw : null);
  // Never preload 410 Basile pages — page_text_for is enough for the reader;
  // borrow / save generate the full flat on demand (cost scales with |Σ|).
  const text = "";
  if (viewMode === "color" || viewMode === "text") {
    S.viewMode = viewMode;
    const toggle = el("viewToggle");
    if (toggle) {
      toggle.textContent =
        S.viewMode === "color" ? t("book.viewText") : t("book.viewColor");
    }
  }
  // Show the dialog before spine title / page WASM so deep links feel instant.
  const hasHandoffImage = Boolean(imageRgbaIn?.length);
  S.currentBook = {
    index: bookIndex,
    title: title || `book ${bookIndex + 1}`,
    text,
    page,
    searchHighlight: highlight,
    searchStartPage: highlight ? page : null,
    searchPageSpan: highlight ? searchPageSpan : null,
    // Find letter grid — page text slices this; colour map must match it.
    contentFlat: contentFlatFinal,
    contentCells: null,
    // Book-scope proof RGBA from Find (optional instant paint).
    imageRgba: imageRgbaIn || null,
    imageW: imageWIn || 0,
    imageH: imageHIn || 0,
    // Defer only when we have pixels but no letters yet (should be rare).
    deferPageText: hasHandoffImage && !contentFlatFinal,
    // Cleared after first book-linked materialise (page turns reuse WASM cache).
    bookScopeReady: Boolean(contentFlatFinal),
  };
  if (contentFlatFinal || imageRgbaIn?.length) {
    rememberBookIdentity(bookIndex, {
      flat: contentFlatFinal,
      imageRgba: imageRgbaIn,
      imageW: imageWIn,
      imageH: imageHIn,
    });
  }
  el("bookTitle").textContent = S.currentBook.title;
  hideBookWait();
  if (!el("bookModal").open) el("bookModal").showModal();
  // Title map is tiny even in Mbit rooms — always resolve when missing.
  if (!title) {
    const resolved = titleForIndex(bookIndex);
    if (resolved) {
      S.currentBook.title = resolved;
      el("bookTitle").textContent = resolved;
    }
  }
  if (S.currentBook.deferPageText) renderBookPageShell();
  else void renderBookPage();
}

/**
 * Re-open the current book under the live lens/universe.
 * @param {"keep"|"clear"} highlightMode keep only if still valid for the alphabet
 */
export function reopenCurrentBook(highlightMode = "clear") {
  if (!S.currentBook) return;
  const b = S.currentBook;
  let highlight = null;
  let span = 1;
  if (highlightMode === "keep" && b.searchHighlight) {
    if (validateSearchQuery(b.searchHighlight, S.alphabetId).length === 0) {
      highlight = b.searchHighlight;
      span = b.searchPageSpan || 1;
    }
  }
  openBook(b.index, null, b.page + 1, highlight, span, {
    contentFlat: b.contentFlat || null,
    imageRgba: b.imageRgba || null,
    imageW: b.imageW || 0,
    imageH: b.imageH || 0,
  });
}

/**
 * Drop search highlight / `&q=` while keeping the same virgin page open.
 */
export function clearBookSearchHighlight() {
  if (!S.currentBook?.searchHighlight) return;
  S.currentBook.searchHighlight = null;
  S.currentBook.searchStartPage = null;
  S.currentBook.searchPageSpan = null;
  void renderBookPage();
}

export async function renderBookPage() {
  if (!S.currentBook) return;
  if (S.currentBook.deferPageText) {
    renderBookPageShell();
    return;
  }
  const book = S.currentBook;
  if (needsMbitBookWait(book)) {
    await withBookWait("book.waitMbit", () => {
      if (S.currentBook !== book) return;
      renderBookPageSync();
      if (S.currentBook === book) book.bookScopeReady = true;
    });
    return;
  }
  renderBookPageSync();
}

function renderBookPageSync() {
  if (!S.currentBook) return;
  const p = S.currentBook.page;
  const onSearchPage =
    S.currentBook.searchHighlight != null &&
    S.currentBook.searchStartPage != null &&
    p >= S.currentBook.searchStartPage &&
    p < S.currentBook.searchStartPage + S.currentBook.searchPageSpan;
  const pageInSpan = onSearchPage ? p - S.currentBook.searchStartPage : 0;
  const chunk = onSearchPage
    ? search_page_embed_for(S.currentBook.searchHighlight, S.alphabetId, pageInSpan) || null
    : null;

  const meta = el("bookMeta");
  // Display 1-based book # to match wall hover ("Wall N · book K").
  meta.textContent =
    `gallery ${formatCoordDisplay(S.z, S.n)} · book ${S.currentBook.index + 1}` +
    (onSearchPage
      ? S.currentBook.searchPageSpan > 1
        ? ` · search match (${S.currentBook.searchStartPage + 1}–${S.currentBook.searchStartPage + S.currentBook.searchPageSpan})`
        : " · search match"
      : "");
  meta.title = `gallery ${formatCoordFull(S.z, S.n)} · shelf index ${S.currentBook.index} (0–699)`;
  const clearBtn = el("clearBookSearch");
  if (clearBtn) {
    const hasSearch = S.currentBook.searchHighlight != null;
    clearBtn.hidden = !hasSearch;
  }
  el("pageInd").textContent = t("book.pageInd", {
    page: p + 1,
    total: PAGES_PER_BOOK,
  });
  const jump = el("pageJump");
  if (jump && document.activeElement !== jump) jump.value = String(p + 1);
  const total = el("pageTotal");
  if (total) total.textContent = `/ ${PAGES_PER_BOOK}`;

  const pageText = pageTextForBook(
    S.currentBook.index,
    p,
    onSearchPage ? S.currentBook.searchHighlight : "",
    onSearchPage ? S.currentBook.searchStartPage : -1,
  );
  const match = phraseMatch(pageText, chunk);

  const pageEl = el("bookPage");
  syncAlphabetPresentation(S.alphabetId);
  pageEl.dir = alphabetIsRtl(S.alphabetId) ? "rtl" : "ltr";
  // Lang helps shaping for Ethiopic / Tifinagh / RTL; Latin lenses stay unmarked.
  if (alphabetScript(S.alphabetId) !== "latin") {
    pageEl.lang = alphabetLang(S.alphabetId);
  } else {
    pageEl.removeAttribute("lang");
  }

  if (S.viewMode === "color") {
    pageEl.hidden = true;
    el("bookCanvas").hidden = false;
    renderBookCanvas(
      pageText,
      match?.cellStart ?? -1,
      match?.cellLen ?? 0,
    );
  } else {
    el("bookCanvas").hidden = true;
    pageEl.hidden = false;
    const html = pageHighlightPhrase(pageText, chunk);
    if (html) {
      pageEl.innerHTML = html;
      pageEl.querySelector("mark")?.scrollIntoView({ block: "nearest" });
    } else {
      pageEl.textContent = pageText;
      pageEl.scrollTop = 0;
    }
  }
  el("prevPage").disabled = p <= 0;
  el("nextPage").disabled = p >= PAGES_PER_BOOK - 1;
  syncUrl();
}

export function turnPage(delta) {
  if (!S.currentBook) return;
  const next = S.currentBook.page + delta;
  if (next < 0 || next >= PAGES_PER_BOOK) return;
  S.currentBook.page = next;
  if (S.currentBook.deferPageText) {
    void hydrateBookPageText();
    return;
  }
  void renderBookPage();
}

export function jumpPage() {
  if (!S.currentBook) return;
  const jump = el("pageJump");
  const v = parseInt(jump.value, 10);
  if (!Number.isFinite(v)) {
    jump.value = String(S.currentBook.page + 1);
    return;
  }
  S.currentBook.page = Math.min(PAGES_PER_BOOK, Math.max(1, v)) - 1;
  if (S.currentBook.deferPageText) {
    void hydrateBookPageText();
    return;
  }
  void renderBookPage();
}

export async function downloadBook() {
  if (!S.currentBook) return;
  const book = S.currentBook;
  const safe =
    book.title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "book";
  // Never put megadigit axes in the filename — use room hash + shelf index.
  let hashTag = "room";
  try {
    hashTag = node_hash_hex(coordForWasm(S.z), coordForWasm(S.n)).slice(0, 12);
  } catch {
    /* keep fallback */
  }
  const name = `babel-${hashTag}-book${book.index + 1}-${safe}.txt`;
  let body = book.text;
  if (!body && book.contentFlat) {
    // Rebuild formatted pages from the Find letter grid (no second invert).
    const parts = [];
    for (let p = 0; p < PAGES_PER_BOOK; p++) {
      parts.push(pageTextFromContentFlat(book.contentFlat, p, S.alphabetId));
    }
    body = parts.join("");
  }
  if (!body) {
    const heavy = S.bijectionScope === "book";
    const build = () =>
      heavy
        ? book_text_book_scope_for(
            coordForWasm(S.z),
            coordForWasm(S.n),
            book.index,
            S.alphabetId,
          )
        : book_text_for(
            coordForWasm(S.z),
            coordForWasm(S.n),
            book.index,
            S.alphabetId,
          );
    try {
      if (heavy) {
        body = await withBookWait("book.waitMbitBorrow", () => build());
      } else {
        body = build();
      }
    } catch (err) {
      console.error(err);
      return;
    }
  }
  if (S.currentBook !== book || !body) return;
  downloadBlob(new Blob([body], { type: "text/plain;charset=utf-8" }), name);
}

export async function renderBookImage() {
  if (!S.currentBook) return;
  const cv = el("bookImageCanvas");
  const gen = ++bookImageRenderGen;
  const book = S.currentBook;
  // Title immediately — don't leave the HTML em-dash while workers run.
  el("imageTitle").textContent = book.title;
  const imageMeta = el("imageMeta");
  imageMeta.textContent = `gallery ${formatCoordDisplay(S.z, S.n)} · book ${book.index + 1} · rendering…`;
  imageMeta.title = `gallery ${formatCoordFull(S.z, S.n)} · shelf index ${book.index} (0–699)`;

  const heavyBookScope =
    S.bijectionScope === "book" && !book.imageRgba?.length;
  if (heavyBookScope) showBookWait("book.waitMbitImage", { image: true });

  let width;
  let height;
  let pixels;
  try {
    if (book.imageRgba?.length) {
      // Find / Babelgram handoff — book-scope proof pixels (same letters as contentFlat).
      const d = book_image_dims();
      width = book.imageW || d[0];
      height = book.imageH || d[1];
      pixels = book.imageRgba;
    } else {
      if (heavyBookScope) {
        await yieldToUi();
        await yieldToUi();
      }
      // Virgin map: book-linked in Mbit rooms, page-linked otherwise.
      const img = await generateBookImageRgba({
        z: S.z,
        n: S.n,
        book: book.index,
        alphabetId: S.alphabetId,
        universe: get_universe(),
        scope: S.bijectionScope === "book" ? "book" : "page",
        onProgress: ({ done, total }) => {
          if (gen !== bookImageRenderGen || S.currentBook !== book) return;
          imageMeta.textContent =
            `gallery ${formatCoordDisplay(S.z, S.n)} · book ${book.index + 1} · rendering ${done}/${total}…`;
        },
      });
      if (gen !== bookImageRenderGen || S.currentBook !== book) return;
      width = img.width;
      height = img.height;
      pixels = img.pixels;
    }
    if (gen !== bookImageRenderGen || !S.currentBook) return;
    cv.width = width;
    cv.height = height;
    const data = new ImageData(
      new Uint8ClampedArray(pixels),
      width,
      height,
    );
    cv.getContext("2d").putImageData(data, 0, 0);
    el("imageTitle").textContent = S.currentBook.title;
    imageMeta.textContent =
      `gallery ${formatCoordDisplay(S.z, S.n)} · book ${S.currentBook.index + 1} · whole book · ${width}×${height}`;
    imageMeta.title = `gallery ${formatCoordFull(S.z, S.n)} · shelf index ${S.currentBook.index} (0–699)`;
  } finally {
    if (heavyBookScope && gen === bookImageRenderGen) {
      hideBookWait({ image: true });
    }
  }
}

/**
 * Open the page reader, then the whole-book colour PNG dialog on top.
 * Short `&b=&img=1` permalinks open virgin maps; pass `searchHighlight` for
 * in-session Babelgram / full-book embed (too large for `&q=`).
 * Pass `imageRgba` to show exact upload pixels (cross-universe Babelgram).
 */
export function openBookImage(
  bookIndex,
  title = null,
  searchHighlight = null,
  searchPageSpan = 1,
  { imageRgba = null, imageW = 0, imageH = 0, contentFlat = null } = {},
) {
  openBook(
    bookIndex,
    title,
    1,
    searchHighlight,
    searchHighlight ? searchPageSpan : 1,
    { imageRgba, imageW, imageH, contentFlat },
  );
  // Colour map + letter flat when handed off — no second Mbit rebuild for text.
  openModal("imageModal");
  void renderBookImage().catch((err) => console.error(err));
  syncUrl();
}

export function saveBookImage() {
  if (!S.currentBook) return;
  const zW = coordForWasm(S.z);
  const nW = coordForWasm(S.n);
  const scope = S.bijectionScope === "book" ? "book" : "page";
  const nameMeta = {
    u: get_universe(),
    name: S.universeName,
    a: S.alphabetId,
    z: S.z,
    n: S.n,
    b: S.currentBook.index,
    scope,
  };
  const name = babelExportFilename(nameMeta);
  el("bookImageCanvas").toBlob(async (blob) => {
    if (!blob) return;
    try {
      const cv = el("bookImageCanvas");
      const w = cv.width;
      const h = cv.height;
      if (!w || !h) throw new Error("colour map not ready — wait for render");
      // Seal what locate will recompute: project the PNG pixels with *this*
      // room’s accent. Do not reuse Find contentFlat — after other-universe
      // Babelgram go, the canvas is still the export print (origin colours)
      // while coords/hash are the rematch room.
      const rgba = new Uint8Array(
        cv.getContext("2d").getImageData(0, 0, w, h).data,
      );
      const accent = room_accent(zW, nW, get_universe());
      const flat = mosaic_flat_for(
        rgba,
        S.alphabetId,
        accent[0],
        accent[1],
        accent[2],
        0,
        false,
        1, // glyph / letter colour map
      );
      const seal = await contentSeal(flat);
      const hRoom = node_hash_hex(zW, nW);
      if (!seal || !hRoom) {
        throw new Error(
          !globalThis.crypto?.subtle
            ? "content seal needs a secure context (https or localhost)"
            : "babel seal unavailable",
        );
      }
      const meta = { ...nameMeta, seal, h: hRoom };
      const stamped = await injectBabelChunk(blob, meta);
      downloadBlob(stamped, name);
    } catch (err) {
      console.error(err);
      const msg =
        typeof err === "string"
          ? err
          : err?.message || "could not seal Babelgram";
      // Never silently write an unsealed stamp — that shows up as “legacy” on locate.
      window.alert?.(`Babelgram seal failed — not saved.\n${msg}`);
    }
  }, "image/png");
}
