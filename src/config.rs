//! Library dimensions, alphabets, and version — the frozen generator contract.

/// Bump only with intent — this is the schema for all generated content.
/// v7: room identity is alphabet-independent (alphabet is a content lens).
pub const GENERATOR_VERSION: u32 = 7;

/// Borges 25 — `a–v` + space, comma, period.
pub const ALPHABET_BORGES_ID: u32 = 25;
/// Basile 29 — `a–z` + space, comma, period (default).
pub const ALPHABET_BASILE_ID: u32 = 29;
/// Basile++ 48 — Basile + digits + everyday punctuation (`?!'"-:;()`).
pub const ALPHABET_BASILE_PLUS_ID: u32 = 48;
/// Basile# 60 — Basile++ plus email/URL staples (`@<>/_+[]#%&=`).
pub const ALPHABET_BASILE_HASH_ID: u32 = 60;
/// Italian — `a–z` + `àèéìòù` + punct (35 glyphs; id `32` ≠ count — Spanish owns 35).
pub const ALPHABET_ITALIAN_ID: u32 = 32;
/// German 33 — `a–z` + `äöüß` + punct.
pub const ALPHABET_GERMAN_ID: u32 = 33;
/// Dutch 34 — `a–z` + `éëïöü` + punct.
pub const ALPHABET_DUTCH_ID: u32 = 34;
/// Spanish 35 — `a–z` + `áéíóúñ` + punct (no `ü`).
pub const ALPHABET_SPANISH_ID: u32 = 35;
/// Romanian — `a–z` + `ăâîșț` + punct (34 glyphs; id `36` — Dutch already owns 34).
pub const ALPHABET_ROMANIAN_ID: u32 = 36;
/// Danish/Norwegian — `a–z` + `æøå` + punct (32 glyphs; id `37` — Italian owns 32).
pub const ALPHABET_DANISH_NORWEGIAN_ID: u32 = 37;
/// Swedish — `a–z` + `äöå` + punct (32 glyphs; id `38`).
pub const ALPHABET_SWEDISH_ID: u32 = 38;
/// Turkish — official 29-letter Latin set (no `q`/`w`/`x`) + punct (32 glyphs; id `39`).
pub const ALPHABET_TURKISH_ID: u32 = 39;
/// Finnish — `a–z` + `åäö` + punct (32 glyphs; id `40`; same glyphs as Swedish, Finnish order).
pub const ALPHABET_FINNISH_ID: u32 = 40;
/// Portuguese 41 — `a–z` + `áàâãçéêíóôõú` + punct.
pub const ALPHABET_PORTUGUESE_ID: u32 = 41;
/// Estonian — `a–z` + `õäöü` + punct (33 glyphs; id `43` — German owns 33).
pub const ALPHABET_ESTONIAN_ID: u32 = 43;
/// Hungarian — `a–z` + `áéíóöőúüű` + punct (38 glyphs; id `44`).
pub const ALPHABET_HUNGARIAN_ID: u32 = 44;
/// French 45 — `a–z` + full classroom accent/ligature set + punct.
pub const ALPHABET_FRENCH_ID: u32 = 45;
/// Greek — monotonic modern Greek + final sigma + punct (35 glyphs; id `46` — Spanish owns 35).
pub const ALPHABET_GREEK_ID: u32 = 46;
/// Polish — `a–z` + `ąćęłńóśźż` + punct (38 glyphs; id `47`).
pub const ALPHABET_POLISH_ID: u32 = 47;
/// Latvian — `a–z` + `āčēģīķļņšūž` + punct (40 glyphs; id `50` — Finnish owns 40).
pub const ALPHABET_LATVIAN_ID: u32 = 50;
/// Lithuanian — `a–z` + `ąčęėįšųūž` + punct (38 glyphs; id `51`).
pub const ALPHABET_LITHUANIAN_ID: u32 = 51;
/// Czech — `a–z` + `áčďéěíňóřšťúůýž` + punct (44 glyphs; id `52`).
pub const ALPHABET_CZECH_ID: u32 = 52;
/// Croatian/Serbian Latin — `a–z` + `čćđšž` + punct (34 glyphs; id `42` — Dutch owns 34).
pub const ALPHABET_CROATIAN_SERBIAN_ID: u32 = 42;
/// Albanian — `a–z` + `çë` + punct (31 glyphs; digraphs omitted).
pub const ALPHABET_ALBANIAN_ID: u32 = 31;
/// Slovak — `a–z` + `áäčďéíĺľňóôŕšťúýž` + punct (46 glyphs; id `57` — Greek owns 46).
pub const ALPHABET_SLOVAK_ID: u32 = 57;
/// Russian — Cyrillic 33 letters + punct (36 glyphs; id `54`).
pub const ALPHABET_RUSSIAN_ID: u32 = 54;
/// Ukrainian — Cyrillic 33 letters + punct (36 glyphs; id `55`).
pub const ALPHABET_UKRAINIAN_ID: u32 = 55;
/// Bulgarian — Cyrillic 30 letters + punct (33 glyphs; id `56` — German owns 33).
pub const ALPHABET_BULGARIAN_ID: u32 = 56;

/// Latin `a–z` + extras + trailing space/comma/period.
macro_rules! latin_az {
    ($($extra:literal),* $(,)?) => {
        &[
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
            'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', $($extra,)* ' ', ',', '.',
        ]
    };
}

/// Basile++ extras, with optional trailing extras (Basile# layers email/URL on top).
macro_rules! basile_plus_extras {
    ($($more:literal),* $(,)?) => {
        latin_az!(
            '?', '!', '\'', '"', '-', ':', ';', '(', ')', '0', '1', '2', '3', '4', '5', '6', '7',
            '8', '9' $(, $more)*
        )
    };
}

const ALPHABET_BORGES: &[char] = &[
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
    't', 'u', 'v', ' ', ',', '.',
];
const ALPHABET_BASILE: &[char] = latin_az!();
const ALPHABET_BASILE_PLUS: &[char] = basile_plus_extras!();
const ALPHABET_BASILE_HASH: &[char] =
    basile_plus_extras!('@', '<', '>', '/', '_', '+', '[', ']', '#', '%', '&', '=');
const ALPHABET_ITALIAN: &[char] = latin_az!('à', 'è', 'é', 'ì', 'ò', 'ù');
const ALPHABET_GERMAN: &[char] = latin_az!('ä', 'ö', 'ü', 'ß');
const ALPHABET_DUTCH: &[char] = latin_az!('é', 'ë', 'ï', 'ö', 'ü');
/// Shared Norsk/Dansk orthography (`æøå`; not Swedish `äöå`).
const ALPHABET_DANISH_NORWEGIAN: &[char] = latin_az!('æ', 'ø', 'å');
const ALPHABET_SWEDISH: &[char] = latin_az!('ä', 'ö', 'å');
/// Official Turkish letters (dotless `ı` + `çğöşü`; no `q`/`w`/`x`).
const ALPHABET_TURKISH: &[char] = &[
    'a', 'b', 'c', 'ç', 'd', 'e', 'f', 'g', 'ğ', 'h', 'ı', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'ö',
    'p', 'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z', ' ', ',', '.',
];
/// Finnish order `åäö` (same glyph set as Swedish, different mapping).
const ALPHABET_FINNISH: &[char] = latin_az!('å', 'ä', 'ö');
const ALPHABET_SPANISH: &[char] = latin_az!('á', 'é', 'í', 'ó', 'ú', 'ñ');
/// Modern Romanian (comma-below `ș`/`ț`, not cedilla).
const ALPHABET_ROMANIAN: &[char] = latin_az!('ă', 'â', 'î', 'ș', 'ț');
const ALPHABET_PORTUGUESE: &[char] =
    latin_az!('á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú');
/// Core Estonian vowels (`õäöü`; loan `š`/`ž` omitted).
const ALPHABET_ESTONIAN: &[char] = latin_az!('õ', 'ä', 'ö', 'ü');
const ALPHABET_HUNGARIAN: &[char] = latin_az!('á', 'é', 'í', 'ó', 'ö', 'ő', 'ú', 'ü', 'ű');
const ALPHABET_FRENCH: &[char] = latin_az!(
    'à', 'â', 'æ', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'œ', 'ù', 'û', 'ü', 'ÿ'
);
/// Monotonic modern Greek: 24 letters + final sigma + tonos vowels.
const ALPHABET_GREEK: &[char] = &[
    'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'ς',
    'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'ά', 'έ', 'ή', 'ί', 'ό', 'ύ', 'ώ', ' ', ',', '.',
];
const ALPHABET_POLISH: &[char] = latin_az!('ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż');
const ALPHABET_CZECH: &[char] = latin_az!(
    'á', 'č', 'ď', 'é', 'ě', 'í', 'ň', 'ó', 'ř', 'š', 'ť', 'ú', 'ů', 'ý', 'ž'
);
const ALPHABET_SLOVAK: &[char] = latin_az!(
    'á', 'ä', 'č', 'ď', 'é', 'í', 'ĺ', 'ľ', 'ň', 'ó', 'ô', 'ŕ', 'š', 'ť', 'ú', 'ý', 'ž'
);
/// Shared BCMS Latin extras (`čćđšž`).
const ALPHABET_CROATIAN_SERBIAN: &[char] = latin_az!('č', 'ć', 'đ', 'š', 'ž');
const ALPHABET_LATVIAN: &[char] = latin_az!('ā', 'č', 'ē', 'ģ', 'ī', 'ķ', 'ļ', 'ņ', 'š', 'ū', 'ž');
const ALPHABET_LITHUANIAN: &[char] = latin_az!('ą', 'č', 'ę', 'ė', 'į', 'š', 'ų', 'ū', 'ž');
/// Single-letter Albanian extras (digraphs `dh`/`gj`/… stay Latin pairs).
const ALPHABET_ALBANIAN: &[char] = latin_az!('ç', 'ë');
const ALPHABET_RUSSIAN: &[char] = &[
    'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с',
    'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я', ' ', ',', '.',
];
const ALPHABET_UKRAINIAN: &[char] = &[
    'а', 'б', 'в', 'г', 'ґ', 'д', 'е', 'є', 'ж', 'з', 'и', 'і', 'ї', 'й', 'к', 'л', 'м', 'н', 'о',
    'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ь', 'ю', 'я', ' ', ',', '.',
];
const ALPHABET_BULGARIAN: &[char] = &[
    'а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т',
    'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ь', 'ю', 'я', ' ', ',', '.',
];

/// The default alphabet when none is specified.
pub const DEFAULT_ALPHABET: u32 = ALPHABET_BASILE_ID;

// Gallery geometry (Borges-canonical).
pub const WALLS: u32 = 4;
pub const SHELVES_PER_WALL: u32 = 5;
pub const BOOKS_PER_SHELF: u32 = 35;
/// 4 * 5 * 35 = 700 books per gallery.
pub const BOOKS_PER_GALLERY: u32 = WALLS * SHELVES_PER_WALL * BOOKS_PER_SHELF;

// Book geometry.
pub const PAGES_PER_BOOK: u32 = 410;
pub const LINES_PER_PAGE: u32 = 40;
pub const CHARS_PER_LINE: u32 = 80;

pub const TITLE_LEN: usize = 24;

/// Content symbols per page (40 × 80); newlines are inserted on format only.
pub const PAGE_CONTENT_SYMBOLS: usize = (LINES_PER_PAGE * CHARS_PER_LINE) as usize;

pub const FEISTEL_ROUNDS: u32 = 12;

/// Two base-`alpha_len` digits per packed address byte (32 bytes → 64 symbols).
pub const ADDR_SYMBOLS: usize = 32 * 2;

/// Max searchable content in one book (410 pages × 3200 symbols).
pub const MAX_SEARCH_CHARS: usize = PAGE_CONTENT_SYMBOLS * PAGES_PER_BOOK as usize;

/// Named alphabet lens (id is what permalinks / Feistel keys use).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct AlphabetDef {
    pub id: u32,
    pub name: &'static str,
    pub symbols: &'static [char],
}

/// Built-in lenses (single registry — lookup by id; unknown → Basile).
pub const ALPHABET_REGISTRY: &[AlphabetDef] = &[
    AlphabetDef {
        id: ALPHABET_BORGES_ID,
        name: "Borges",
        symbols: ALPHABET_BORGES,
    },
    AlphabetDef {
        id: ALPHABET_BASILE_ID,
        name: "Basile",
        symbols: ALPHABET_BASILE,
    },
    AlphabetDef {
        id: ALPHABET_BASILE_PLUS_ID,
        name: "Basile++",
        symbols: ALPHABET_BASILE_PLUS,
    },
    AlphabetDef {
        id: ALPHABET_BASILE_HASH_ID,
        name: "Basile#",
        symbols: ALPHABET_BASILE_HASH,
    },
    AlphabetDef {
        id: ALPHABET_ITALIAN_ID,
        name: "Italian",
        symbols: ALPHABET_ITALIAN,
    },
    AlphabetDef {
        id: ALPHABET_GERMAN_ID,
        name: "German",
        symbols: ALPHABET_GERMAN,
    },
    AlphabetDef {
        id: ALPHABET_DUTCH_ID,
        name: "Dutch",
        symbols: ALPHABET_DUTCH,
    },
    AlphabetDef {
        id: ALPHABET_DANISH_NORWEGIAN_ID,
        name: "Danish/Norwegian",
        symbols: ALPHABET_DANISH_NORWEGIAN,
    },
    AlphabetDef {
        id: ALPHABET_SWEDISH_ID,
        name: "Swedish",
        symbols: ALPHABET_SWEDISH,
    },
    AlphabetDef {
        id: ALPHABET_TURKISH_ID,
        name: "Turkish",
        symbols: ALPHABET_TURKISH,
    },
    AlphabetDef {
        id: ALPHABET_FINNISH_ID,
        name: "Finnish",
        symbols: ALPHABET_FINNISH,
    },
    AlphabetDef {
        id: ALPHABET_SPANISH_ID,
        name: "Spanish",
        symbols: ALPHABET_SPANISH,
    },
    AlphabetDef {
        id: ALPHABET_ROMANIAN_ID,
        name: "Romanian",
        symbols: ALPHABET_ROMANIAN,
    },
    AlphabetDef {
        id: ALPHABET_PORTUGUESE_ID,
        name: "Portuguese",
        symbols: ALPHABET_PORTUGUESE,
    },
    AlphabetDef {
        id: ALPHABET_ESTONIAN_ID,
        name: "Estonian",
        symbols: ALPHABET_ESTONIAN,
    },
    AlphabetDef {
        id: ALPHABET_HUNGARIAN_ID,
        name: "Hungarian",
        symbols: ALPHABET_HUNGARIAN,
    },
    AlphabetDef {
        id: ALPHABET_FRENCH_ID,
        name: "French",
        symbols: ALPHABET_FRENCH,
    },
    AlphabetDef {
        id: ALPHABET_GREEK_ID,
        name: "Greek",
        symbols: ALPHABET_GREEK,
    },
    AlphabetDef {
        id: ALPHABET_POLISH_ID,
        name: "Polish",
        symbols: ALPHABET_POLISH,
    },
    AlphabetDef {
        id: ALPHABET_CZECH_ID,
        name: "Czech",
        symbols: ALPHABET_CZECH,
    },
    AlphabetDef {
        id: ALPHABET_SLOVAK_ID,
        name: "Slovak",
        symbols: ALPHABET_SLOVAK,
    },
    AlphabetDef {
        id: ALPHABET_CROATIAN_SERBIAN_ID,
        name: "Croatian/Serbian",
        symbols: ALPHABET_CROATIAN_SERBIAN,
    },
    AlphabetDef {
        id: ALPHABET_LATVIAN_ID,
        name: "Latvian",
        symbols: ALPHABET_LATVIAN,
    },
    AlphabetDef {
        id: ALPHABET_LITHUANIAN_ID,
        name: "Lithuanian",
        symbols: ALPHABET_LITHUANIAN,
    },
    AlphabetDef {
        id: ALPHABET_ALBANIAN_ID,
        name: "Albanian",
        symbols: ALPHABET_ALBANIAN,
    },
    AlphabetDef {
        id: ALPHABET_RUSSIAN_ID,
        name: "Russian",
        symbols: ALPHABET_RUSSIAN,
    },
    AlphabetDef {
        id: ALPHABET_UKRAINIAN_ID,
        name: "Ukrainian",
        symbols: ALPHABET_UKRAINIAN,
    },
    AlphabetDef {
        id: ALPHABET_BULGARIAN_ID,
        name: "Bulgarian",
        symbols: ALPHABET_BULGARIAN,
    },
];

/// Built-in lenses. Unknown ids fall back to Basile (legacy `alphabet()` behavior).
#[must_use]
pub fn alphabet_def(alphabet_id: u32) -> AlphabetDef {
    ALPHABET_REGISTRY
        .iter()
        .copied()
        .find(|a| a.id == alphabet_id)
        .unwrap_or_else(|| {
            ALPHABET_REGISTRY
                .iter()
                .copied()
                .find(|a| a.id == DEFAULT_ALPHABET)
                .expect("Basile is registered")
        })
}

/// Symbol table for an alphabet id (named European lenses + Borges / Basile).
///
/// Unknown ids use the Basile symbol table (legacy behaviour).
#[inline]
#[must_use]
pub fn alphabet(alphabet_id: u32) -> &'static [char] {
    alphabet_def(alphabet_id).symbols
}
