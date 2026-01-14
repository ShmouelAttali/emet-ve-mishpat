import type {TokenGlyph} from "@/lib/text/tokenize";
import type {Inference} from "@/lib/taamim/model/inferred";
import {hasKnown} from "@/lib/taamim/roles/infer/inferUtils";
import {hasTaamOnLastSyllable, hasVowelNucleusBeforeLetterIndex} from "@/lib/taamim/syllables";
import {TokenStep2} from "@/lib/taamim/types";


const OLE_U = "U+05AB";   // ֫
const YORED_U = "U+05A5"; // ֥

function isSkippable(tok: TokenGlyph | undefined): boolean {
    return !!tok?.isPasek || !!tok?.isSofPasuq;
}

function allMarks(tok: TokenGlyph) {
    return tok.clusters.flatMap((c) => c.marks);
}

function hasTaamU(tok: TokenGlyph, u: string): boolean {
    return allMarks(tok).some((m) => m.kind === "TAAM" && m.u === u);
}

function firstTwoWordIndices(tokens: TokenGlyph[], from: number, toInclusive: number) {
    let first: number | undefined;
    let second: number | undefined;

    for (let i = from; i <= toInclusive; i++) {
        const t = tokens[i];
        if (!t || isSkippable(t)) continue;
        if (first == null) first = i;
        else {
            second = i;
            break;
        }
    }

    return {first, second};
}

function prevWordIndex(tokens: TokenGlyph[], from: number, idxExclusive: number): number | undefined {
    for (let i = idxExclusive - 1; i >= from; i--) {
        const t = tokens[i];
        if (!t || isSkippable(t)) continue;
        return i;
    }
    return undefined;
}

function findLetterIndexOfTaamU(tok: TokenGlyph, u: string): number | null {
    for (let i = 0; i < tok.clusters.length; i++) {
        if (tok.clusters[i].marks.some((m) => m.kind === "TAAM" && m.u === u)) return i;
    }
    return null;
}

/**
 * "אין מקום לעולה במילה של המירכא":
 * אין גרעין הברה לפני אות היורד (מירכא).
 * (כלומר אין תנועה לפני עוגן היורד)
 */
function noRoomForOleInThisWord(tok: TokenGlyph): boolean {
    const yIdx = findLetterIndexOfTaamU(tok, YORED_U);
    if (yIdx == null) return false;
    return !hasVowelNucleusBeforeLetterIndex(tok, yIdx);
}

function hasRoomForOleInPrev(tokPrev: TokenGlyph): boolean {
    return !hasTaamOnLastSyllable(tokPrev);
}

export function inferOlehVeyored(opts: {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    domainFrom: number;
    domainToInclusive: number;
}): Inference | undefined {
    const {tokens, step2, domainFrom, domainToInclusive} = opts;

    const {first: w0, second: w1} = firstTwoWordIndices(tokens, domainFrom, domainToInclusive);
    if (w0 == null) return undefined;

    // 1) explicit OLEH_VEYORED anywhere in domain
    for (let i = domainFrom; i <= domainToInclusive; i++) {
        if (isSkippable(tokens[i])) continue;
        if (hasKnown(step2[i], "OLEH_VEYORED")) {
            return {index: i, inferredCode: "OLEH_VEYORED_EXPLICIT", effectiveTaam: "OLEH_VEYORED"};
        }
    }

    // 2) substitution: אם המילה הראשונה היא AZLA_LEGARMEH => OLEH_VEYORED
    if (hasKnown(step2[w0], "AZLA_LEGARMEH")) {
        return {
            index: w0,
            inferredCode: "OLEH_VEYORED_SUB_AZLA_LEGARMEH_FIRST",
            effectiveTaam: "OLEH_VEYORED",
        };
    }

    // 3) חפש את המירכא הראשונה מה"מילה השניה" ועד סוף התחום
    if (w1 != null) {
        for (let i = w1; i <= domainToInclusive; i++) {
            const tok = tokens[i];
            if (!tok || isSkippable(tok)) continue;
            // חייב להיות מירכא (יורד) ב-step2 + לוודא שיש glyph של יורד בפועל
            if (!hasKnown(step2[i], "MERCHA")) continue;
            if (!hasTaamU(tok, YORED_U)) continue;
            // תנאי "אין מקום לעולה" במילה של המירכא
            if (!noRoomForOleInThisWord(tok)) continue;
            const p = prevWordIndex(tokens, domainFrom, i);
            if (p == null) continue;

            const prevTok = tokens[p]!;
            const oleOnPrev = hasTaamU(prevTok, OLE_U);
            // 3a) אם יש עולה מפורש במילה הקודמת => עולה ויורד
            if (oleOnPrev) {
                return {
                    index: i,
                    inferredCode: "OLEH_VEYORED_SUB_MERCHA_WITH_OLE_PREV",
                    effectiveTaam: "OLEH_VEYORED",
                };
            }

            // 3b) אין עולה מפורש במילה הקודמת.
            // אם יש במילה הקודמת "מקום לעולה" => לא מסיקים כאן (העולה היה אמור להופיע)
            if (hasRoomForOleInPrev(prevTok)) {
                continue;
            }
            // 3c) אין מקום לעולה במילה הקודמת => עולה ויורד (העולה נעלם/נדחק)
            return {
                index: i,
                inferredCode: "OLEH_VEYORED_SUB_MERCHA_NO_ROOM_FOR_OLE_PREV",
                effectiveTaam: "OLEH_VEYORED",
            };
        }
    }

    return undefined;
}
