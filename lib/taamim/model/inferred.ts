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
    ;

export type Inference = {
    index?: number;
    inferredCode: InferredCode;
    effectiveTaam: Taam;
};

export const INFERRED_CODE_REASON: Record<InferredCode, string> = {
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
