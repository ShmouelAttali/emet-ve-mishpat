import type {Taam} from "./taam";

export type InferredCode =
    | "EFFECTIVE_ORIGINAL"

    // ATNACH
    | "ATNACH_EXPLICIT"
    | "ATNACH_SUB_REVIa_NEAR_END"
    | "ATNACH_SUB_PAZER"
    | "ATNACH_HIDDEN_NEAR_SILLUQ"

    // OLEH_VEYORED
    | "OLEH_VEYORED_EXPLICIT"
    | "OLEH_VEYORED_SUB_AZLA_LEGARMEH_FIRST"

    | "REVIa_MUGRASH_EXPLICIT"
    | "REVIa_MUGRASH_SUB_SHALSHELET_GEDOLA"
    | "REVIa_MUGRASH_HIDDEN_NEAR_SILLUQ"
    | "DCHI_EXPLICIT"
    | "DCHI_MAHAPACH_LEGARMEH"
    | "DCHI_HIDDEN_NEAR_ATNACH_SHORT"

    | "MAHAPAKH_LEGARMEH_ROLE_AFTER_ATNACH_BY_REVIa_MUGRASH_IN_DOMAIN"
    | "MAHAPAKH_LEGARMEH_ROLE_AFTER_ATNACH_WHEN_SHALSHELET_GEDOLA_PRESENT"
    ;

export type Inference = {
    index?: number;
    inferredCode: InferredCode;
    effectiveTaam: Taam;
};

export const INFERRED_CODE_REASON: Record<InferredCode, string> = {
    MAHAPAKH_LEGARMEH_ROLE_AFTER_ATNACH_BY_REVIa_MUGRASH_IN_DOMAIN: "מהפך לגרמיה בתחום שלאחר האתנח",
    MAHAPAKH_LEGARMEH_ROLE_AFTER_ATNACH_WHEN_SHALSHELET_GEDOLA_PRESENT: "מהפך לגרמיה נסתר - הומר במשרת כי היה פחות מ-3 הברות עד הסילוק",
    DCHI_EXPLICIT: "דחי מפורש",
    DCHI_HIDDEN_NEAR_ATNACH_SHORT: "דחי נסתר: פחות מ-3 הברות עד האתנח → המשרת האחרון לפני האתנח",
    DCHI_MAHAPACH_LEGARMEH: "מהפך לגרמיה במקום דחי - שולט על תיבתו (צריך אישור)",
    REVIa_MUGRASH_EXPLICIT: "רביע מוגרש מפורש",
    REVIa_MUGRASH_HIDDEN_NEAR_SILLUQ: "רביע מוגרש נסתר: פחות מ-3 הברות עד סילוק → המשרת האחרון לפני הסילוק",
    REVIa_MUGRASH_SUB_SHALSHELET_GEDOLA: "שלשלת גדולה במקום רביע מוגרש בעקבות מהפך לגרמיה שהפך למשרת לפני הסילוק",
    EFFECTIVE_ORIGINAL: "הטעם המקורי",

    ATNACH_EXPLICIT: "אתנח מפורש",
    ATNACH_SUB_REVIa_NEAR_END: "אין אתנח מפורש; רביע סמוך לסילוק מתפקד כאתנח",
    ATNACH_SUB_PAZER: "אין אתנח/רביע סמוך; פזר מתפקד כאתנח",
    ATNACH_HIDDEN_NEAR_SILLUQ: "אתנח נסתר: פחות מ-3 הברות עד סילוק → המשרת האחרון לפני הסילוק",

    OLEH_VEYORED_EXPLICIT: "עולה־ויורד מפורש",
    OLEH_VEYORED_SUB_AZLA_LEGARMEH_FIRST:
        "עולה־ויורד חסר; אזלא לגרמיה בתחילת הפסוק מתפקד כעולה־ויורד"
};
