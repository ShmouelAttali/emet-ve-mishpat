import type {TokenGlyph} from "@/lib/text/tokenize";
import type {TokenStep2} from "@/lib/taamim/step2Local";
import type {Inference} from "@/lib/taamim/model/inferred";
import {hasKnown} from "@/lib/taamim/roles/infer/inferUtils";
import {countSyllablesFromStartToTaamAnchor} from "@/lib/taamim/syllables";


function findFirstIndex(tokens: TokenGlyph[], pred: (i: number) => boolean): number | undefined {
    for (let i = 0; i < tokens.length; i++) if (pred(i)) return i;
    return undefined;
}

export function inferAtnach(tokens: TokenGlyph[], step2: TokenStep2[], emperorTo: number): Inference {
    const explicit = findFirstIndex(tokens, (i) => i <= emperorTo && hasKnown(step2[i], "ATNACH"));
    if (explicit !== undefined) {
        return {index: explicit, inferredCode: "ATNACH_EXPLICIT", effectiveTaam: "ATNACH"};
    }

    // REVIa near end (within last 3 tokens)
    const start = Math.max(0, emperorTo - 3);
    for (let i = emperorTo; i >= start; i--) {
        if (tokens[i]?.isPasek || tokens[i]?.isSofPasuq) continue;
        if (hasKnown(step2[i], "REVIa") || hasKnown(step2[i], "REVIa_MUGRASH")) {
            return {index: i, inferredCode: "ATNACH_SUB_REVIa_NEAR_END", effectiveTaam: "ATNACH"};
        }
    }

    // PAZER
    const pazer = findFirstIndex(tokens, (i) => i <= emperorTo && hasKnown(step2[i], "PAZER"));
    if (pazer !== undefined) {
        return {index: pazer, inferredCode: "ATNACH_SUB_PAZER", effectiveTaam: "ATNACH"};
    }

    // Hidden atnach: <3 syllables from silluq to end
    const lastWord = tokens[emperorTo];
    const syll = lastWord ? countSyllablesFromStartToTaamAnchor(tokens[emperorTo], "SILLUQ") : null;

    if (syll != null && syll < 3) {
        for (let i = emperorTo - 1; i >= 0; i--) {
            if (tokens[i]?.isPasek || tokens[i]?.isSofPasuq) continue;
            const info = step2[i];
            const hasMesharet = info?.identified.some((x) => x.kind === "KNOWN" && x.role === "mesharet");
            if (hasMesharet) {
                return {index: i, inferredCode: "ATNACH_HIDDEN_NEAR_SILLUQ", effectiveTaam: "ATNACH"};
            }
        }
    }

    // Not found -> don't change anything
    return {inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "UNKNOWN"};
}
