//! Glyph tables for each alphabet lens.
//!
//! Order is part of the frozen mapping — do not reorder without bumping
//! [`crate::config::GENERATOR_VERSION`].

/// Latin `a–z` + extras + trailing space/comma/period.
macro_rules! latin_az {
    ($($extra:literal),* $(,)?) => {
        &[
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q",
            "r", "s", "t", "u", "v", "w", "x", "y", "z", $($extra,)* " ", ",", ".",
        ]
    };
}

/// Curated glyph set + trailing space/comma/period (non-`latin_az` lenses).
macro_rules! with_trail_punct {
    ($($glyph:expr),+ $(,)?) => {
        &[$($glyph,)+ " ", ",", "."]
    };
}

/// Basile++ extras, with optional trailing extras (Basile# layers email/URL on top).
macro_rules! basile_plus_extras {
    ($($more:literal),* $(,)?) => {
        latin_az!(
            "?", "!", "'", "\"", "-", ":", ";", "(", ")", "0", "1", "2", "3", "4", "5", "6", "7",
            "8", "9" $(, $more)*
        )
    };
}

use super::generated::packs::{
    AMHARIC, BENGALI, CHINESE, CHINESE_TRAD, GUJARATI, HINDI, JAPANESE, KANNADA, KHMER, KOREAN,
    MALAYALAM, ODIA, PUNJABI, TAMIL, TELUGU, THAI, VIETNAMESE,
};

/// Glyph vectors keyed by language / alphabet name.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct AlphabetTables {
    pub borges: &'static [&'static str],
    pub basile: &'static [&'static str],
    pub basile_plus: &'static [&'static str],
    pub basile_hash: &'static [&'static str],
    pub italian: &'static [&'static str],
    pub german: &'static [&'static str],
    pub dutch: &'static [&'static str],
    /// Shared Norsk/Dansk orthography (`æøå`; not Swedish `äöå`).
    pub danish_norwegian: &'static [&'static str],
    pub swedish: &'static [&'static str],
    /// Official Turkish letters (dotless `ı` + `çğöşü`; no `q`/`w`/`x`).
    pub turkish: &'static [&'static str],
    /// Finnish order `åäö` (same glyph set as Swedish, different mapping).
    pub finnish: &'static [&'static str],
    pub spanish: &'static [&'static str],
    /// Modern Romanian (comma-below `ș`/`ț`, not cedilla).
    pub romanian: &'static [&'static str],
    pub portuguese: &'static [&'static str],
    /// Core Estonian vowels (`õäöü`; loan `š`/`ž` omitted).
    pub estonian: &'static [&'static str],
    pub hungarian: &'static [&'static str],
    pub french: &'static [&'static str],
    /// Monotonic modern Greek: 24 letters + final sigma + tonos vowels.
    pub greek: &'static [&'static str],
    pub polish: &'static [&'static str],
    pub czech: &'static [&'static str],
    pub slovak: &'static [&'static str],
    /// Shared BCMS Latin extras (`čćđšž`).
    pub croatian_serbian: &'static [&'static str],
    pub latvian: &'static [&'static str],
    pub lithuanian: &'static [&'static str],
    /// Single-letter Albanian extras (digraphs `dh`/`gj`/… stay Latin pairs).
    pub albanian: &'static [&'static str],
    pub russian: &'static [&'static str],
    pub ukrainian: &'static [&'static str],
    pub bulgarian: &'static [&'static str],
    pub icelandic: &'static [&'static str],
    pub slovenian: &'static [&'static str],
    pub belarusian: &'static [&'static str],
    pub macedonian: &'static [&'static str],
    pub serbian_cyrillic: &'static [&'static str],
    pub catalan: &'static [&'static str],
    pub basque: &'static [&'static str],
    pub welsh: &'static [&'static str],
    pub irish: &'static [&'static str],
    pub maltese: &'static [&'static str],
    /// Eastern Armenian (without ligature և — write ե+վ).
    pub armenian: &'static [&'static str],
    pub georgian: &'static [&'static str],
    pub hebrew: &'static [&'static str],
    pub arabic: &'static [&'static str],
    pub persian: &'static [&'static str],
    pub nko: &'static [&'static str],
    pub amharic: &'static [&'static str],
    pub swahili: &'static [&'static str],
    pub afrikaans: &'static [&'static str],
    pub hausa: &'static [&'static str],
    pub yoruba: &'static [&'static str],
    pub igbo: &'static [&'static str],
    pub wolof: &'static [&'static str],
    pub tifinagh: &'static [&'static str],
    /// Hiragana + katakāna gojūon (ゐ/ゑ omitted); no dakuten / small kana.
    pub japanese: &'static [&'static str],
    /// Frequent Hangul syllables (FrequencyWords ko_50k token → syllable counts).
    pub korean: &'static [&'static str],
    /// Top Simplified characters (Jun Da modern Chinese frequency; curated pack).
    pub chinese: &'static [&'static str],
    /// Top Traditional characters (Jun Da → OpenCC s2tw; curated pack).
    pub chinese_trad: &'static [&'static str],
    /// Hindi clustered Devanagari (bases + C+matra cells).
    pub hindi: &'static [&'static str],
    /// Bengali clustered cells.
    pub bengali: &'static [&'static str],
    /// Tamil clustered cells.
    pub tamil: &'static [&'static str],
    /// Telugu clustered cells.
    pub telugu: &'static [&'static str],
    /// Kannada clustered cells.
    pub kannada: &'static [&'static str],
    /// Malayalam clustered cells.
    pub malayalam: &'static [&'static str],
    /// Gujarati clustered cells.
    pub gujarati: &'static [&'static str],
    /// Punjabi clustered cells.
    pub punjabi: &'static [&'static str],
    /// Odia clustered cells.
    pub odia: &'static [&'static str],
    /// Azerbaijani Latin (ə/ğ/x/ı/…) + trail punct.
    pub azerbaijani: &'static [&'static str],
    /// Kazakh Latin (ä/ğ/ñ/ū/…) + trail punct.
    pub kazakh: &'static [&'static str],
    /// Uzbek Latin (a–z + ʻ U+02BB) + trail punct.
    pub uzbek: &'static [&'static str],
    /// Turkmen Latin (ä/ň/ž/ý/…) + trail punct.
    pub turkmen: &'static [&'static str],
    /// Kyrgyz Cyrillic (ң/ө/ү) + trail punct.
    pub kyrgyz: &'static [&'static str],
    /// Mongolian Cyrillic (ө/ү) + trail punct.
    pub mongolian: &'static [&'static str],
    /// Filipino Latin (a–z + ñ) + trail punct.
    pub filipino: &'static [&'static str],
    /// Vietnamese Latin (đ + tone vowels) + trail punct.
    pub vietnamese: &'static [&'static str],
    /// Thai clustered cells (no lone combining marks).
    pub thai: &'static [&'static str],
    /// Khmer clustered cells (no lone combining marks).
    pub khmer: &'static [&'static str],
}

/// Built-in alphabet glyph tables.
pub const ALPHABET_TABLE: AlphabetTables = AlphabetTables {
    borges: &[
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", " ", ",", ".",
    ],
    basile: latin_az!(),
    basile_plus: basile_plus_extras!(),
    basile_hash: basile_plus_extras!("@", "<", ">", "/", "_", "+", "[", "]", "#", "%", "&", "="),
    italian: latin_az!("à", "è", "é", "ì", "ò", "ù"),
    german: latin_az!("ä", "ö", "ü", "ß"),
    dutch: latin_az!("é", "ë", "ï", "ö", "ü"),
    danish_norwegian: latin_az!("æ", "ø", "å"),
    swedish: latin_az!("ä", "ö", "å"),
    turkish: &[
        "a", "b", "c", "ç", "d", "e", "f", "g", "ğ", "h", "ı", "i", "j", "k", "l", "m", "n", "o",
        "ö", "p", "r", "s", "ş", "t", "u", "ü", "v", "y", "z", " ", ",", ".",
    ],
    finnish: latin_az!("å", "ä", "ö"),
    spanish: latin_az!("á", "é", "í", "ó", "ú", "ñ"),
    romanian: latin_az!("ă", "â", "î", "ș", "ț"),
    portuguese: latin_az!("á", "à", "â", "ã", "ç", "é", "ê", "í", "ó", "ô", "õ", "ú"),
    estonian: latin_az!("õ", "ä", "ö", "ü"),
    hungarian: latin_az!("á", "é", "í", "ó", "ö", "ő", "ú", "ü", "ű"),
    french: latin_az!(
        "à", "â", "æ", "ç", "é", "è", "ê", "ë", "î", "ï", "ô", "œ", "ù", "û", "ü", "ÿ"
    ),
    greek: &[
        "α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ρ", "σ",
        "ς", "τ", "υ", "φ", "χ", "ψ", "ω", "ά", "έ", "ή", "ί", "ό", "ύ", "ώ", " ", ",", ".",
    ],
    polish: latin_az!("ą", "ć", "ę", "ł", "ń", "ó", "ś", "ź", "ż"),
    czech: latin_az!(
        "á", "č", "ď", "é", "ě", "í", "ň", "ó", "ř", "š", "ť", "ú", "ů", "ý", "ž"
    ),
    slovak: latin_az!(
        "á", "ä", "č", "ď", "é", "í", "ĺ", "ľ", "ň", "ó", "ô", "ŕ", "š", "ť", "ú", "ý", "ž"
    ),
    croatian_serbian: latin_az!("č", "ć", "đ", "š", "ž"),
    latvian: latin_az!("ā", "č", "ē", "ģ", "ī", "ķ", "ļ", "ņ", "š", "ū", "ž"),
    lithuanian: latin_az!("ą", "č", "ę", "ė", "į", "š", "ų", "ū", "ž"),
    albanian: latin_az!("ç", "ë"),
    russian: &[
        "а", "б", "в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "п", "р",
        "с", "т", "у", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я", " ", ",", ".",
    ],
    ukrainian: &[
        "а", "б", "в", "г", "ґ", "д", "е", "є", "ж", "з", "и", "і", "ї", "й", "к", "л", "м", "н",
        "о", "п", "р", "с", "т", "у", "ф", "х", "ц", "ч", "ш", "щ", "ь", "ю", "я", " ", ",", ".",
    ],
    bulgarian: &[
        "а", "б", "в", "г", "д", "е", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "п", "р", "с",
        "т", "у", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ь", "ю", "я", " ", ",", ".",
    ],
    icelandic: latin_az!("á", "é", "í", "ó", "ú", "ý", "þ", "æ", "ð", "ö"),
    slovenian: latin_az!("č", "š", "ž"),
    belarusian: &[
        "а", "б", "в", "г", "д", "е", "ё", "ж", "з", "і", "й", "к", "л", "м", "н", "о", "п", "р",
        "с", "т", "у", "ў", "ф", "х", "ц", "ч", "ш", "ы", "ь", "э", "ю", "я", " ", ",", ".",
    ],
    macedonian: &[
        "а", "б", "в", "г", "д", "ѓ", "е", "ж", "з", "ѕ", "и", "ј", "к", "л", "љ", "м", "н", "њ",
        "о", "п", "р", "с", "т", "ќ", "у", "ф", "х", "ц", "ч", "џ", "ш", " ", ",", ".",
    ],
    serbian_cyrillic: &[
        "а", "б", "в", "г", "д", "ђ", "е", "ж", "з", "и", "ј", "к", "л", "љ", "м", "н", "њ", "о",
        "п", "р", "с", "т", "ћ", "у", "ф", "х", "ц", "ч", "џ", "ш", " ", ",", ".",
    ],
    catalan: latin_az!("à", "è", "é", "í", "ï", "ò", "ó", "ú", "ü", "ç", "·"),
    basque: latin_az!("ñ", "ç"),
    welsh: latin_az!("â", "ê", "î", "ô", "û", "ŵ", "ŷ"),
    irish: latin_az!("á", "é", "í", "ó", "ú"),
    maltese: latin_az!("ċ", "ġ", "ħ", "ż"),
    armenian: &[
        "ա", "բ", "գ", "դ", "ե", "զ", "է", "ը", "թ", "ժ", "ի", "լ", "խ", "ծ", "կ", "հ", "ձ", "ղ",
        "ճ", "մ", "յ", "ն", "շ", "ո", "չ", "պ", "ջ", "ռ", "ս", "վ", "տ", "ր", "ց", "ւ", "փ", "ք",
        "օ", "ֆ", " ", ",", ".",
    ],
    georgian: &[
        "ა", "ბ", "გ", "დ", "ე", "ვ", "ზ", "თ", "ი", "კ", "ლ", "მ", "ნ", "ო", "პ", "ჟ", "რ", "ს",
        "ტ", "უ", "ფ", "ქ", "ღ", "ყ", "შ", "ჩ", "ც", "ძ", "წ", "ჭ", "ხ", "ჯ", "ჰ", " ", ",", ".",
    ],
    hebrew: &[
        "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "ך", "כ", "ל", "ם", "מ", "ן", "נ", "ס",
        "ע", "ף", "פ", "ץ", "צ", "ק", "ר", "ש", "ת", " ", ",", ".",
    ],
    arabic: &[
        "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع",
        "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي", "ء", " ", ",", ".",
    ],
    persian: &[
        "ا", "ب", "پ", "ت", "ث", "ج", "چ", "ح", "خ", "د", "ذ", "ر", "ز", "ژ", "س", "ش", "ص", "ض",
        "ط", "ظ", "ع", "غ", "ف", "ق", "ک", "گ", "ل", "م", "ن", "ه", "و", "ی", "ء", " ", ",", ".",
    ],
    nko: &[
        "ߊ", "ߋ", "ߌ", "ߍ", "ߎ", "ߏ", "ߐ", "ߑ", "ߒ", "ߓ", "ߔ", "ߕ", "ߖ", "ߗ", "ߘ", "ߙ", "ߚ", "ߛ",
        "ߜ", "ߝ", "ߞ", "ߟ", "ߠ", "ߡ", "ߢ", "ߣ", "ߤ", "ߥ", "ߦ", "ߧ", "ߨ", "ߩ", "ߪ", " ", ",", ".",
    ],
    amharic: AMHARIC,
    swahili: &[
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", " ", ",", ".",
    ],
    afrikaans: &[
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", "á", "ä", "é", "ê", "ë", "è", "í", "î", "ï", "ó",
        "ô", "ö", "ú", "û", "ü", "ý", " ", ",", ".",
    ],
    hausa: &[
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", "ɓ", "ɗ", "ƙ", "ƴ", " ", ",", ".",
    ],
    yoruba: &[
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", "ẹ", "ọ", "ṣ", "á", "à", "é", "è", "í", "ì", "ó",
        "ò", "ú", "ù", " ", ",", ".",
    ],
    igbo: &[
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", "ị", "ñ", "ọ", "ụ", " ", ",", ".",
    ],
    wolof: &[
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", "ë", "ñ", "à", "é", "ó", " ", ",", ".",
    ],
    tifinagh: &[
        "ⴰ", "ⴱ", "ⴲ", "ⴳ", "ⴴ", "ⴵ", "ⴶ", "ⴷ", "ⴸ", "ⴹ", "ⴺ", "ⴻ", "ⴼ", "ⴽ", "ⴾ", "ⴿ", "ⵀ", "ⵁ",
        "ⵂ", "ⵃ", "ⵄ", "ⵅ", "ⵆ", "ⵇ", "ⵈ", "ⵉ", "ⵊ", "ⵋ", "ⵌ", "ⵍ", "ⵎ", "ⵏ", "ⵐ", "ⵑ", "ⵒ", "ⵓ",
        "ⵔ", "ⵕ", "ⵖ", "ⵗ", "ⵘ", "ⵙ", "ⵚ", "ⵛ", "ⵜ", "ⵝ", "ⵞ", "ⵟ", "ⵠ", "ⵡ", "ⵢ", "ⵣ", "ⵤ", "ⵥ",
        " ", ",", ".",
    ],
    // Hiragana + katakāna gojūon (ゐ/ゑ omitted); no dakuten / small kana.
    japanese: JAPANESE,
    korean: KOREAN,
    chinese: CHINESE,
    chinese_trad: CHINESE_TRAD,
    hindi: HINDI,
    bengali: BENGALI,
    tamil: TAMIL,
    telugu: TELUGU,
    kannada: KANNADA,
    malayalam: MALAYALAM,
    gujarati: GUJARATI,
    punjabi: PUNJABI,
    odia: ODIA,
    azerbaijani: with_trail_punct!(
        "a", "b", "c", "ç", "d", "e", "ə", "f", "g", "ğ", "h", "x", "ı", "i", "j", "k", "q", "l",
        "m", "n", "o", "ö", "p", "r", "s", "ş", "t", "u", "ü", "v", "y", "z",
    ),
    kazakh: with_trail_punct!(
        "a", "ä", "b", "d", "e", "f", "g", "ğ", "h", "ı", "i", "j", "k", "l", "m", "n", "ñ", "o",
        "ö", "p", "q", "r", "s", "ş", "t", "u", "ū", "ü", "v", "y", "z",
    ),
    uzbek: with_trail_punct!(
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", "ʻ",
    ),
    turkmen: with_trail_punct!(
        "a", "b", "ç", "d", "e", "ä", "f", "g", "h", "i", "j", "ž", "k", "l", "m", "n", "ň", "o",
        "ö", "p", "r", "s", "ş", "t", "u", "ü", "w", "y", "ý", "z",
    ),
    kyrgyz: with_trail_punct!(
        "а", "б", "в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "ң", "о", "ө",
        "п", "р", "с", "т", "у", "ү", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я",
    ),
    mongolian: with_trail_punct!(
        "а", "б", "в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "ө", "п",
        "р", "с", "т", "у", "ү", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я",
    ),
    filipino: with_trail_punct!(
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
        "s", "t", "u", "v", "w", "x", "y", "z", "ñ",
    ),
    vietnamese: VIETNAMESE,
    thai: THAI,
    khmer: KHMER,
};
