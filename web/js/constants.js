// Canonical library dimensions (mirror src/lib.rs) and small lookup tables.

export const WALLS = 4;
export const SHELVES_PER_WALL = 5;
export const BOOKS_PER_SHELF = 35;
export const TOTAL_BOOKS = WALLS * SHELVES_PER_WALL * BOOKS_PER_SHELF; // 700

export const WINDOW_MAX = 50; // forget rendered nodes beyond this; trail keeps hashes
export const PAGES_PER_BOOK = 410;
export const LINES_PER_PAGE = 40;
export const CHARS_PER_LINE = 80;
export const PAGE_CONTENT_SYMBOLS = LINES_PER_PAGE * CHARS_PER_LINE; // 3200 content chars
export const PAGE_CHARS = (CHARS_PER_LINE + 1) * LINES_PER_PAGE; // chars + newline per line
export const MAX_SEARCH_CHARS = PAGE_CONTENT_SYMBOLS * PAGES_PER_BOOK; // one full book

// i64 bounds, so big coordinate jumps stay in the lattice the WASM core accepts.
export const I64_MIN = -9223372036854775808n;
export const I64_MAX = 9223372036854775807n;

export const DB_NAME = "lib-of-babel";
export const STORE = "kv";

export const MOVE_ARROW = { 0: "◁", 1: "▷", 2: "▲", 3: "▼", null: "•", jump: "⤳" };

// alphabets mirror src/lib.rs; index spreads heatmap hues evenly
export const ALPHABETS = {
  25: "abcdefghijklmnopqrstuv ,.",
  29: "abcdefghijklmnopqrstuvwxyz ,.",
};

/** Human-readable allowed set, e.g. "a–v, space, comma, period". */
export function alphabetDescription(alphabetId = 29) {
  const alpha = ALPHABETS[alphabetId] || ALPHABETS[29];
  const letters = alpha.replace(/[, .]/g, "");
  const parts = [];
  if (letters.length) parts.push(`${letters[0]}–${letters[letters.length - 1]}`);
  if (alpha.includes(" ")) parts.push("space");
  if (alpha.includes(",")) parts.push("comma");
  if (alpha.includes(".")) parts.push("period");
  return parts.join(", ");
}
