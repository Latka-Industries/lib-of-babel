// Search-by-content and search-by-title — WASM reverse lookup → coordinates + go there.
// Search is scoped to the universe in the header — we never switch universes on "go there".

import { S, applyUniverseFromInput, syncLensControls } from "../gallery/state.js";
import {
  TITLE_LEN,
  MAX_SEARCH_CHARS,
  formatAlphabetSymbolLabel,
  alphabetIsRtl,
  alphabetLang,
} from "../lib/constants.js";
import { t, getLocale } from "../lib/i18n.js";
import {
  el,
  copyText,
  escapeHtml,
  formatUniverseLabel,
  formatCoordDisplay,
  formatCoordFull,
  findActionRow,
  wireFindActions,
} from "../lib/util.js";
import {
  normalizeSearchQuery,
  validateSearchQuery,
  countSearchCells,
} from "./search-query.js";
import { locate_page_json, locate_title_json, node_hash_hex } from "../lib/wasm.js";
import { jumpTo } from "../gallery/nav.js";
import { openBook } from "./book.js";
import { permalink, findPermalink } from "../gallery/url.js";

function invalidFromResult(result) {
  return (result.invalid || []).map((x) => ({ i: x.i, ch: x.c ?? x.ch }));
}

function formatInvalidMessage(invalid, alphabetId = S.alphabetId) {
  const seen = new Set();
  const unique = [];
  for (const { ch } of invalid) {
    if (!seen.has(ch)) {
      seen.add(ch);
      unique.push(ch);
    }
  }
  let shown = unique.slice(0, 8).map((ch) => `"${ch}"`).join(", ");
  if (unique.length > 8) {
    shown += t("search.error.moreKinds", { n: unique.length - 8 });
  }
  const key =
    invalid.length > 1 ? "search.error.invalidPlural" : "search.error.invalid";
  return t(key, {
    alphabet: formatAlphabetSymbolLabel(alphabetId, t),
    shown,
  });
}

/** Map English WASM / client locate errors into the active UI locale. */
function localizeLocateError(error) {
  if (!error) return t("search.error.unknown");
  if (error === "search text is empty") return t("search.error.empty");
  if (error === "invalid characters for this alphabet") {
    return t("search.error.invalidGeneric");
  }
  if (error === "invalid response from generator") {
    return t("search.error.badResponse");
  }
  let m = /^text too long \(max (\d+) characters — one book\)$/.exec(error);
  if (m) return t("search.error.tooLong", { n: m[1] });
  m = /^title too long \(max (\d+) characters\)$/.exec(error);
  if (m) return t("search.error.titleTooLong", { n: m[1] });
  m =
    /^text needs (\d+) pages but only (\d+) remain in this book — try a shorter phrase$/.exec(
      error,
    );
  if (m) return t("search.error.pageRoom", { need: m[1], room: m[2] });
  return error;
}

/** Normalized title embed for the current gallery, if any. */
export function titleEmbedFlat() {
  const hit = S.titleEmbed;
  if (!hit || hit.z !== S.z.toString() || hit.n !== S.n.toString()) return "";
  return hit.flat;
}

/** Update search field limits and copy for content / title (text tab). */
export function syncSearchKindUI() {
  const kind = el("searchKind")?.value || "content";
  const isTitle = kind === "title";
  const input = el("searchInput");
  if (input) {
    input.maxLength = isTitle ? TITLE_LEN : MAX_SEARCH_CHARS;
    input.rows = isTitle ? 2 : 6;
    input.placeholder = isTitle
      ? t("search.placeholderTitle")
      : t("search.placeholderContent");
    const backdrop = el("searchBackdrop");
    if (alphabetIsRtl(S.alphabetId)) {
      const lang = alphabetLang(S.alphabetId);
      input.dir = "rtl";
      input.lang = lang;
      if (backdrop) {
        backdrop.dir = "rtl";
        backdrop.lang = lang;
      }
    } else {
      input.dir = "ltr";
      input.removeAttribute("lang");
      if (backdrop) {
        backdrop.dir = "ltr";
        backdrop.removeAttribute("lang");
      }
    }
  }
  const hint = el("searchHint");
  if (hint) {
    hint.textContent = isTitle
      ? t("search.hintTitle", { n: TITLE_LEN })
      : t("search.hintContent");
  }
  syncSearchCount();
  syncSearchChrome();
}

/** Live cell count vs max for content / title (alphabet cells, not UTF-16 units). */
export function syncSearchCount() {
  const countEl = el("searchCount");
  const input = el("searchInput");
  if (!countEl || !input) return;
  const isTitle = el("searchKind")?.value === "title";
  const max = isTitle ? TITLE_LEN : MAX_SEARCH_CHARS;
  const n = countSearchCells(normalizeSearchQuery(input.value), S.alphabetId);
  countEl.textContent = t("search.count", {
    n: n.toLocaleString(getLocale()),
    max: max.toLocaleString(getLocale()),
  });
  countEl.classList.toggle("search-count-over", n > max);
  countEl.title = t("search.countTip", {
    n: String(n),
    max: String(max),
  });
}

/**
 * Photo→mosaic search tab. Off until the luma path is good enough to ship.
 * Core + Babelgram stay available; flip this when re-enabling the UI.
 */
export const PHOTO_SEARCH_TAB_ENABLED = false;

/** @returns {"text"|"photo"|"babel"} */
export function searchMode() {
  if (el("searchTab-babel")?.getAttribute("aria-selected") === "true") {
    return "babel";
  }
  if (
    PHOTO_SEARCH_TAB_ENABLED &&
    el("searchTab-photo")?.getAttribute("aria-selected") === "true"
  ) {
    return "photo";
  }
  return "text";
}

function syncSearchChrome() {
  const mode = searchMode();
  const head = el("searchHead");
  const meta = el("searchMeta");
  if (mode === "photo") {
    if (head) head.textContent = t("search.headMosaic");
    if (meta) meta.textContent = t("search.metaMosaic");
    return;
  }
  if (mode === "babel") {
    if (head) head.textContent = t("search.headBabel");
    if (meta) meta.textContent = t("search.metaBabel");
    return;
  }
  const isTitle = el("searchKind")?.value === "title";
  if (head) {
    head.textContent = isTitle ? t("search.headTitle") : t("search.headContent");
  }
  if (meta) {
    meta.textContent = isTitle ? t("search.metaTitle") : t("search.metaContent");
  }
}

/**
 * Switch search modal tabs: text | photo | babel.
 * @param {"text"|"photo"|"babel"} mode
 */
export function selectSearchTab(mode) {
  let want = mode === "babel" ? "babel" : mode === "photo" ? "photo" : "text";
  if (want === "photo" && !PHOTO_SEARCH_TAB_ENABLED) want = "text";
  const mosaicOn = want === "photo" || want === "babel";

  const textTab = el("searchTab-text");
  const photoTab = el("searchTab-photo");
  const babelTab = el("searchTab-babel");
  const textPanel = el("searchPanel-text");
  const mosaicPanel = el("searchPanel-mosaic");

  const setTab = (tab, on) => {
    if (!tab) return;
    tab.setAttribute("aria-selected", on ? "true" : "false");
    tab.tabIndex = on ? 0 : -1;
  };

  if (photoTab) {
    photoTab.hidden = !PHOTO_SEARCH_TAB_ENABLED;
    photoTab.disabled = !PHOTO_SEARCH_TAB_ENABLED;
  }

  setTab(textTab, want === "text");
  setTab(photoTab, want === "photo");
  setTab(babelTab, want === "babel");

  if (textPanel) {
    textPanel.classList.toggle("active", want === "text");
    textPanel.hidden = want !== "text";
  }
  if (mosaicPanel) {
    mosaicPanel.classList.toggle("active", mosaicOn);
    mosaicPanel.hidden = !mosaicOn;
  }

  syncSearchChrome();
}

export function searchKind() {
  return el("searchKind")?.value === "title" ? "title" : "content";
}

/** Wire text / photo / babel tab buttons (once). */
export function wireSearchTabs({ onPhoto, onBabel } = {}) {
  el("searchTab-text")?.addEventListener("click", () => {
    selectSearchTab("text");
    el("searchInput")?.focus();
  });
  el("searchTab-photo")?.addEventListener("click", () => {
    if (!PHOTO_SEARCH_TAB_ENABLED) return;
    selectSearchTab("photo");
    onPhoto?.();
  });
  el("searchTab-babel")?.addEventListener("click", () => {
    selectSearchTab("babel");
    onBabel?.();
  });
  // Keep DOM in sync if the flag is off (hidden + disabled).
  if (!PHOTO_SEARCH_TAB_ENABLED) {
    const photoTab = el("searchTab-photo");
    if (photoTab) {
      photoTab.hidden = true;
      photoTab.disabled = true;
    }
  }
}

/** Parse WASM `locate_page_json` / `locate_title_json` response. */
export function parseLocateResult(jsonStr) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: t("search.error.badResponse") };
  }
}

function syncSearchUniverse() {
  applyUniverseFromInput(el("universe")?.value);
}

/** Keep the search backdrop overlay scrolled in sync with the textarea. */
export function syncSearchBackdropScroll() {
  const input = el("searchInput");
  const backdrop = el("searchBackdrop");
  if (input && backdrop) {
    backdrop.scrollTop = input.scrollTop;
    backdrop.scrollLeft = input.scrollLeft;
  }
}

/** Highlight invalid characters in the search field overlay. */
export function renderSearchHighlights(invalid) {
  const input = el("searchInput");
  const backdrop = el("searchBackdrop");
  const editor = el("searchEditor");
  if (!input || !backdrop) return;

  const invalidSet = new Set(invalid.map((x) => x.i));
  let html = "";
  for (let i = 0; i < input.value.length; i++) {
    const ch = escapeHtml(input.value[i]);
    if (invalidSet.has(i)) html += `<mark class="search-invalid">${ch}</mark>`;
    else html += ch;
  }
  backdrop.innerHTML = html;
  editor?.classList.toggle("search-invalid-field", invalid.length > 0);
  syncSearchBackdropScroll();
}

/** Remove invalid-character highlights from the search field. */
export function clearSearchHighlights() {
  renderSearchHighlights([]);
}

/** Lowercase the search field in place; returns the normalized query. */
export function syncSearchInput() {
  const input = el("searchInput");
  const normalized = normalizeSearchQuery(input.value);
  if (input.value !== normalized) input.value = normalized;
  return normalized;
}

function locateWith(jsonFn, text, alphabetId = S.alphabetId) {
  syncSearchUniverse();
  const query = normalizeSearchQuery(text);
  const invalid = validateSearchQuery(query, alphabetId);
  if (invalid.length) {
    renderSearchHighlights(invalid);
    return {
      ok: false,
      error: formatInvalidMessage(invalid, alphabetId),
      invalid,
    };
  }
  clearSearchHighlights();
  const result = parseLocateResult(jsonFn(query, alphabetId));
  if (!result.ok) {
    const wasmInvalid = invalidFromResult(result);
    if (wasmInvalid.length) {
      renderSearchHighlights(wasmInvalid);
      result.error = formatInvalidMessage(wasmInvalid, alphabetId);
    } else if (result.error) {
      result.error = localizeLocateError(result.error);
    }
  }
  return result;
}

/** Reverse lookup (content) in the current universe. */
export function locateText(text, alphabetId = S.alphabetId) {
  return locateWith(locate_page_json, text, alphabetId);
}

/** Reverse lookup (spine title) in the current universe. */
export function locateTitle(text, alphabetId = S.alphabetId) {
  return locateWith(locate_title_json, text, alphabetId);
}

/** Coerce locate JSON `z`/`n` (string or number) to BigInt. */
function asBigInt(v) {
  if (typeof v === "bigint") return v;
  return BigInt(typeof v === "string" || typeof v === "number" ? v : String(v));
}

/** Permalink for a search hit — short `#q=&find=` (re-locate on open). */
export function searchPermalink(result, query, kind = "content") {
  syncSearchUniverse();
  const short = findPermalink(
    query,
    kind === "title" ? "title" : "content",
    result.alphabet,
    S.universeName,
  );
  if (short) return short;
  // Query too long for &q= — fall back to compact coord link (no phrase).
  const z = asBigInt(result.z);
  const n = asBigInt(result.n);
  const hash = node_hash_hex(String(z), String(n));
  return permalink(
    z,
    n,
    hash,
    result.alphabet,
    result.book,
    kind === "title" ? 1 : result.page,
    S.universeName,
    null,
  );
}

/** Render hit coordinates or validation error into the search result panel. */
export function renderSearchResult(result, box, kind = "content") {
  if (!result.ok) {
    const invalid = invalidFromResult(result);
    if (invalid.length) renderSearchHighlights(invalid);
    const msg = invalid.length
      ? result.error
      : localizeLocateError(result.error);
    box.innerHTML = `<p class="find-dim search-error">${escapeHtml(msg)}</p>`;
    box.classList.add("show");
    return;
  }

  clearSearchHighlights();
  const safe = escapeHtml;
  const query = syncSearchInput();
  const charLabel = t("search.result.chars", {
    n: Number(result.char_count).toLocaleString(getLocale()),
  });
  const alphabet = formatAlphabetSymbolLabel(result.alphabet, t);
  const pages =
    result.page_span > 1
      ? t("search.result.pages", {
          start: result.page,
          end: result.page_end,
        })
      : t("search.result.page", { n: result.page });
  const detail =
    kind === "title"
      ? t("search.result.detailTitle", {
          query: `<b>${safe(query)}</b>`,
          chars: charLabel,
          alphabet,
        })
      : t("search.result.detailContent", {
          pages,
          chars: charLabel,
          alphabet,
        });

  box.innerHTML =
    `<div class="find-big" title="${safe(formatCoordFull(result.z, result.n))}">${safe(
      t("search.result.gallery", {
        coords: formatCoordDisplay(result.z, result.n),
      }),
    )}</div>` +
    `<div class="find-dim">` +
    t("search.result.coords", {
      universe: `<b>${safe(formatUniverseLabel(S.universeName))}</b>`,
      wall: result.wall,
      shelf: result.shelf,
      book: result.book_on_shelf,
      detail,
    }) +
    `</div>` +
    findActionRow([
      { id: "go", label: t("search.go") },
      { id: "link", label: t("actions.copy") },
    ]);
  box.classList.add("show");

  wireFindActions(box, {
    go: () => goToSearchResult(result, query, kind),
    link: (_ev, btn) =>
      copyText(searchPermalink(result, query, kind), btn, t("common.copied")),
  });
}

/** Navigate to a search hit without switching universe. */
export function goToSearchResult(result, query, kind = "content") {
  syncSearchUniverse();
  if (result.alphabet !== S.alphabetId) {
    S.alphabetId = result.alphabet;
    syncLensControls();
  }
  if (kind === "title") {
    S.titleEmbed = {
      flat: query,
      z: String(result.z),
      n: String(result.n),
      book: result.book,
    };
  } else {
    S.titleEmbed = null;
  }
  jumpTo(String(result.z), String(result.n));
  openBook(
    result.book,
    kind === "title" ? query : null,
    kind === "title" ? 1 : result.page,
    kind === "content" ? query || null : null,
    kind === "content" ? result.page_span || 1 : 1,
  );
  el("searchModal").close();
}

/** Open the search dialog empty and focused. */
export function openSearch({ tab = "text" } = {}) {
  el("searchResult")?.classList.remove("show");
  if (el("searchInput")) el("searchInput").value = "";
  clearSearchHighlights();
  let want = "text";
  if (tab === "babel") want = "babel";
  else if (
    PHOTO_SEARCH_TAB_ENABLED &&
    (tab === "photo" || tab === "image")
  ) {
    want = "photo";
  }
  selectSearchTab(want);
  syncSearchKindUI();
  syncSearchCount();
  el("searchModal").showModal();
  if (want === "text") el("searchInput")?.focus();
}

/** Run the current search field against title or content. */
export function runSearch() {
  if (searchMode() !== "text") return;
  const text = syncSearchInput();
  if (!text.trim()) return;
  const kind = searchKind();
  const result =
    kind === "title" ? locateTitle(text, S.alphabetId) : locateText(text, S.alphabetId);
  renderSearchResult(result, el("searchResult"), kind);
}
