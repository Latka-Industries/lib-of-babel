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
    id: 79,
    name: "Hindi",
    native: "हिन्दी",
    short: "hi",
    group: "Indic",
    rtl: false,
    script: "devanagari",
    lang: "hi",
    symbols: "अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहािीुूृेैोौंःँ़् ,.",
  },
  {
    id: 80,
    name: "Bengali",
    native: "বাংলা",
    short: "bn",
    group: "Indic",
    rtl: false,
    script: "bengali",
    lang: "bn",
    symbols: "অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহািীুূৃেৈোৌংঃঁ়্ ,.",
  },
  {
    id: 81,
    name: "Tamil",
    native: "தமிழ்",
    short: "ta",
    group: "Indic",
    rtl: false,
    script: "tamil",
    lang: "ta",
    symbols: "அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறனாிீுூெேைொோௌஃ் ,.",
  },
  {
    id: 82,
    name: "Telugu",
    native: "తెలుగు",
    short: "te",
    group: "Indic",
    rtl: false,
    script: "telugu",
    lang: "te",
    symbols: "అఆఇఈఉఊఋఎఏఐఒఓఔకఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరలవశషసహళాిీుూృెేైొోౌంఃఁ్ ,.",
  },
  {
    id: 83,
    name: "Kannada",
    native: "ಕನ್ನಡ",
    short: "kn",
    group: "Indic",
    rtl: false,
    script: "kannada",
    lang: "kn",
    symbols: "ಅಆಇಈಉಊಋಎಏಐಒಓಔಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹಳಾಿೀುೂೃೆೇೈೊೋೌಂಃಁ್ ,.",
  },
  {
    id: 84,
    name: "Malayalam",
    native: "മലയാളം",
    short: "ml",
    group: "Indic",
    rtl: false,
    script: "malayalam",
    lang: "ml",
    symbols: "അആഇഈഉഊഋഎഏഐഒഓഔകഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹളഴറാിീുൂൃെേൈൊോൗംഃ്ൻർൽൾൺൿ ,.",
  },
  {
    id: 85,
    name: "Gujarati",
    native: "ગુજરાતી",
    short: "gu",
    group: "Indic",
    rtl: false,
    script: "gujarati",
    lang: "gu",
    symbols: "અઆઇઈઉઊઋએઐઓઔકખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળાિીુૂૃેૈોૌંઃઁ઼્ ,.",
  },
  {
    id: 86,
    name: "Punjabi",
    native: "ਪੰਜਾਬੀ",
    short: "pa",
    group: "Indic",
    rtl: false,
    script: "gurmukhi",
    lang: "pa",
    symbols: "ਅਆਇਈਉਊਏਐਓਔਕਖਗਘਙਚਛਜਝਞਟਠਡਢਣਤਥਦਧਨਪਫਬਭਮਯਰਲਵਸਹੜਾਿੀੁੂੇੈੋੌਂਃੱ਼੍ੰ ,.",
  },
  {
    id: 87,
    name: "Odia",
    native: "ଓଡ଼ିଆ",
    short: "or",
    group: "Indic",
    rtl: false,
    script: "oriya",
    lang: "or",
    symbols: "ଅଆଇଈଉଊଋଏଐଓଔକଖଗଘଙଚଛଜଝଞଟଠଡଢଣତଥଦଧନପଫବଭମଯରଲଳଵଶଷସହାିୀୁୂୃେୈୋୌଂଃଁ଼୍ ,.",
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

/** True when the lens reads right-to-left (Arabic, Hebrew, N’Ko, …). */
export function alphabetIsRtl(alphabetId = DEFAULT_ALPHABET_ID) {
  return !!alphabetEntry(alphabetId).rtl;
}

/** Font-cascade key: latin | arabic | hebrew | nko | ethiopic | tifinagh | japanese | hangul | han | Indic scripts. */
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
