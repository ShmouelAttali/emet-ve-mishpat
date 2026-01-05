export type AmtGlyphKey =
    | "ATNACH"
    | "REVIa"
    | "PAZER"
    | "TSINOR"
    | "DCHI"
    | "OLE"
    | "YORED"
    | "QADMA"
    | "MAHAPAKH"
    | "ILUY"
    | "MUNACH"
    | "TIPCHA"
    | "MUGRASH_MARK" // e.g. ֝
    | "GALGAL"
    ;

export const GLYPH_TO_KEY: Record<string, AmtGlyphKey> = {
    "U+0591": "ATNACH",        // ֑  (your "אתנח")
    "U+0597": "REVIa",         // ֗  (your "רביע")
    "U+05A1": "PAZER",         // ֡  (your "פזר")
    "U+05AE": "TSINOR",        // ֮  (your "צינור" / "צינורית" by position)
    "U+05AB": "OLE",           // ֫  (your "עולה")
    "U+05A5": "YORED",         // ֥  (your "יורד" / "מירכא" by context)
    "U+05A8": "QADMA",         // ֨  (קדמא -> אזלא לגרמיה with pasek)
    "U+05A4": "MAHAPAKH",      // ֤  (מהפך -> מהפך לגרמיה with pasek)
    "U+05AC": "ILUY",          // ֬  (עילוי)
    "U+05A3": "MUNACH",        // ֣  (מונח)
    "U+0596": "TIPCHA", // ֖ טיפחא
    "U+05AD": "DCHI",   // ֭ דחי
    "U+059D": "MUGRASH_MARK",  // ֝  (used in "רביע מוגרש" pattern with רביע)
    "U+05AA": "GALGAL", // ֪  גלגל (משרת)
};
