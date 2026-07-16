// One WASM instance per worker — generates a page-range RGBA strip (THI-144).

import init, {
  book_image_pages,
  set_universe,
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
  return BigInt.asUintN(64, BigInt(String(v)));
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  if (!msg || msg.type !== "pages") return;
  const { id, z, n, book, alphabetId, universe, pageStart, pageEnd } = msg;
  try {
    await ensureWasm();
    set_universe(asUniverseSeed(universe));
    const pixels = book_image_pages(
      String(z),
      String(n),
      asU32(book),
      asU32(alphabetId),
      asU32(pageStart),
      asU32(pageEnd),
    );
    const src =
      pixels instanceof Uint8Array ? pixels : new Uint8Array(pixels);
    // Fresh buffer for transfer (never detach wasm scratch).
    const copy = src.slice();
    self.postMessage(
      { id, ok: true, pageStart: asU32(pageStart), pixels: copy.buffer },
      [copy.buffer],
    );
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      pageStart,
      error: err?.message || String(err),
    });
  }
};
