import type { TokenGlyph } from "@/lib/text/tokenize";
import type { TokenStep2 } from "@/lib/taamim/step2Local";
import type { Inference } from "@/lib/taamim/model/inferred";
import {hasKnown} from "@/lib/taamim/roles/infer/inferUtils";
import {countSyllablesFromStartToTaamAnchor} from "@/lib/taamim/syllables";

function hasMesharet(step2Tok: TokenStep2 | undefined) {
    return !!step2Tok?.identified.some((x) => x.kind === "KNOWN" && x.role === "mesharet");
}

// “שלשלת גדולה” אצלך: שלשלת + פסק אחרי המילה
function isShalsheletGedola(tokens: TokenGlyph[], step2: TokenStep2[], i: number) {
    if (!hasKnown(step2[i], "SHALSHELET_GEDOLA")) return false;
    // עדיף על observed.hasPasekAfter אם קיים אצלך; אחרת בדיקה מול tokens[i+1]
    const hasPasekAfter =
        (step2[i] as any)?.observed?.hasPasekAfter ?? (tokens[i + 1]?.isPasek === true);
    return !!hasPasekAfter;
}

export function inferReviaMugrashAfterAtnach(opts: {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    domainFrom: number;        // atnachRoleIndex+1
    domainToInclusive: number; // silluqIndex
    silluqIndex: number;
}): Inference | undefined {
    const { tokens, step2, domainFrom, domainToInclusive, silluqIndex } = opts;

    // 1) explicit REVIa_MUGRASH in domain
    for (let i = domainFrom; i <= domainToInclusive; i++) {
        if (tokens[i]?.isPasek || tokens[i]?.isSofPasuq) continue;
        if (hasKnown(step2[i], "REVIa_MUGRASH")) {
            return {
                index: i,
                inferredCode: "REVIa_MUGRASH_EXPLICIT",
                effectiveTaam: "REVIa_MUGRASH",
            };
        }
    }

    // 3) shalshelet gedola in domain => treat as REVIa_MUGRASH (effective)
    for (let i = domainFrom; i <= domainToInclusive; i++) {
        if (tokens[i]?.isPasek || tokens[i]?.isSofPasuq) continue;
        if (isShalsheletGedola(tokens, step2, i)) {
            return {
                index: i,
                inferredCode: "REVIa_MUGRASH_SUB_SHALSHELET_GEDOLA",
                effectiveTaam: "REVIa_MUGRASH",
            };
        }
    }

    // 2) hidden rule near silluq:
    // "masharet in the word adjacent to silluq" + "<3 syllables to end"
    const syll = countSyllablesFromStartToTaamAnchor(tokens[silluqIndex], "SILLUQ");
    if (syll != null && syll < 3) {
        const candidate = silluqIndex - 1;
        if (candidate >= domainFrom && candidate <= domainToInclusive) {
            if (!(tokens[candidate]?.isPasek || tokens[candidate]?.isSofPasuq) && hasMesharet(step2[candidate])) {
                return {
                    index: candidate,
                    inferredCode: "REVIa_MUGRASH_HIDDEN_NEAR_SILLUQ",
                    effectiveTaam: "REVIa_MUGRASH",
                };
            }
        }
    }

    return undefined;
}
