// Render assets/sigils.svg from assets/sigils.json — a contact sheet of REAL
// gallery sigils for the README. The manifest is the source of truth: each tile
// carries the true node hash + hue (and a permalink) for an actual gallery.
//
// To refresh the manifest's hashes, recompute node_hash_hex(z, n, alphabet) for
// each tile in the browser (the WASM core), then re-run this to redraw the sheet:
//   node scripts/make-sigil-sheet.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sigilSvg } from "../web/js/sigil.js";

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "..", "assets");
const { tiles } = JSON.parse(readFileSync(join(assets, "sigils.json"), "utf8"));

const COLS = 6, CELL = 150, GAP = 12, PAD = 16;
const ROWS = Math.ceil(tiles.length / COLS);
const W = PAD * 2 + COLS * CELL + (COLS - 1) * GAP;
const H = PAD * 2 + ROWS * CELL + (ROWS - 1) * GAP;

let cells = "";
tiles.forEach((t, i) => {
  const col = i % COLS, row = (i / COLS) | 0;
  const x = PAD + col * (CELL + GAP);
  const y = PAD + row * (CELL + GAP);
  // strip the renderer's outer <svg> wrapper and re-emit as a positioned tile
  const inner = sigilSvg(t.hash, t.hue).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  cells +=
    `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="8" fill="#141318" stroke="#2a2832"/>` +
    `<svg x="${x}" y="${y}" width="${CELL}" height="${CELL}" viewBox="0 0 100 100">${inner}</svg>`;
});

const out =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="#0b0b0d"/>${cells}</svg>\n`;

writeFileSync(join(assets, "sigils.svg"), out);
console.log(`wrote assets/sigils.svg (${W}x${H}, ${tiles.length} real galleries)`);
