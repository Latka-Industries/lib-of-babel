//! Stable alphabet lens ids (permalink / lens id).
//!
//! Prefer `id == glyph_count` when free; on collision use a free id ≥ 69
//! (or a free slot that matches count, e.g. Hebrew = 30).

/// Lens ids keyed by language / alphabet name.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct AlphabetIds {
    pub borges: u32,
    /// Basile 29 — `a–z` + space, comma, period (default).
    pub basile: u32,
    /// Basile++ 48 — Basile + digits + everyday punctuation (`?!'"-:;()`).
    pub basile_plus: u32,
    /// Basile# 60 — Basile++ plus email/URL staples (`@<>/_+[]#%&=`).
    pub basile_hash: u32,
    /// Italian — `a–z` + `àèéìòù` + punct (35 glyphs; id `32` ≠ count — Spanish owns 35).
    pub italian: u32,
    /// German 33 — `a–z` + `äöüß` + punct.
    pub german: u32,
    /// Dutch 34 — `a–z` + `éëïöü` + punct.
    pub dutch: u32,
    /// Spanish 35 — `a–z` + `áéíóúñ` + punct (no `ü`).
    pub spanish: u32,
    /// Romanian — `a–z` + `ăâîșț` + punct (34 glyphs; id `36` — Dutch already owns 34).
    pub romanian: u32,
    /// Danish/Norwegian — `a–z` + `æøå` + punct (32 glyphs; id `37` — Italian owns 32).
    pub danish_norwegian: u32,
    /// Swedish — `a–z` + `äöå` + punct (32 glyphs; id `38`).
    pub swedish: u32,
    /// Turkish — official 29-letter Latin set (no `q`/`w`/`x`) + punct (32 glyphs; id `39`).
    pub turkish: u32,
    /// Finnish — `a–z` + `åäö` + punct (32 glyphs; id `40`; same glyphs as Swedish, Finnish order).
    pub finnish: u32,
    /// Portuguese 41 — `a–z` + `áàâãçéêíóôõú` + punct.
    pub portuguese: u32,
    /// Estonian — `a–z` + `õäöü` + punct (33 glyphs; id `43` — German owns 33).
    pub estonian: u32,
    /// Hungarian — `a–z` + `áéíóöőúüű` + punct (38 glyphs; id `44`).
    pub hungarian: u32,
    /// French 45 — `a–z` + full classroom accent/ligature set + punct.
    pub french: u32,
    /// Greek — monotonic modern Greek + final sigma + punct (35 glyphs; id `46` — Spanish owns 35).
    pub greek: u32,
    /// Polish — `a–z` + `ąćęłńóśźż` + punct (38 glyphs; id `47`).
    pub polish: u32,
    /// Latvian — `a–z` + `āčēģīķļņšūž` + punct (40 glyphs; id `50` — Finnish owns 40).
    pub latvian: u32,
    /// Lithuanian — `a–z` + `ąčęėįšųūž` + punct (38 glyphs; id `51`).
    pub lithuanian: u32,
    /// Czech — `a–z` + `áčďéěíňóřšťúůýž` + punct (44 glyphs; id `52`).
    pub czech: u32,
    /// Croatian/Serbian Latin — `a–z` + `čćđšž` + punct (34 glyphs; id `42` — Dutch owns 34).
    pub croatian_serbian: u32,
    /// Albanian — `a–z` + `çë` + punct (31 glyphs; digraphs omitted).
    pub albanian: u32,
    /// Slovak — `a–z` + `áäčďéíĺľňóôŕšťúýž` + punct (46 glyphs; id `57` — Greek owns 46).
    pub slovak: u32,
    /// Russian — Cyrillic 33 letters + punct (36 glyphs; id `54`).
    pub russian: u32,
    /// Ukrainian — Cyrillic 33 letters + punct (36 glyphs; id `55`).
    pub ukrainian: u32,
    /// Bulgarian — Cyrillic 30 letters + punct (33 glyphs; id `56` — German owns 33).
    pub bulgarian: u32,
    /// Icelandic — `a–z` + `áéíóúýþæðö` + punct (39 glyphs; id `49`).
    pub icelandic: u32,
    /// Slovenian — `a–z` + `čšž` + punct (32 glyphs; id `53`).
    pub slovenian: u32,
    /// Belarusian — Cyrillic 32 letters + punct (35 glyphs; id `58`).
    pub belarusian: u32,
    /// Macedonian — Cyrillic 31 letters + punct (34 glyphs; id `59`).
    pub macedonian: u32,
    /// Serbian Cyrillic — 30 letters + punct (33 glyphs; id `61`).
    pub serbian_cyrillic: u32,
    /// Catalan — `a–z` + accents + `·` + punct (40 glyphs; id `62`).
    pub catalan: u32,
    /// Basque — `a–z` + `ñç` + punct (31 glyphs; id `63`).
    pub basque: u32,
    /// Welsh — `a–z` + `âêîôûŵŷ` + punct (36 glyphs; id `64`).
    pub welsh: u32,
    /// Irish — `a–z` + `áéíóú` + punct (34 glyphs; id `65`).
    pub irish: u32,
    /// Maltese — `a–z` + `ċġħż` + punct (33 glyphs; id `66`).
    pub maltese: u32,
    /// Armenian — Eastern letters (38; no և) + punct (41 glyphs; id `67`).
    pub armenian: u32,
    /// Georgian — Mkhedruli 33 letters + punct (36 glyphs; id `68`).
    pub georgian: u32,
    /// Hebrew — 30 glyphs; id `30`.
    pub hebrew: u32,
    /// Arabic — 32 glyphs; id `69`.
    pub arabic: u32,
    /// Persian — 36 glyphs; id `70`.
    pub persian: u32,
    /// `NKo` — 36 glyphs; id `71`.
    pub nko: u32,
    /// Amharic — 234 glyphs; id `234`.
    pub amharic: u32,
    /// Swahili — 29 glyphs; id `72`.
    pub swahili: u32,
    /// Afrikaans — 45 glyphs; id `73`.
    pub afrikaans: u32,
    /// Hausa — 33 glyphs; id `74`.
    pub hausa: u32,
    /// Yoruba — 42 glyphs; id `75`.
    pub yoruba: u32,
    /// Igbo — 33 glyphs; id `76`.
    pub igbo: u32,
    /// Wolof — 34 glyphs; id `77`.
    pub wolof: u32,
    /// Tifinagh — 57 glyphs; id `78`.
    pub tifinagh: u32,
    /// Japanese — hiragana + katakāna gojūon + punct (95 glyphs; id `95`).
    pub japanese: u32,
    /// Korean — curated Hangul syllables + punct (250 glyphs; id `250`).
    pub korean: u32,
    /// Chinese Simplified — frequency pack; id `255` (frozen permalink; inventory >255).
    pub chinese: u32,
    /// Chinese Traditional — frequency pack; id `1000`.
    pub chinese_trad: u32,
    /// Hindi — clustered Devanagari; id `99`.
    pub hindi: u32,
    /// Bengali — clustered; id `100`.
    pub bengali: u32,
    /// Tamil — clustered; id `101`.
    pub tamil: u32,
    /// Telugu — clustered; id `102`.
    pub telugu: u32,
    /// Kannada — clustered; id `103`.
    pub kannada: u32,
    /// Malayalam — clustered; id `104`.
    pub malayalam: u32,
    /// Gujarati — clustered; id `105`.
    pub gujarati: u32,
    /// Punjabi — clustered; id `106`.
    pub punjabi: u32,
    /// Odia — clustered; id `107`.
    pub odia: u32,
    /// Azerbaijani — 35 glyphs; id `88` (count slot taken).
    pub azerbaijani: u32,
    /// Kazakh — 34 glyphs; id `89` (count slot taken).
    pub kazakh: u32,
    /// Uzbek — 30 glyphs; id `90` (count slot taken).
    pub uzbek: u32,
    /// Turkmen — 33 glyphs; id `91` (count slot taken).
    pub turkmen: u32,
    /// Kyrgyz — 39 glyphs; id `92` (count slot taken).
    pub kyrgyz: u32,
    /// Mongolian — 38 glyphs; id `93` (count slot taken).
    pub mongolian: u32,
    /// Filipino — 30 glyphs; id `94` (count slot taken).
    pub filipino: u32,
    /// Vietnamese — 96 glyphs; id `96`.
    pub vietnamese: u32,
    /// Thai — clustered consonants×marks; id `108` (frozen permalink; inventory >255).
    pub thai: u32,
    /// Khmer — clustered consonants×vowels; id `109` (frozen permalink; inventory >255).
    pub khmer: u32,
}

/// Built-in alphabet lens ids.
pub const ALPHABET_ID: AlphabetIds = AlphabetIds {
    borges: 25,
    basile: 29,
    basile_plus: 48,
    basile_hash: 60,
    italian: 32,
    german: 33,
    dutch: 34,
    spanish: 35,
    romanian: 36,
    danish_norwegian: 37,
    swedish: 38,
    turkish: 39,
    finnish: 40,
    portuguese: 41,
    estonian: 43,
    hungarian: 44,
    french: 45,
    greek: 46,
    polish: 47,
    latvian: 50,
    lithuanian: 51,
    czech: 52,
    croatian_serbian: 42,
    albanian: 31,
    slovak: 57,
    russian: 54,
    ukrainian: 55,
    bulgarian: 56,
    icelandic: 49,
    slovenian: 53,
    belarusian: 58,
    macedonian: 59,
    serbian_cyrillic: 61,
    catalan: 62,
    basque: 63,
    welsh: 64,
    irish: 65,
    maltese: 66,
    armenian: 67,
    georgian: 68,
    hebrew: 30,
    arabic: 69,
    persian: 70,
    nko: 71,
    amharic: 234,
    swahili: 72,
    afrikaans: 73,
    hausa: 74,
    yoruba: 75,
    igbo: 76,
    wolof: 77,
    tifinagh: 78,
    japanese: 95,
    korean: 250,
    chinese: 255,
    chinese_trad: 1000,
    hindi: 99,
    bengali: 100,
    tamil: 101,
    telugu: 102,
    kannada: 103,
    malayalam: 104,
    gujarati: 105,
    punjabi: 106,
    odia: 107,
    azerbaijani: 88,
    kazakh: 89,
    uzbek: 90,
    turkmen: 91,
    kyrgyz: 92,
    mongolian: 93,
    filipino: 94,
    vietnamese: 96,
    thai: 108,
    khmer: 109,
};
