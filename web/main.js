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
  openBook,
  renderBookPage,
  turnPage,
  jumpPage,
  downloadBook,
  renderBookImage,
  saveBookImage,
} from "./js/book.js";

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

  el("historyBtn").addEventListener("click", () => {
    renderHistory();
    el("historyModal").showModal();
  });
  el("closeHistory").addEventListener("click", () => el("historyModal").close());

  el("actionsMenu").addEventListener("change", (ev) => {
    const choice = ev.currentTarget.value;
    ev.currentTarget.selectedIndex = 0; // reset to the "actions…" label
    if (choice === "copy") copyText(currentUrl());
    else if (choice === "export") exportJourney();
    else if (choice === "verify") el("verifyFile").click();
    else if (choice === "reset") newWalk();
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
