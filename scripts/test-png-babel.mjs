#!/usr/bin/env node
// Round-trip stamp for babel PNG provenance helpers.
import {
  injectBabelChunk,
  readBabelMeta,
  parseBabelFilename,
  babelExportFilename,
  encodeBabelPayload,
  parseBabelPayload,
} from "../web/js/lib/png-babel.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const meta = { u: 0xdeadn, name: "neptune|sea", a: 29, z: -3n, n: 42n, b: 7 };
const payload = encodeBabelPayload(meta);
const parsed = parseBabelPayload(payload);
assert(parsed?.z === -3n, "payload parse");
assert(parsed?.name === "neptune|sea", "payload name (pipe-safe)");

const legacy = parseBabelPayload("v1|u=10|a=29|z=1|n=2|b=3");
assert(legacy?.u === 10n && legacy?.name === null, "legacy stamp has null name");

const fileName = babelExportFilename(meta);
assert(fileName === "babel-udead-z-3-n42-b7-a29-colors.png", `name=${fileName}`);
assert(parseBabelFilename(fileName)?.u === 0xdeadn, "filename parse");

// Minimal valid PNG: signature + empty IHDR-sized chunk is hard; build IHDR+IDAT+IEND.
// 1×1 RGBA via uncompressed PNG is overkill — use a known tiny PNG (1×1 red).
const tiny = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

const stamped = new Uint8Array(await (await injectBabelChunk(tiny, meta)).arrayBuffer());
const got = readBabelMeta(stamped);
assert(
  got && got.u === meta.u && got.a === meta.a && got.z === meta.z && got.name === meta.name,
  "chunk round-trip",
);
assert(!readBabelMeta(tiny), "unstamped has no meta");
console.log("png-babel ok");
