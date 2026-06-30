// Canonical library dimensions (mirror src/lib.rs) and small lookup tables.

export const WALLS = 4;
export const SHELVES_PER_WALL = 5;
export const BOOKS_PER_SHELF = 35;
export const TOTAL_BOOKS = WALLS * SHELVES_PER_WALL * BOOKS_PER_SHELF; // 700

export const WINDOW_MAX = 50; // forget rendered nodes beyond this; trail keeps hashes
export const PAGES_PER_BOOK = 410;
export const LINES_PER_PAGE = 40;
export const CHARS_PER_LINE = 80;
export const PAGE_CHARS = (CHARS_PER_LINE + 1) * LINES_PER_PAGE; // chars + newline per line

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
