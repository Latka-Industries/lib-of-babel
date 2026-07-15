// Lattice neighbor math (kept in JS to avoid BigInt/JSON round-trips through wasm).

import { I64_MIN, I64_MAX } from "./constants.js";

/** Lattice neighbor for move `mv`: 0=left, 1=right, 2=up, 3=down. */
export function neighbor(z, n, mv) {
  switch (mv) {
    case 0:
      return [z, n - 1n]; // left hallway
    case 1:
      return [z, n + 1n]; // right hallway
    case 2:
      return [z + 1n, n]; // stairs up
    default:
      return [z - 1n, n]; // stairs down
  }
}

/** Random `(z, n)` within safe i64 range for a new walk. */
export function randomCoord() {
  const buf = new BigInt64Array(2);
  crypto.getRandomValues(buf);
  // keep within a friendly range so the header stays readable
  return [buf[0] % 1_000_000_000n, buf[1] % 1_000_000_000n];
}

export const clampI64 = (v) => (v < I64_MIN ? I64_MIN : v > I64_MAX ? I64_MAX : v);
