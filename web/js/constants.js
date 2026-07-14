// Canonical library dimensions (mirror src/config.rs) and alphabet UI registry.
// Authoritative symbol tables live in Rust; this registry mirrors them for
// validation / picker / About without round-tripping through WASM.

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
export const TITLE_LEN = 24; // spine title length (mirror src/config.rs)

// i64 bounds, so big coordinate jumps stay in the lattice the WASM core accepts.
export const I64_MIN = -9223372036854775808n;
export const I64_MAX = 9223372036854775807n;

export const DB_NAME = "lib-of-babel";
export const STORE = "kv";

export const MOVE_ARROW = { 0: "◁", 1: "▷", 2: "▲", 3: "▼", null: "•", jump: "⤳" };

const AV = "abcdefghijklmnopqrstuv";
const AZ = "abcdefghijklmnopqrstuvwxyz";
const PUNCT = " ,.";

/** Digits + everyday punctuation — shared by Basile++ and Basile#. */
const BASILE_PLUS_EXTRAS = `?!'"-:;()0123456789`;
/** Email/URL staples layered on Basile++. */
const BASILE_HASH_EXTRAS = `${BASILE_PLUS_EXTRAS}@<>/_+[]#%&=`;

/**
 * Single registry mirroring `src/config.rs`.
 * `stem`: "av" (Borges) or "az"; `extras` appended before punctuation.
 * `id` is the permalink/Feistel key (usually glyph count; Italian/Romanian collide).
 * `native` — endonym; always shown in the picker (not UI-locale-translated).
 * `uiLocale` — optional chrome locale when this lens is active.
 */
export const ALPHABET_REGISTRY = [
  { id: 29, name: "Basile", native: "Basile", short: "a–z", group: "Latin base", stem: "az", extras: "" },
  {
    id: 48,
    name: "Basile++",
    native: "Basile++",
    short: "a–z+",
    group: "Latin base",
    stem: "az",
    extras: BASILE_PLUS_EXTRAS,
  },
  {
    id: 60,
    name: "Basile#",
    native: "Basile#",
    short: "a–z#",
    group: "Latin base",
    stem: "az",
    extras: BASILE_HASH_EXTRAS,
  },
  { id: 25, name: "Borges", native: "Borges", short: "a–v", group: "Latin base", stem: "av", extras: "" },
  { id: 35, name: "Spanish", native: "Español", short: "es", group: "Romance", stem: "az", extras: "áéíóúñ" },
  {
    id: 45,
    name: "French",
    native: "Français",
    short: "fr",
    group: "Romance",
    stem: "az",
    extras: "àâæçéèêëîïôœùûüÿ",
  },
  { id: 32, name: "Italian", native: "Italiano", short: "it", group: "Romance", stem: "az", extras: "àèéìòù" },
  {
    id: 41,
    name: "Portuguese",
    native: "Português",
    short: "pt",
    group: "Romance",
    stem: "az",
    extras: "áàâãçéêíóôõú",
  },
  { id: 36, name: "Romanian", native: "Română", short: "ro", group: "Romance", stem: "az", extras: "ăâîșț" },
  {
    id: 33,
    name: "German",
    native: "Deutsch",
    short: "de",
    group: "Germanic",
    stem: "az",
    extras: "äöüß",
    uiLocale: "de",
  },
  {
    id: 34,
    name: "Dutch",
    native: "Nederlands",
    short: "nl",
    group: "Germanic",
    stem: "az",
    extras: "éëïöü",
    uiLocale: "nl",
  },
  {
    id: 37,
    name: "Danish/Norwegian",
    native: "Norsk · Dansk",
    short: "da/no",
    group: "Germanic",
    stem: "az",
    extras: "æøå",
  },
  {
    id: 38,
    name: "Swedish",
    native: "Svenska",
    short: "sv",
    group: "Germanic",
    stem: "az",
    extras: "äöå",
  },
  {
    id: 40,
    name: "Finnish",
    native: "Suomi",
    short: "fi",
    group: "Uralic",
    stem: "az",
    extras: "åäö",
  },
  {
    id: 43,
    name: "Estonian",
    native: "Eesti",
    short: "et",
    group: "Uralic",
    stem: "az",
    extras: "õäöü",
  },
  {
    id: 44,
    name: "Hungarian",
    native: "Magyar",
    short: "hu",
    group: "Uralic",
    stem: "az",
    extras: "áéíóöőúüű",
  },
  {
    id: 39,
    name: "Turkish",
    native: "Türkçe",
    short: "tr",
    group: "Turkic",
    // Official 29-letter set (no q/w/x); full table, not a–z + extras.
    symbols: "abcçdefgğhıijklmnoöprsştuüvyz" + PUNCT,
    desc: "turkish letters (no q/w/x), space, comma, period",
  },
  {
    id: 46,
    name: "Greek",
    native: "Ελληνικά",
    short: "el",
    group: "Hellenic",
    // Monotonic modern Greek + final sigma + tonos vowels.
    symbols: "αβγδεζηθικλμνξοπρσςτυφχψωάέήίόύώ" + PUNCT,
    desc: "α–ω, άέήίόύώ, space, comma, period",
  },
  { id: 47, name: "Polish", native: "Polski", short: "pl", group: "Slavic", stem: "az", extras: "ąćęłńóśźż" },
  {
    id: 52,
    name: "Czech",
    native: "Čeština",
    short: "cs",
    group: "Slavic",
    stem: "az",
    extras: "áčďéěíňóřšťúůýž",
  },
  {
    id: 57,
    name: "Slovak",
    native: "Slovenčina",
    short: "sk",
    group: "Slavic",
    stem: "az",
    extras: "áäčďéíĺľňóôŕšťúýž",
  },
  {
    id: 42,
    name: "Croatian/Serbian",
    native: "Hrvatski · Srpski",
    short: "hr/sr",
    group: "Slavic",
    stem: "az",
    extras: "čćđšž",
  },
  {
    id: 54,
    name: "Russian",
    native: "Русский",
    short: "ru",
    group: "Slavic",
    symbols: "абвгдеёжзийклмнопрстуфхцчшщъыьэюя" + PUNCT,
    desc: "а–я (Cyrillic), space, comma, period",
  },
  {
    id: 55,
    name: "Ukrainian",
    native: "Українська",
    short: "uk",
    group: "Slavic",
    symbols: "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя" + PUNCT,
    desc: "Ukrainian Cyrillic, space, comma, period",
  },
  {
    id: 56,
    name: "Bulgarian",
    native: "Български",
    short: "bg",
    group: "Slavic",
    symbols: "абвгдежзийклмнопрстуфхцчшщъьюя" + PUNCT,
    desc: "Bulgarian Cyrillic, space, comma, period",
  },
  {
    id: 53,
    name: "Slovenian",
    native: "Slovenščina",
    short: "sl",
    group: "Slavic",
    stem: "az",
    extras: "čšž",
  },
  {
    id: 58,
    name: "Belarusian",
    native: "Беларуская",
    short: "be",
    group: "Slavic",
    symbols: "абвгдеёжзійклмнопрстуўфхцчшыьэюя" + PUNCT,
    desc: "Belarusian Cyrillic, space, comma, period",
  },
  {
    id: 59,
    name: "Macedonian",
    native: "Македонски",
    short: "mk",
    group: "Slavic",
    symbols: "абвгдѓежзѕијклљмнњопрстќуфхцчџш" + PUNCT,
    desc: "Macedonian Cyrillic, space, comma, period",
  },
  {
    id: 61,
    name: "Serbian Cyrillic",
    native: "Српски",
    short: "sr-Cyrl",
    group: "Slavic",
    symbols: "абвгдђежзијклљмнњопрстћуфхцчџш" + PUNCT,
    desc: "Serbian Cyrillic, space, comma, period",
  },
  {
    id: 49,
    name: "Icelandic",
    native: "Íslenska",
    short: "is",
    group: "Germanic",
    stem: "az",
    extras: "áéíóúýþæðö",
  },
  {
    id: 62,
    name: "Catalan",
    native: "Català",
    short: "ca",
    group: "Romance",
    stem: "az",
    extras: "àèéíïòóúüç·",
  },
  {
    id: 63,
    name: "Basque",
    native: "Euskara",
    short: "eu",
    group: "Basque",
    stem: "az",
    extras: "ñç",
  },
  {
    id: 64,
    name: "Welsh",
    native: "Cymraeg",
    short: "cy",
    group: "Celtic",
    stem: "az",
    extras: "âêîôûŵŷ",
  },
  {
    id: 65,
    name: "Irish",
    native: "Gaeilge",
    short: "ga",
    group: "Celtic",
    stem: "az",
    extras: "áéíóú",
  },
  {
    id: 66,
    name: "Maltese",
    native: "Malti",
    short: "mt",
    group: "Maltese",
    stem: "az",
    extras: "ċġħż",
  },
  {
    id: 50,
    name: "Latvian",
    native: "Latviešu",
    short: "lv",
    group: "Baltic",
    stem: "az",
    extras: "āčēģīķļņšūž",
  },
  {
    id: 51,
    name: "Lithuanian",
    native: "Lietuvių",
    short: "lt",
    group: "Baltic",
    stem: "az",
    extras: "ąčęėįšųūž",
  },
  {
    id: 31,
    name: "Albanian",
    native: "Shqip",
    short: "sq",
    group: "Albanian",
    stem: "az",
    extras: "çë",
  },
  {
    id: 67,
    name: "Armenian",
    native: "Հայերեն",
    short: "hy",
    group: "Caucasian",
    symbols: "աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ" + PUNCT,
    desc: "Eastern Armenian, space, comma, period",
  },
  {
    id: 68,
    name: "Georgian",
    native: "ქართული",
    short: "ka",
    group: "Caucasian",
    symbols: "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ" + PUNCT,
    desc: "Mkhedruli, space, comma, period",
  },
];

function stemLetters(stem) {
  return stem === "av" ? AV : AZ;
}

function symbolsOf(entry) {
  if (entry.symbols) return entry.symbols;
  return stemLetters(entry.stem) + (entry.extras || "") + PUNCT;
}

/** Trailing space / comma / period tiles in About. */
export function isTrailPunct(ch) {
  return ch === " " || ch === "," || ch === ".";
}

/** id → symbol string (for validation / colour map). */
export const ALPHABETS = Object.fromEntries(
  ALPHABET_REGISTRY.map((e) => [e.id, symbolsOf(e)]),
);

export const DEFAULT_ALPHABET_ID = 29;

/** Resolve a known alphabet string, else Basile. */
export function alphabetString(alphabetId = DEFAULT_ALPHABET_ID) {
  return ALPHABETS[alphabetId] || ALPHABETS[DEFAULT_ALPHABET_ID];
}

/** Registry row for an id (Basile fallback). */
export function alphabetEntry(alphabetId = DEFAULT_ALPHABET_ID) {
  return (
    ALPHABET_REGISTRY.find((e) => e.id === alphabetId) ||
    ALPHABET_REGISTRY.find((e) => e.id === DEFAULT_ALPHABET_ID)
  );
}

/** Human-readable allowed set for search validation copy. */
export function alphabetDescription(alphabetId = DEFAULT_ALPHABET_ID) {
  const entry = alphabetEntry(alphabetId);
  if (entry.desc) return entry.desc;
  const parts = [entry.stem === "av" ? "a–v" : "a–z"];
  if (entry.extras) parts.push(entry.extras);
  parts.push("space", "comma", "period");
  return parts.join(", ");
}

/** Compact lens label for wanderings rows. */
export function alphabetShortLabel(alphabetId = DEFAULT_ALPHABET_ID) {
  return alphabetEntry(alphabetId).short;
}

/** Verify / trail note — language name is always the endonym. */
export function formatAlphabetSymbolLabel(alphabetId = DEFAULT_ALPHABET_ID, tFn = null) {
  const entry = alphabetEntry(alphabetId);
  const n = [...alphabetString(alphabetId)].length;
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
    symbols: [...symbolsOf(e)],
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
};

export function alphabetFamilyRefs(group) {
  return ALPHABET_FAMILY_REFS[group] || [];
}

/** Populate `#alphabet` from the registry (optgroups by `group`). */
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
    // Endonym always — not the current UI locale's word for that language.
    opt.textContent = `${entry.short} · ${entry.native || entry.name}`;
    og.appendChild(opt);
  }
  select.value = want;
  if (select.value !== want) select.value = String(DEFAULT_ALPHABET_ID);
}
