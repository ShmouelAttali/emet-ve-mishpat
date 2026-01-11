import {Taam} from "@/lib/taamim/model/taam";

export type AmtGlyphKey =
    | "METEG"
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
    | "SHALSHELET"
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
    "U+05BD": "METEG", // מתג או סילוק
    "U+0593": "SHALSHELET", // שלשלת
};

export const TAAM_TO_AMT_GLYPH_KEY: Record<Taam, AmtGlyphKey | null> = {
    // --- מלכים ---
    SILLUQ: "METEG",        // סילוק מזוהה קונטקסטואלית (סוף פסוק), בנוסף למתג
    ATNACH: "ATNACH",
    OLEH_VEYORED: "YORED",

    // --- מפסיקים ---
    PAZER: "PAZER",

    REVIa: "REVIa",
    REVIa_MUGRASH: "REVIa",
    REVIa_QATAN: "REVIa",
    REVIa_GADOL: "REVIa",

    TSINOR: "TSINOR",
    TSINORIT: "TSINOR",

    DCHI: "DCHI",

    // --- לגרמיה ---
    MAHAPAKH_LEGARMEH: "MAHAPAKH",
    AZLA_LEGARMEH: "QADMA",

    // --- משרתים ---
    QADMA: "QADMA",
    MAHAPAKH: "MAHAPAKH",
    MERCHA: "YORED",
    MUNACH: "MUNACH",
    TIPCHA: "TIPCHA",
    ILUY: "ILUY",
    GALGAL: "GALGAL",

    // --- שלשלת ---
    SHALSHELET_GEDOLA: "SHALSHELET",
    SHALSHELET_KETANA: "SHALSHELET",

    // --- fallback ---
    UNKNOWN: null,
};

const KEY_TO_U: Record<AmtGlyphKey, string> = Object.entries(GLYPH_TO_KEY).reduce(
    (acc, [u, key]) => {
        acc[key] = u;
        return acc;
    },
    {} as Record<AmtGlyphKey, string>
);

export function uOf(key: AmtGlyphKey): string {
    const u = KEY_TO_U[key];
    if (!u) throw new Error(`Missing KEY_TO_U for ${key}`);
    return u;
}
