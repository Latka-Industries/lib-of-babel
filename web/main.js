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
const LINES_PER_PAGE = 40;
const CHARS_PER_LINE = 80;

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
        const book = document.createElement("div");
        book.className = "book";
        book.title = titles[bookIndex] || `book ${bookIndex}`;
        book.addEventListener("click", () => openBook(bookIndex, titles[bookIndex]));
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

function openBook(bookIndex, title) {
  el("bookTitle").textContent = title || `book ${bookIndex}`;
  el("bookMeta").textContent = `gallery (${z}, ${n}) · shelf index ${bookIndex} · page 1 of 410`;
  // book_text_for returns the full 410-page book; show just page 1.
  const full = book_text_for(z, n, bookIndex);
  el("bookPage").textContent = full.slice(0, (CHARS_PER_LINE + 1) * LINES_PER_PAGE);
  el("bookModal").showModal();
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

  window.addEventListener("keydown", (e) => {
    if (el("bookModal").open) return;
    const map = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3 };
    if (e.key in map) { e.preventDefault(); step(map[e.key]); }
  });
}

main().catch((err) => {
  document.getElementById("walls").innerHTML =
    `<div class="loading">failed to load: ${err}</div>`;
  console.error(err);
});
