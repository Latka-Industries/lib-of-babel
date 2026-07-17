// Book-linked photo Find off the UI thread — own WASM instance.
// Staged: locate (letters + invert) → finish (colour map + score).

import init, {
  mosaic_find_book_locate,
  mosaic_find_book_finish,
  set_universe,
  warm_book_basile,
} from "../../pkg/lib_of_babel.js";

const WASM_URL = new URL("../../pkg/lib_of_babel_bg.wasm", import.meta.url);

let ready = null;

function ensureWasm() {
  if (!ready) ready = init({ module_or_path: WASM_URL });
  return ready;
}

function asU32(v) {
  if (typeof v === "bigint") return Number(v & 0xffffffffn);
  return Number(v) >>> 0;
}

function asUniverseSeed(v) {
  if (typeof v === "bigint") return BigInt.asUintN(64, v);
  return BigInt.asUintN(64, BigInt(String(v ?? "0")));
}

function postProgress(id, phase) {
  self.postMessage({ id, type: "progress", phase });
}

function workerLog(debug, ...args) {
  if (debug) console.info("[babel find worker]", ...args);
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  if (!msg || msg.type !== "find") return;
  const { id, rgba, alphabetId, hue, chroma, light, universe, debug } = msg;
  let locate = null;
  const t0 = performance.now();
  let last = t0;
  const lap = (label) => {
    const now = performance.now();
    workerLog(
      debug,
      `job#${id}`,
      label,
      `+${(now - last).toFixed(0)}ms`,
      `(${(now - t0).toFixed(0)}ms total)`,
    );
    last = now;
  };
  try {
    workerLog(debug, `job#${id} · ensureWasm`, { bytes: rgba?.byteLength ?? 0 });
    await ensureWasm();
    lap("wasm ready");
    set_universe(asUniverseSeed(universe));
    const src = new Uint8Array(rgba);
    const alpha = asU32(alphabetId);

    // First (universe, alphabet): build α^BOOK + C⁻¹. Can take minutes in WASM.
    postProgress(id, "warm");
    lap("enter warm_book_basile");
    warm_book_basile(alpha);
    lap("warm done (cached for this worker)");

    // Project + invert — still heavy (1.3M-digit bigint), but modulus is ready.
    postProgress(id, "invert");
    lap("enter locate (project+invert)");
    locate = mosaic_find_book_locate(
      src,
      alpha,
      Number(hue),
      Number(chroma),
      Number(light),
    );
    lap("locate done");

    postProgress(id, "construct");
    lap("enter finish (colour map)");
    const result = mosaic_find_book_finish(locate);
    lap("finish done");
    const resultsJson = result.results_json;
    const flat = result.flat;
    const bookSrc = result.reproject_pixels;
    const mosaicSrc = result.mosaic_pixels;
    const diffSrc = result.diff_pixels;
    const width = asU32(result.width);
    const height = asU32(result.height);
    result.free?.();
    locate.free?.();
    locate = null;

    postProgress(id, "score");

    const book =
      bookSrc instanceof Uint8Array ? bookSrc.slice() : new Uint8Array(bookSrc);
    const mosaic =
      mosaicSrc instanceof Uint8Array
        ? mosaicSrc.slice()
        : new Uint8Array(mosaicSrc ?? []);
    const diff =
      diffSrc instanceof Uint8Array ? diffSrc.slice() : new Uint8Array(diffSrc);
    lap("buffers copied");

    const transfer = [book.buffer, diff.buffer];
    if (mosaic.byteLength) transfer.push(mosaic.buffer);

    self.postMessage(
      {
        id,
        ok: true,
        resultsJson,
        flat: typeof flat === "string" ? flat : String(flat ?? ""),
        bookRgba: book.buffer,
        mosaicRgba: mosaic.byteLength ? mosaic.buffer : null,
        diffRgba: diff.buffer,
        width,
        height,
      },
      transfer,
    );
    workerLog(debug, `job#${id} · posted ok`, {
      w: width,
      h: height,
      totalMs: (performance.now() - t0).toFixed(0),
    });
  } catch (err) {
    locate?.free?.();
    const error =
      typeof err === "string"
        ? err
        : err?.message || (err && String(err)) || "mosaic_find_book failed";
    workerLog(debug, `job#${id} · error`, error);
    self.postMessage({ id, ok: false, error });
  }
};
