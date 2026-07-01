// lib-of-babel — the librarian (boot + event wiring).
// Generation lives in WASM (deterministic); this file just loads it, restores
// the session, and connects the controls. Logic is split across ./js/*:
//   constants · wasm · util · db · state · url · book · view · nav
// Text is never stored — only the trail of {z, n, move, hash} in IndexedDB.

import { init, generator_version, default_alphabet } from "./js/wasm.js";
import { TOTAL_BOOKS, WINDOW_MAX } from "./js/constants.js";
import { el, copyText } from "./js/util.js";
import { kvGet } from "./js/db.js";
import {
  S,
  applyUniverse,
  randomUniverseName,
  persist,
  recordStep,
} from "./js/state.js";
import { currentUrl, syncUrl, parsePermalink } from "./js/url.js";
import { render, renderHistory } from "./js/view.js";
import { step, jumpTo, exportJourney, newWalk } from "./js/nav.js";
import { verifyJourney } from "./js/verify.js";
import {
  prospect,
  claimFor,
  addTrophy,
  getTrophies,
  removeTrophy,
  verifyClaim,
  claimPermalink,
  getFinder,
  setFinder,
  rarityTier,
  rarityOdds,
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
import { locateText, renderSearchResult } from "./js/search.js";

// ---- restore the session, then render -------------------------------------
async function boot() {
  await init();
  S.gv = generator_version();

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
    S.trail = [];
    S.windowBuf = [];
    S.startedAt = new Date().toISOString();
    recordStep(null);
    await persist();
    render();
  } else if (savedOk) {
    S.z = BigInt(saved.current.z);
    S.n = BigInt(saved.current.n);
    S.trail = saved.trail;
    S.startedAt = saved.started_at || S.startedAt;
    S.windowBuf = S.trail
      .slice(-WINDOW_MAX)
      .map((e) => ({ z: e.z, n: e.n, hash: e.hash }));
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
    openBook(link.b, null, link.p || 1);
  }

  // ask the browser not to evict the trail under disk pressure
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

  wireControls();
}

// ---- a fresh walk in the current library (shared by alphabet/universe swaps) -
function freshWalkHere() {
  S.trail = [];
  S.windowBuf = [];
  S.startedAt = new Date().toISOString();
  recordStep(null);
  persist();
  render();
}

// ---- verify journey result ------------------------------------------------
function showVerify(r, fileName) {
  el("verifyMeta").textContent = fileName
    ? fileName
    : "re-walked in WASM against this build";
  const facts =
    r.total != null
      ? `<ul class="verify-facts">
           <li>universe: <b>${(r.universe || "default") .replace(/[<>&]/g, "")}</b></li>
           <li>alphabet: <b>${r.alphabet ?? "—"}-symbol</b></li>
           <li>generator: <b>v${r.gv ?? "—"}</b></li>
           <li>steps checked: <b>${r.checked} / ${r.total}</b></li>
         </ul>`
      : "";
  el("verifyBody").innerHTML =
    `<div class="verify-verdict ${r.ok ? "verify-ok" : "verify-bad"}">` +
    `<span class="badge">${r.ok ? "✓" : "✕"}</span>` +
    `<span>${r.ok ? "verified" : "rejected"}</span></div>` +
    `<p class="verify-reason">${String(r.reason).replace(/[<>&]/g, "")}</p>` +
    facts;
  if (!el("verifyModal").open) el("verifyModal").showModal();
}

// ---- proof-of-find: prospecting + trophies --------------------------------
function tierColor(tier) {
  return tier.dim ? "var(--muted)" : `hsl(${tier.hue} 75% 62%)`;
}

function openProspect() {
  el("prospectProgress").textContent = "";
  el("prospectResult").classList.remove("show");
  el("prospectModal").showModal();
}

function renderProspectResult(best) {
  const box = el("prospectResult");
  if (!best) {
    box.classList.remove("show");
    return;
  }
  const tier = rarityTier(best.bits);
  const color = tierColor(tier);
  box.innerHTML =
    `<span class="tier-badge" style="background:${color}">${tier.name}</span>` +
    `<div class="find-big" style="color:${color}">${best.bits} leading zero bits</div>` +
    `<div class="find-dim">gallery (${best.z}, ${best.n}) · hash ${best.hash} · ${rarityOdds(best.bits)}</div>` +
    `<div class="find-row" style="margin-top:.5rem">` +
    `<button id="prospectGo">travel here</button>` +
    `<button id="prospectClaim">claim trophy</button></div>`;
  box.classList.add("show");
  el("prospectGo").onclick = () => {
    jumpTo(best.z, best.n);
    el("prospectModal").close();
  };
  el("prospectClaim").onclick = async (e) => {
    const finder = await getFinder();
    const { added } = await addTrophy(claimFor(best.z, best.n, finder));
    e.currentTarget.textContent = added ? "claimed!" : "already yours";
  };
}

async function runDig() {
  const samples = Number(el("prospectCount").value);
  const dig = el("prospectDig");
  dig.disabled = true;
  el("prospectResult").classList.remove("show");
  const { best, scanned } = await prospect({
    samples,
    onProgress: (done, total, b) => {
      el("prospectProgress").textContent =
        `scanned ${done.toLocaleString()} / ${total.toLocaleString()} · best ${b ? b.bits : 0} bits`;
    },
  });
  el("prospectProgress").textContent = `scanned ${scanned.toLocaleString()} galleries`;
  renderProspectResult(best);
  dig.disabled = false;
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
      `<div class="trophy-empty">No trophies yet. Open <b>prospect rarity</b>, dig for a rare gallery, then claim it.</div>`;
    return;
  }
  box.innerHTML = "";
  for (const c of list) {
    const v = verifyClaim(c);
    const tier = rarityTier(c.bits);
    const color = tierColor(tier);
    const safe = (s) => String(s).replace(/[<>&]/g, "");
    const row = document.createElement("div");
    row.className = "trophy";
    row.innerHTML =
      `<span class="tier-badge" style="background:${color}">${tier.name}</span>` +
      `<b style="color:${color}">${c.bits} bits</b>` +
      `<span class="coord">(${c.z}, ${c.n})</span>` +
      `<small>${safe(c.universe || "default")} · ${c.alphabet}-sym${c.finder ? ` · ${safe(c.finder)}` : ""}</small>` +
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
  el("searchModal").showModal();
  el("searchInput").focus();
}

function runSearch() {
  const text = el("searchInput").value;
  if (!text.trim()) return;
  const result = locateText(text, S.alphabetId);
  renderSearchResult(result, el("searchResult"));
}

// ---- event wiring ---------------------------------------------------------
function wireControls() {
  document
    .querySelectorAll(".moves button")
    .forEach((btn) =>
      btn.addEventListener("click", () => step(Number(btn.dataset.move))),
    );

  el("aboutBtn").addEventListener("click", () => el("aboutModal").showModal());
  el("closeAbout").addEventListener("click", () => el("aboutModal").close());

  // click the (z, n) coordinate to jump anywhere on the lattice
  const doJump = () => {
    if (jumpTo(el("jumpZ").value, el("jumpN").value)) el("jumpModal").close();
  };
  el("coord").addEventListener("click", () => {
    el("jumpZ").value = S.z.toString();
    el("jumpN").value = S.n.toString();
    el("jumpModal").showModal();
    el("jumpZ").focus();
    el("jumpZ").select();
  });
  el("goJump").addEventListener("click", doJump);
  el("closeJump").addEventListener("click", () => el("jumpModal").close());
  ["jumpZ", "jumpN"].forEach((id) =>
    el(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doJump();
      }
    }),
  );

  // click the sigil to take this gallery's emblem home as a standalone SVG
  el("sigil").addEventListener("click", () => {
    const svg = el("sigil").innerHTML.trim();
    if (!svg) return;
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], {
      type: "image/svg+xml",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sigil_${S.z}_${S.n}_${el("hash").textContent}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  el("historyBtn").addEventListener("click", () => {
    renderHistory();
    el("historyModal").showModal();
  });
  el("closeHistory").addEventListener("click", () => el("historyModal").close());

  el("actionsMenu").addEventListener("change", (ev) => {
    const choice = ev.currentTarget.value;
    ev.currentTarget.selectedIndex = 0; // reset to the "actions…" label
    if (choice === "copy") copyText(currentUrl());
    else if (choice === "search") openSearch();
    else if (choice === "export") exportJourney();
    else if (choice === "verify") el("verifyFile").click();
    else if (choice === "prospect") openProspect();
    else if (choice === "trophies") openTrophies();
    else if (choice === "reset") newWalk();
  });

  // proof-of-find: rarity badge opens the prospector; modals + claiming
  el("rarity").addEventListener("click", openProspect);
  el("closeProspect").addEventListener("click", () => el("prospectModal").close());
  el("prospectDig").addEventListener("click", runDig);
  el("closeTrophies").addEventListener("click", () => el("trophiesModal").close());
  el("closeSearch").addEventListener("click", () => el("searchModal").close());
  el("searchFind").addEventListener("click", runSearch);
  el("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      runSearch();
    }
  });
  el("finderHandle").addEventListener("change", (ev) => setFinder(ev.target.value));
  el("claimCurrent").addEventListener("click", async (ev) => {
    await setFinder(el("finderHandle").value);
    const { added } = await addTrophy(claimFor(S.z, S.n, el("finderHandle").value.trim()));
    ev.currentTarget.textContent = added ? "claimed!" : "already claimed";
    setTimeout(() => (ev.currentTarget.textContent = "claim this gallery"), 1200);
    renderTrophyList();
  });

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
  el("closeVerify").addEventListener("click", () => el("verifyModal").close());
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
  el("universe").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      enterUniverse(e.target.value);
      e.target.blur();
    }
  });
  el("universeRandom").addEventListener("click", () =>
    enterUniverse(randomUniverseName()),
  );

  // book modal
  el("bookModal").addEventListener("close", () => {
    S.currentBook = null;
    syncUrl();
  });
  el("closeBook").addEventListener("click", () => el("bookModal").close());
  el("saveMenu").addEventListener("change", (ev) => {
    const choice = ev.currentTarget.value;
    ev.currentTarget.selectedIndex = 0; // reset to the "save…" label
    if (choice === "txt") downloadBook();
    else if (choice === "img") {
      renderBookImage();
      if (!el("imageModal").open) el("imageModal").showModal();
    }
  });
  el("viewToggle").addEventListener("click", (ev) => {
    S.viewMode = S.viewMode === "color" ? "text" : "color";
    ev.currentTarget.textContent = S.viewMode === "color" ? "text" : "color";
    renderBookPage();
  });
  el("saveImage").addEventListener("click", saveBookImage);
  el("closeImage").addEventListener("click", () => el("imageModal").close());
  el("prevPage").addEventListener("click", () => turnPage(-1));
  el("nextPage").addEventListener("click", () => turnPage(1));
  el("goPage").addEventListener("click", jumpPage);
  el("pageJump").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      jumpPage();
    }
  });

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
