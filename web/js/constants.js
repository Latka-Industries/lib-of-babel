// Canonical library dimensions (mirror src/config/) and alphabet UI registry.
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
export const TITLE_LEN = 24; // spine title length (mirror src/config/)

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

/** Hiragana gojūon (ゐ/ゑ omitted); katakāna is +0x60 — keep in sync with Rust `kana_gojuon!`. */
const HIRAGANA_GOJUON =
  "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";

function katakānaFromHiragana(hira) {
  return [...hira]
    .map((ch) => String.fromCodePoint(ch.codePointAt(0) + 0x60))
    .join("");
}

const JAPANESE_SYMBOLS =
  HIRAGANA_GOJUON + katakānaFromHiragana(HIRAGANA_GOJUON) + PUNCT;

/**
 * Single registry mirroring `src/config/` (`ALPHABET_ID` + `ALPHABET_TABLE`).
 * `stem`: "av" (Borges) or "az"; `extras` appended before punctuation.
 * `id` is the permalink/Feistel key (usually glyph count; Italian/Romanian collide).
 * `native` — endonym; always shown in the picker (not UI-locale-translated).
 * `uiLocale` — optional chrome locale when this lens is active.
 * `rtl` — page/search direction; `script` — font cascade key (arabic/hebrew/…).
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
  {
    id: 30,
    name: "Hebrew",
    native: "\u05e2\u05d1\u05e8\u05d9\u05ea",
    short: "he",
    group: "Semitic",
    rtl: true,
    script: "hebrew",
    symbols: "אבגדהוזחטיךכלםמןנסעףפץצקרשת ,.",
  },
  {
    id: 69,
    name: "Arabic",
    native: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
    short: "ar",
    group: "Semitic",
    rtl: true,
    script: "arabic",
    symbols: "ابتثجحخدذرزسشصضطظعغفقكلمنهويء ,.",
  },
  {
    id: 70,
    name: "Persian",
    native: "\u0641\u0627\u0631\u0633\u06cc",
    short: "fa",
    group: "Semitic",
    rtl: true,
    script: "arabic",
    symbols: "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنهویء ,.",
  },
  {
    id: 71,
    name: "N'Ko",
    native: "\u07d2\u07de\u07cf",
    short: "nqo",
    group: "West African",
    rtl: true,
    script: "nko",
    symbols: "ߊߋߌߍߎߏߐߑߒߓߔߕߖߗߘߙߚߛߜߝߞߟߠߡߢߣߤߥߦߧߨߩߪ ,.",
  },
  {
    id: 234,
    name: "Amharic",
    native: "\u12a0\u121b\u122d\u129b",
    short: "am",
    group: "Ethiopic",
    rtl: false,
    script: "ethiopic",
    symbols: "ሀሁሂሃሄህሆለሉሊላሌልሎሐሑሒሓሔሕሖመሙሚማሜምሞሠሡሢሣሤሥሦረሩሪራሬርሮሰሱሲሳሴስሶሸሹሺሻሼሽሾቀቁቂቃቄቅቆበቡቢባቤብቦተቱቲታቴትቶቸቹቺቻቼችቾኀኁኂኃኄኅኆነኑኒናኔንኖኘኙኚኛኜኝኞአኡኢኣኤእኦከኩኪካኬክኮኸኹኺኻኼኽኾወዉዊዋዌውዎዐዑዒዓዔዕዖዘዙዚዛዜዝዞዠዡዢዣዤዥዦየዩዪያዬይዮደዱዲዳዴድዶጀጁጂጃጄጅጆገጉጊጋጌግጎጠጡጢጣጤጥጦጨጩጪጫጬጭጮጰጱጲጳጴጵጶጸጹጺጻጼጽጾፀፁፂፃፄፅፆፈፉፊፋፌፍፎፐፑፒፓፔፕፖ ,.",
  },
  {
    id: 72,
    name: "Swahili",
    native: "Kiswahili",
    short: "sw",
    group: "African Latin",
    rtl: false,
    script: "latin",
    symbols: "abcdefghijklmnopqrstuvwxyz ,.",
  },
  {
    id: 73,
    name: "Afrikaans",
    native: "Afrikaans",
    short: "af",
    group: "African Latin",
    rtl: false,
    script: "latin",
    symbols: "abcdefghijklmnopqrstuvwxyzáäéêëèíîïóôöúûüý ,.",
  },
  {
    id: 74,
    name: "Hausa",
    native: "Hausa",
    short: "ha",
    group: "African Latin",
    rtl: false,
    script: "latin",
    symbols: "abcdefghijklmnopqrstuvwxyzɓɗƙƴ ,.",
  },
  {
    id: 75,
    name: "Yoruba",
    native: "Yor\u00f9b\u00e1",
    short: "yo",
    group: "African Latin",
    rtl: false,
    script: "latin",
    symbols: "abcdefghijklmnopqrstuvwxyzẹọṣáàéèíìóòúù ,.",
  },
  {
    id: 76,
    name: "Igbo",
    native: "Igbo",
    short: "ig",
    group: "African Latin",
    rtl: false,
    script: "latin",
    symbols: "abcdefghijklmnopqrstuvwxyzịñọụ ,.",
  },
  {
    id: 77,
    name: "Wolof",
    native: "Wolof",
    short: "wo",
    group: "African Latin",
    rtl: false,
    script: "latin",
    symbols: "abcdefghijklmnopqrstuvwxyzëñàéó ,.",
  },
  {
    id: 78,
    name: "Tifinagh",
    native: "\u2d5c\u2d49\u2d3c\u2d49\u2d4f\u2d30\u2d56",
    short: "zgh",
    group: "Berber",
    rtl: false,
    script: "tifinagh",
    symbols: "ⴰⴱⴲⴳⴴⴵⴶⴷⴸⴹⴺⴻⴼⴽⴾⴿⵀⵁⵂⵃⵄⵅⵆⵇⵈⵉⵊⵋⵌⵍⵎⵏⵐⵑⵒⵓⵔⵕⵖⵗⵘⵙⵚⵛⵜⵝⵞⵟⵠⵡⵢⵣⵤⵥ ,.",
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
    symbols: JAPANESE_SYMBOLS,
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
    symbols: '이요어아가그지는다고하에을니있리게거나야해은도기서한내사들말자를로안만네마라의제신우시여일수면데보없래알무당전대저스오할했것건정죠으었난모너좋생인세겠까러않주구같상람려았장걸부때미와금습렇런진더좀소든각왜잘간실돼문못뭐드바예죽잖히누되분음위두날르비럼군봐님테디슨랑원치적워버물중찮괜직계조엄린터동번떻싶줄방냥과선녀남른필빠트얘냐살집입화명발속운단찾친심맞넌합왔처크됐애약작감던레경차유잠돌늘많머식관피얼연결갈길행될릴줘타영새프파녕희언몰놈된공져짜올받절근름술씨먹긴확응루체혼개온겁불성카곳달봤통 ,.',
  },
  {
    id: 255,
    name: "Chinese",
    native: "中文",
    short: "zh",
    group: "CJK",
    rtl: false,
    script: "han",
    lang: "zh-Hans",
    symbols: '的一是不了在人有我他这个们中来上大为和国地到以说时要就出会可也你对生能而子那得于着下自之年过发后作里用道行所然家种事成方多经么去法学如都同现当没动面起看定天分还进好小部其些主样理心她本前开但因只从想实日军者意无力它与长把机十民第公此已工使情明性知全三又关点正业外将两高间由问很最重并物手应战向头文体政美相见被利什二等产或新己制身果加西斯月话合回特代内信表化老给世位次度门任常先海通教儿原东声提立及比员解水名真论处走义各入几口认条平系气题活尔更别打女变四神总何电数安少报才结反受目太量再感建务做接必场件计管 ,.',
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
    symbols: ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए", "ऐ", "ओ", "औ", "क", "ख", "ग", "घ", "ङ", "च", "छ", "ज", "झ", "ञ", "ट", "ठ", "ड", "ढ", "ण", "त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श", "ष", "स", "ह", "का", "कि", "की", "कु", "कू", "के", "को", "कं", "खा", "खि", "खी", "खु", "खू", "खे", "खो", "खं", "गा", "गि", "गी", "गु", "गू", "गे", "गो", "गं", "घा", "घि", "घी", "घु", "घू", "घे", "घो", "घं", "ङा", "ङि", "ङी", "ङु", "ङू", "ङे", "ङो", "ङं", "चा", "चि", "ची", "चु", "चू", "चे", "चो", "चं", "छा", "छि", "छी", "छु", "छू", "छे", "छो", "छं", "जा", "जि", "जी", "जु", "जू", "जे", "जो", "जं", "झा", "झि", "झी", "झु", "झू", "झे", "झो", "झं", "ञा", "ञि", "ञी", "ञु", "ञू", "ञे", "ञो", "ञं", "टा", "टि", "टी", "टु", "टू", "टे", "टो", "टं", "ठा", "ठि", "ठी", "ठु", "ठू", "ठे", "ठो", "ठं", "डा", "डि", "डी", "डु", "डू", "डे", "डो", "डं", "ढा", "ढि", "ढी", "ढु", "ढू", "ढे", "ढो", "ढं", "णा", "णि", "णी", "णु", "णू", "णे", "णो", "णं", "ता", "ति", "ती", "तु", "तू", "ते", "तो", "तं", "था", "थि", "थी", "थु", "थू", "थे", "थो", "थं", "दा", "दि", "दी", "दु", "दू", "दे", "दो", "दं", "धा", "धि", "धी", "धु", "धू", "धे", "धो", "धं", "ना", "नि", "नी", "नु", "नू", "ने", "नो", "नं", "पा", "पि", "पी", "पु", "पू", "पे", "पो", "पं", "फा", "फि", "फी", "फु", "फू", "फे", "फो", "फं", "बा", "बि", "बी", "बु", "बू", "बे", "बो", "बं", "भा", "भि", "भी", "भु", "भू", "भे", "भो", "भं", "मा", "मि", "मी", "मु", "मू", "मे", "मो", "मं", "या", "यि", "यी", "यु", "यू", "ये", "यो", "यं", " ", ",", "."],
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
    symbols: ["অ", "আ", "ই", "ঈ", "উ", "ঊ", "ঋ", "এ", "ঐ", "ও", "ঔ", "ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ", "ট", "ঠ", "ড", "ঢ", "ণ", "ত", "থ", "দ", "ধ", "ন", "প", "ফ", "ব", "ভ", "ম", "য", "র", "ল", "শ", "ষ", "স", "হ", "কা", "কি", "কী", "কু", "কূ", "কে", "কো", "কং", "খা", "খি", "খী", "খু", "খূ", "খে", "খো", "খং", "গা", "গি", "গী", "গু", "গূ", "গে", "গো", "গং", "ঘা", "ঘি", "ঘী", "ঘু", "ঘূ", "ঘে", "ঘো", "ঘং", "ঙা", "ঙি", "ঙী", "ঙু", "ঙূ", "ঙে", "ঙো", "ঙং", "চা", "চি", "চী", "চু", "চূ", "চে", "চো", "চং", "ছা", "ছি", "ছী", "ছু", "ছূ", "ছে", "ছো", "ছং", "জা", "জি", "জী", "জু", "জূ", "জে", "জো", "জং", "ঝা", "ঝি", "ঝী", "ঝু", "ঝূ", "ঝে", "ঝো", "ঝং", "ঞা", "ঞি", "ঞী", "ঞু", "ঞূ", "ঞে", "ঞো", "ঞং", "টা", "টি", "টী", "টু", "টূ", "টে", "টো", "টং", "ঠা", "ঠি", "ঠী", "ঠু", "ঠূ", "ঠে", "ঠো", "ঠং", "ডা", "ডি", "ডী", "ডু", "ডূ", "ডে", "ডো", "ডং", "ঢা", "ঢি", "ঢী", "ঢু", "ঢূ", "ঢে", "ঢো", "ঢং", "ণা", "ণি", "ণী", "ণু", "ণূ", "ণে", "ণো", "ণং", "তা", "তি", "তী", "তু", "তূ", "তে", "তো", "তং", "থা", "থি", "থী", "থু", "থূ", "থে", "থো", "থং", "দা", "দি", "দী", "দু", "দূ", "দে", "দো", "দং", "ধা", "ধি", "ধী", "ধু", "ধূ", "ধে", "ধো", "ধং", "না", "নি", "নী", "নু", "নূ", "নে", "নো", "নং", "পা", "পি", "পী", "পু", "পূ", "পে", "পো", "পং", "ফা", "ফি", "ফী", "ফু", "ফূ", "ফে", "ফো", "ফং", "বা", "বি", "বী", "বু", "বূ", "বে", "বো", "বং", "ভা", "ভি", "ভী", "ভু", "ভূ", "ভে", "ভো", "ভং", "মা", "মি", "মী", "মু", "মূ", "মে", "মো", "মং", "যা", "যি", "যী", "যু", "যূ", "যে", "যো", "যং", "রা", " ", ",", "."],
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
    symbols: ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ", "க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன", "ஃ", "கா", "கி", "கீ", "கு", "கூ", "கெ", "கே", "கை", "கொ", "கோ", "கௌ", "க்", "ஙா", "ஙி", "ஙீ", "ஙு", "ஙூ", "ஙெ", "ஙே", "ஙை", "ஙொ", "ஙோ", "ஙௌ", "ங்", "சா", "சி", "சீ", "சு", "சூ", "செ", "சே", "சை", "சொ", "சோ", "சௌ", "ச்", "ஞா", "ஞி", "ஞீ", "ஞு", "ஞூ", "ஞெ", "ஞே", "ஞை", "ஞொ", "ஞோ", "ஞௌ", "ஞ்", "டா", "டி", "டீ", "டு", "டூ", "டெ", "டே", "டை", "டொ", "டோ", "டௌ", "ட்", "ணா", "ணி", "ணீ", "ணு", "ணூ", "ணெ", "ணே", "ணை", "ணொ", "ணோ", "ணௌ", "ண்", "தா", "தி", "தீ", "து", "தூ", "தெ", "தே", "தை", "தொ", "தோ", "தௌ", "த்", "நா", "நி", "நீ", "நு", "நூ", "நெ", "நே", "நை", "நொ", "நோ", "நௌ", "ந்", "பா", "பி", "பீ", "பு", "பூ", "பெ", "பே", "பை", "பொ", "போ", "பௌ", "ப்", "மா", "மி", "மீ", "மு", "மூ", "மெ", "மே", "மை", "மொ", "மோ", "மௌ", "ம்", "யா", "யி", "யீ", "யு", "யூ", "யெ", "யே", "யை", "யொ", "யோ", "யௌ", "ய்", "ரா", "ரி", "ரீ", "ரு", "ரூ", "ரெ", "ரே", "ரை", "ரொ", "ரோ", "ரௌ", "ர்", "லா", "லி", "லீ", "லு", "லூ", "லெ", "லே", "லை", "லொ", "லோ", "லௌ", "ல்", "வா", "வி", "வீ", "வு", "வூ", "வெ", "வே", "வை", "வொ", "வோ", "வௌ", "வ்", "ழா", "ழி", "ழீ", "ழு", "ழூ", "ழெ", "ழே", "ழை", "ழொ", "ழோ", "ழௌ", "ழ்", "ளா", "ளி", "ளீ", "ளு", "ளூ", "ளெ", "ளே", "ளை", "ளொ", "ளோ", "ளௌ", "ள்", "றா", "றி", "றீ", "று", "றூ", "றெ", "றே", "றை", "றொ", "றோ", "றௌ", "ற்", "னா", "னி", "னீ", "னு", "னூ", "னெ", "னே", "னை", "னொ", "னோ", "னௌ", "ன்", " ", ",", "."],
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
    symbols: ["అ", "ఆ", "ఇ", "ఈ", "ఉ", "ఊ", "ఋ", "ఎ", "ఏ", "ఐ", "ఒ", "ఓ", "ఔ", "క", "ఖ", "గ", "ఘ", "ఙ", "చ", "ఛ", "జ", "ఝ", "ఞ", "ట", "ఠ", "డ", "ఢ", "ణ", "త", "థ", "ద", "ధ", "న", "ప", "ఫ", "బ", "భ", "మ", "య", "ర", "ల", "వ", "శ", "ష", "స", "హ", "ళ", "కా", "కి", "కీ", "కు", "కూ", "కె", "కే", "కో", "కం", "ఖా", "ఖి", "ఖీ", "ఖు", "ఖూ", "ఖె", "ఖే", "ఖో", "ఖం", "గా", "గి", "గీ", "గు", "గూ", "గె", "గే", "గో", "గం", "ఘా", "ఘి", "ఘీ", "ఘు", "ఘూ", "ఘె", "ఘే", "ఘో", "ఘం", "ఙా", "ఙి", "ఙీ", "ఙు", "ఙూ", "ఙె", "ఙే", "ఙో", "ఙం", "చా", "చి", "చీ", "చు", "చూ", "చె", "చే", "చో", "చం", "ఛా", "ఛి", "ఛీ", "ఛు", "ఛూ", "ఛె", "ఛే", "ఛో", "ఛం", "జా", "జి", "జీ", "జు", "జూ", "జె", "జే", "జో", "జం", "ఝా", "ఝి", "ఝీ", "ఝు", "ఝూ", "ఝె", "ఝే", "ఝో", "ఝం", "ఞా", "ఞి", "ఞీ", "ఞు", "ఞూ", "ఞె", "ఞే", "ఞో", "ఞం", "టా", "టి", "టీ", "టు", "టూ", "టె", "టే", "టో", "టం", "ఠా", "ఠి", "ఠీ", "ఠు", "ఠూ", "ఠె", "ఠే", "ఠో", "ఠం", "డా", "డి", "డీ", "డు", "డూ", "డె", "డే", "డో", "డం", "ఢా", "ఢి", "ఢీ", "ఢు", "ఢూ", "ఢె", "ఢే", "ఢో", "ఢం", "ణా", "ణి", "ణీ", "ణు", "ణూ", "ణె", "ణే", "ణో", "ణం", "తా", "తి", "తీ", "తు", "తూ", "తె", "తే", "తో", "తం", "థా", "థి", "థీ", "థు", "థూ", "థె", "థే", "థో", "థం", "దా", "ది", "దీ", "దు", "దూ", "దె", "దే", "దో", "దం", "ధా", "ధి", "ధీ", "ధు", "ధూ", "ధె", "ధే", "ధో", "ధం", "నా", "ని", "నీ", "ను", "నూ", "నె", "నే", "నో", "నం", "పా", "పి", "పీ", "పు", "పూ", "పె", "పే", "పో", "పం", "ఫా", "ఫి", "ఫీ", "ఫు", "ఫూ", "ఫె", "ఫే", "ఫో", "ఫం", "బా", "బి", "బీ", "బు", "బూ", "బె", "బే", " ", ",", "."],
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
    symbols: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ", "ಏ", "ಐ", "ಒ", "ಓ", "ಔ", "ಕ", "ಖ", "ಗ", "ಘ", "ಙ", "ಚ", "ಛ", "ಜ", "ಝ", "ಞ", "ಟ", "ಠ", "ಡ", "ಢ", "ಣ", "ತ", "ಥ", "ದ", "ಧ", "ನ", "ಪ", "ಫ", "ಬ", "ಭ", "ಮ", "ಯ", "ರ", "ಲ", "ವ", "ಶ", "ಷ", "ಸ", "ಹ", "ಳ", "ಕಾ", "ಕಿ", "ಕೀ", "ಕು", "ಕೂ", "ಕೆ", "ಕೇ", "ಕೋ", "ಕಂ", "ಖಾ", "ಖಿ", "ಖೀ", "ಖು", "ಖೂ", "ಖೆ", "ಖೇ", "ಖೋ", "ಖಂ", "ಗಾ", "ಗಿ", "ಗೀ", "ಗು", "ಗೂ", "ಗೆ", "ಗೇ", "ಗೋ", "ಗಂ", "ಘಾ", "ಘಿ", "ಘೀ", "ಘು", "ಘೂ", "ಘೆ", "ಘೇ", "ಘೋ", "ಘಂ", "ಙಾ", "ಙಿ", "ಙೀ", "ಙು", "ಙೂ", "ಙೆ", "ಙೇ", "ಙೋ", "ಙಂ", "ಚಾ", "ಚಿ", "ಚೀ", "ಚು", "ಚೂ", "ಚೆ", "ಚೇ", "ಚೋ", "ಚಂ", "ಛಾ", "ಛಿ", "ಛೀ", "ಛು", "ಛೂ", "ಛೆ", "ಛೇ", "ಛೋ", "ಛಂ", "ಜಾ", "ಜಿ", "ಜೀ", "ಜು", "ಜೂ", "ಜೆ", "ಜೇ", "ಜೋ", "ಜಂ", "ಝಾ", "ಝಿ", "ಝೀ", "ಝು", "ಝೂ", "ಝೆ", "ಝೇ", "ಝೋ", "ಝಂ", "ಞಾ", "ಞಿ", "ಞೀ", "ಞು", "ಞೂ", "ಞೆ", "ಞೇ", "ಞೋ", "ಞಂ", "ಟಾ", "ಟಿ", "ಟೀ", "ಟು", "ಟೂ", "ಟೆ", "ಟೇ", "ಟೋ", "ಟಂ", "ಠಾ", "ಠಿ", "ಠೀ", "ಠು", "ಠೂ", "ಠೆ", "ಠೇ", "ಠೋ", "ಠಂ", "ಡಾ", "ಡಿ", "ಡೀ", "ಡು", "ಡೂ", "ಡೆ", "ಡೇ", "ಡೋ", "ಡಂ", "ಢಾ", "ಢಿ", "ಢೀ", "ಢು", "ಢೂ", "ಢೆ", "ಢೇ", "ಢೋ", "ಢಂ", "ಣಾ", "ಣಿ", "ಣೀ", "ಣು", "ಣೂ", "ಣೆ", "ಣೇ", "ಣೋ", "ಣಂ", "ತಾ", "ತಿ", "ತೀ", "ತು", "ತೂ", "ತೆ", "ತೇ", "ತೋ", "ತಂ", "ಥಾ", "ಥಿ", "ಥೀ", "ಥು", "ಥೂ", "ಥೆ", "ಥೇ", "ಥೋ", "ಥಂ", "ದಾ", "ದಿ", "ದೀ", "ದು", "ದೂ", "ದೆ", "ದೇ", "ದೋ", "ದಂ", "ಧಾ", "ಧಿ", "ಧೀ", "ಧು", "ಧೂ", "ಧೆ", "ಧೇ", "ಧೋ", "ಧಂ", "ನಾ", "ನಿ", "ನೀ", "ನು", "ನೂ", "ನೆ", "ನೇ", "ನೋ", "ನಂ", "ಪಾ", "ಪಿ", "ಪೀ", "ಪು", "ಪೂ", "ಪೆ", "ಪೇ", "ಪೋ", "ಪಂ", "ಫಾ", "ಫಿ", "ಫೀ", "ಫು", "ಫೂ", "ಫೆ", "ಫೇ", "ಫೋ", "ಫಂ", "ಬಾ", "ಬಿ", "ಬೀ", "ಬು", "ಬೂ", "ಬೆ", "ಬೇ", " ", ",", "."],
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
    symbols: ["അ", "ആ", "ഇ", "ഈ", "ഉ", "ഊ", "ഋ", "എ", "ഏ", "ഐ", "ഒ", "ഓ", "ഔ", "ക", "ഖ", "ഗ", "ഘ", "ങ", "ച", "ഛ", "ജ", "ഝ", "ഞ", "ട", "ഠ", "ഡ", "ഢ", "ണ", "ത", "ഥ", "ദ", "ധ", "ന", "പ", "ഫ", "ബ", "ഭ", "മ", "യ", "ര", "ല", "വ", "ശ", "ഷ", "സ", "ഹ", "ള", "ഴ", "റ", "ൻ", "ർ", "ൽ", "ൾ", "ൺ", "ൿ", "കാ", "കി", "കീ", "കു", "കൂ", "കെ", "കേ", "കോ", "കം", "ഖാ", "ഖി", "ഖീ", "ഖു", "ഖൂ", "ഖെ", "ഖേ", "ഖോ", "ഖം", "ഗാ", "ഗി", "ഗീ", "ഗു", "ഗൂ", "ഗെ", "ഗേ", "ഗോ", "ഗം", "ഘാ", "ഘി", "ഘീ", "ഘു", "ഘൂ", "ഘെ", "ഘേ", "ഘോ", "ഘം", "ങാ", "ങി", "ങീ", "ങു", "ങൂ", "ങെ", "ങേ", "ങോ", "ങം", "ചാ", "ചി", "ചീ", "ചു", "ചൂ", "ചെ", "ചേ", "ചോ", "ചം", "ഛാ", "ഛി", "ഛീ", "ഛു", "ഛൂ", "ഛെ", "ഛേ", "ഛോ", "ഛം", "ജാ", "ജി", "ജീ", "ജു", "ജൂ", "ജെ", "ജേ", "ജോ", "ജം", "ഝാ", "ഝി", "ഝീ", "ഝു", "ഝൂ", "ഝെ", "ഝേ", "ഝോ", "ഝം", "ഞാ", "ഞി", "ഞീ", "ഞു", "ഞൂ", "ഞെ", "ഞേ", "ഞോ", "ഞം", "ടാ", "ടി", "ടീ", "ടു", "ടൂ", "ടെ", "ടേ", "ടോ", "ടം", "ഠാ", "ഠി", "ഠീ", "ഠു", "ഠൂ", "ഠെ", "ഠേ", "ഠോ", "ഠം", "ഡാ", "ഡി", "ഡീ", "ഡു", "ഡൂ", "ഡെ", "ഡേ", "ഡോ", "ഡം", "ഢാ", "ഢി", "ഢീ", "ഢു", "ഢൂ", "ഢെ", "ഢേ", "ഢോ", "ഢം", "ണാ", "ണി", "ണീ", "ണു", "ണൂ", "ണെ", "ണേ", "ണോ", "ണം", "താ", "തി", "തീ", "തു", "തൂ", "തെ", "തേ", "തോ", "തം", "ഥാ", "ഥി", "ഥീ", "ഥു", "ഥൂ", "ഥെ", "ഥേ", "ഥോ", "ഥം", "ദാ", "ദി", "ദീ", "ദു", "ദൂ", "ദെ", "ദേ", "ദോ", "ദം", "ധാ", "ധി", "ധീ", "ധു", "ധൂ", "ധെ", "ധേ", "ധോ", "ധം", "നാ", "നി", "നീ", "നു", "നൂ", "നെ", "നേ", "നോ", "നം", "പാ", "പി", "പീ", "പു", "പൂ", "പെ", "പേ", "പോ", "പം", "ഫാ", "ഫി", "ഫീ", "ഫു", "ഫൂ", "ഫെ", "ഫേ", "ഫോ", " ", ",", "."],
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
    symbols: ["અ", "આ", "ઇ", "ઈ", "ઉ", "ઊ", "ઋ", "એ", "ઐ", "ઓ", "ઔ", "ક", "ખ", "ગ", "ઘ", "ઙ", "ચ", "છ", "જ", "ઝ", "ઞ", "ટ", "ઠ", "ડ", "ઢ", "ણ", "ત", "થ", "દ", "ધ", "ન", "પ", "ફ", "બ", "ભ", "મ", "ય", "ર", "લ", "વ", "શ", "ષ", "સ", "હ", "ળ", "કા", "કિ", "કી", "કુ", "કૂ", "કે", "કો", "કં", "ખા", "ખિ", "ખી", "ખુ", "ખૂ", "ખે", "ખો", "ખં", "ગા", "ગિ", "ગી", "ગુ", "ગૂ", "ગે", "ગો", "ગં", "ઘા", "ઘિ", "ઘી", "ઘુ", "ઘૂ", "ઘે", "ઘો", "ઘં", "ઙા", "ઙિ", "ઙી", "ઙુ", "ઙૂ", "ઙે", "ઙો", "ઙં", "ચા", "ચિ", "ચી", "ચુ", "ચૂ", "ચે", "ચો", "ચં", "છા", "છિ", "છી", "છુ", "છૂ", "છે", "છો", "છં", "જા", "જિ", "જી", "જુ", "જૂ", "જે", "જો", "જં", "ઝા", "ઝિ", "ઝી", "ઝુ", "ઝૂ", "ઝે", "ઝો", "ઝં", "ઞા", "ઞિ", "ઞી", "ઞુ", "ઞૂ", "ઞે", "ઞો", "ઞં", "ટા", "ટિ", "ટી", "ટુ", "ટૂ", "ટે", "ટો", "ટં", "ઠા", "ઠિ", "ઠી", "ઠુ", "ઠૂ", "ઠે", "ઠો", "ઠં", "ડા", "ડિ", "ડી", "ડુ", "ડૂ", "ડે", "ડો", "ડં", "ઢા", "ઢિ", "ઢી", "ઢુ", "ઢૂ", "ઢે", "ઢો", "ઢં", "ણા", "ણિ", "ણી", "ણુ", "ણૂ", "ણે", "ણો", "ણં", "તા", "તિ", "તી", "તુ", "તૂ", "તે", "તો", "તં", "થા", "થિ", "થી", "થુ", "થૂ", "થે", "થો", "થં", "દા", "દિ", "દી", "દુ", "દૂ", "દે", "દો", "દં", "ધા", "ધિ", "ધી", "ધુ", "ધૂ", "ધે", "ધો", "ધં", "ના", "નિ", "ની", "નુ", "નૂ", "ને", "નો", "નં", "પા", "પિ", "પી", "પુ", "પૂ", "પે", "પો", "પં", "ફા", "ફિ", "ફી", "ફુ", "ફૂ", "ફે", "ફો", "ફં", "બા", "બિ", "બી", "બુ", "બૂ", "બે", "બો", "બં", "ભા", "ભિ", "ભી", "ભુ", "ભૂ", "ભે", "ભો", "ભં", "મા", "મિ", "મી", "મુ", "મૂ", "મે", "મો", "મં", "યા", "યિ", "યી", "યુ", "યૂ", "યે", "યો", " ", ",", "."],
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
    symbols: ["ਅ", "ਆ", "ਇ", "ਈ", "ਉ", "ਊ", "ਏ", "ਐ", "ਓ", "ਔ", "ਕ", "ਖ", "ਗ", "ਘ", "ਙ", "ਚ", "ਛ", "ਜ", "ਝ", "ਞ", "ਟ", "ਠ", "ਡ", "ਢ", "ਣ", "ਤ", "ਥ", "ਦ", "ਧ", "ਨ", "ਪ", "ਫ", "ਬ", "ਭ", "ਮ", "ਯ", "ਰ", "ਲ", "ਵ", "ਸ", "ਹ", "ੜ", "ਕਾ", "ਕਿ", "ਕੀ", "ਕੁ", "ਕੂ", "ਕੇ", "ਕੋ", "ਕੰ", "ਖਾ", "ਖਿ", "ਖੀ", "ਖੁ", "ਖੂ", "ਖੇ", "ਖੋ", "ਖੰ", "ਗਾ", "ਗਿ", "ਗੀ", "ਗੁ", "ਗੂ", "ਗੇ", "ਗੋ", "ਗੰ", "ਘਾ", "ਘਿ", "ਘੀ", "ਘੁ", "ਘੂ", "ਘੇ", "ਘੋ", "ਘੰ", "ਙਾ", "ਙਿ", "ਙੀ", "ਙੁ", "ਙੂ", "ਙੇ", "ਙੋ", "ਙੰ", "ਚਾ", "ਚਿ", "ਚੀ", "ਚੁ", "ਚੂ", "ਚੇ", "ਚੋ", "ਚੰ", "ਛਾ", "ਛਿ", "ਛੀ", "ਛੁ", "ਛੂ", "ਛੇ", "ਛੋ", "ਛੰ", "ਜਾ", "ਜਿ", "ਜੀ", "ਜੁ", "ਜੂ", "ਜੇ", "ਜੋ", "ਜੰ", "ਝਾ", "ਝਿ", "ਝੀ", "ਝੁ", "ਝੂ", "ਝੇ", "ਝੋ", "ਝੰ", "ਞਾ", "ਞਿ", "ਞੀ", "ਞੁ", "ਞੂ", "ਞੇ", "ਞੋ", "ਞੰ", "ਟਾ", "ਟਿ", "ਟੀ", "ਟੁ", "ਟੂ", "ਟੇ", "ਟੋ", "ਟੰ", "ਠਾ", "ਠਿ", "ਠੀ", "ਠੁ", "ਠੂ", "ਠੇ", "ਠੋ", "ਠੰ", "ਡਾ", "ਡਿ", "ਡੀ", "ਡੁ", "ਡੂ", "ਡੇ", "ਡੋ", "ਡੰ", "ਢਾ", "ਢਿ", "ਢੀ", "ਢੁ", "ਢੂ", "ਢੇ", "ਢੋ", "ਢੰ", "ਣਾ", "ਣਿ", "ਣੀ", "ਣੁ", "ਣੂ", "ਣੇ", "ਣੋ", "ਣੰ", "ਤਾ", "ਤਿ", "ਤੀ", "ਤੁ", "ਤੂ", "ਤੇ", "ਤੋ", "ਤੰ", "ਥਾ", "ਥਿ", "ਥੀ", "ਥੁ", "ਥੂ", "ਥੇ", "ਥੋ", "ਥੰ", "ਦਾ", "ਦਿ", "ਦੀ", "ਦੁ", "ਦੂ", "ਦੇ", "ਦੋ", "ਦੰ", "ਧਾ", "ਧਿ", "ਧੀ", "ਧੁ", "ਧੂ", "ਧੇ", "ਧੋ", "ਧੰ", "ਨਾ", "ਨਿ", "ਨੀ", "ਨੁ", "ਨੂ", "ਨੇ", "ਨੋ", "ਨੰ", "ਪਾ", "ਪਿ", "ਪੀ", "ਪੁ", "ਪੂ", "ਪੇ", "ਪੋ", "ਪੰ", "ਫਾ", "ਫਿ", "ਫੀ", "ਫੁ", "ਫੂ", "ਫੇ", "ਫੋ", "ਫੰ", "ਬਾ", "ਬਿ", "ਬੀ", "ਬੁ", "ਬੂ", "ਬੇ", "ਬੋ", "ਬੰ", "ਭਾ", "ਭਿ", "ਭੀ", "ਭੁ", "ਭੂ", "ਭੇ", "ਭੋ", "ਭੰ", "ਮਾ", "ਮਿ", "ਮੀ", "ਮੁ", "ਮੂ", "ਮੇ", "ਮੋ", "ਮੰ", "ਯਾ", "ਯਿ", "ਯੀ", "ਯੁ", "ਯੂ", "ਯੇ", "ਯੋ", "ਯੰ", "ਰਾ", "ਰਿ", " ", ",", "."],
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
    symbols: ["ଅ", "ଆ", "ଇ", "ଈ", "ଉ", "ଊ", "ଋ", "ଏ", "ଐ", "ଓ", "ଔ", "କ", "ଖ", "ଗ", "ଘ", "ଙ", "ଚ", "ଛ", "ଜ", "ଝ", "ଞ", "ଟ", "ଠ", "ଡ", "ଢ", "ଣ", "ତ", "ଥ", "ଦ", "ଧ", "ନ", "ପ", "ଫ", "ବ", "ଭ", "ମ", "ଯ", "ର", "ଲ", "ଳ", "ଵ", "ଶ", "ଷ", "ସ", "ହ", "କା", "କି", "କୀ", "କୁ", "କୂ", "କେ", "କୋ", "କଂ", "ଖା", "ଖି", "ଖୀ", "ଖୁ", "ଖୂ", "ଖେ", "ଖୋ", "ଖଂ", "ଗା", "ଗି", "ଗୀ", "ଗୁ", "ଗୂ", "ଗେ", "ଗୋ", "ଗଂ", "ଘା", "ଘି", "ଘୀ", "ଘୁ", "ଘୂ", "ଘେ", "ଘୋ", "ଘଂ", "ଙା", "ଙି", "ଙୀ", "ଙୁ", "ଙୂ", "ଙେ", "ଙୋ", "ଙଂ", "ଚା", "ଚି", "ଚୀ", "ଚୁ", "ଚୂ", "ଚେ", "ଚୋ", "ଚଂ", "ଛା", "ଛି", "ଛୀ", "ଛୁ", "ଛୂ", "ଛେ", "ଛୋ", "ଛଂ", "ଜା", "ଜି", "ଜୀ", "ଜୁ", "ଜୂ", "ଜେ", "ଜୋ", "ଜଂ", "ଝା", "ଝି", "ଝୀ", "ଝୁ", "ଝୂ", "ଝେ", "ଝୋ", "ଝଂ", "ଞା", "ଞି", "ଞୀ", "ଞୁ", "ଞୂ", "ଞେ", "ଞୋ", "ଞଂ", "ଟା", "ଟି", "ଟୀ", "ଟୁ", "ଟୂ", "ଟେ", "ଟୋ", "ଟଂ", "ଠା", "ଠି", "ଠୀ", "ଠୁ", "ଠୂ", "ଠେ", "ଠୋ", "ଠଂ", "ଡା", "ଡି", "ଡୀ", "ଡୁ", "ଡୂ", "ଡେ", "ଡୋ", "ଡଂ", "ଢା", "ଢି", "ଢୀ", "ଢୁ", "ଢୂ", "ଢେ", "ଢୋ", "ଢଂ", "ଣା", "ଣି", "ଣୀ", "ଣୁ", "ଣୂ", "ଣେ", "ଣୋ", "ଣଂ", "ତା", "ତି", "ତୀ", "ତୁ", "ତୂ", "ତେ", "ତୋ", "ତଂ", "ଥା", "ଥି", "ଥୀ", "ଥୁ", "ଥୂ", "ଥେ", "ଥୋ", "ଥଂ", "ଦା", "ଦି", "ଦୀ", "ଦୁ", "ଦୂ", "ଦେ", "ଦୋ", "ଦଂ", "ଧା", "ଧି", "ଧୀ", "ଧୁ", "ଧୂ", "ଧେ", "ଧୋ", "ଧଂ", "ନା", "ନି", "ନୀ", "ନୁ", "ନୂ", "ନେ", "ନୋ", "ନଂ", "ପା", "ପି", "ପୀ", "ପୁ", "ପୂ", "ପେ", "ପୋ", "ପଂ", "ଫା", "ଫି", "ଫୀ", "ଫୁ", "ଫୂ", "ଫେ", "ଫୋ", "ଫଂ", "ବା", "ବି", "ବୀ", "ବୁ", "ବୂ", "ବେ", "ବୋ", "ବଂ", "ଭା", "ଭି", "ଭୀ", "ଭୁ", "ଭୂ", "ଭେ", "ଭୋ", "ଭଂ", "ମା", "ମି", "ମୀ", "ମୁ", "ମୂ", "ମେ", "ମୋ", "ମଂ", "ଯା", "ଯି", "ଯୀ", "ଯୁ", "ଯୂ", "ଯେ", "ଯୋ", " ", ",", "."],
  },
  {
    id: 88,
    name: "Azerbaijani",
    native: "Azərbaycan",
    short: "az",
    group: "Turkic",
    script: "latin",
    lang: "az",
    symbols: "abcçdeəfgğhxıijkqlmnoöprsştuüvyz" + PUNCT,
  },
  {
    id: 89,
    name: "Kazakh",
    native: "Qazaqşa",
    short: "kk",
    group: "Turkic",
    script: "latin",
    lang: "kk",
    symbols: "aäbdefgğhıijklmnñoöpqrsştuūüvyz" + PUNCT,
  },
  {
    id: 90,
    name: "Uzbek",
    native: "Oʻzbekcha",
    short: "uz",
    group: "Turkic",
    script: "latin",
    lang: "uz",
    symbols: "abcdefghijklmnopqrstuvwxyzʻ" + PUNCT,
  },
  {
    id: 91,
    name: "Turkmen",
    native: "Türkmençe",
    short: "tk",
    group: "Turkic",
    script: "latin",
    lang: "tk",
    symbols: "abçdeäfghijžklmnňoöprsştuüwyýz" + PUNCT,
  },
  {
    id: 92,
    name: "Kyrgyz",
    native: "Кыргызча",
    short: "ky",
    group: "Turkic",
    symbols: "абвгдеёжзийклмнңоөпрстуүфхцчшщъыьэюя" + PUNCT,
  },
  {
    id: 93,
    name: "Mongolian",
    native: "Монгол",
    short: "mn",
    group: "Mongolic",
    symbols: "абвгдеёжзийклмноөпрстуүфхцчшщъыьэюя" + PUNCT,
  },
  {
    id: 94,
    name: "Filipino",
    native: "Filipino",
    short: "fil",
    group: "Southeast Asian",
    script: "latin",
    lang: "fil",
    symbols: "abcdefghijklmnopqrstuvwxyzñ" + PUNCT,
  },
  {
    id: 96,
    name: "Vietnamese",
    native: "Tiếng Việt",
    short: "vi",
    group: "Southeast Asian",
    script: "latin",
    lang: "vi",
    symbols:
      "abcdefghijklmnopqrstuvwxyzđáàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ" +
      PUNCT,
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
    symbols: ["ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ฤ", "ล", "ฦ", "ว", "ศ", "ษ", "ส", "ห", "ฬ", "อ", "ฮ", "ะ", "า", "ำ", "เ", "แ", "โ", "ใ", "ไ", "ๆ", "ฯ", "กิ", "กี", "กึ", "กื", "กุ", "กู", "กั", "ก่", "ก้", "ก๊", "ก๋", "ขิ", "ขี", "ขึ", "ขื", "ขุ", "ขู", "ขั", "ข่", "ข้", "ข๊", "ข๋", "ฃิ", "ฃี", "ฃึ", "ฃื", "ฃุ", "ฃู", "ฃั", "ฃ่", "ฃ้", "ฃ๊", "ฃ๋", "คิ", "คี", "คึ", "คื", "คุ", "คู", "คั", "ค่", "ค้", "ค๊", "ค๋", "ฅิ", "ฅี", "ฅึ", "ฅื", "ฅุ", "ฅู", "ฅั", "ฅ่", "ฅ้", "ฅ๊", "ฅ๋", "ฆิ", "ฆี", "ฆึ", "ฆื", "ฆุ", "ฆู", "ฆั", "ฆ่", "ฆ้", "ฆ๊", "ฆ๋", "งิ", "งี", "งึ", "งื", "งุ", "งู", "งั", "ง่", "ง้", "ง๊", "ง๋", "จิ", "จี", "จึ", "จื", "จุ", "จู", "จั", "จ่", "จ้", "จ๊", "จ๋", "ฉิ", "ฉี", "ฉึ", "ฉื", "ฉุ", "ฉู", "ฉั", "ฉ่", "ฉ้", "ฉ๊", "ฉ๋", "ชิ", "ชี", "ชึ", "ชื", "ชุ", "ชู", "ชั", "ช่", "ช้", "ช๊", "ช๋", "ซิ", "ซี", "ซึ", "ซื", "ซุ", "ซู", "ซั", "ซ่", "ซ้", "ซ๊", "ซ๋", "ฌิ", "ฌี", "ฌึ", "ฌื", "ฌุ", "ฌู", "ฌั", "ฌ่", "ฌ้", "ฌ๊", "ฌ๋", "ญิ", "ญี", "ญึ", "ญื", "ญุ", "ญู", "ญั", "ญ่", "ญ้", "ญ๊", "ญ๋", "ฎิ", "ฎี", "ฎึ", "ฎื", "ฎุ", "ฎู", "ฎั", "ฎ่", "ฎ้", "ฎ๊", "ฎ๋", "ฏิ", "ฏี", "ฏึ", "ฏื", "ฏุ", "ฏู", "ฏั", "ฏ่", "ฏ้", "ฏ๊", "ฏ๋", "ฐิ", "ฐี", "ฐึ", "ฐื", "ฐุ", "ฐู", "ฐั", "ฐ่", "ฐ้", "ฐ๊", "ฐ๋", "ฑิ", "ฑี", "ฑึ", "ฑื", "ฑุ", "ฑู", "ฑั", "ฑ่", "ฑ้", "ฑ๊", "ฑ๋", "ฒิ", "ฒี", "ฒึ", "ฒื", "ฒุ", "ฒู", "ฒั", "ฒ่", "ฒ้", " ", ",", "."],
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
    symbols: ["ក", "ខ", "គ", "ឃ", "ង", "ច", "ឆ", "ជ", "ឈ", "ញ", "ដ", "ឋ", "ឌ", "ឍ", "ណ", "ត", "ថ", "ទ", "ធ", "ន", "ប", "ផ", "ព", "ភ", "ម", "យ", "រ", "ល", "វ", "ស", "ហ", "ឡ", "អ", "ឥ", "ឦ", "ឧ", "ឨ", "ឩ", "ឪ", "ឫ", "ឬ", "ឭ", "ឮ", "ឯ", "ឰ", "ឱ", "ឲ", "ឳ", "កា", "កិ", "កី", "កឹ", "កឺ", "កុ", "កូ", "កេ", "កោ", "កំ", "ខា", "ខិ", "ខី", "ខឹ", "ខឺ", "ខុ", "ខូ", "ខេ", "ខោ", "ខំ", "គា", "គិ", "គី", "គឹ", "គឺ", "គុ", "គូ", "គេ", "គោ", "គំ", "ឃា", "ឃិ", "ឃី", "ឃឹ", "ឃឺ", "ឃុ", "ឃូ", "ឃេ", "ឃោ", "ឃំ", "ងា", "ងិ", "ងី", "ងឹ", "ងឺ", "ងុ", "ងូ", "ងេ", "ងោ", "ងំ", "ចា", "ចិ", "ចី", "ចឹ", "ចឺ", "ចុ", "ចូ", "ចេ", "ចោ", "ចំ", "ឆា", "ឆិ", "ឆី", "ឆឹ", "ឆឺ", "ឆុ", "ឆូ", "ឆេ", "ឆោ", "ឆំ", "ជា", "ជិ", "ជី", "ជឹ", "ជឺ", "ជុ", "ជូ", "ជេ", "ជោ", "ជំ", "ឈា", "ឈិ", "ឈី", "ឈឹ", "ឈឺ", "ឈុ", "ឈូ", "ឈេ", "ឈោ", "ឈំ", "ញា", "ញិ", "ញី", "ញឹ", "ញឺ", "ញុ", "ញូ", "ញេ", "ញោ", "ញំ", "ដា", "ដិ", "ដី", "ដឹ", "ដឺ", "ដុ", "ដូ", "ដេ", "ដោ", "ដំ", "ឋា", "ឋិ", "ឋី", "ឋឹ", "ឋឺ", "ឋុ", "ឋូ", "ឋេ", "ឋោ", "ឋំ", "ឌា", "ឌិ", "ឌី", "ឌឹ", "ឌឺ", "ឌុ", "ឌូ", "ឌេ", "ឌោ", "ឌំ", "ឍា", "ឍិ", "ឍី", "ឍឹ", "ឍឺ", "ឍុ", "ឍូ", "ឍេ", "ឍោ", "ឍំ", "ណា", "ណិ", "ណី", "ណឹ", "ណឺ", "ណុ", "ណូ", "ណេ", "ណោ", "ណំ", "តា", "តិ", "តី", "តឹ", "តឺ", "តុ", "តូ", "តេ", "តោ", "តំ", "ថា", "ថិ", "ថី", "ថឹ", "ថឺ", "ថុ", "ថូ", "ថេ", "ថោ", "ថំ", "ទា", "ទិ", "ទី", "ទឹ", "ទឺ", "ទុ", "ទូ", "ទេ", "ទោ", "ទំ", "ធា", "ធិ", "ធី", "ធឹ", "ធឺ", "ធុ", "ធូ", "ធេ", "ធោ", "ធំ", "នា", "និ", "នី", "នឹ", "នឺ", "នុ", "នូ", "នេ", "នោ", "នំ", "បា", "បិ", "បី", "បឹ", " ", ",", "."],
  },
];

function stemLetters(stem) {
  return stem === "av" ? AV : AZ;
}

function symbolsOf(entry) {
  if (Array.isArray(entry.symbols)) return entry.symbols;
  if (typeof entry.symbols === "string") return [...entry.symbols];
  return [...(stemLetters(entry.stem) + (entry.extras || "") + PUNCT)];
}

/** Trailing space / comma / period tiles in About. */
export function isTrailPunct(ch) {
  return ch === " " || ch === "," || ch === ".";
}

/** id → symbol cell array (for validation / colour map / About tiles). */
export const ALPHABETS = Object.fromEntries(
  ALPHABET_REGISTRY.map((e) => [e.id, symbolsOf(e)]),
);

export const DEFAULT_ALPHABET_ID = 29;

/** Resolve known alphabet cells, else Basile. */
export function alphabetCells(alphabetId = DEFAULT_ALPHABET_ID) {
  return ALPHABETS[alphabetId] || ALPHABETS[DEFAULT_ALPHABET_ID];
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

/** Font-cascade key: latin | arabic | hebrew | nko | ethiopic | tifinagh | japanese | hangul | han | thai | khmer | Indic scripts. */
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
    symbols: symbolsOf(e),
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
