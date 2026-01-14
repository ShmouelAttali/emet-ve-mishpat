import {AmtGlyphKey} from "@/lib/taamim/amtRegistry";

import {Role} from "@/lib/taamim/types";

export type Taam =
    | "SILLUQ"
    | "ATNACH"
    | "OLEH_VEYORED"
    | "PAZER"
    | "REVIa"
    | "REVIa_MUGRASH"
    | "REVIa_QATAN"
    | "REVIa_GADOL"
    | "TSINOR"
    | "TSINORIT"
    | "DCHI"
    | "MAHAPAKH_LEGARMEH"
    | "AZLA_LEGARMEH"
    | "QADMA"
    | "MAHAPAKH"
    | "MERCHA"
    | "MUNACH"
    | "TIPCHA"
    | "ILUY"
    | "GALGAL"
    | "SHALSHELET_GEDOLA"
    | "SHALSHELET_KETANA"
    | "UNKNOWN";

export const TAAM_META: Record<Taam, { hebName: string; role: Role; glyphs: AmtGlyphKey[]; }> = {
    MUNACH: {hebName: "מונח", role: "mesharet", glyphs: ["MUNACH"]},
    GALGAL: {hebName: "גלגל", role: "mesharet", glyphs: ["GALGAL"]},
    ILUY: {hebName: "עילוי", role: "mesharet", glyphs: ["ILUY"]},
    MERCHA: {hebName: "מרכא", role: "mesharet", glyphs: ["YORED"]},
    TIPCHA: {hebName: "טיפחא", role: "mesharet", glyphs: ["TIPCHA"]},
    SHALSHELET_GEDOLA: {hebName: "שלשלת גדולה", role: "mafsik", glyphs: ["SHALSHELET"]},
    SHALSHELET_KETANA: {hebName: "שלשלת קטנה", role: "mesharet", glyphs: ["SHALSHELET"]},
    SILLUQ: {hebName: "סילוק", role: "mafsik", glyphs: ["METEG"]},
    ATNACH: {hebName: "אתנח", role: "mafsik", glyphs: ["ATNACH"]},
    OLEH_VEYORED: {hebName: "עולה ויורד", role: "mafsik", glyphs: ["YORED", "OLE"]},
    PAZER: {hebName: "פזר", role: "mafsik", glyphs: ["PAZER"]},
    REVIa: {hebName: "רביע", role: "mafsik", glyphs: ["REVIa"]},
    REVIa_MUGRASH: {hebName: "רביע מוגרש", role: "mafsik", glyphs: ["REVIa", "MUGRASH_MARK"]},
    REVIa_QATAN: {hebName: "רביע קטן", role: "mafsik", glyphs: ["REVIa"]},
    REVIa_GADOL: {hebName: "רביע גדול", role: "mafsik", glyphs: ["REVIa"]},
    TSINOR: {hebName: "צינור", role: "mafsik", glyphs: ["TSINOR"]},
    TSINORIT: {hebName: "צינורית", role: "mesharet", glyphs: ["TSINOR"]},
    DCHI: {hebName: "דחי", role: "mafsik", glyphs: ["DCHI"]},

    // לפי המודל שלך: כשזה "לגרמיה" זה מפסיק; (אם תרצה לשנות - פשוט כאן)
    MAHAPAKH_LEGARMEH: {hebName: "מהפך לגרמיה", role: "mafsik", glyphs: ["MAHAPAKH"]},
    AZLA_LEGARMEH: {hebName: "אזלא לגרמיה", role: "mafsik", glyphs: ["QADMA"]},
    QADMA: {hebName: "קדמא", role: "mesharet", glyphs: ["QADMA"]},
    MAHAPAKH: {hebName: "מהפך", role: "mesharet", glyphs: ["MAHAPAKH"]},
    UNKNOWN: {hebName: "לא מזוהה", role: "mesharet", glyphs: []}
};
