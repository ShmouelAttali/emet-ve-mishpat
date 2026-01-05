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

export const TAAM_META: Record<Taam, { hebName: string; role: "mesharet" | "mafsik" }> = {
    MUNACH: {hebName: "מונח", role: "mesharet"},
    GALGAL: {hebName: "גלגל", role: "mesharet"},
    ILUY: {hebName: "עילוי", role: "mesharet"},
    MERCHA: {hebName: "מרכא", role: "mesharet"},
    TIPCHA: {hebName: "טיפחא", role: "mesharet"},
    SHALSHELET_GEDOLA: {hebName: "שלשלת גדולה", role: "mafsik"},
    SHALSHELET_KETANA: {hebName: "שלשלת קטנה", role: "mesharet"},
    SILLUQ: {hebName: "סילוק", role: "mafsik"},
    ATNACH: {hebName: "אתנח", role: "mafsik"},
    OLEH_VEYORED: {hebName: "עולה ויורד", role: "mafsik"},

    PAZER: {hebName: "פזר", role: "mafsik"},
    REVIa: {hebName: "רביע", role: "mafsik"},
    REVIa_MUGRASH: {hebName: "רביע מוגרש", role: "mafsik"},
    REVIa_QATAN: {hebName: "רביע קטן", role: "mafsik"},
    REVIa_GADOL: {hebName: "רביע גדול", role: "mafsik"},

    TSINOR: {hebName: "צינור", role: "mafsik"},
    TSINORIT: {hebName: "צינורית", role: "mesharet"},
    DCHI: {hebName: "דחי", role: "mafsik"},

    // לפי המודל שלך: כשזה "לגרמיה" זה מפסיק; (אם תרצה לשנות - פשוט כאן)
    MAHAPAKH_LEGARMEH: {hebName: "מהפך לגרמיה", role: "mafsik"},
    AZLA_LEGARMEH: {hebName: "אזלא לגרמיה", role: "mafsik"},
    QADMA: {hebName: "קדמא", role: "mesharet"},
    MAHAPAKH: {hebName: "קדמא", role: "mesharet"},

    UNKNOWN: {hebName: "לא מזוהה", role: "mesharet"}
};
