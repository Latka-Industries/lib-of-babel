// lib-of-babel — the walk.
// Generation lives in WASM (deterministic). This file is just the librarian:
// render the gallery, move between coordinates, keep a 50-node window, and
// persist the trail of {z, n, move, hash} to IndexedDB. Text is never stored.

import init, {
  gallery_titles_json,
  node_hash_hex,
  book_text_for,
  generator_version,
} from "./pkg/lib_of_babel.js";

const WALLS = 4;
const SHELVES_PER_WALL = 5;
const BOOKS_PER_SHELF = 35;
const WINDOW_MAX = 50; // forget rendered nodes beyond this; trail keeps hashes
const PAGES_PER_BOOK = 410;
const LINES_PER_PAGE = 40;
const CHARS_PER_LINE = 80;
const PAGE_CHARS = (CHARS_PER_LINE + 1) * LINES_PER_PAGE; // 80 chars + newline per line

// deterministic hue from a string (spine title) — stable per book
function hueFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

// ---- tiny IndexedDB key/value store ---------------------------------------
const DB_NAME = "lib-of-babel";
const STORE = "kv";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function kvGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    tx.onsuccess = () => resolve(tx.result);
    tx.onerror = () => reject(tx.error);
  });
}
async function kvSet(key, val) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite").objectStore(STORE).put(val, key);
    tx.onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- state ----------------------------------------------------------------
const MOVE_NAMES = { 0: "left", 1: "right", 2: "up", 3: "down" };
let z = 0n;
let n = 0n;
let gv = 0;
let trail = []; // [{ z:string, n:string, move:number|null, hash:string }]
let windowBuf = []; // last <=50 visited {z,n,hash}
let startedAt = new Date().toISOString();
let saveTimer = null;

// neighbor math (kept in JS to avoid BigInt/JSON round-trips through wasm)
function neighbor(z, n, mv) {
  switch (mv) {
    case 0: return [z, n - 1n];
    case 1: return [z, n + 1n];
    case 2: return [z + 1n, n];
    default: return [z - 1n, n];
  }
}

function randomCoord() {
  const buf = new BigInt64Array(2);
  crypto.getRandomValues(buf);
  // keep within a friendly range so the header stays readable
  return [buf[0] % 1_000_000_000n, buf[1] % 1_000_000_000n];
}

// ---- persistence ----------------------------------------------------------
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 250);
}
async function persist() {
  await kvSet("journey", {
    generator_version: gv,
    started_at: startedAt,
    current: { z: z.toString(), n: n.toString() },
    trail,
  });
}

function recordStep(move) {
  const hash = node_hash_hex(z, n);
  trail.push({ z: z.toString(), n: n.toString(), move, hash });
  windowBuf.push({ z: z.toString(), n: n.toString(), hash });
  if (windowBuf.length > WINDOW_MAX) windowBuf.shift(); // forget beyond 50
  scheduleSave();
  return hash;
}

// ---- rendering ------------------------------------------------------------
const el = (id) => document.getElementById(id);

function render() {
  const titles = JSON.parse(gallery_titles_json(z, n));
  const hash = node_hash_hex(z, n);
  el("coord").textContent = `(${z}, ${n})`;
  el("hash").textContent = hash;
  el("steps").textContent = String(Math.max(0, trail.length - 1));

  // gallery accent colour derived from its hash (deterministic per node)
  const accentHue = parseInt(hash.slice(0, 4), 16) % 360;
  document.documentElement.style.setProperty("--accent", `hsl(${accentHue} 70% 58%)`);

  const wallsEl = el("walls");
  wallsEl.innerHTML = "";
  let idx = 0;
  for (let w = 0; w < WALLS; w++) {
    const wall = document.createElement("div");
    wall.className = "wall";
    const h = document.createElement("h2");
    h.textContent = `Wall ${w + 1}`;
    wall.appendChild(h);
    for (let s = 0; s < SHELVES_PER_WALL; s++) {
      const shelf = document.createElement("div");
      shelf.className = "shelf";
      for (let b = 0; b < BOOKS_PER_SHELF; b++) {
        const bookIndex = idx++;
        const title = titles[bookIndex] || `book ${bookIndex}`;
        const hue = hueFromString(title);
        const book = document.createElement("div");
        book.className = "book";
        book.title = title;
        book.style.background = `linear-gradient(180deg, hsl(${hue} 48% 44%), hsl(${hue} 52% 22%))`;
        book.textContent = title.replace(/[^a-z]/gi, "").slice(0, 6).toUpperCase();
        book.addEventListener("click", () => openBook(bookIndex, title));
        shelf.appendChild(book);
      }
      wall.appendChild(shelf);
    }
    wallsEl.appendChild(wall);
  }

  const recent = windowBuf.slice(-12).map((e) => `(${e.z},${e.n})`).join(" → ");
  el("breadcrumb").innerHTML =
    `<b>window</b> (last ${windowBuf.length}/${WINDOW_MAX}): ${recent || "—"}` +
    `<br><b>trail</b>: ${trail.length} nodes · gen v${gv}`;
}

let currentBook = null; // { index, title, text, page }

function openBook(bookIndex, title) {
  // generate the whole 410-page book once, then page through it from the cache
  const text = book_text_for(z, n, bookIndex);
  currentBook = { index: bookIndex, title: title || `book ${bookIndex}`, text, page: 0 };
  el("bookTitle").textContent = currentBook.title;
  renderBookPage();
  el("bookModal").showModal();
}

function renderBookPage() {
  if (!currentBook) return;
  const p = currentBook.page;
  el("bookMeta").textContent = `gallery (${z}, ${n}) · shelf index ${currentBook.index}`;
  el("pageInd").textContent = `page ${p + 1} / ${PAGES_PER_BOOK}`;
  el("bookPage").textContent = currentBook.text.slice(p * PAGE_CHARS, (p + 1) * PAGE_CHARS);
  el("bookPage").scrollTop = 0;
  el("prevPage").disabled = p <= 0;
  el("nextPage").disabled = p >= PAGES_PER_BOOK - 1;
}

function turnPage(delta) {
  if (!currentBook) return;
  const next = currentBook.page + delta;
  if (next < 0 || next >= PAGES_PER_BOOK) return;
  currentBook.page = next;
  renderBookPage();
}

function jumpPage() {
  if (!currentBook) return;
  const v = parseInt(el("pageJump").value, 10);
  if (!Number.isFinite(v)) return;
  currentBook.page = Math.min(PAGES_PER_BOOK, Math.max(1, v)) - 1;
  renderBookPage();
}

function downloadBook() {
  if (!currentBook) return;
  const safe =
    currentBook.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40) ||
    "book";
  const name = `babel-${z}_${n}-shelf${currentBook.index}-${safe}.txt`;
  const blob = new Blob([currentBook.text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---- movement -------------------------------------------------------------
function step(move) {
  [z, n] = neighbor(z, n, move);
  recordStep(move);
  render();
}

// ---- export ---------------------------------------------------------------
function exportJourney() {
  const blob = new Blob(
    [JSON.stringify({ generator_version: gv, started_at: startedAt, trail }, null, 2)],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `babel-journey-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function newWalk() {
  [z, n] = randomCoord();
  trail = [];
  windowBuf = [];
  startedAt = new Date().toISOString();
  recordStep(null); // the starting node
  await persist();
  render();
}

// ---- boot -----------------------------------------------------------------
async function main() {
  await init();
  gv = generator_version();

  const saved = await kvGet("journey");
  if (saved && saved.current && Array.isArray(saved.trail) && saved.trail.length) {
    z = BigInt(saved.current.z);
    n = BigInt(saved.current.n);
    trail = saved.trail;
    startedAt = saved.started_at || startedAt;
    windowBuf = trail.slice(-WINDOW_MAX).map((e) => ({ z: e.z, n: e.n, hash: e.hash }));
    render();
  } else {
    await newWalk();
  }

  // ask the browser not to evict the trail under disk pressure
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

  document.querySelectorAll(".moves button").forEach((btn) =>
    btn.addEventListener("click", () => step(Number(btn.dataset.move))),
  );
  el("export").addEventListener("click", exportJourney);
  el("reset").addEventListener("click", newWalk);
  el("closeBook").addEventListener("click", () => el("bookModal").close());
  el("downloadBook").addEventListener("click", downloadBook);
  el("prevPage").addEventListener("click", () => turnPage(-1));
  el("nextPage").addEventListener("click", () => turnPage(1));
  el("goPage").addEventListener("click", jumpPage);
  el("pageJump").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); jumpPage(); }
  });

  window.addEventListener("keydown", (e) => {
    // inside an open book, arrows turn pages instead of walking
    if (el("bookModal").open) {
      if (e.target === el("pageJump")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); turnPage(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); turnPage(1); }
      return;
    }
    const map = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
    if (e.key in map) { e.preventDefault(); step(map[e.key]); }
  });
}

main().catch((err) => {
  document.getElementById("walls").innerHTML =
    `<div class="loading">failed to load: ${err}</div>`;
  console.error(err);
});
