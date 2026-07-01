// The book reader: open a book, page through it, the per-page colour map, and
// taking it home (full text, or the whole-book colour image from WASM).

import { S } from "./state.js";
import { el, oklchToHex, flattenSearchQuery } from "./util.js";
import { PAGES_PER_BOOK, PAGE_CHARS, ALPHABETS } from "./constants.js";
import { syncUrl } from "./url.js";
import { gallery_titles_json, book_text_for, book_image, page_text_for, search_page_embed_for } from "./wasm.js";

// the page's characters rewrapped into the near-square divisor pair (64×50) so
// the colour map reads as a block rather than a 2:1 sliver. Looks like colour
// noise, since the text is maximum-entropy.
function pageGrid(total) {
  let rows = Math.floor(Math.sqrt(total));
  while (total % rows !== 0) rows--;
  return { cols: total / rows, rows };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function phraseMatch(pageText, phrase) {
  if (!phrase) return null;
  const needle = phrase.replace(/[\r\n]/g, "");
  const hay = pageText.replace(/\n/g, "");
  const start = hay.indexOf(needle);
  if (!needle || start < 0) return null;
  return { start, len: needle.length };
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
  const chars = pageText.replace(/\n/g, "");
  const { cols, rows } = pageGrid(chars.length);
  const cell = 10;
  const cv = el("bookCanvas");
  cv.width = cols * cell;
  cv.height = rows * cell;
  const ctx = cv.getContext("2d");
  const alpha = ALPHABETS[S.alphabetId] || ALPHABETS[29];
  const step = 360 / alpha.length;
  const palette = new Array(alpha.length);
  for (let i = 0; i < alpha.length; i++) {
    palette[i] = oklchToHex(
      S.accentLightness,
      S.accentChroma,
      (i * step + S.accentHue) % 360,
    );
  }
  for (let k = 0; k < chars.length; k++) {
    const ch = chars[k];
    const i = alpha.indexOf(ch);
    const x = (k % cols) * cell;
    const y = Math.floor(k / cols) * cell;
    ctx.fillStyle = ch === " " || i < 0 ? "#15131a" : palette[i];
    ctx.fillRect(x, y, cell, cell);
    if (
      highlightLen > 0 &&
      k >= highlightStart &&
      k < highlightStart + highlightLen
    ) {
      ctx.strokeStyle = "rgba(201, 162, 39, 0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }
}

function titleForIndex(i) {
  try {
    return JSON.parse(gallery_titles_json(S.z, S.n, S.alphabetId))[i] || null;
  } catch {
    return null;
  }
}

function pageTextForBook(bookIndex, pageIndex, searchQuery = "", searchStartPage = -1) {
  if (searchQuery) {
    return page_text_for(
      S.z,
      S.n,
      bookIndex,
      pageIndex,
      S.alphabetId,
      searchQuery,
      searchStartPage,
    );
  }
  const text = book_text_for(S.z, S.n, bookIndex, S.alphabetId);
  return text.slice(pageIndex * PAGE_CHARS, (pageIndex + 1) * PAGE_CHARS);
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
    ? search_page_embed_for(S.currentBook.searchHighlight, pageInSpan) || null
    : null;

  el("bookMeta").textContent =
    `gallery (${S.z}, ${S.n}) · shelf index ${S.currentBook.index}` +
    (onSearchPage
      ? S.currentBook.searchPageSpan > 1
        ? ` · search match (${S.currentBook.searchStartPage + 1}–${S.currentBook.searchStartPage + S.currentBook.searchPageSpan})`
        : " · search match"
      : "");
  el("pageInd").textContent = `page ${p + 1} / ${PAGES_PER_BOOK}`;

  const pageText = pageTextForBook(
    S.currentBook.index,
    p,
    onSearchPage ? S.currentBook.searchHighlight : "",
    onSearchPage ? S.currentBook.searchStartPage : -1,
  );
  const match = phraseMatch(pageText, chunk);

  if (S.viewMode === "color") {
    el("bookPage").hidden = true;
    el("bookCanvas").hidden = false;
    renderBookCanvas(
      pageText,
      match?.start ?? -1,
      match?.len ?? 0,
    );
  } else {
    el("bookCanvas").hidden = true;
    el("bookPage").hidden = false;
    const html = pageHighlightPhrase(pageText, chunk);
    if (html) {
      el("bookPage").innerHTML = html;
      el("bookPage").querySelector("mark")?.scrollIntoView({ block: "nearest" });
    } else {
      el("bookPage").textContent = pageText;
      el("bookPage").scrollTop = 0;
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
  const v = parseInt(el("pageJump").value, 10);
  if (!Number.isFinite(v)) return;
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
  const blob = new Blob([S.currentBook.text], {
    type: "text/plain;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `babel-${S.z}_${S.n}-shelf${S.currentBook.index}-colors.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}
