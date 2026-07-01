// lib-of-babel — the librarian (boot + event wiring).
// Generation lives in WASM (deterministic); this file just loads it, restores
// the session, and connects the controls. Logic is split across ./js/*:
//   constants · wasm · util · db · state · url · book · view · nav
// Text is never stored — only the trail of {z, n, move, hash} in IndexedDB.

import { init, generator_version, default_alphabet, search_page_span_for } from "./js/wasm.js";
import { TOTAL_BOOKS, WINDOW_MAX } from "./js/constants.js";
import { el, copyText, trailEntryBits, escapeHtml, downloadBlob, wireModalCloses, wireActionMenu, wireEnter, openModal, formatUniverseLabel, findActionRow, wireFindActions, validateSearchQuery } from "./js/util.js";
import { kvGet } from "./js/db.js";
import {
  S,
  applyUniverse,
  randomUniverseName,
  persist,
  markLastPickedUp,
  setOnRecordStep,
  syncUniverseToWasm,
} from "./js/state.js";
import { currentUrl, syncUrl, parsePermalink } from "./js/url.js";
import { render, renderHistory } from "./js/view.js";
import { step, jumpTo, exportJourney, newWalk, freshWalkHere, resetTrail } from "./js/nav.js";
import { verifyJourney } from "./js/verify.js";
import {
  prospect,
  getTrophies,
  removeTrophy,
  verifyClaim,
  claimPermalink,
  getFinder,
  setFinder,
  rarityOdds,
  autoTrophy,
  backfillTrophiesFromTrail,
  formatProspectProgress,
  formatTierDisplay,
  TROPHY_MIN_BITS,
} from "./js/find.js";
import {
  openBook,
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
  setOnRecordStep((z, n, bits) => autoTrophy(z, n, bits));

  const saved = await kvGet("journey");
  const savedOk =
    saved && saved.current && Array.isArray(saved.trail) && saved.trail.length;

  // a permalink (#z=..&n=..) takes priority — unless it's just our own session
  // being refreshed (coords + universe already match the saved trail).
  const link = parsePermalink();

  // alphabet is an axis of the universe: permalink wins, else saved, else default
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
    S.trail = saved.trail;
    S.startedAt = saved.started_at || S.startedAt;
    S.windowBuf = S.trail
      .slice(-WINDOW_MAX)
      .map((e) => ({
        z: e.z,
        n: e.n,
        hash: e.hash,
        bits: trailEntryBits(e),
      }));
    await backfillTrophiesFromTrail(S.trail);
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
  const facts =
    r.total != null
      ? `<ul class="verify-facts">
           <li>universe: <b>${escapeHtml(formatUniverseLabel(r.universe))}</b></li>
           <li>alphabet: <b>${r.alphabet ?? "—"}-symbol</b></li>
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

// ---- proof-of-find: prospecting + trophies --------------------------------
let prospectAbort = null;

function openProspect() {
  el("prospectProgress").textContent = "";
  el("prospectResult").classList.remove("show");
  el("prospectCancel").hidden = true;
  el("prospectDig").disabled = false;
  el("prospectModal").showModal();
}

function renderProspectResult(best) {
  const box = el("prospectResult");
  if (!best) {
    box.classList.remove("show");
    return;
  }
  const { color, badgeHtml } = formatTierDisplay(best.bits);
  box.innerHTML =
    badgeHtml +
    `<div class="find-big" style="color:${color}">${best.bits} leading zero bits</div>` +
    `<div class="find-dim">gallery (${best.z}, ${best.n}) · hash ${best.hash} · ${rarityOdds(best.bits)}</div>` +
    findActionRow([{ id: "go", label: "travel here" }]);
  box.classList.add("show");
  wireFindActions(box, {
    go: () => {
      jumpTo(best.z, best.n);
      el("prospectModal").close();
    },
  });
}

async function runDig() {
  const samples = Number(el("prospectCount").value);
  const dig = el("prospectDig");
  const cancel = el("prospectCancel");
  prospectAbort?.abort();
  prospectAbort = new AbortController();
  const { signal } = prospectAbort;

  dig.disabled = true;
  cancel.hidden = false;
  el("prospectResult").classList.remove("show");
  syncUniverseToWasm();

  const t0 = performance.now();
  let result;
  try {
    result = await prospect({
      samples,
      signal,
      onProgress: (done, total, best, meta) => {
        el("prospectProgress").textContent = formatProspectProgress(
          done,
          total,
          best,
          { ...meta, t0 },
        );
      },
    });
  } catch (err) {
    if (err.name !== "AbortError") throw err;
    result = { best: null, scanned: 0, cancelled: true };
  }

  cancel.hidden = true;
  dig.disabled = false;
  prospectAbort = null;

  if (result.cancelled) {
    el("prospectProgress").textContent = `stopped at ${result.scanned.toLocaleString()} galleries`;
  } else {
    el("prospectProgress").textContent = `scanned ${result.scanned.toLocaleString()} galleries`;
  }
  renderProspectResult(result.best);
}

function cancelDig() {
  prospectAbort?.abort();
}

// travel to a trophy that may live in another universe/alphabet: rebuild via
// its permalink so boot restores the right library, then reload.
function travelToClaim(c) {
  const url = claimPermalink(c);
  location.hash = url.slice(url.indexOf("#"));
  location.reload();
}

async function renderTrophyList() {
  const list = (await getTrophies())
    .slice()
    .sort((a, b) => b.bits - a.bits || b.found_at.localeCompare(a.found_at));
  const box = el("trophyList");
  if (!list.length) {
    box.innerHTML =
      `<div class="trophy-empty">No trophies yet. Walk into galleries with <b>${TROPHY_MIN_BITS}+</b> leading zero bits (uncommon or better) — they are saved automatically.</div>`;
    return;
  }
  box.innerHTML = "";
  for (const c of list) {
    const v = verifyClaim(c);
    const { color, badgeHtml } = formatTierDisplay(c.bits);
    const safe = escapeHtml;
    const row = document.createElement("div");
    row.className = "trophy";
    row.innerHTML =
      badgeHtml +
      `<b style="color:${color}">${c.bits} bits</b>` +
      `<span class="coord">(${c.z}, ${c.n})</span>` +
      `<small>${safe(formatUniverseLabel(c.universe))} · ${c.alphabet}-sym${c.finder ? ` · ${safe(c.finder)}` : ""}</small>` +
      `<span class="grow"></span>` +
      `<span class="${v.ok ? "ok" : "bad"}">${v.ok ? "✓ verified" : "✕ unverified"}</span>` +
      `<button data-act="go">go</button>` +
      `<button data-act="link">link</button>` +
      `<button data-act="del">remove</button>`;
    row.querySelector('[data-act="go"]').onclick = () => travelToClaim(c);
    row.querySelector('[data-act="link"]').onclick = (e) =>
      copyText(claimPermalink(c), e.currentTarget, "copied");
    row.querySelector('[data-act="del"]').onclick = async () => {
      await removeTrophy(c);
      renderTrophyList();
    };
    box.appendChild(row);
  }
}

async function openTrophies() {
  el("finderHandle").value = await getFinder();
  await renderTrophyList();
  el("trophiesModal").showModal();
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

function selectAboutTab(tabId) {
  const tabs = [...document.querySelectorAll(".about-tab")];
  const panels = [...document.querySelectorAll(".about-panel")];
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
}

function stepAboutTab(dir) {
  const tabs = [...document.querySelectorAll(".about-tab")];
  const i = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  const next = tabs[(i + dir + tabs.length) % tabs.length];
  selectAboutTab(next.id);
  next.focus();
}

function wireAboutTabs() {
  document.querySelectorAll(".about-tab").forEach((tab) => {
    tab.addEventListener("click", () => selectAboutTab(tab.id));
  });
}

// ---- event wiring ---------------------------------------------------------
function wireControls() {
  wireAboutTabs();
  el("aboutBtn").addEventListener("click", () => {
    selectAboutTab("aboutTab-overview");
    openModal("aboutModal");
  });

  wireModalCloses([
    ["closeAbout", "aboutModal"],
    ["closeJump", "jumpModal"],
    ["closeHistory", "historyModal"],
    ["closeProspect", "prospectModal"],
    ["closeTrophies", "trophiesModal"],
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
    prospect: openProspect,
    trophies: openTrophies,
    reset: newWalk,
  });

  // proof-of-find: rarity badge opens the prospector; modals + claiming
  el("rarity").addEventListener("click", openProspect);
  el("prospectDig").addEventListener("click", runDig);
  el("prospectCancel").addEventListener("click", cancelDig);
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
  el("finderHandle").addEventListener("change", (ev) => setFinder(ev.target.value));

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
    copyText(currentUrl(), ev.currentTarget, "copied!"),
  );

  // switching alphabet steps into a different library (same coordinate, new
  // text + new hash), so it starts a fresh walk there.
  el("alphabet").value = String(S.alphabetId);
  el("alphabet").addEventListener("change", (ev) => {
    S.alphabetId = Number(ev.target.value);
    freshWalkHere();
  });

  // entering / naming a universe steps into a wholly different parallel library
  // at the same coordinate (new text + new hashes), so it starts a fresh walk.
  el("universe").value = S.universeName;
  const enterUniverse = (name) => {
    const next = (name || "").trim();
    if (next === S.universeName) return; // already here
    applyUniverse(next);
    el("universe").value = S.universeName;
    freshWalkHere();
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
    ev.currentTarget.textContent = S.viewMode === "color" ? "text" : "color";
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
        turnPage(1);
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
        stepAboutTab(1);
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
}

boot().catch((err) => {
  document.getElementById("walls").innerHTML =
    `<div class="loading">failed to load: ${err}</div>`;
  console.error(err);
});
