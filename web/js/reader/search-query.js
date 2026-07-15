// Alphabet-cell search query helpers (segment / validate / flatten).

import { alphabetCells, DEFAULT_ALPHABET_ID } from "../lib/constants.js";

/** Lowercase only — punctuation is not auto-corrected. */
export function normalizeSearchQuery(text) {
  return text.toLowerCase();
}

/** Longest alphabet cell that is a prefix of `text` from `from`. */
export function matchCellAt(cells, text, from) {
  const rest = text.slice(from);
  if (!rest) return null;
  let best = null;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (rest.startsWith(cell) && (!best || cell.length > best.cell.length)) {
      best = { index: i, cell };
    }
  }
  return best;
}

/**
 * Walk text as alphabet cells (newlines skipped).
 * `onCell(cell)` and `onInvalid(i, sample)` — return false from either to stop.
 */
function walkCells(text, alphabetId, { onCell, onInvalid } = {}) {
  const cells = alphabetCells(alphabetId);
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\n" || ch === "\r") {
      i += 1;
      continue;
    }
    const m = matchCellAt(cells, text, i);
    if (!m) {
      const sample = String.fromCodePoint(text.codePointAt(i));
      if (onInvalid?.(i, sample) === false) return;
      i += sample.length;
      continue;
    }
    if (onCell?.(m.cell) === false) return;
    i += m.cell.length;
  }
}

/** Segment text into registered alphabet cells (newlines skipped). */
export function segmentText(text, alphabetId = DEFAULT_ALPHABET_ID) {
  const out = [];
  let invalidAt = -1;
  let sample = null;
  walkCells(text, alphabetId, {
    onCell: (cell) => {
      out.push(cell);
    },
    onInvalid: (i, s) => {
      invalidAt = i;
      sample = s;
      return false;
    },
  });
  return { cells: out, invalidAt, sample };
}

/** Find spans outside the active alphabet. Returns `{ i, ch }` (string index + sample). */
export function validateSearchQuery(text, alphabetId = DEFAULT_ALPHABET_ID) {
  const invalid = [];
  walkCells(text, alphabetId, {
    onInvalid: (i, ch) => {
      invalid.push({ i, ch });
    },
  });
  return invalid;
}

/** Flatten search text for chunking — must match Rust flatten_to_cells. */
export function flattenSearchQuery(text, alphabetId = DEFAULT_ALPHABET_ID) {
  const invalid = validateSearchQuery(text, alphabetId);
  if (invalid.length) {
    throw new Error(
      `invalid character${invalid.length > 1 ? "s" : ""} for this alphabet`,
    );
  }
  let out = "";
  walkCells(text, alphabetId, {
    onCell: (cell) => {
      if (cell === " " && out.endsWith(" ")) return;
      out += cell;
    },
  });
  return out.trim();
}
