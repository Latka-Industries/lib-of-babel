// Canonical library dimensions (mirror src/config/) and alphabet UI registry.
// Glyph inventories come from WASM after init — Rust `src/config` is authoritative.
// This file keeps UI metadata only (names, groups, rtl/script/lang).

import { alphabet_symbols_json } from "./wasm.js";

export const WALLS = 4;
export const SHELVES_PER_WALL = 5;
export const BOOKS_PER_SHELF = 35;
export const TOTAL_BOOKS = WALLS * SHELVES_PER_WALL * BOOKS_PER_SHELF; // 700

/** Wanderings popup: last N trail steps. Full trail is unbounded (IndexedDB). */
export const WINDOW_MAX = 500;
export const PAGES_PER_BOOK = 410;
export const LINES_PER_PAGE = 40;
export const CHARS_PER_LINE = 80;
export const PAGE_CONTENT_SYMBOLS = LINES_PER_PAGE * CHARS_PER_LINE; // 3200 content chars
export const PAGE_CHARS = (CHARS_PER_LINE + 1) * LINES_PER_PAGE; // chars + newline per line
export const MAX_SEARCH_CHARS = PAGE_CONTENT_SYMBOLS * PAGES_PER_BOOK; // one full book
export const TITLE_LEN = 24; // spine title length (mirror src/config/)

// i64 bounds, so big coordinate jumps stay in the lattice the WASM core accepts.
export const I64_MIN = -9223372036854775808n;
export const I64_MAX = 9223372036854775807n;

export const DB_NAME = "lib-of-babel";
export const STORE = "kv";

export const MOVE_ARROW = { 0: "◁", 1: "▷", 2: "▲", 3: "▼", null: "•", jump: "⤳" };

/**
 * UI metadata for built-in lenses. Glyph cells: `alphabetCells(id)` → WASM.
 * `id` is the permalink/Feistel key (usually glyph count; some ids stay frozen after growth).
 * `native` — endonym; always shown in the picker (not UI-locale-translated).
 * `uiLocale` — optional chrome locale when this lens is active.
 * `rtl` / `script` / `lang` — presentation hints.
 */
export const ALPHABET_REGISTRY = [
  { id: 29, name: "Basile", native: "Basile", short: "a–z", group: "Latin base" },
  { id: 48, name: "Basile++", native: "Basile++", short: "a–z+", group: "Latin base" },
  { id: 60, name: "Basile#", native: "Basile#", short: "a–z#", group: "Latin base" },
  { id: 25, name: "Borges", native: "Borges", short: "a–v", group: "Latin base" },
  { id: 35, name: "Spanish", native: "Español", short: "es", group: "Romance" },
  { id: 45, name: "French", native: "Français", short: "fr", group: "Romance" },
  { id: 32, name: "Italian", native: "Italiano", short: "it", group: "Romance" },
  { id: 41, name: "Portuguese", native: "Português", short: "pt", group: "Romance" },
  { id: 36, name: "Romanian", native: "Română", short: "ro", group: "Romance" },
  { id: 33, name: "German", native: "Deutsch", short: "de", group: "Germanic", uiLocale: "de" },
  { id: 34, name: "Dutch", native: "Nederlands", short: "nl", group: "Germanic", uiLocale: "nl" },
  { id: 37, name: "Danish/Norwegian", native: "Norsk · Dansk", short: "da/no", group: "Germanic" },
  { id: 38, name: "Swedish", native: "Svenska", short: "sv", group: "Germanic" },
  { id: 40, name: "Finnish", native: "Suomi", short: "fi", group: "Uralic" },
  { id: 43, name: "Estonian", native: "Eesti", short: "et", group: "Uralic" },
  { id: 44, name: "Hungarian", native: "Magyar", short: "hu", group: "Uralic" },
  {
    id: 39,
    name: "Turkish",
    native: "Türkçe",
    short: "tr",
    group: "Turkic",
    desc: "turkish letters (no q/w/x), space, comma, period",
  },
  {
    id: 46,
    name: "Greek",
    native: "Ελληνικά",
    short: "el",
    group: "Hellenic",
    desc: "α–ω, άέήίόύώ, space, comma, period",
  },
  { id: 47, name: "Polish", native: "Polski", short: "pl", group: "Slavic" },
  { id: 52, name: "Czech", native: "Čeština", short: "cs", group: "Slavic" },
  { id: 57, name: "Slovak", native: "Slovenčina", short: "sk", group: "Slavic" },
  { id: 42, name: "Croatian/Serbian", native: "Hrvatski · Srpski", short: "hr/sr", group: "Slavic" },
  {
    id: 54,
    name: "Russian",
    native: "Русский",
    short: "ru",
    group: "Slavic",
    desc: "а–я (Cyrillic), space, comma, period",
  },
  {
    id: 55,
    name: "Ukrainian",
    native: "Українська",
    short: "uk",
    group: "Slavic",
    desc: "Ukrainian Cyrillic, space, comma, period",
  },
  {
    id: 56,
    name: "Bulgarian",
    native: "Български",
    short: "bg",
    group: "Slavic",
    desc: "Bulgarian Cyrillic, space, comma, period",
  },
  { id: 53, name: "Slovenian", native: "Slovenščina", short: "sl", group: "Slavic" },
  {
    id: 58,
    name: "Belarusian",
    native: "Беларуская",
    short: "be",
    group: "Slavic",
    desc: "Belarusian Cyrillic, space, comma, period",
  },
  {
    id: 59,
    name: "Macedonian",
    native: "Македонски",
    short: "mk",
    group: "Slavic",
    desc: "Macedonian Cyrillic, space, comma, period",
  },
  {
    id: 61,
    name: "Serbian Cyrillic",
    native: "Српски",
    short: "sr-Cyrl",
    group: "Slavic",
    desc: "Serbian Cyrillic, space, comma, period",
  },
  { id: 49, name: "Icelandic", native: "Íslenska", short: "is", group: "Germanic" },
  { id: 62, name: "Catalan", native: "Català", short: "ca", group: "Romance" },
  { id: 63, name: "Basque", native: "Euskara", short: "eu", group: "Basque" },
  { id: 64, name: "Welsh", native: "Cymraeg", short: "cy", group: "Celtic" },
  { id: 65, name: "Irish", native: "Gaeilge", short: "ga", group: "Celtic" },
  { id: 66, name: "Maltese", native: "Malti", short: "mt", group: "Maltese" },
  { id: 50, name: "Latvian", native: "Latviešu", short: "lv", group: "Baltic" },
  { id: 51, name: "Lithuanian", native: "Lietuvių", short: "lt", group: "Baltic" },
  { id: 31, name: "Albanian", native: "Shqip", short: "sq", group: "Albanian" },
  {
    id: 67,
    name: "Armenian",
    native: "Հայերեն",
    short: "hy",
    group: "Caucasian",
    desc: "Eastern Armenian, space, comma, period",
  },
  {
    id: 68,
    name: "Georgian",
    native: "ქართული",
    short: "ka",
    group: "Caucasian",
    desc: "Mkhedruli, space, comma, period",
  },
  {
    id: 30,
    name: "Hebrew",
    native: "\u05e2\u05d1\u05e8\u05d9\u05ea",
    short: "he",
    group: "Semitic",
    rtl: true,
    script: "hebrew",
  },
  {
    id: 69,
    name: "Arabic",
    native: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
    short: "ar",
    group: "Semitic",
    rtl: true,
    script: "arabic",
  },
  {
    id: 70,
    name: "Persian",
    native: "\u0641\u0627\u0631\u0633\u06cc",
    short: "fa",
    group: "Semitic",
    rtl: true,
    script: "arabic",
  },
  {
    id: 71,
    name: "N'Ko",
    native: "\u07d2\u07de\u07cf",
    short: "nqo",
    group: "West African",
    rtl: true,
    script: "nko",
  },
  {
    id: 234,
    name: "Amharic",
    native: "\u12a0\u121b\u122d\u129b",
    short: "am",
    group: "Ethiopic",
    rtl: false,
    script: "ethiopic",
  },
  {
    id: 72,
    name: "Swahili",
    native: "Kiswahili",
    short: "sw",
    group: "African Latin",
    rtl: false,
    script: "latin",
  },
  {
    id: 73,
    name: "Afrikaans",
    native: "Afrikaans",
    short: "af",
    group: "African Latin",
    rtl: false,
    script: "latin",
  },
  {
    id: 74,
    name: "Hausa",
    native: "Hausa",
    short: "ha",
    group: "African Latin",
    rtl: false,
    script: "latin",
  },
  {
    id: 75,
    name: "Yoruba",
    native: "Yor\u00f9b\u00e1",
    short: "yo",
    group: "African Latin",
    rtl: false,
    script: "latin",
  },
  {
    id: 76,
    name: "Igbo",
    native: "Igbo",
    short: "ig",
    group: "African Latin",
    rtl: false,
    script: "latin",
  },
  {
    id: 77,
    name: "Wolof",
    native: "Wolof",
    short: "wo",
    group: "African Latin",
    rtl: false,
    script: "latin",
  },
  {
    id: 78,
    name: "Tifinagh",
    native: "\u2d5c\u2d49\u2d3c\u2d49\u2d4f\u2d30\u2d56",
    short: "zgh",
    group: "Berber",
    rtl: false,
    script: "tifinagh",
  },
  {
    id: 95,
    name: "Japanese",
    native: "日本語",
    short: "ja",
    group: "CJK",
    rtl: false,
    script: "japanese",
    lang: "ja",
  },
  {
    id: 250,
    name: "Korean",
    native: "한국어",
    short: "ko",
    group: "CJK",
    rtl: false,
    script: "hangul",
    lang: "ko",
  },
  {
    id: 255,
    name: "Chinese (Simplified)",
    native: "简体中文",
    short: "zh-Hans",
    group: "CJK",
    rtl: false,
    script: "han",
    lang: "zh-Hans",
  },
  {
    id: 1000,
    name: "Chinese (Traditional)",
    native: "繁體中文",
    short: "zh-Hant",
    group: "CJK",
    rtl: false,
    script: "hant",
    lang: "zh-Hant",
  },
  {
    id: 99,
    name: "Hindi",
    native: "हिन्दी",
    short: "hi",
    group: "Indic",
    rtl: false,
    script: "devanagari",
    lang: "hi",
  },
  {
    id: 100,
    name: "Bengali",
    native: "বাংলা",
    short: "bn",
    group: "Indic",
    rtl: false,
    script: "bengali",
    lang: "bn",
  },
  {
    id: 101,
    name: "Tamil",
    native: "தமிழ்",
    short: "ta",
    group: "Indic",
    rtl: false,
    script: "tamil",
    lang: "ta",
  },
  {
    id: 102,
    name: "Telugu",
    native: "తెలుగు",
    short: "te",
    group: "Indic",
    rtl: false,
    script: "telugu",
    lang: "te",
  },
  {
    id: 103,
    name: "Kannada",
    native: "ಕನ್ನಡ",
    short: "kn",
    group: "Indic",
    rtl: false,
    script: "kannada",
    lang: "kn",
  },
  {
    id: 104,
    name: "Malayalam",
    native: "മലയാളം",
    short: "ml",
    group: "Indic",
    rtl: false,
    script: "malayalam",
    lang: "ml",
  },
  {
    id: 105,
    name: "Gujarati",
    native: "ગુજરાતી",
    short: "gu",
    group: "Indic",
    rtl: false,
    script: "gujarati",
    lang: "gu",
  },
  {
    id: 106,
    name: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    short: "pa",
    group: "Indic",
    rtl: false,
    script: "gurmukhi",
    lang: "pa",
  },
  {
    id: 107,
    name: "Odia",
    native: "ଓଡ଼ିଆ",
    short: "or",
    group: "Indic",
    rtl: false,
    script: "oriya",
    lang: "or",
  },
  {
    id: 88,
    name: "Azerbaijani",
    native: "Azərbaycan",
    short: "az",
    group: "Turkic",
    script: "latin",
    lang: "az",
  },
  {
    id: 89,
    name: "Kazakh",
    native: "Qazaqşa",
    short: "kk",
    group: "Turkic",
    script: "latin",
    lang: "kk",
  },
  {
    id: 90,
    name: "Uzbek",
    native: "Oʻzbekcha",
    short: "uz",
    group: "Turkic",
    script: "latin",
    lang: "uz",
  },
  {
    id: 91,
    name: "Turkmen",
    native: "Türkmençe",
    short: "tk",
    group: "Turkic",
    script: "latin",
    lang: "tk",
  },
  { id: 92, name: "Kyrgyz", native: "Кыргызча", short: "ky", group: "Turkic" },
  { id: 93, name: "Mongolian", native: "Монгол", short: "mn", group: "Mongolic" },
  {
    id: 94,
    name: "Filipino",
    native: "Filipino",
    short: "fil",
    group: "Southeast Asian",
    script: "latin",
    lang: "fil",
  },
  {
    id: 96,
    name: "Vietnamese",
    native: "Tiếng Việt",
    short: "vi",
    group: "Southeast Asian",
    script: "latin",
    lang: "vi",
  },
  {
    id: 108,
    name: "Thai",
    native: "ไทย",
    short: "th",
    group: "Southeast Asian",
    rtl: false,
    script: "thai",
    lang: "th",
  },
  {
    id: 109,
    name: "Khmer",
    native: "ខ្មែរ",
    short: "km",
    group: "Southeast Asian",
    rtl: false,
    script: "khmer",
    lang: "km",
  },
];

/** Trailing space / comma / period tiles in About. */
export function isTrailPunct(ch) {
  return ch === " " || ch === "," || ch === ".";
}

export const DEFAULT_ALPHABET_ID = 29;

/** Cached Feistel cells from WASM (authoritative — see src/config/). */
const cellCache = new Map();

/** Resolve known alphabet cells via WASM (Basile fallback inside core). Call after init(). */
export function alphabetCells(alphabetId = DEFAULT_ALPHABET_ID) {
  const id = Number(alphabetId);
  if (!cellCache.has(id)) {
    cellCache.set(id, JSON.parse(alphabet_symbols_json(id)));
  }
  return cellCache.get(id);
}

/** Concatenated alphabet string (legacy helpers; prefer alphabetCells). */
export function alphabetString(alphabetId = DEFAULT_ALPHABET_ID) {
  return alphabetCells(alphabetId).join("");
}

/** Registry row for an id (Basile fallback). */
export function alphabetEntry(alphabetId = DEFAULT_ALPHABET_ID) {
  return (
    ALPHABET_REGISTRY.find((e) => e.id === alphabetId) ||
    ALPHABET_REGISTRY.find((e) => e.id === DEFAULT_ALPHABET_ID)
  );
}

/** True when the lens reads right-to-left (Arabic, Hebrew, N’Ko, …). */
export function alphabetIsRtl(alphabetId = DEFAULT_ALPHABET_ID) {
  return !!alphabetEntry(alphabetId).rtl;
}

/** Font-cascade key: latin | arabic | hebrew | nko | ethiopic | tifinagh | japanese | hangul | han | hant | thai | khmer | Indic scripts. */
export function alphabetScript(alphabetId = DEFAULT_ALPHABET_ID) {
  return alphabetEntry(alphabetId).script || "latin";
}

/** BCP-47 lang hint for shaping (falls back to short code). */
export function alphabetLang(alphabetId = DEFAULT_ALPHABET_ID) {
  const e = alphabetEntry(alphabetId);
  return e.lang || e.short || "en";
}

/**
 * Apply lens presentation to the document: script font + (optional) page dir helpers.
 * Call after alphabet changes and on boot.
 */
export function syncAlphabetPresentation(alphabetId = DEFAULT_ALPHABET_ID) {
  const script = alphabetScript(alphabetId);
  const rtl = alphabetIsRtl(alphabetId);
  const lang = alphabetLang(alphabetId);
  document.documentElement.dataset.script = script;
  return { script, rtl, lang };
}

/** Human-readable allowed set for search validation copy. */
export function alphabetDescription(alphabetId = DEFAULT_ALPHABET_ID) {
  const entry = alphabetEntry(alphabetId);
  if (entry.desc) return entry.desc;
  const n = alphabetCells(alphabetId).length;
  return `${entry.short || entry.name} (${n} glyphs)`;
}

/** Compact lens label for wanderings rows. */
export function alphabetShortLabel(alphabetId = DEFAULT_ALPHABET_ID) {
  return alphabetEntry(alphabetId).short;
}

/** Verify / trail note — language name is always the endonym. */
export function formatAlphabetSymbolLabel(alphabetId = DEFAULT_ALPHABET_ID, tFn = null) {
  const entry = alphabetEntry(alphabetId);
  const n = alphabetCells(alphabetId).length;
  const name = entry.native || entry.name;
  if (tFn) return tFn("alphabet.symbolLabel", { name, n });
  return `${name} · ${n} glyphs`;
}

/** Built-in lenses in picker order — for About / docs. */
export function listAlphabets() {
  return ALPHABET_REGISTRY.map((e) => ({
    id: e.id,
    native: e.native || e.name,
    group: e.group,
    uiLocale: e.uiLocale || null,
    script: e.script || "latin",
    lang: e.lang || e.short || "en",
    symbols: alphabetCells(e.id),
  }));
}

/**
 * External overview links for About blurbs (mostly English Wikipedia).
 * Not exhaustive scholarship — starting points for the history claims on each shelf.
 * @type {Record<string, { href: string, title: string }[]>}
 */
export const ALPHABET_FAMILY_REFS = {
  "Latin base": [
    {
      href: "https://en.wikipedia.org/wiki/The_Library_of_Babel",
      title: "The Library of Babel (Borges)",
    },
    {
      href: "https://libraryofbabel.info/",
      title: "libraryofbabel.info (Basile)",
    },
  ],
  Romance: [
    {
      href: "https://en.wikipedia.org/wiki/Romance_languages",
      title: "Romance languages",
    },
    {
      href: "https://en.wikipedia.org/wiki/Latin_alphabet",
      title: "Latin alphabet",
    },
  ],
  Germanic: [
    {
      href: "https://en.wikipedia.org/wiki/Germanic_languages",
      title: "Germanic languages",
    },
    {
      href: "https://en.wikipedia.org/wiki/Runes",
      title: "Runes",
    },
  ],
  Uralic: [
    {
      href: "https://en.wikipedia.org/wiki/Uralic_languages",
      title: "Uralic languages",
    },
  ],
  Turkic: [
    {
      href: "https://en.wikipedia.org/wiki/Turkish_alphabet",
      title: "Turkish alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Letter_Revolution",
      title: "Letter Revolution (1928)",
    },
    {
      href: "https://en.wikipedia.org/wiki/Turkic_languages",
      title: "Turkic languages",
    },
    {
      href: "https://en.wikipedia.org/wiki/Latinisation_in_the_Soviet_Union",
      title: "Latinisation in the Soviet Union",
    },
  ],
  Hellenic: [
    {
      href: "https://en.wikipedia.org/wiki/Greek_alphabet",
      title: "Greek alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Greek_orthography",
      title: "Greek orthography (monotonic)",
    },
  ],
  Slavic: [
    {
      href: "https://en.wikipedia.org/wiki/Cyrillic_script",
      title: "Cyrillic script",
    },
    {
      href: "https://en.wikipedia.org/wiki/Glagolitic_script",
      title: "Glagolitic script",
    },
    {
      href: "https://en.wikipedia.org/wiki/Gaj%27s_Latin_alphabet",
      title: "Gaj’s Latin alphabet",
    },
  ],
  Baltic: [
    {
      href: "https://en.wikipedia.org/wiki/Baltic_languages",
      title: "Baltic languages",
    },
  ],
  Albanian: [
    {
      href: "https://en.wikipedia.org/wiki/Albanian_alphabet",
      title: "Albanian alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Congress_of_Manastir",
      title: "Congress of Manastir (1908)",
    },
  ],
  Celtic: [
    {
      href: "https://en.wikipedia.org/wiki/Celtic_languages",
      title: "Celtic languages",
    },
    {
      href: "https://en.wikipedia.org/wiki/Ogham",
      title: "Ogham",
    },
  ],
  Basque: [
    {
      href: "https://en.wikipedia.org/wiki/Basque_language",
      title: "Basque language",
    },
    {
      href: "https://en.wikipedia.org/wiki/Basque_alphabet",
      title: "Basque alphabet",
    },
  ],
  Maltese: [
    {
      href: "https://en.wikipedia.org/wiki/Maltese_language",
      title: "Maltese language",
    },
    {
      href: "https://en.wikipedia.org/wiki/Maltese_alphabet",
      title: "Maltese alphabet",
    },
  ],
  Caucasian: [
    {
      href: "https://en.wikipedia.org/wiki/Armenian_alphabet",
      title: "Armenian alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Georgian_scripts",
      title: "Georgian scripts",
    },
  ],
  Semitic: [
    {
      href: "https://en.wikipedia.org/wiki/Hebrew_alphabet",
      title: "Hebrew alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Arabic_alphabet",
      title: "Arabic alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Persian_alphabet",
      title: "Persian alphabet",
    },
  ],
  "West African": [
    {
      href: "https://en.wikipedia.org/wiki/N%27Ko_script",
      title: "N’Ko script",
    },
  ],
  Ethiopic: [
    {
      href: "https://en.wikipedia.org/wiki/Ge%CA%BDez_script",
      title: "Geʿez script",
    },
    {
      href: "https://en.wikipedia.org/wiki/Amharic",
      title: "Amharic",
    },
  ],
  "African Latin": [
    {
      href: "https://en.wikipedia.org/wiki/African_reference_alphabet",
      title: "African reference alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Latin_script_in_Africa",
      title: "Latin script in Africa",
    },
  ],
  Berber: [
    {
      href: "https://en.wikipedia.org/wiki/Tifinagh",
      title: "Tifinagh",
    },
  ],
  CJK: [
    {
      href: "https://en.wikipedia.org/wiki/Kana",
      title: "Kana",
    },
    {
      href: "https://en.wikipedia.org/wiki/Hangul",
      title: "Hangul",
    },
    {
      href: "https://en.wikipedia.org/wiki/Simplified_Chinese_characters",
      title: "Simplified Chinese characters",
    },
    {
      href: "https://lingua.mtsu.edu/chinese-computing/statistics/char/list.php?Which=MO",
      title: "Jun Da Chinese character frequency (modern)",
    },
  ],
  Indic: [
    {
      href: "https://en.wikipedia.org/wiki/Brahmic_scripts",
      title: "Brahmic scripts",
    },
    {
      href: "https://en.wikipedia.org/wiki/Devanagari",
      title: "Devanagari",
    },
    {
      href: "https://en.wikipedia.org/wiki/Languages_of_India",
      title: "Languages of India",
    },
  ],
  Mongolic: [
    {
      href: "https://en.wikipedia.org/wiki/Mongolian_Cyrillic_alphabet",
      title: "Mongolian Cyrillic alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Mongolic_languages",
      title: "Mongolic languages",
    },
  ],
  "Southeast Asian": [
    {
      href: "https://en.wikipedia.org/wiki/Thai_script",
      title: "Thai script",
    },
    {
      href: "https://en.wikipedia.org/wiki/Khmer_script",
      title: "Khmer script",
    },
    {
      href: "https://en.wikipedia.org/wiki/Vietnamese_alphabet",
      title: "Vietnamese alphabet",
    },
    {
      href: "https://en.wikipedia.org/wiki/Filipino_alphabet",
      title: "Filipino alphabet",
    },
  ],
};

export function alphabetFamilyRefs(group) {
  return ALPHABET_FAMILY_REFS[group] || [];
}

/** @deprecated Header uses the alphabet picker dialog; kept for any stray callers. */
export function fillAlphabetSelect(select, selectedId = DEFAULT_ALPHABET_ID, t = (k) => k) {
  if (!select) return;
  const want = String(selectedId);
  select.replaceChildren();
  const groups = new Map();
  for (const entry of ALPHABET_REGISTRY) {
    let og = groups.get(entry.group);
    if (!og) {
      og = document.createElement("optgroup");
      og.label = t(`alphabet.group.${entry.group}`);
      groups.set(entry.group, og);
      select.appendChild(og);
    }
    const opt = document.createElement("option");
    opt.value = String(entry.id);
    opt.textContent = `${entry.short} · ${entry.native || entry.name}`;
    og.appendChild(opt);
  }
  select.value = want;
  if (select.value !== want) select.value = String(DEFAULT_ALPHABET_ID);
}
