#!/usr/bin/env node
// Deterministic page-scope fold for Mbit → hallway escape (THI-160).
import {
  foldToPageScopeCoord,
  encodeCoordParam,
  isHugeCoordValue,
} from "../web/js/lib/coords.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Signed i64 magnitude mask (low 63 bits) — hallway / randomCoord scale. */
const mask = (1n << 63n) - 1n;

// Small bigint: low bits only, sign preserved.
assert(foldToPageScopeCoord(12345n) === 12345n, "small positive");
assert(foldToPageScopeCoord(-12345n) === -12345n, "small negative");
assert(foldToPageScopeCoord(0n) === 0n, "zero");

const wide = (1n << 100_000n) + 12345n;
assert(foldToPageScopeCoord(wide) === (wide & mask), "wide positive low bits");
assert(foldToPageScopeCoord(-wide) === -((wide & mask)), "wide negative");

// Same fold every time.
assert(
  foldToPageScopeCoord(wide) === foldToPageScopeCoord(wide),
  "deterministic",
);

// Decimal string (non-huge) normalizes then folds.
assert(foldToPageScopeCoord("99") === 99n, "decimal string");
assert(foldToPageScopeCoord("-7") === -7n, "negative decimal string");

// Huge compact `c…`: low 8 bytes of magnitude (i64 fold).
// Compact length must be ≥ HUGE_COMPACT_LEN (32_000) so isHugeCoordValue is true.
const magLen = 24_000;
const mag = new Uint8Array(magLen);
mag[0] = 0x80;
mag[magLen - 1] = 0xab;
mag[magLen - 2] = 0xcd;
const bytes = [0, ...mag];
let bin = "";
for (const b of bytes) bin += String.fromCharCode(b);
const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const compact = `c${b64}`;
assert(compact.length >= 32_000, `compact len ${compact.length} should be huge`);
assert(isHugeCoordValue(compact), "fixture is huge");

const folded = foldToPageScopeCoord(compact);
const byteLen = 8;
let expect = 0n;
const slice = mag.subarray(mag.length - byteLen);
for (const b of slice) expect = (expect << 8n) | BigInt(b);
expect &= mask;
assert(folded === expect, `compact fold got ${folded} want ${expect}`);
assert(foldToPageScopeCoord(compact) === folded, "compact deterministic");

// Page-scale compact still folds via decode path (not huge).
const pageCompact = encodeCoordParam(1n << 40n);
assert(!isHugeCoordValue(pageCompact), "page compact not huge");
assert(
  foldToPageScopeCoord(pageCompact) === ((1n << 40n) & mask),
  "page compact fold",
);

// Folded result stays within signed i64 magnitude.
assert(folded <= mask && folded >= -mask, "folded in i64 magnitude");
assert(
  foldToPageScopeCoord(wide) <= mask,
  "wide fold magnitude ≤ I64_MAX",
);

console.log("fold-page-scope ok");
