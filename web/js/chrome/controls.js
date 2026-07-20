// DOM event wiring — header, dialogs, lenses, book nav, layout debug.

import { WINDOW_MAX, syncAlphabetPresentation } from "../lib/constants.js";
import { t, setLocaleFromAlphabet } from "../lib/i18n.js";
import { startLoadingTypewriter } from "./loading-wave.js";
import {
  el,
  copyText,
  downloadBlob,
  wireModalCloses,
  wireEnter,
  openModal,
  setFooterDim,
  isDevMode,
  galleryIsTouch,
} from "../lib/util.js";
import { wireDropdownMenu } from "./dropdown.js";
import { validateSearchQuery } from "../reader/search-query.js";
import {
  S,
  applyUniverse,
  freezeTrailLenses,
  syncLensControls,
  randomUniverseName,
  persist,
  markLastPickedUp,
  recordStep,
  clearBookIdentityCache,
} from "../gallery/state.js";
import { currentUrl, syncUrl } from "../gallery/url.js";
import { coordForWasm } from "../lib/coords.js";
import { render, renderHistory } from "../gallery/view.js";
import {
  step,
  jumpTo,
  exportJourney,
  newWalk,
  jumpToNearestPageScope,
} from "../gallery/nav.js";
import { showMbitNotice } from "../gallery/mbit-notice.js";
import { verifyJourney, showVerify } from "../reader/verify.js";
import {
  reopenCurrentBook,
  renderBookPage,
  hydrateBookPageText,
  turnPage,
  jumpPage,
  downloadBook,
  renderBookImage,
  saveBookImage,
  clearBookSearchHighlight,
  warmPageGenerator,
} from "../reader/book.js";
import {
  syncSearchInput,
  syncSearchKindUI,
  syncSearchCount,
  clearSearchHighlights,
  renderSearchHighlights,
  syncSearchBackdropScroll,
  syncSearchBackdropLayout,
  openSearch,
  runSearch,
  wireSearchTabs,
} from "../reader/search.js";
import {
  wireMosaicSearch,
  syncMosaicKnobsFromGallery,
  syncMosaicModeUI,
  clearMosaicResults,
} from "../reader/mosaic-search.js";
import {
  openAboutGuide,
  stepAboutTab,
  renderAboutAlphabets,
  renderAboutScale,
  wireAboutTabs,
} from "../about/about.js";
import {
  syncAlphabetPickerLabel,
  renderAlphabetPicker,
  wireAlphabetPicker,
  ensureKnownAlphabetId,
} from "./alphabet-picker.js";
import { toggleTheme, syncThemeToggle } from "./theme.js";

export function refreshLocaleChrome() {
  setLocaleFromAlphabet(S.alphabetId, { max: WINDOW_MAX });
  const id = ensureKnownAlphabetId(S.alphabetId);
  if (id !== S.alphabetId) S.alphabetId = id;
  syncAlphabetPickerLabel(S.alphabetId);
  renderAlphabetPicker(S.alphabetId);
  syncLensControls();
  syncAlphabetPresentation(S.alphabetId);
  renderAboutAlphabets();
  renderAboutScale();
  document.querySelectorAll("[data-window-max]").forEach((node) => {
    node.textContent = String(WINDOW_MAX);
  });
  syncSearchKindUI();
  syncMosaicModeUI();
  syncThemeToggle(t);
  if (document.getElementById("loadingCopy")?.isConnected) {
    startLoadingTypewriter(t("loading.building"));
  }
  const viewBtn = el("viewToggle");
  if (viewBtn) {
    viewBtn.textContent =
      S.viewMode === "color" ? t("book.viewText") : t("book.viewColor");
  }
  syncHeaderMenuTitle();
}

const HEADER_MENU_MQ = "(max-width: 860px)";

function headerMenuActive() {
  return window.matchMedia(HEADER_MENU_MQ).matches;
}

function syncHeaderMenuTitle() {
  const btn = el("menuBtn");
  if (!btn) return;
  const open = document.querySelector("header")?.classList.contains("is-menu-open");
  btn.title = t(open ? "header.menuCloseTitle" : "header.menuOpenTitle");
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function setHeaderMenuOpen(open) {
  const hdr = document.querySelector("header");
  const backdrop = el("menuBackdrop");
  if (hdr) hdr.classList.toggle("is-menu-open", open);
  if (backdrop) backdrop.hidden = !open;
  syncHeaderMenuTitle();
}

export function closeHeaderMenu() {
  setHeaderMenuOpen(false);
}

function openHeaderMenu() {
  if (!headerMenuActive()) return;
  setHeaderMenuOpen(true);
}

/** Run an action handler, closing the mobile header sheet first. */
function withMenuClosed(fn) {
  return () => {
    closeHeaderMenu();
    fn();
  };
}

function wireHeaderMenu() {
  const btn = el("menuBtn");
  const backdrop = el("menuBackdrop");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const hdr = document.querySelector("header");
    if (hdr?.classList.contains("is-menu-open")) closeHeaderMenu();
    else openHeaderMenu();
  });
  backdrop?.addEventListener("click", closeHeaderMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.querySelector("dialog[open]")) return;
    closeHeaderMenu();
  });
  window.matchMedia(HEADER_MENU_MQ).addEventListener("change", (e) => {
    if (!e.matches) closeHeaderMenu();
  });

  // Close the sheet before nested dialogs so they aren't stacked under it.
  el("alphabetBtn")?.addEventListener("click", closeHeaderMenu, true);
}

// ---- event wiring ---------------------------------------------------------
export function wireControls() {
  wireModalCloses([
    ["closeAbout", "aboutModal"],
    ["closeAlphabet", "alphabetModal"],
    ["closeJump", "jumpModal"],
    ["closeHistory", "historyModal"],
    ["closeSearch", "searchModal"],
    ["closeVerify", "verifyModal"],
    ["closeBook", "bookModal"],
    ["closeImage", "imageModal"],
    ["closeBabelCompare", "babelCompareModal"],
    ["closeMbitNotice", "mbitNoticeModal"],
  ]);
  refreshLocaleChrome();
  wireAboutTabs();
  wireHeaderMenu();
  const openGuide = withMenuClosed(() => openAboutGuide());
  el("aboutBtn").addEventListener("click", openGuide);
  el("helpBtn").addEventListener("click", openGuide);
  el("themeToggle").addEventListener("click", () => {
    toggleTheme();
    syncThemeToggle(t);
    // Retune gallery accent + minimap fill for the new skin.
    render();
  });

  // click the (z, n) coordinate to jump anywhere on the lattice
  const doJump = () => {
    S.titleEmbed = null;
    if (jumpTo(el("jumpZ").value, el("jumpN").value)) el("jumpModal").close();
  };
  el("coord").addEventListener("click", () => {
    // Mbit-range: show room hash / axes notice (jump form can't take mega-axes).
    if (S.coordsHuge) {
      showMbitNotice();
      return;
    }
    el("jumpZ").value = coordForWasm(S.z);
    el("jumpN").value = coordForWasm(S.n);
    openModal("jumpModal");
    el("jumpZ").focus();
    el("jumpZ").select();
  });
  el("goJump").addEventListener("click", doJump);
  wireEnter(["jumpZ", "jumpN"], doJump);

  el("minimapToPage")?.addEventListener("click", () => {
    if (!S.coordsHuge) return;
    jumpToNearestPageScope();
  });

  // click the sigil to take this gallery's emblem home as a standalone SVG
  el("sigil").addEventListener("click", () => {
    const svg = el("sigil").innerHTML.trim();
    if (!svg) return;
    const zPart = S.coordsHuge ? "huge" : String(S.z);
    const nPart = S.coordsHuge ? "huge" : String(S.n);
    downloadBlob(
      new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], { type: "image/svg+xml" }),
      `sigil_${zPart}_${nPart}_${el("hash").textContent}.svg`,
      { revokeDelay: 1000 },
    );
  });

  el("historyBtn").addEventListener("click", () => {
    renderHistory();
    openModal("historyModal");
  });

  wireDropdownMenu(
    "actionsMenu",
    {
      copy: () => copyText(currentUrl()),
      search: () => {
        clearMosaicResults();
        openSearch();
      },
      export: exportJourney,
      verify: () => el("verifyFile").click(),
      reset: newWalk,
    },
    { beforeAction: closeHeaderMenu },
  );

  el("searchFind").addEventListener("click", () => {
    void runSearch();
  });
  el("searchKind").addEventListener("change", () => {
    el("searchResult").classList.remove("show");
    clearSearchHighlights();
    syncSearchKindUI();
    el("searchInput").focus();
  });
  wireSearchTabs({
    // syncMosaicModeUI already restores the per-tab upload, palette strip, and meta.
    onPhoto: () => syncMosaicModeUI("photo"),
    onBabel: () => syncMosaicModeUI("babel"),
  });
  wireMosaicSearch();
  el("searchInput").addEventListener("input", (e) => {
    // Don't lowercase mid-IME composition — it jumps the caret.
    if (!e.isComposing) syncSearchInput();
    syncSearchCount();
    const invalid = validateSearchQuery(el("searchInput").value, S.alphabetId);
    if (invalid.length) renderSearchHighlights(invalid);
    else clearSearchHighlights();
  });
  el("searchInput").addEventListener("compositionend", () => {
    syncSearchInput();
    syncSearchCount();
    const invalid = validateSearchQuery(el("searchInput").value, S.alphabetId);
    if (invalid.length) renderSearchHighlights(invalid);
    else clearSearchHighlights();
  });
  el("searchInput").addEventListener("scroll", syncSearchBackdropScroll);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => syncSearchBackdropLayout()).observe(el("searchInput"));
  }
  syncSearchBackdropLayout();
  wireEnter(
    "searchInput",
    () => {
      void runSearch();
    },
    { modKey: true },
  );

  // verify journey: read an exported file, re-walk it in WASM, prove the hashes
  el("verifyFile").addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    let journey;
    try {
      journey = JSON.parse(await file.text());
    } catch {
      showVerify({ ok: false, reason: "that file isn't valid JSON" });
      return;
    }
    showVerify(verifyJourney(journey), file.name, journey);
  });
  el("hash").addEventListener("click", (ev) =>
    copyText(ev.currentTarget.dataset.full || "", ev.currentTarget),
  );
  el("copyBookLink").addEventListener("click", (ev) =>
    copyText(currentUrl(), ev.currentTarget, t("common.copied")),
  );

  // Shared path after alphabet/universe change: freeze past steps, persist, redraw.
  function afterLensChange(reopenHighlight) {
    clearBookIdentityCache();
    if (S.currentBook) {
      // Find identity is lens/universe-specific — drop cached letters + proof pixels.
      S.currentBook.contentFlat = null;
      S.currentBook.contentCells = null;
      S.currentBook.imageRgba = null;
      S.currentBook.imageW = 0;
      S.currentBook.imageH = 0;
      S.currentBook.bookScopeReady = false;
    }
    refreshLocaleChrome();
    persist();
    render();
    reopenCurrentBook(reopenHighlight);
    syncMosaicKnobsFromGallery();
    // Basile C/I/N is per-alphabet; warm off the UI thread so the first open is snappy.
    const warm = () => warmPageGenerator();
    if (typeof requestIdleCallback === "function") requestIdleCallback(warm, { timeout: 800 });
    else setTimeout(warm, 0);
  }

  // Alphabet is a lens on the same room: spines/text rewrite, hash + trail stay.
  // UI locale follows German / Dutch (and English for everything else, for now).
  wireAlphabetPicker(
    () => S.alphabetId,
    (id) => {
      if (id === S.alphabetId) return;
      freezeTrailLenses();
      S.alphabetId = id;
      afterLensChange("keep");
    },
  );

  // Universe switch: same coords, new library — counts as a wander step (◇).
  const enterUniverse = (name) => {
    const next = (name || "").trim();
    if (next === S.universeName) return;
    freezeTrailLenses();
    applyUniverse(next);
    recordStep("universe");
    afterLensChange("clear");
  };
  el("universe").addEventListener("change", (ev) => enterUniverse(ev.target.value));
  wireEnter("universe", (e) => {
    enterUniverse(e.target.value);
    e.target.blur();
  });
  el("universeRandom").addEventListener("click", () =>
    enterUniverse(randomUniverseName()),
  );

  // book modal
  el("bookModal").addEventListener("close", () => {
    if (S.currentBook) {
      markLastPickedUp(S.currentBook.index);
      render();
    }
    S.currentBook = null;
    S.bookOpenId = null;
    syncUrl();
  });
  wireDropdownMenu("saveMenu", {
    txt: () => {
      void downloadBook().catch((err) => console.error(err));
    },
    img: () => {
      void renderBookImage().catch((err) => console.error(err));
      openModal("imageModal");
    },
  });
  el("viewToggle").addEventListener("click", (ev) => {
    S.viewMode = S.viewMode === "color" ? "text" : "color";
    ev.currentTarget.textContent =
      S.viewMode === "color" ? t("book.viewText") : t("book.viewColor");
    if (S.currentBook?.deferPageText) {
      void hydrateBookPageText();
      return;
    }
    void renderBookPage();
  });
  el("clearBookSearch")?.addEventListener("click", () => {
    clearBookSearchHighlight();
  });
  el("saveImage").addEventListener("click", saveBookImage);
  wireEnter("pageJump", jumpPage);
  el("pageJump").addEventListener("blur", jumpPage);
  el("pageJump").addEventListener("change", jumpPage);
  el("prevPage").addEventListener("click", () => turnPage(-1));
  el("nextPage").addEventListener("click", () => turnPage(+1));
  el("goPage").addEventListener("click", jumpPage);

  window.addEventListener("keydown", (e) => {
    const tag = e.target?.tagName;
    const typing =
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      e.target?.isContentEditable;

    // inside an open book, arrows turn pages instead of walking
    if (el("bookModal").open) {
      if (e.target === el("pageJump")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        turnPage(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        turnPage(+1);
      }
      return;
    }
    // about guide open — left/right switch tabs, but never walk the library underneath
    if (el("aboutModal").open) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepAboutTab(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepAboutTab(+1);
      }
      return;
    }
    // any other open dialog owns the keyboard — don't walk underneath it
    if (document.querySelector("dialog[open]")) return;
    // ? opens the guide (help)
    if (!typing && e.key === "?") {
      e.preventDefault();
      openAboutGuide();
      return;
    }
    const map = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
    if (e.key in map) {
      e.preventDefault();
      step(map[e.key]);
    }
  });

  // Touch layout swaps need a re-render (hover listeners). Viewport px strip is
  // dev-only (localhost / ?dev=1).
  let lastTouch = galleryIsTouch();
  const measureFooter = () => {
    const node = el("viewportSize");
    if (!node || node.hidden) return;
    const book = document.querySelector(".book");
    const track = document.querySelector(".shelf-track");
    const px = (n) => Math.round(n);
    const bookBox = book?.getBoundingClientRect();
    const trackBox = track?.getBoundingClientRect();
    const touch = galleryIsTouch();
    const narrow = window.matchMedia("(max-width: 960px)").matches;
    const spine =
      bookBox && bookBox.width > 0
        ? `spine ~${px(bookBox.width)}×${px(bookBox.height)}`
        : "spine —";
    let shelfBit = "";
    if (trackBox && trackBox.width > 0) {
      const rowH = touch ? trackBox.height : trackBox.height / 5;
      shelfBit = ` · shelf ~${px(trackBox.width)}×${px(rowH)}`;
    }
    const mode = touch ? "scroll" : narrow ? "stacked" : "2×2";
    setFooterDim(
      node,
      `${window.innerWidth}×${window.innerHeight}px · ${mode} · ${spine}${shelfBit}`,
    );
  };
  const syncGalleryLayout = () => {
    const touch = galleryIsTouch();
    if (touch !== lastTouch) {
      lastTouch = touch;
      render();
      if (isDevMode()) requestAnimationFrame(measureFooter);
      return;
    }
    if (isDevMode()) measureFooter();
  };
  if (isDevMode()) {
    el("viewportSize").hidden = false;
    measureFooter();
  }
  window.addEventListener("resize", syncGalleryLayout);
  for (const q of ["(hover: none)", "(pointer: coarse)", "(max-width: 960px)"]) {
    window.matchMedia(q).addEventListener("change", syncGalleryLayout);
  }
}
