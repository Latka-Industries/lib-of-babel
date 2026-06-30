// The book reader: open a book, page through it, the per-page colour map, and
// taking it home (full text, or the whole-book colour image from WASM).

import { S } from "./state.js";
import { el, oklchToHex } from "./util.js";
import { PAGES_PER_BOOK, PAGE_CHARS, ALPHABETS } from "./constants.js";
import { syncUrl } from "./url.js";
import { gallery_titles_json, book_text_for, book_image } from "./wasm.js";

// the page's characters rewrapped into the near-square divisor pair (64×50) so
// the colour map reads as a block rather than a 2:1 sliver. Looks like colour
// noise, since the text is maximum-entropy.
function pageGrid(total) {
  let rows = Math.floor(Math.sqrt(total));
  while (total % rows !== 0) rows--;
  return { cols: total / rows, rows };
}

function renderBookCanvas(pageText) {
  const chars = pageText.replace(/\n/g, "");
  const { cols, rows } = pageGrid(chars.length);
  const cell = 10;
  const cv = el("bookCanvas");
  cv.width = cols * cell;
  cv.height = rows * cell;
  const ctx = cv.getContext("2d");
  // OKLCH so the spread is perceptually even (HSL clumps greens, crushes blues).
  // hue = letter's position in the alphabet, evenly spaced and rotated by the
  // gallery's accent hue; chroma + lightness are seeded per gallery so each one
  // reads as a distinct mood while staying a faithful per-page content map.
  // precompute one sRGB swatch per symbol so each cell is just an array lookup.
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
    ctx.fillStyle = ch === " " || i < 0 ? "#15131a" : palette[i];
    ctx.fillRect((k % cols) * cell, Math.floor(k / cols) * cell, cell, cell);
  }
}

function titleForIndex(i) {
  try {
    return JSON.parse(gallery_titles_json(S.z, S.n, S.alphabetId))[i] || null;
  } catch {
    return null;
  }
}

export function openBook(bookIndex, title, startPage = 1) {
  // generate the whole book once, then page through it from the cache
  const text = book_text_for(S.z, S.n, bookIndex, S.alphabetId);
  const page = Math.min(PAGES_PER_BOOK, Math.max(1, startPage)) - 1;
  S.currentBook = {
    index: bookIndex,
    title: title || titleForIndex(bookIndex) || `book ${bookIndex}`,
    text,
    page,
  };
  el("bookTitle").textContent = S.currentBook.title;
  // open the modal first so renderBookPage's syncUrl sees it and writes &b/&p
  if (!el("bookModal").open) el("bookModal").showModal();
  renderBookPage();
}

export function renderBookPage() {
  if (!S.currentBook) return;
  const p = S.currentBook.page;
  el("bookMeta").textContent =
    `gallery (${S.z}, ${S.n}) · shelf index ${S.currentBook.index}`;
  el("pageInd").textContent = `page ${p + 1} / ${PAGES_PER_BOOK}`;
  const pageText = S.currentBook.text.slice(p * PAGE_CHARS, (p + 1) * PAGE_CHARS);
  if (S.viewMode === "color") {
    el("bookPage").hidden = true;
    el("bookCanvas").hidden = false;
    renderBookCanvas(pageText);
  } else {
    el("bookCanvas").hidden = true;
    el("bookPage").hidden = false;
    el("bookPage").textContent = pageText;
    el("bookPage").scrollTop = 0;
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

// whole-book colour map: WASM returns an RGBA image of all pages, we blit it
// straight to a canvas (one putImageData, no per-cell JS work).
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
