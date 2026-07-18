// Off-main-thread photo Find (`mosaic_find_book_locate` → `finish`).
// Posts phase progress so the UI can show finding / constructing / scoring.

import {
  mosaic_find_book,
  mosaic_find_book_locate,
  mosaic_find_book_finish,
  locate_book_json,
  set_universe,
  get_universe,
  warm_book_basile,
} from "../lib/wasm.js";
import { createFindTrace, isFindDebug } from "../lib/find-debug.js";

/** @type {Worker | null} */
let worker = null;
let workerDisabled = false;
let nextJobId = 1;
/** @type {Map<number, { resolve: (v: any) => void, reject: (e: Error) => void, onProgress?: (phase: string) => void, trace?: ReturnType<typeof createFindTrace> }>} */
const pending = new Map();

function settle(id, fn) {
  const wait = pending.get(id);
  if (!wait) return;
  pending.delete(id);
  fn(wait);
}

function rejectAll(err) {
  const e = err instanceof Error ? err : new Error(String(err));
  for (const [id, wait] of pending) {
    pending.delete(id);
    wait.trace?.fail(e);
    wait.reject(e);
  }
}

function terminateWorker() {
  if (!worker) return;
  try {
    worker.terminate();
  } catch {
    /* ignore */
  }
  worker = null;
}

function disableWorker(reason) {
  if (workerDisabled) return;
  workerDisabled = true;
  console.warn("mosaic-find worker disabled:", reason);
  rejectAll(reason instanceof Error ? reason : new Error(String(reason)));
  terminateWorker();
}

/** Abort in-flight Find (e.g. user left the photo tab). Worker is recreated next call. */
export function cancelMosaicFind() {
  if (!pending.size && !worker) return;
  rejectAll(new Error("mosaic find cancelled"));
  terminateWorker();
}

function onMessage(ev) {
  const msg = ev.data;
  if (!msg || msg.id == null) return;
  if (msg.type === "progress") {
    const wait = pending.get(msg.id);
    wait?.trace?.phase(msg.phase, { via: "worker" });
    wait?.onProgress?.(msg.phase);
    return;
  }
  if (msg.ok) {
    settle(msg.id, (wait) => {
      if (msg.kind === "locate_book") {
        wait.trace?.done({ via: "worker", kind: "locate_book" });
        wait.resolve({ resultsJson: msg.resultsJson });
        return;
      }
      wait.trace?.done({
        via: "worker",
        w: msg.width,
        h: msg.height,
        flatLen: typeof msg.flat === "string" ? msg.flat.length : 0,
      });
      wait.resolve({
        resultsJson: msg.resultsJson,
        flat: typeof msg.flat === "string" ? msg.flat : "",
        bookRgba: new Uint8Array(msg.bookRgba),
        mosaicRgba: msg.mosaicRgba
          ? new Uint8Array(msg.mosaicRgba)
          : new Uint8Array(0),
        diffRgba: new Uint8Array(msg.diffRgba),
        width: msg.width,
        height: msg.height,
      });
    });
  } else {
    settle(msg.id, (wait) => {
      const err = new Error(msg.error || "mosaic find failed");
      wait.trace?.fail(err);
      wait.reject(err);
    });
  }
}

function ensureWorker() {
  if (workerDisabled) return null;
  if (worker) return worker;
  if (typeof Worker === "undefined") {
    workerDisabled = true;
    return null;
  }
  try {
    worker = new Worker(new URL("./mosaic-find-worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = onMessage;
    worker.onerror = (err) => {
      disableWorker(err?.message || "worker onerror");
    };
    worker.onmessageerror = () => {
      disableWorker("worker messageerror");
    };
    return worker;
  } catch (err) {
    disableWorker(err);
    return null;
  }
}

function runOnWorker(rgba, alphabetId, hue, chroma, light, universe, onProgress) {
  const w = ensureWorker();
  if (!w) return Promise.reject(new Error("no mosaic-find worker"));

  const copy = rgba instanceof Uint8Array ? rgba.slice() : new Uint8Array(rgba);
  const id = nextJobId++;
  const debug = isFindDebug();
  const trace = createFindTrace(`job#${id}`, {
    via: "worker",
    bytes: copy.byteLength,
    alphabetId,
    universe: String(universe ?? "0"),
  });
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress, trace });
    try {
      w.postMessage(
        {
          type: "find",
          id,
          rgba: copy.buffer,
          alphabetId,
          hue,
          chroma,
          light,
          universe: String(universe ?? "0"),
          debug,
        },
        [copy.buffer],
      );
      trace.phase("posted", { waiting: "worker wasm" });
    } catch (err) {
      pending.delete(id);
      const e = err instanceof Error ? err : new Error(String(err));
      trace.fail(e);
      reject(e);
    }
  });
}

function runOnMain(rgba, alphabetId, hue, chroma, light, universe, onProgress) {
  const trace = createFindTrace("main-thread", {
    via: "main",
    bytes: rgba?.byteLength ?? 0,
    alphabetId,
  });
  try {
    set_universe(universe);
    onProgress?.("project");
    trace.phase("project");
    onProgress?.("warm");
    trace.phase("warm");
    warm_book_basile(alphabetId);
    onProgress?.("invert");
    trace.phase("invert");
    const locate = mosaic_find_book_locate(rgba, alphabetId, hue, chroma, light);
    try {
      onProgress?.("construct");
      trace.phase("construct");
      const result = mosaic_find_book_finish(locate);
      try {
        onProgress?.("score");
        trace.phase("score");
        const bookSrc = result.reproject_pixels;
        const mosaicSrc = result.mosaic_pixels;
        const diffSrc = result.diff_pixels;
        const out = {
          resultsJson: result.results_json,
          flat: typeof result.flat === "string" ? result.flat : String(result.flat ?? ""),
          bookRgba:
            bookSrc instanceof Uint8Array ? bookSrc : new Uint8Array(bookSrc),
          mosaicRgba:
            mosaicSrc instanceof Uint8Array
              ? mosaicSrc
              : new Uint8Array(mosaicSrc ?? []),
          diffRgba:
            diffSrc instanceof Uint8Array ? diffSrc : new Uint8Array(diffSrc),
          width: Number(result.width) >>> 0,
          height: Number(result.height) >>> 0,
        };
        trace.done({ w: out.width, h: out.height, flatLen: out.flat.length });
        return out;
      } finally {
        result.free?.();
      }
    } finally {
      locate.free?.();
    }
  } catch (err) {
    trace.fail(err);
    throw err;
  }
}

/**
 * Photo Find: letter mosaic → book-linked invert → proof RGBA + letter flat.
 *
 * @param {Uint8Array} rgba book-grid RGBA
 * @param {number} alphabetId
 * @param {number} hue
 * @param {number} chroma
 * @param {number} light
 * @param {bigint|number|string} [universe]
 * @param {{ onProgress?: (phase: string) => void }} [opts]
 */
export async function mosaicFindBookAsync(
  rgba,
  alphabetId,
  hue,
  chroma,
  light,
  universe = get_universe(),
  opts = {},
) {
  const onProgress = opts.onProgress;
  if (!workerDisabled) {
    try {
      return await runOnWorker(
        rgba,
        alphabetId,
        hue,
        chroma,
        light,
        universe,
        onProgress,
      );
    } catch (err) {
      const msg = err?.message || String(err);
      if (/cancelled/i.test(msg)) throw err;
      console.warn("mosaic-find worker failed; using main thread", err);
      if (!workerDisabled) terminateWorker();
    }
  }
  // Fallback may still use the one-shot API if staged exports failed to load.
  try {
    return runOnMain(rgba, alphabetId, hue, chroma, light, universe, onProgress);
  } catch (err) {
    console.warn("staged find failed; one-shot mosaic_find_book", err);
    const trace = createFindTrace("one-shot", { via: "main-oneshot" });
    try {
      onProgress?.("invert");
      trace.phase("invert");
      set_universe(universe);
      const locate = mosaic_find_book(rgba, alphabetId, hue, chroma, light);
      try {
        onProgress?.("construct");
        trace.phase("construct");
        const bookSrc = locate.reproject_pixels;
        const mosaicSrc = locate.mosaic_pixels;
        const diffSrc = locate.diff_pixels;
        onProgress?.("score");
        trace.phase("score");
        const out = {
          resultsJson: locate.results_json,
          flat: typeof locate.flat === "string" ? locate.flat : String(locate.flat ?? ""),
          bookRgba:
            bookSrc instanceof Uint8Array ? bookSrc : new Uint8Array(bookSrc),
          mosaicRgba:
            mosaicSrc instanceof Uint8Array
              ? mosaicSrc
              : new Uint8Array(mosaicSrc ?? []),
          diffRgba:
            diffSrc instanceof Uint8Array ? diffSrc : new Uint8Array(diffSrc),
          width: Number(locate.width) >>> 0,
          height: Number(locate.height) >>> 0,
        };
        trace.done({ w: out.width, h: out.height, flatLen: out.flat.length });
        return out;
      } finally {
        locate.free?.();
      }
    } catch (err2) {
      trace.fail(err2);
      throw err2;
    }
  }
}

/**
 * Whole-book text locate (THI-149): warm α^BOOK → invert padded book flat.
 *
 * @param {string} text
 * @param {number} alphabetId
 * @param {bigint|number|string} [universe]
 * @param {{ onProgress?: (phase: string) => void }} [opts]
 * @returns {Promise<{ resultsJson: string }>}
 */
export async function locateBookAsync(
  text,
  alphabetId,
  universe = get_universe(),
  opts = {},
) {
  const onProgress = opts.onProgress;
  if (!workerDisabled) {
    try {
      const w = ensureWorker();
      if (!w) throw new Error("no mosaic-find worker");
      const id = nextJobId++;
      const debug = isFindDebug();
      const trace = createFindTrace(`job#${id}`, {
        via: "worker",
        kind: "locate_book",
        alphabetId,
        universe: String(universe ?? "0"),
      });
      return await new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject, onProgress, trace });
        try {
          w.postMessage({
            type: "locate_book",
            id,
            text: String(text ?? ""),
            alphabetId,
            universe: String(universe ?? "0"),
            debug,
          });
          trace.phase("posted", { waiting: "worker wasm" });
        } catch (err) {
          pending.delete(id);
          const e = err instanceof Error ? err : new Error(String(err));
          trace.fail(e);
          reject(e);
        }
      });
    } catch (err) {
      const msg = err?.message || String(err);
      if (/cancelled/i.test(msg)) throw err;
      console.warn("locate_book worker failed; using main thread", err);
      if (!workerDisabled) terminateWorker();
    }
  }
  const trace = createFindTrace("locate_book-main", { via: "main" });
  try {
    set_universe(universe);
    onProgress?.("warm");
    trace.phase("warm");
    warm_book_basile(alphabetId);
    onProgress?.("invert");
    trace.phase("invert");
    const resultsJson = locate_book_json(String(text ?? ""), alphabetId);
    trace.done({ kind: "locate_book" });
    return { resultsJson };
  } catch (err) {
    trace.fail(err);
    throw err;
  }
}
