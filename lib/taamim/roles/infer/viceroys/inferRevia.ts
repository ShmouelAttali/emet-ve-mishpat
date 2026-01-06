import type { Inference } from "@/lib/taamim/model/inferred";
import { isTaken } from "@/lib/taamim/roles/engine/taken";
import { hasKnown } from "@/lib/taamim/roles/infer/inferUtils";
import type { ViceroyRuleInput } from "./types";
import { inferReviaMugrashAfterAtnach } from "./inferReviaMugrash";

export function inferReviaViceroy(input: ViceroyRuleInput): Inference[] {
    const { tokens, step2, taken, scope, leader } = input;
    const out: Inference[] = [];

    // Special: AFTER_ATNACH domain => infer REVIa_MUGRASH effective anchor
    const isAfterAtnachDomain =
        !!leader &&
        leader.taam === "ATNACH" &&
        leader.silluqIndex != null &&
        scope.from === leader.index + 1 &&
        scope.to === leader.silluqIndex;

    if (isAfterAtnachDomain && leader.silluqIndex != null) {
        const mug = inferReviaMugrashAfterAtnach({
            tokens,
            step2,
            domainFrom: scope.from,
            domainToInclusive: scope.to,
            silluqIndex: leader.silluqIndex,
        });

        if (mug?.index != null) {
            const t = tokens[mug.index];
            if (t && !t.isPasek && !t.isSofPasuq && !isTaken(taken, mug.index)) {
                out.push(mug);
                // do not return; there might still be other viceroys in this domain (dchi/tsinor etc)
            }
        }
    }

    // Normal REVIa (small/large) in any domain except AFTER_ATNACH logic is separate.
    for (let i = scope.from; i <= scope.to; i++) {
        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;
        if (out.some((x) => x.index === i)) continue; // avoid duplicates with mugrash inference

        const s2 = step2[i];

        // skip explicit mugrash here
        if (hasKnown(s2, "REVIa_MUGRASH")) continue;

        if (hasKnown(s2, "REVIa")) {
            const ovIdx = leader?.oleVeyoredIndex;
            const isQatan = ovIdx != null && i === ovIdx - 1;
            out.push({
                index: i,
                inferredCode: "EFFECTIVE_ORIGINAL",
                effectiveTaam: isQatan ? "REVIa_QATAN" : "REVIa_GADOL",
            });
        }
    }

    return out;
}
