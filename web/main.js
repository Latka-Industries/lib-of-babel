// lib-of-babel — the librarian (boot + event wiring).
// Generation lives in WASM (deterministic); this file just loads it, restores
// the session, and connects the controls. Logic is split across ./js/*:
//   constants · wasm · util · db · state · url · book · view · nav
// Text is never stored — only the trail of {z, n, move, hash} in IndexedDB.

import { init, generator_version, default_alphabet, search_page_span_for } from "./js/wasm.js";
import {
  TOTAL_BOOKS,
  WINDOW_MAX,
  formatAlphabetSymbolLabel,
  alphabetShortLabel,
  listAlphabets,
  alphabetFamilyRefs,
  isTrailPunct,
  fillAlphabetSelect,
} from "./js/constants.js";
import { t, setLocaleFromAlphabet } from "./js/i18n.js";
import {
  el,
  copyText,
  escapeHtml,
  downloadBlob,
  wireModalCloses,
  wireActionMenu,
  wireEnter,
  openModal,
  formatUniverseLabel,
  formatVerifyList,
  validateSearchQuery,
  setFooterDim,
  isDevMode,
} from "./js/util.js";
import { kvGet } from "./js/db.js";
import {
  S,
  applyUniverse,
  hydrateTrail,
  freezeTrailLenses,
  syncLensControls,
  randomUniverseName,
  persist,
  markLastPickedUp,
} from "./js/state.js";
import { currentUrl, syncUrl, parsePermalink } from "./js/url.js";
import { render, renderHistory } from "./js/view.js";
import { step, jumpTo, exportJourney, newWalk, resetTrail } from "./js/nav.js";
import { verifyJourney } from "./js/verify.js";
import {
  openBook,
  reopenCurrentBook,
  renderBookPage,
  turnPage,
  jumpPage,
  downloadBook,
  renderBookImage,
  saveBookImage,
} from "./js/book.js";
import { locateText, locateTitle, renderSearchResult, syncSearchInput, syncSearchKindUI, searchKind, clearSearchHighlights, renderSearchHighlights, syncSearchBackdropScroll } from "./js/search.js";

// ---- restore the session, then render -------------------------------------
async function boot() {
  await init();
  S.gv = generator_version();
  // Keep guide/footer placeholders in sync with the single WINDOW_MAX constant.
  document.querySelectorAll("[data-window-max]").forEach((node) => {
    node.textContent = String(WINDOW_MAX);
  });

  const saved = await kvGet("journey");
  const savedOk =
    saved && saved.current && Array.isArray(saved.trail) && saved.trail.length;

  // a permalink (#z=..&n=..) takes priority — unless it's just our own session
  // being refreshed (coords + universe already match the saved trail).
  const link = parsePermalink();

  // alphabet is a view lens: permalink wins, else saved, else default
  S.alphabetId =
    link && link.a != null
      ? link.a
      : savedOk && saved.alphabet
        ? saved.alphabet
        : default_alphabet();

  // universe is the outermost axis: permalink wins, else saved, else default.
  // applyUniverse must run before any generation (it sets WASM global state).
  applyUniverse(
    link && link.u != null ? link.u : savedOk && saved.universe ? saved.universe : "",
  );

  const isOwnRefresh =
    link &&
    savedOk &&
    saved.current.z === link.z.toString() &&
    saved.current.n === link.n.toString() &&
    (saved.universe || "") === S.universeName;

  if (link && !isOwnRefresh) {
    S.z = link.z;
    S.n = link.n;
    resetTrail();
    await persist();
    render();
  } else if (savedOk) {
    S.z = BigInt(saved.current.z);
    S.n = BigInt(saved.current.n);
    S.trail = hydrateTrail(saved.trail, {
      universe: saved.universe,
      alphabet: saved.alphabet,
    });
    S.startedAt = saved.started_at || S.startedAt;
    render();
  } else {
    await newWalk();
  }

  // a permalink can also point at a specific book + page — open it
  if (
    link &&
    Number.isInteger(link.b) &&
    link.b >= 0 &&
    link.b < TOTAL_BOOKS &&
    S.z === link.z &&
    S.n === link.n
  ) {
    openBook(
      link.b,
      null,
      link.p || 1,
      link.q || null,
      link.q ? search_page_span_for(link.q) : 1,
    );
  }

  // ask the browser not to evict the trail under disk pressure
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

  wireControls();
}

// ---- verify journey result ------------------------------------------------
function showVerify(r, fileName) {
  el("verifyMeta").textContent = fileName
    ? fileName
    : "re-walked in WASM against this build";
  const multiAlpha = (r.alphabets?.length ?? 0) > 1;
  const alphabetList = formatVerifyList(r.alphabets, (a) =>
    escapeHtml(
      multiAlpha ? alphabetShortLabel(a) : formatAlphabetSymbolLabel(a, t),
    ),
  );
  const universeList = formatVerifyList(r.universes, (u) =>
    escapeHtml(formatUniverseLabel(u)),
  );
  const facts =
    r.total != null
      ? `<ul class="verify-facts">
           <li>universe(s): ${universeList}</li>
           <li>alphabet(s): ${alphabetList}</li>
           <li>generator: <b>v${r.gv ?? "—"}</b></li>
           <li>steps checked: <b>${r.checked} / ${r.total}</b></li>
         </ul>`
      : "";
  el("verifyBody").innerHTML =
    `<div class="verify-verdict ${r.ok ? "verify-ok" : "verify-bad"}">` +
    `<span class="badge">${r.ok ? "✓" : "✕"}</span>` +
    `<span>${r.ok ? "verified" : "rejected"}</span></div>` +
    `<p class="verify-reason">${escapeHtml(r.reason)}</p>` +
    facts;
  openModal("verifyModal");
}

function openSearch() {
  el("searchResult").classList.remove("show");
  el("searchInput").value = "";
  clearSearchHighlights();
  syncSearchKindUI();
  el("searchModal").showModal();
  el("searchInput").focus();
}

function runSearch() {
  const text = syncSearchInput();
  if (!text.trim()) return;
  const kind = searchKind();
  const result =
    kind === "title" ? locateTitle(text, S.alphabetId) : locateText(text, S.alphabetId);
  renderSearchResult(result, el("searchResult"), kind);
}

const ABOUT_TAB_RESIZE_MS = 220;
/** @type {number} */
let aboutTabResizeToken = 0;

function aboutBodyMaxHeightPx() {
  // Keep in sync with `.about-body { max-height: 74vh }`.
  return Math.round(window.innerHeight * 0.74);
}

function selectAboutTab(tabId, { animate = true } = {}) {
  const tabs = [...document.querySelectorAll(".about-tab")];
  const panels = [...document.querySelectorAll(".about-panel")];
  const modal = el("aboutModal");
  const body = modal?.querySelector(".about-body");
  const current = tabs.find((t) => t.getAttribute("aria-selected") === "true");
  if (current?.id === tabId) return;

  const reduceMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shouldAnimate = Boolean(animate && !reduceMotion && modal?.open && body);
  const fromH = shouldAnimate ? body.getBoundingClientRect().height : null;
  const token = ++aboutTabResizeToken;

  // Hold the current body height while swapping panels so the dialog cannot
  // flash to an uncapped auto height before the transition runs.
  if (fromH != null) {
    body.style.transition = "none";
    body.style.overflow = "hidden";
    body.style.height = `${fromH}px`;
  }

  for (const tab of tabs) {
    const on = tab.id === tabId;
    tab.setAttribute("aria-selected", on ? "true" : "false");
    tab.tabIndex = on ? 0 : -1;
  }
  for (const panel of panels) {
    const on = panel.getAttribute("aria-labelledby") === tabId;
    panel.classList.toggle("active", on);
    panel.hidden = !on;
  }

  if (fromH == null || !body) return;

  const styles = getComputedStyle(body);
  const padY =
    (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
  const active = panels.find((p) => !p.hidden);
  const toH = Math.min(
    Math.ceil((active?.scrollHeight || 0) + padY),
    aboutBodyMaxHeightPx(),
  );
  if (Math.abs(toH - fromH) < 2) {
    body.style.height = "";
    body.style.transition = "";
    body.style.overflow = "";
    return;
  }

  void body.offsetHeight;
  body.style.transition = `height ${ABOUT_TAB_RESIZE_MS}ms ease`;
  body.style.height = `${toH}px`;

  const clear = () => {
    if (token !== aboutTabResizeToken) return;
    body.style.height = "";
    body.style.transition = "";
    body.style.overflow = "";
    body.removeEventListener("transitionend", onEnd);
  };
  const onEnd = (ev) => {
    if (ev.target === body && ev.propertyName === "height") clear();
  };
  body.addEventListener("transitionend", onEnd);
  window.setTimeout(clear, ABOUT_TAB_RESIZE_MS + 80);
}

function stepAboutTab(dir) {
  const tabs = [...document.querySelectorAll(".about-tab")];
  const i = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  const next = tabs[(i + dir + tabs.length) % tabs.length];
  selectAboutTab(next.id);
  next.focus();
}

/** Active family in the About alphabets browser (registry group key). */
let aboutAlphaGroup = null;

function alphabetRefsHtml(refs, className) {
  if (!refs?.length) return "";
  const items = refs
    .map(
      (r) =>
        `<li><a href="${escapeHtml(r.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a></li>`,
    )
    .join("");
  return (
    `<aside class="${className}">` +
    `<h6 class="alpha-refs-h">${escapeHtml(t("about.alphabets.refs"))}</h6>` +
    `<ul>${items}</ul>` +
    `</aside>`
  );
}

function alphabetLensHtml({ id, native, symbols, uiLocale }) {
  const glyphs = symbols
    .map((ch) => {
      const punct = isTrailPunct(ch);
      // Space / comma / period: same tile style, literal glyphs (nbsp so space is visible).
      const shown = ch === " " ? "&nbsp;" : escapeHtml(ch);
      const title = ch === " " ? "" : escapeHtml(`“${ch}”`);
      return `<span class="alpha-glyph${punct ? " punct" : ""}"${title ? ` title="${title}"` : ""}>${shown}</span>`;
    })
    .join("");
  const meta = t("about.alphabet.meta", { n: symbols.length, id });
  const pack = uiLocale
    ? `<span class="alpha-lens-pack">${escapeHtml(
        t("about.alphabet.uiPack", { name: native }),
      )}</span>`
    : "";
  const blurb = t(`alphabet.lensBlurb.${id}`);
  const blurbHtml =
    blurb && blurb !== `alphabet.lensBlurb.${id}`
      ? `<p class="alpha-lens-blurb dim">${escapeHtml(blurb)}</p>`
      : "";
  return (
    `<article class="alpha-lens">` +
    `<div class="alpha-lens-head">` +
    `<strong>${escapeHtml(native)}</strong>` +
    `<span class="alpha-lens-meta">${meta}</span>` +
    pack +
    `</div>` +
    blurbHtml +
    `<div class="alpha-glyphs" aria-label="${escapeHtml(native)}">${glyphs}</div>` +
    `</article>`
  );
}

function renderAboutAlphabets() {
  const host = el("aboutAlphabetList");
  if (!host) return;
  const lenses = listAlphabets();
  const groups = [];
  const byGroup = new Map();
  for (const lens of lenses) {
    if (!byGroup.has(lens.group)) {
      byGroup.set(lens.group, []);
      groups.push(lens.group);
    }
    byGroup.get(lens.group).push(lens);
  }
  if (!aboutAlphaGroup || !byGroup.has(aboutAlphaGroup)) {
    aboutAlphaGroup = groups[0] ?? null;
  }
  if (!aboutAlphaGroup) {
    host.replaceChildren();
    return;
  }

  const active = aboutAlphaGroup;
  const activeLenses = byGroup.get(active);

  const familyButtons = groups
    .map((group) => {
      const label = escapeHtml(t(`alphabet.group.${group}`));
      const n = byGroup.get(group).length;
      const on = group === active ? ' aria-current="true"' : "";
      return (
        `<button type="button" class="alpha-family-btn" data-group="${escapeHtml(group)}"${on}>` +
        `<span class="alpha-family-name">${label}</span>` +
        `<span class="alpha-family-count">${n}</span>` +
        `</button>`
      );
    })
    .join("");

  const selectOpts = groups
    .map((group) => {
      const label = escapeHtml(t(`alphabet.group.${group}`));
      const sel = group === active ? " selected" : "";
      return `<option value="${escapeHtml(group)}"${sel}>${label}</option>`;
    })
    .join("");

  // Rebuild only when the shell is missing (locale refresh / first open). Group
  // switches patch the panel so the dialog height and rail scroll stay put.
  let browse = host.querySelector(".alpha-browse");
  if (!browse) {
    host.innerHTML =
      `<div class="alpha-browse">` +
      `<div class="alpha-family-rail">` +
      `<label class="alpha-family-select-wrap">` +
      `<span class="alpha-family-select-label">${escapeHtml(t("about.alphabets.indexLabel"))}</span>` +
      `<select class="alpha-family-select" aria-label="${escapeHtml(t("about.alphabets.indexLabel"))}">${selectOpts}</select>` +
      `</label>` +
      `<nav class="alpha-family-list" aria-label="${escapeHtml(t("about.alphabets.indexLabel"))}">${familyButtons}</nav>` +
      `</div>` +
      `<div class="alpha-family-panel" tabindex="-1">` +
      `<p class="alpha-family-blurb dim"></p>` +
      `<div class="alpha-family-refs-host"></div>` +
      `<div class="alpha-family-lenses"></div>` +
      `</div>` +
      `</div>`;
    browse = host.querySelector(".alpha-browse");
    const setGroup = (group) => {
      if (!group || group === aboutAlphaGroup) return;
      aboutAlphaGroup = group;
      renderAboutAlphabets();
    };
    host.querySelectorAll(".alpha-family-btn").forEach((btn) => {
      btn.addEventListener("click", () => setGroup(btn.getAttribute("data-group")));
    });
    const sel = host.querySelector(".alpha-family-select");
    if (sel) sel.addEventListener("change", () => setGroup(sel.value));
  } else {
    // Locale/chrome refresh: restamp family labels without remounting the shell.
    host.querySelectorAll(".alpha-family-btn").forEach((btn) => {
      const group = btn.getAttribute("data-group");
      const name = btn.querySelector(".alpha-family-name");
      const count = btn.querySelector(".alpha-family-count");
      if (name) name.textContent = t(`alphabet.group.${group}`);
      if (count && byGroup.has(group)) count.textContent = String(byGroup.get(group).length);
      if (group === active) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
    });
    const sel = host.querySelector(".alpha-family-select");
    if (sel) {
      [...sel.options].forEach((opt) => {
        opt.textContent = t(`alphabet.group.${opt.value}`);
        opt.selected = opt.value === active;
      });
    }
  }

  host.querySelectorAll(".alpha-family-btn").forEach((btn) => {
    if (btn.getAttribute("data-group") === active) btn.setAttribute("aria-current", "true");
    else btn.removeAttribute("aria-current");
  });
  const sel = host.querySelector(".alpha-family-select");
  if (sel && sel.value !== active) sel.value = active;

  const panel = host.querySelector(".alpha-family-panel");
  const blurb = host.querySelector(".alpha-family-blurb");
  const familyRefsHost = host.querySelector(".alpha-family-refs-host");
  const lensesHost = host.querySelector(".alpha-family-lenses");
  if (blurb) {
    blurb.textContent = t(`alphabet.blurb.${active}`);
  }
  if (familyRefsHost) {
    familyRefsHost.innerHTML = alphabetRefsHtml(
      alphabetFamilyRefs(active),
      "alpha-refs alpha-family-refs",
    );
  }
  if (lensesHost) {
    lensesHost.innerHTML = activeLenses.map(alphabetLensHtml).join("");
    lensesHost.scrollTop = 0;
  }
  if (panel) panel.scrollTop = 0;
}

function refreshLocaleChrome() {
  setLocaleFromAlphabet(S.alphabetId, { max: WINDOW_MAX });
  fillAlphabetSelect(el("alphabet"), S.alphabetId, t);
  syncLensControls();
  renderAboutAlphabets();
  document.querySelectorAll("[data-window-max]").forEach((node) => {
    node.textContent = String(WINDOW_MAX);
  });
  syncSearchKindUI();
  const viewBtn = el("viewToggle");
  if (viewBtn) {
    viewBtn.textContent =
      S.viewMode === "color" ? t("book.viewText") : t("book.viewColor");
  }
}

function wireAboutTabs() {
  document.querySelectorAll(".about-tab").forEach((tab) => {
    tab.addEventListener("click", () => selectAboutTab(tab.id));
  });
}

// ---- event wiring ---------------------------------------------------------
function wireControls() {
  refreshLocaleChrome();
  wireAboutTabs();
  el("aboutBtn").addEventListener("click", () => {
    selectAboutTab("aboutTab-overview", { animate: false });
    openModal("aboutModal");
  });

  wireModalCloses([
    ["closeAbout", "aboutModal"],
    ["closeJump", "jumpModal"],
    ["closeHistory", "historyModal"],
    ["closeSearch", "searchModal"],
    ["closeVerify", "verifyModal"],
    ["closeBook", "bookModal"],
    ["closeImage", "imageModal"],
  ]);

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
    copy: () => copyText(currentUrl()),
    search: openSearch,
    export: exportJourney,
    verify: () => el("verifyFile").click(),
    reset: newWalk,
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
  el("alphabet").addEventListener("change", (ev) => {
    freezeTrailLenses();
    S.alphabetId = Number(ev.target.value);
    afterLensChange("keep");
  });

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
  el("prevPage").addEventListener("click", () => turnPage(-1));
  el("nextPage").addEventListener("click", () => turnPage(1));
  el("goPage").addEventListener("click", jumpPage);

  window.addEventListener("keydown", (e) => {
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
    const map = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
    if (e.key in map) {
      e.preventDefault();
      step(map[e.key]);
    }
  });

  // Touch layout swaps need a re-render (hover listeners). Viewport px footer is
  // dev-only (localhost / ?dev=1) — production keeps trail note only.
  let lastTouch = galleryTouch();
  const measureFooter = () => {
    const node = el("viewportSize");
    if (!node || node.hidden) return;
    const book = document.querySelector(".book");
    const track = document.querySelector(".shelf-track");
    const px = (n) => Math.round(n);
    const bookBox = book?.getBoundingClientRect();
    const trackBox = track?.getBoundingClientRect();
    const touch = galleryTouch();
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
    const touch = galleryTouch();
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

function galleryTouch() {
  return (
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

boot().catch((err) => {
  document.getElementById("walls").innerHTML =
    `<div class="loading">${t("loading.failed", { err })}</div>`;
  console.error(err);
});
