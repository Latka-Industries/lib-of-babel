// DOM event wiring — header, dialogs, lenses, book nav, layout debug.

import { WINDOW_MAX, syncAlphabetPresentation } from "./constants.js";
import { t, setLocaleFromAlphabet } from "./i18n.js";
import {
  el,
  copyText,
  downloadBlob,
  wireModalCloses,
  wireActionMenu,
  wireEnter,
  openModal,
  validateSearchQuery,
  setFooterDim,
  isDevMode,
  galleryIsTouch,
} from "./util.js";
import {
  S,
  applyUniverse,
  freezeTrailLenses,
  syncLensControls,
  randomUniverseName,
  persist,
  markLastPickedUp,
} from "./state.js";
import { currentUrl, syncUrl } from "./url.js";
import { render, renderHistory } from "./view.js";
import { step, jumpTo, exportJourney, newWalk } from "./nav.js";
import { verifyJourney, showVerify } from "./verify.js";
import {
  reopenCurrentBook,
  renderBookPage,
  turnPage,
  jumpPage,
  downloadBook,
  renderBookImage,
  saveBookImage,
} from "./book.js";
import {
  syncSearchInput,
  syncSearchKindUI,
  clearSearchHighlights,
  renderSearchHighlights,
  syncSearchBackdropScroll,
  openSearch,
  runSearch,
} from "./search.js";
import {
  openAboutGuide,
  stepAboutTab,
  renderAboutAlphabets,
  wireAboutTabs,
} from "./about.js";
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
  document.querySelectorAll("[data-window-max]").forEach((node) => {
    node.textContent = String(WINDOW_MAX);
  });
  syncSearchKindUI();
  syncThemeToggle(t);
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
    el("jumpZ").value = S.z.toString();
    el("jumpN").value = S.n.toString();
    openModal("jumpModal");
    el("jumpZ").focus();
    el("jumpZ").select();
  });
  el("goJump").addEventListener("click", doJump);
  wireEnter(["jumpZ", "jumpN"], doJump);

  // click the sigil to take this gallery's emblem home as a standalone SVG
  el("sigil").addEventListener("click", () => {
    const svg = el("sigil").innerHTML.trim();
    if (!svg) return;
    downloadBlob(
      new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], { type: "image/svg+xml" }),
      `sigil_${S.z}_${S.n}_${el("hash").textContent}.svg`,
      { revokeDelay: 1000 },
    );
  });

  el("historyBtn").addEventListener("click", () => {
    renderHistory();
    openModal("historyModal");
  });

  wireActionMenu("actionsMenu", {
    copy: withMenuClosed(() => copyText(currentUrl())),
    search: withMenuClosed(openSearch),
    export: withMenuClosed(exportJourney),
    verify: withMenuClosed(() => el("verifyFile").click()),
    reset: withMenuClosed(newWalk),
  });

  el("searchFind").addEventListener("click", runSearch);
  el("searchKind").addEventListener("change", () => {
    el("searchResult").classList.remove("show");
    clearSearchHighlights();
    syncSearchKindUI();
    el("searchInput").focus();
  });
  el("searchInput").addEventListener("input", () => {
    syncSearchInput();
    const invalid = validateSearchQuery(el("searchInput").value, S.alphabetId);
    if (invalid.length) renderSearchHighlights(invalid);
    else clearSearchHighlights();
  });
  el("searchInput").addEventListener("scroll", syncSearchBackdropScroll);
  wireEnter("searchInput", runSearch, { modKey: true });

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
    showVerify(verifyJourney(journey), file.name);
  });
  el("hash").addEventListener("click", (ev) =>
    copyText(ev.currentTarget.dataset.full || "", ev.currentTarget),
  );
  el("copyBookLink").addEventListener("click", (ev) =>
    copyText(currentUrl(), ev.currentTarget, t("common.copied")),
  );

  // Shared path after alphabet/universe change: freeze past steps, persist, redraw.
  function afterLensChange(reopenHighlight) {
    refreshLocaleChrome();
    persist();
    render();
    reopenCurrentBook(reopenHighlight);
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

  // Universe switch: same coords, new library; trail kept across universes.
  const enterUniverse = (name) => {
    const next = (name || "").trim();
    if (next === S.universeName) return;
    freezeTrailLenses();
    applyUniverse(next);
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
    syncUrl();
  });
  wireActionMenu("saveMenu", {
    txt: downloadBook,
    img: () => {
      renderBookImage();
      openModal("imageModal");
    },
  });
  el("viewToggle").addEventListener("click", (ev) => {
    S.viewMode = S.viewMode === "color" ? "text" : "color";
    ev.currentTarget.textContent =
      S.viewMode === "color" ? t("book.viewText") : t("book.viewColor");
    renderBookPage();
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
