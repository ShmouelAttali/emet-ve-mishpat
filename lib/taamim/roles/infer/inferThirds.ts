import type { TokenGlyph } from "@/lib/text/tokenize";
import type { TokenStep2 } from "../../step2Local";
import type { Inference } from "../../model/inferred";
import type { TakenState } from "../engine/taken";
import { isTaken } from "../engine/taken";
import {hasKnown} from "@/lib/taamim/roles/infer/inferUtils";


export function inferThirdsInViceroyDomain(opts: {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    taken: TakenState;
    domain: { from: number; to: number };
}): Inference[] {
    const { tokens, step2, taken, domain } = opts;
    const out: Inference[] = [];

    for (let i = domain.from; i <= domain.to; i++) {
        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;

        const s2 = step2[i];

        if (hasKnown(s2, "MAHAPAKH_LEGARMEH")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "MAHAPAKH_LEGARMEH" });
            continue;
        }
        if (hasKnown(s2, "AZLA_LEGARMEH")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "AZLA_LEGARMEH" });
            continue;
        }
        if (hasKnown(s2, "PAZER")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "PAZER" });
            continue;
        }
    }

    out.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return out;
}
