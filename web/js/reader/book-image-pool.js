// Virgin book_image generation (THI-144).
// Prefer Web Workers (page-range strips → stitch). If workers fail / hang,
// fall back to chunked main-thread `book_image_pages` with UI yields.
// N workers ≈ N× WASM instances in memory.

import {
  PAGES_PER_BOOK,
  PAGE_CONTENT_SYMBOLS,
} from "../lib/constants.js";
import {
  book_image_dims,
  book_image_pages,
  get_universe,
  set_universe,
} from "../lib/wasm.js";

const MAX_WORKERS = 8;
const BYTES_PER_PAGE = PAGE_CONTENT_SYMBOLS * 4;
/** Whole-pool budget before falling back to main-thread chunks. */
const WORKER_POOL_MS = 12_000;
/** Pages per main-thread chunk (keeps UI responsive). */
const MAIN_CHUNK_PAGES = 20;

/** wasm-bindgen returns `u64` as BigInt — never use `>>>` on it. */
function asU32(v) {
  if (typeof v === "bigint") return Number(v & 0xffffffffn);
  return Number(v) >>> 0;
}

function asUniverseSeed(v) {
  if (typeof v === "bigint") return BigInt.asUintN(64, v);
  if (typeof v === "number" && Number.isFinite(v)) {
    return BigInt.asUintN(64, BigInt(Math.trunc(v)));
  }
  // Prefer string parse — Number loses precision above 2^53.
  return BigInt.asUintN(64, BigInt(String(v ?? "0")));
}

/** @type {Worker[] | null} */
let workers = null;
/** @type {boolean} */
let workersDisabled = false;
let nextJobId = 1;
/** @type {Map<number, { resolve: (v: any) => void, reject: (e: Error) => void }>} */
const pending = new Map();

function workerCount() {
  const hw =
    typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4;
  return Math.max(1, Math.min(MAX_WORKERS, hw));
}

function settlePending(id, fn) {
  const wait = pending.get(id);
  if (!wait) return;
  pending.delete(id);
  fn(wait);
}

function rejectAllPending(err) {
  for (const [id, wait] of pending) {
    pending.delete(id);
    wait.reject(err);
  }
}

function terminatePool() {
  if (!workers?.length) {
    workers = null;
    return;
  }
  for (const w of workers) {
    try {
      w.terminate();
    } catch {
      /* ignore */
    }
  }
  workers = null;
}

/** Permanent — worker script / runtime is broken. */
function disableWorkers(reason) {
  if (workersDisabled) return;
  workersDisabled = true;
  console.warn("book-image workers disabled:", reason);
  rejectAllPending(
    reason instanceof Error ? reason : new Error(String(reason)),
  );
  terminatePool();
  workers = [];
}

/** One-shot abandon (e.g. timeout on huge coords) — recreate next call. */
function abandonWorkers(reason) {
  console.warn("book-image workers abandoned for this run:", reason);
  rejectAllPending(
    reason instanceof Error ? reason : new Error(String(reason)),
  );
  terminatePool();
}

function onWorkerMessage(ev) {
  const msg = ev.data;
  if (!msg || msg.id == null) return;
  if (msg.ok) {
    settlePending(msg.id, (wait) => {
      wait.resolve({
        pageStart: msg.pageStart,
        pixels: new Uint8Array(msg.pixels),
      });
    });
  } else {
    settlePending(msg.id, (wait) => {
      wait.reject(new Error(msg.error || "book-image worker failed"));
    });
  }
}

function ensureWorkers() {
  if (workersDisabled) return [];
  if (workers) return workers;
  if (typeof Worker === "undefined") {
    workers = [];
    return workers;
  }
  const n = workerCount();
  workers = [];
  try {
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL("./book-image-worker.js", import.meta.url), {
        type: "module",
      });
      w.onmessage = onWorkerMessage;
      w.onerror = (err) => {
        disableWorkers(err?.message || "worker onerror");
      };
      w.onmessageerror = () => {
        disableWorkers("worker messageerror");
      };
      workers.push(w);
    }
  } catch (err) {
    disableWorkers(err);
    return [];
  }
  return workers;
}

/**
 * Split `[0, pages)` into `n` contiguous ranges.
 * @param {number} pages
 * @param {number} n
 */
export function splitPageRanges(pages, n) {
  const count = Math.max(1, Math.min(n, pages));
  const base = Math.floor(pages / count);
  const rem = pages % count;
  /** @type {{ start: number, end: number }[]} */
  const ranges = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const len = base + (i < rem ? 1 : 0);
    const end = start + len;
    ranges.push({ start, end });
    start = end;
  }
  return ranges;
}

function runOnWorker(worker, payload) {
  const id = nextJobId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    try {
      worker.postMessage({ type: "pages", id, ...payload });
    } catch (err) {
      settlePending(id, (wait) => {
        wait.reject(err instanceof Error ? err : new Error(String(err)));
      });
    }
  });
}

function yieldToUi() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * @param {(info: { done: number, total: number }) => void} [onProgress]
 */
async function generateOnMainChunked(
  z,
  n,
  book,
  alphabetId,
  universe,
  onProgress,
) {
  const dims = book_image_dims();
  const width = dims[0];
  const height = dims[1];
  const full = new Uint8Array(PAGES_PER_BOOK * BYTES_PER_PAGE);
  const prev = asUniverseSeed(get_universe());
  const uni = asUniverseSeed(universe);
  const bookIdx = asU32(book);
  const alpha = asU32(alphabetId);
  try {
    set_universe(uni);
    for (let start = 0; start < PAGES_PER_BOOK; start += MAIN_CHUNK_PAGES) {
      const end = Math.min(PAGES_PER_BOOK, start + MAIN_CHUNK_PAGES);
      const strip = book_image_pages(
        String(z),
        String(n),
        bookIdx,
        alpha,
        start,
        end,
      );
      const bytes =
        strip instanceof Uint8Array ? strip : new Uint8Array(strip);
      full.set(bytes, start * BYTES_PER_PAGE);
      onProgress?.({ done: end, total: PAGES_PER_BOOK });
      await yieldToUi();
    }
  } finally {
    set_universe(prev);
  }
  return { width, height, pixels: full };
}

async function generateViaWorkers(z, n, book, alphabetId, universe) {
  const pool = ensureWorkers();
  if (!pool.length) {
    throw new Error("no workers");
  }
  const dims = book_image_dims();
  const ranges = splitPageRanges(PAGES_PER_BOOK, pool.length);
  const uni = asUniverseSeed(universe);
  const bookIdx = asU32(book);
  const alpha = asU32(alphabetId);
  const parts = await Promise.all(
    ranges.map((range, i) =>
      runOnWorker(pool[i % pool.length], {
        z: String(z),
        n: String(n),
        book: bookIdx,
        alphabetId: alpha,
        // Structured-clone as string — workers rehydrate to BigInt.
        universe: uni.toString(),
        pageStart: range.start,
        pageEnd: range.end,
      }),
    ),
  );
  const full = new Uint8Array(PAGES_PER_BOOK * BYTES_PER_PAGE);
  for (const part of parts) {
    full.set(part.pixels, part.pageStart * BYTES_PER_PAGE);
  }
  return { width: dims[0], height: dims[1], pixels: full };
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(label || "timeout"));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * Full-book virgin RGBA via worker pool, else chunked main thread.
 *
 * @param {{
 *   z: string|bigint,
 *   n: string|bigint,
 *   book: number,
 *   alphabetId: number,
 *   universe?: number|bigint|string,
 *   onProgress?: (info: { done: number, total: number }) => void,
 * }} opts
 * @returns {Promise<{ width: number, height: number, pixels: Uint8Array }>}
 */
export async function generateBookImageRgba({
  z,
  n,
  book,
  alphabetId,
  universe = get_universe(),
  onProgress,
}) {
  if (!workersDisabled) {
    try {
      return await withTimeout(
        generateViaWorkers(z, n, book, alphabetId, universe),
        WORKER_POOL_MS,
        "book-image worker pool timeout",
      );
    } catch (err) {
      const msg = err?.message || String(err);
      console.warn("book-image workers unavailable, using main thread:", err);
      // Timeouts happen on huge Basile coords — retry workers next open.
      if (/timeout/i.test(msg)) abandonWorkers(err);
      else disableWorkers(err);
    }
  }
  return generateOnMainChunked(
    z,
    n,
    book,
    alphabetId,
    universe,
    onProgress,
  );
}
