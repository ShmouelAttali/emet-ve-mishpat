import type { Inference } from "@/lib/taamim/model/inferred";
import { isTaken } from "@/lib/taamim/roles/engine/taken";
import { hasKnown } from "@/lib/taamim/roles/infer/inferUtils";
import type { ViceroyRuleInput } from "./types";

export function inferTsinorViceroy(input: ViceroyRuleInput): Inference[] {
    const { tokens, step2, taken, scope } = input;

    const out: Inference[] = [];

    // tsinor can appear anywhere inside the current king-domain.
    for (let i = scope.from; i <= scope.to; i++) {
        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;

        if (hasKnown(step2[i], "TSINOR")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "TSINOR" });
        }
    }

    return out;
}
