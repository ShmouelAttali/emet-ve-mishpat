import type { TokenGlyph } from "@/lib/text/tokenize";
import type { TokenStep2 } from "../../step2Local";
import type { Inference } from "../../model/inferred";
import type { TakenState } from "../engine/taken";
import { isTaken } from "../engine/taken";
import { hasKnown } from "@/lib/taamim/roles/infer/inferUtils";
import { inferReviaMugrashAfterAtnach } from "@/lib/taamim/roles/infer/inferReviaMugrash";

export function inferViceroysInKingDomain(opts: {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    taken: TakenState;
    domain: { from: number; to: number };
    oleVeyoredIndex?: number;

    // needed for AFTER_ATNACH logic:
    atnachRoleIndex?: number;
    silluqIndex?: number;
}): Inference[] {
    const { tokens, step2, taken, domain, oleVeyoredIndex, atnachRoleIndex, silluqIndex } = opts;
    const out: Inference[] = [];

    // 0) Special handling for the King-domain "after atnach"
    const isAfterAtnachDomain =
        atnachRoleIndex != null && domain.from === atnachRoleIndex + 1 && silluqIndex != null && domain.to === silluqIndex;

    if (isAfterAtnachDomain) {
        const mug = inferReviaMugrashAfterAtnach({
            tokens,
            step2,
            domainFrom: domain.from,
            domainToInclusive: domain.to,
            silluqIndex,
        });

        if (mug?.index != null) {
            // only if not taken and not punctuation
            const t = tokens[mug.index];
            if (t && !t.isPasek && !t.isSofPasuq && !isTaken(taken, mug.index)) {
                out.push(mug);
                // NOTE: do NOT mark taken here (engine should do it centrally after collecting inferences)
                // but this ensures our later scanning doesn't duplicate it:
            }
        }
    }

    for (let i = domain.from; i <= domain.to; i++) {
        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;

        // If we already inferred a viceroy anchor on this token (e.g. revia mugrash after atnach), skip
        if (out.some((x) => x.index === i)) continue;

        const s2 = step2[i];

        // DCHI
        if (hasKnown(s2, "DCHI")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "DCHI" });
            continue;
        }

        // TSINOR
        if (hasKnown(s2, "TSINOR")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "TSINOR" });
            continue;
        }

        // REVIa -> decide qatan/gadol based on OV adjacency
        // IMPORTANT: do not classify REVIa_MUGRASH here (it is handled explicitly in AFTER_ATNACH, and/or in Step2 elsewhere)
        if (hasKnown(s2, "REVIa") && !hasKnown(s2, "REVIa_MUGRASH")) {
            const isQatan = oleVeyoredIndex != null && i === oleVeyoredIndex - 1;
            out.push({
                index: i,
                inferredCode: "EFFECTIVE_ORIGINAL",
                effectiveTaam: isQatan ? "REVIa_QATAN" : "REVIa_GADOL",
            });
            continue;
        }
    }

    out.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return out;
}
