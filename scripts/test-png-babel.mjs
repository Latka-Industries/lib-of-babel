#!/usr/bin/env node
// Round-trip stamp for babel PNG provenance helpers.
import {
  injectBabelChunk,
  readBabelMeta,
  parseBabelFilename,
  babelExportFilename,
  encodeBabelPayload,
  parseBabelPayload,
  verifyBabelProof,
  contentSeal,
} from "../web/js/lib/png-babel.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const meta = {
  u: 0xdeadn,
  name: "neptune|sea",
  a: 29,
  z: 3n,
  n: 42n,
  b: 7,
  scope: "page",
};
const payload = encodeBabelPayload(meta);
assert(payload.startsWith("v2|"), "unsealed → v2");
const parsed = parseBabelPayload(payload);
assert(String(parsed?.z) === "3", `payload z=${parsed?.z}`);
assert(parsed?.name === "neptune|sea", "payload name (pipe-safe)");
assert(parsed?.seal == null && parsed?.h == null, "v2 has no seal");

const sealed = {
  ...meta,
  seal: "abcdef012345",
  h: "0123456789abcdef",
};
const v3 = encodeBabelPayload(sealed);
assert(v3.startsWith("v3|"), "sealed → v3");
const parsed3 = parseBabelPayload(v3);
assert(parsed3?.seal === "abcdef012345", "v3 seal");
assert(parsed3?.h === "0123456789abcdef", "v3 h");
assert(parsed3?.version === 3, "v3 version");
assert(parsed?.version === 2, "v2 version");
assert(
  verifyBabelProof(parsed3, { seal: "abcdef012345", roomHash: "0123456789abcdef" }).ok,
  "verify ok",
);
assert(
  !verifyBabelProof(parsed3, { seal: "000000000000", roomHash: "0123456789abcdef" }).ok,
  "verify seal fail",
);
assert(
  !verifyBabelProof(parsed3, { seal: "abcdef012345", roomHash: "ffffffffffffffff" }).ok,
  "verify hash fail",
);
assert(verifyBabelProof(parsed, { seal: "x", roomHash: "y" }).sealed === false, "legacy unsealed");

const legacy = parseBabelPayload("v1|u=10|a=29|z=1|n=2|b=3");
assert(legacy?.u === 10n && legacy?.name === null, "legacy stamp has null name");
assert(legacy?.version === 1, "v1 version");

const fileName = babelExportFilename(meta);
assert(fileName === "babel-udead-z3-n42-b7-a29-spage-colors.png", `name=${fileName}`);
assert(parseBabelFilename(fileName)?.u === 0xdeadn, "filename parse");
const negName = babelExportFilename({ ...meta, z: -3n, n: -42n });
assert(negName === "babel-udead-z-3-n-42-b7-a29-spage-colors.png", `neg name=${negName}`);
assert(parseBabelFilename(negName)?.z === "-3", "neg z parse");
assert(parseBabelFilename(negName)?.n === "-42", "neg n parse");
const compactName = babelExportFilename({
  ...meta,
  z: "cAQcDvPwPJa22VwjxbF8774oD0nM7gWxCaJgIx9PUIA",
  n: "cBQcDvPwPJa22VwjxbF8774oD0nM7gWxCaJgIx9PUIA",
  scope: "book",
});
assert(
  compactName === "babel-udead-zc…-nc…-b7-a29-sbook-colors.png",
  `compact name=${compactName}`,
);

const tiny = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

const stamped = new Uint8Array(await (await injectBabelChunk(tiny, sealed)).arrayBuffer());
const got = await readBabelMeta(stamped);
assert(
  got &&
    got.u === meta.u &&
    got.a === meta.a &&
    String(got.z) === "3" &&
    got.name === meta.name &&
    got.seal === sealed.seal &&
    got.h === sealed.h,
  "chunk round-trip v3",
);
assert(!(await readBabelMeta(tiny)), "unstamped has no meta");

if (globalThis.crypto?.subtle) {
  const s = await contentSeal("hello");
  assert(typeof s === "string" && s.length === 12, "contentSeal length");
}

console.log("png-babel ok");
