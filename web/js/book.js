// The book reader: open a book, page through it, the per-page colour map, and
// taking it home (full text, or the whole-book colour image from WASM).

import { S } from "./state.js";
import {
  el,
  buildAlphabetPalette,
  SPACE_CELL_HEX,
  flattenSearchQuery,
  segmentText,
  escapeHtml,
  downloadBlob,
  validateSearchQuery,
} from "./util.js";
import {
  PAGES_PER_BOOK,
  alphabetCells,
  alphabetIsRtl,
  alphabetLang,
  alphabetScript,
  syncAlphabetPresentation,
} from "./constants.js";
import { t } from "./i18n.js";
import { syncUrl } from "./url.js";
import { gallery_titles_json, book_text_for, book_image, page_text_for, search_page_embed_for } from "./wasm.js";
import { titleEmbedFlat } from "./search.js";

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
      ctx.strokeStyle = "rgba(201, 162, 39, 0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cellPx - 2, cellPx - 2);
    }
  }
}

function titleForIndex(i) {
  try {
    return JSON.parse(gallery_titles_json(S.z, S.n, S.alphabetId, titleEmbedFlat()))[i] || null;
  } catch {
    return null;
  }
}

function pageTextForBook(bookIndex, pageIndex, searchQuery = "", searchStartPage = -1) {
  return page_text_for(
    S.z,
    S.n,
    bookIndex,
    pageIndex,
    S.alphabetId,
    searchQuery || "",
    searchQuery ? searchStartPage : -1,
  );
}

export function openBook(
  bookIndex,
  title,
  startPage = 1,
  searchHighlight = null,
  searchPageSpan = 1,
) {
  const text = book_text_for(S.z, S.n, bookIndex, S.alphabetId);
  const page = Math.min(PAGES_PER_BOOK, Math.max(1, startPage)) - 1;
  const highlight = searchHighlight
    ? flattenSearchQuery(searchHighlight, S.alphabetId)
    : null;
  S.currentBook = {
    index: bookIndex,
    title: title || titleForIndex(bookIndex) || `book ${bookIndex}`,
    text,
    page,
    searchHighlight: highlight,
    searchStartPage: highlight ? page : null,
    searchPageSpan: highlight ? searchPageSpan : null,
  };
  el("bookTitle").textContent = S.currentBook.title;
  if (!el("bookModal").open) el("bookModal").showModal();
  renderBookPage();
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
  openBook(b.index, null, b.page + 1, highlight, span);
}

export function renderBookPage() {
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

  el("bookMeta").textContent =
    `gallery (${S.z}, ${S.n}) · shelf index ${S.currentBook.index}` +
    (onSearchPage
      ? S.currentBook.searchPageSpan > 1
        ? ` · search match (${S.currentBook.searchStartPage + 1}–${S.currentBook.searchStartPage + S.currentBook.searchPageSpan})`
        : " · search match"
      : "");
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
  renderBookPage();
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
  renderBookPage();
}

export function downloadBook() {
  if (!S.currentBook) return;
  const safe =
    S.currentBook.title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "book";
  const name = `babel-${S.z}_${S.n}-shelf${S.currentBook.index}-${safe}.txt`;
  downloadBlob(new Blob([S.currentBook.text], { type: "text/plain;charset=utf-8" }), name);
}

export function renderBookImage() {
  if (!S.currentBook) return;
  const img = book_image(S.z, S.n, S.currentBook.index, S.alphabetId);
  const cv = el("bookImageCanvas");
  cv.width = img.width;
  cv.height = img.height;
  const data = new ImageData(
    new Uint8ClampedArray(img.pixels),
    img.width,
    img.height,
  );
  cv.getContext("2d").putImageData(data, 0, 0);
  el("imageTitle").textContent = S.currentBook.title;
  el("imageMeta").textContent =
    `gallery (${S.z}, ${S.n}) · shelf ${S.currentBook.index} · whole book · ${img.width}×${img.height}`;
}

export function saveBookImage() {
  if (!S.currentBook) return;
  el("bookImageCanvas").toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, `babel-${S.z}_${S.n}-shelf${S.currentBook.index}-colors.png`);
  });
}
