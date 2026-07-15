//! Glyph tables for each alphabet lens.
//!
//! Order is part of the frozen mapping — do not reorder without bumping
//! [`crate::config::GENERATOR_VERSION`].

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

/// Glyph vectors keyed by language / alphabet name.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct AlphabetTables {
    pub borges: &'static [char],
    pub basile: &'static [char],
    pub basile_plus: &'static [char],
    pub basile_hash: &'static [char],
    pub italian: &'static [char],
    pub german: &'static [char],
    pub dutch: &'static [char],
    /// Shared Norsk/Dansk orthography (`æøå`; not Swedish `äöå`).
    pub danish_norwegian: &'static [char],
    pub swedish: &'static [char],
    /// Official Turkish letters (dotless `ı` + `çğöşü`; no `q`/`w`/`x`).
    pub turkish: &'static [char],
    /// Finnish order `åäö` (same glyph set as Swedish, different mapping).
    pub finnish: &'static [char],
    pub spanish: &'static [char],
    /// Modern Romanian (comma-below `ș`/`ț`, not cedilla).
    pub romanian: &'static [char],
    pub portuguese: &'static [char],
    /// Core Estonian vowels (`õäöü`; loan `š`/`ž` omitted).
    pub estonian: &'static [char],
    pub hungarian: &'static [char],
    pub french: &'static [char],
    /// Monotonic modern Greek: 24 letters + final sigma + tonos vowels.
    pub greek: &'static [char],
    pub polish: &'static [char],
    pub czech: &'static [char],
    pub slovak: &'static [char],
    /// Shared BCMS Latin extras (`čćđšž`).
    pub croatian_serbian: &'static [char],
    pub latvian: &'static [char],
    pub lithuanian: &'static [char],
    /// Single-letter Albanian extras (digraphs `dh`/`gj`/… stay Latin pairs).
    pub albanian: &'static [char],
    pub russian: &'static [char],
    pub ukrainian: &'static [char],
    pub bulgarian: &'static [char],
    pub icelandic: &'static [char],
    pub slovenian: &'static [char],
    pub belarusian: &'static [char],
    pub macedonian: &'static [char],
    pub serbian_cyrillic: &'static [char],
    pub catalan: &'static [char],
    pub basque: &'static [char],
    pub welsh: &'static [char],
    pub irish: &'static [char],
    pub maltese: &'static [char],
    /// Eastern Armenian (without ligature և — write ե+վ).
    pub armenian: &'static [char],
    pub georgian: &'static [char],
    pub hebrew: &'static [char],
    pub arabic: &'static [char],
    pub persian: &'static [char],
    pub nko: &'static [char],
    pub amharic: &'static [char],
    pub swahili: &'static [char],
    pub afrikaans: &'static [char],
    pub hausa: &'static [char],
    pub yoruba: &'static [char],
    pub igbo: &'static [char],
    pub wolof: &'static [char],
    pub tifinagh: &'static [char],
}

/// Built-in alphabet glyph tables.
pub const ALPHABET_TABLE: AlphabetTables = AlphabetTables {
    borges: &[
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
        's', 't', 'u', 'v', ' ', ',', '.',
    ],
    basile: latin_az!(),
    basile_plus: basile_plus_extras!(),
    basile_hash: basile_plus_extras!('@', '<', '>', '/', '_', '+', '[', ']', '#', '%', '&', '='),
    italian: latin_az!('à', 'è', 'é', 'ì', 'ò', 'ù'),
    german: latin_az!('ä', 'ö', 'ü', 'ß'),
    dutch: latin_az!('é', 'ë', 'ï', 'ö', 'ü'),
    danish_norwegian: latin_az!('æ', 'ø', 'å'),
    swedish: latin_az!('ä', 'ö', 'å'),
    turkish: &[
        'a', 'b', 'c', 'ç', 'd', 'e', 'f', 'g', 'ğ', 'h', 'ı', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
        'ö', 'p', 'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z', ' ', ',', '.',
    ],
    finnish: latin_az!('å', 'ä', 'ö'),
    spanish: latin_az!('á', 'é', 'í', 'ó', 'ú', 'ñ'),
    romanian: latin_az!('ă', 'â', 'î', 'ș', 'ț'),
    portuguese: latin_az!('á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'),
    estonian: latin_az!('õ', 'ä', 'ö', 'ü'),
    hungarian: latin_az!('á', 'é', 'í', 'ó', 'ö', 'ő', 'ú', 'ü', 'ű'),
    french: latin_az!(
        'à', 'â', 'æ', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'œ', 'ù', 'û', 'ü', 'ÿ'
    ),
    greek: &[
        'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ',
        'ς', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'ά', 'έ', 'ή', 'ί', 'ό', 'ύ', 'ώ', ' ', ',', '.',
    ],
    polish: latin_az!('ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'),
    czech: latin_az!(
        'á', 'č', 'ď', 'é', 'ě', 'í', 'ň', 'ó', 'ř', 'š', 'ť', 'ú', 'ů', 'ý', 'ž'
    ),
    slovak: latin_az!(
        'á', 'ä', 'č', 'ď', 'é', 'í', 'ĺ', 'ľ', 'ň', 'ó', 'ô', 'ŕ', 'š', 'ť', 'ú', 'ý', 'ž'
    ),
    croatian_serbian: latin_az!('č', 'ć', 'đ', 'š', 'ž'),
    latvian: latin_az!('ā', 'č', 'ē', 'ģ', 'ī', 'ķ', 'ļ', 'ņ', 'š', 'ū', 'ž'),
    lithuanian: latin_az!('ą', 'č', 'ę', 'ė', 'į', 'š', 'ų', 'ū', 'ž'),
    albanian: latin_az!('ç', 'ë'),
    russian: &[
        'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р',
        'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я', ' ', ',', '.',
    ],
    ukrainian: &[
        'а', 'б', 'в', 'г', 'ґ', 'д', 'е', 'є', 'ж', 'з', 'и', 'і', 'ї', 'й', 'к', 'л', 'м', 'н',
        'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ь', 'ю', 'я', ' ', ',', '.',
    ],
    bulgarian: &[
        'а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с',
        'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ь', 'ю', 'я', ' ', ',', '.',
    ],
    icelandic: latin_az!('á', 'é', 'í', 'ó', 'ú', 'ý', 'þ', 'æ', 'ð', 'ö'),
    slovenian: latin_az!('č', 'š', 'ž'),
    belarusian: &[
        'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'і', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р',
        'с', 'т', 'у', 'ў', 'ф', 'х', 'ц', 'ч', 'ш', 'ы', 'ь', 'э', 'ю', 'я', ' ', ',', '.',
    ],
    macedonian: &[
        'а', 'б', 'в', 'г', 'д', 'ѓ', 'е', 'ж', 'з', 'ѕ', 'и', 'ј', 'к', 'л', 'љ', 'м', 'н', 'њ',
        'о', 'п', 'р', 'с', 'т', 'ќ', 'у', 'ф', 'х', 'ц', 'ч', 'џ', 'ш', ' ', ',', '.',
    ],
    serbian_cyrillic: &[
        'а', 'б', 'в', 'г', 'д', 'ђ', 'е', 'ж', 'з', 'и', 'ј', 'к', 'л', 'љ', 'м', 'н', 'њ', 'о',
        'п', 'р', 'с', 'т', 'ћ', 'у', 'ф', 'х', 'ц', 'ч', 'џ', 'ш', ' ', ',', '.',
    ],
    catalan: latin_az!('à', 'è', 'é', 'í', 'ï', 'ò', 'ó', 'ú', 'ü', 'ç', '·'),
    basque: latin_az!('ñ', 'ç'),
    welsh: latin_az!('â', 'ê', 'î', 'ô', 'û', 'ŵ', 'ŷ'),
    irish: latin_az!('á', 'é', 'í', 'ó', 'ú'),
    maltese: latin_az!('ċ', 'ġ', 'ħ', 'ż'),
    armenian: &[
        'ա', 'բ', 'գ', 'դ', 'ե', 'զ', 'է', 'ը', 'թ', 'ժ', 'ի', 'լ', 'խ', 'ծ', 'կ', 'հ', 'ձ', 'ղ',
        'ճ', 'մ', 'յ', 'ն', 'շ', 'ո', 'չ', 'պ', 'ջ', 'ռ', 'ս', 'վ', 'տ', 'ր', 'ց', 'ւ', 'փ', 'ք',
        'օ', 'ֆ', ' ', ',', '.',
    ],
    georgian: &[
        'ა', 'ბ', 'გ', 'დ', 'ე', 'ვ', 'ზ', 'თ', 'ი', 'კ', 'ლ', 'მ', 'ნ', 'ო', 'პ', 'ჟ', 'რ', 'ს',
        'ტ', 'უ', 'ფ', 'ქ', 'ღ', 'ყ', 'შ', 'ჩ', 'ც', 'ძ', 'წ', 'ჭ', 'ხ', 'ჯ', 'ჰ', ' ', ',', '.',
    ],
    hebrew: &[
        'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'ך', 'כ', 'ל', 'ם', 'מ', 'ן', 'נ', 'ס',
        'ע', 'ף', 'פ', 'ץ', 'צ', 'ק', 'ר', 'ש', 'ת', ' ', ',', '.',
    ],
    arabic: &[
        'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع',
        'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ء', ' ', ',', '.',
    ],
    persian: &[
        'ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض',
        'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'ه', 'و', 'ی', 'ء', ' ', ',', '.',
    ],
    nko: &[
        'ߊ', 'ߋ', 'ߌ', 'ߍ', 'ߎ', 'ߏ', 'ߐ', 'ߑ', 'ߒ', 'ߓ', 'ߔ', 'ߕ', 'ߖ', 'ߗ', 'ߘ', 'ߙ', 'ߚ', 'ߛ',
        'ߜ', 'ߝ', 'ߞ', 'ߟ', 'ߠ', 'ߡ', 'ߢ', 'ߣ', 'ߤ', 'ߥ', 'ߦ', 'ߧ', 'ߨ', 'ߩ', 'ߪ', ' ', ',', '.',
    ],
    amharic: &[
        'ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ', 'ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ', 'ሐ', 'ሑ', 'ሒ', 'ሓ',
        'ሔ', 'ሕ', 'ሖ', 'መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ', 'ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ', 'ረ',
        'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ', 'ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ', 'ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ',
        'ሽ', 'ሾ', 'ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ', 'በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ', 'ተ', 'ቱ',
        'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ', 'ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ', 'ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ',
        'ኆ', 'ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ', 'ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ', 'አ', 'ኡ', 'ኢ',
        'ኣ', 'ኤ', 'እ', 'ኦ', 'ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ', 'ኸ', 'ኹ', 'ኺ', 'ኻ', 'ኼ', 'ኽ', 'ኾ',
        'ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ', 'ዐ', 'ዑ', 'ዒ', 'ዓ', 'ዔ', 'ዕ', 'ዖ', 'ዘ', 'ዙ', 'ዚ', 'ዛ',
        'ዜ', 'ዝ', 'ዞ', 'ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ', 'የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ', 'ደ',
        'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ', 'ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ', 'ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ',
        'ግ', 'ጎ', 'ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ', 'ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ', 'ጰ', 'ጱ',
        'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ', 'ጸ', 'ጹ', 'ጺ', 'ጻ', 'ጼ', 'ጽ', 'ጾ', 'ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ',
        'ፆ', 'ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ', 'ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ', ' ', ',', '.',
    ],
    swahili: &[
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
        's', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' ', ',', '.',
    ],
    afrikaans: &[
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
        's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'á', 'ä', 'é', 'ê', 'ë', 'è', 'í', 'î', 'ï', 'ó',
        'ô', 'ö', 'ú', 'û', 'ü', 'ý', ' ', ',', '.',
    ],
    hausa: &[
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
        's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ɓ', 'ɗ', 'ƙ', 'ƴ', ' ', ',', '.',
    ],
    yoruba: &[
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
        's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ẹ', 'ọ', 'ṣ', 'á', 'à', 'é', 'è', 'í', 'ì', 'ó',
        'ò', 'ú', 'ù', ' ', ',', '.',
    ],
    igbo: &[
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
        's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ị', 'ñ', 'ọ', 'ụ', ' ', ',', '.',
    ],
    wolof: &[
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
        's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ë', 'ñ', 'à', 'é', 'ó', ' ', ',', '.',
    ],
    tifinagh: &[
        'ⴰ', 'ⴱ', 'ⴲ', 'ⴳ', 'ⴴ', 'ⴵ', 'ⴶ', 'ⴷ', 'ⴸ', 'ⴹ', 'ⴺ', 'ⴻ', 'ⴼ', 'ⴽ', 'ⴾ', 'ⴿ', 'ⵀ', 'ⵁ',
        'ⵂ', 'ⵃ', 'ⵄ', 'ⵅ', 'ⵆ', 'ⵇ', 'ⵈ', 'ⵉ', 'ⵊ', 'ⵋ', 'ⵌ', 'ⵍ', 'ⵎ', 'ⵏ', 'ⵐ', 'ⵑ', 'ⵒ', 'ⵓ',
        'ⵔ', 'ⵕ', 'ⵖ', 'ⵗ', 'ⵘ', 'ⵙ', 'ⵚ', 'ⵛ', 'ⵜ', 'ⵝ', 'ⵞ', 'ⵟ', 'ⵠ', 'ⵡ', 'ⵢ', 'ⵣ', 'ⵤ', 'ⵥ',
        ' ', ',', '.',
    ],
};
