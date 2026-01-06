import type { TokenGlyph } from "@/lib/text/tokenize";
import type { TokenStep2 } from "@/lib/taamim/step2Local";
import type { Inference } from "@/lib/taamim/model/inferred";
import type { TakenState } from "@/lib/taamim/roles/engine/taken";
import { isTaken } from "@/lib/taamim/roles/engine/taken";
import { hasKnown } from "@/lib/taamim/roles/infer/inferUtils";

import type { ThirdRule, ThirdRuleInput, ViceroyLeader } from "./types";

// --- rules (for now they are simple inline scans; can be split later) ---

const inferLegarmehThird: ThirdRule = (input) => {
    const { tokens, step2, taken, scope } = input;
    const out: Inference[] = [];

    for (let i = scope.from; i <= scope.to; i++) {
        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;

        if (hasKnown(step2[i], "MAHAPAKH_LEGARMEH")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "MAHAPAKH_LEGARMEH" });
            continue;
        }
        if (hasKnown(step2[i], "AZLA_LEGARMEH")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "AZLA_LEGARMEH" });

        }
    }

    return out;
};

const inferPazerThird: ThirdRule = (input) => {
    const { tokens, step2, taken, scope } = input;
    const out: Inference[] = [];

    for (let i = scope.from; i <= scope.to; i++) {
        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;

        if (hasKnown(step2[i], "PAZER")) {
            out.push({ index: i, inferredCode: "EFFECTIVE_ORIGINAL", effectiveTaam: "PAZER" });
        }
    }

    return out;
};

function sanitize(infs: Inference[], input: ThirdRuleInput): Inference[] {
    const out: Inference[] = [];
    for (const inf of infs) {
        if (inf.index == null) continue;
        const i = inf.index;
        const t = input.tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(input.taken, i)) continue;
        if (out.some((x) => x.index === i)) continue;
        out.push(inf);
    }
    return out;
}

/**
 * Entry point (as requested): thirds inference within a viceroy-domain.
 */
export function inferThirds(input: ThirdRuleInput): Inference[] {
    const rules: ThirdRule[] = [inferLegarmehThird, inferPazerThird];
    const collected: Inference[] = [];

    for (const rule of rules) {
        const infs = sanitize(rule(input), input);
        input.scope.prior.push(...infs);
        collected.push(...infs);
    }

    collected.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return collected;
}

/**
 * Backwards-compatible wrapper for the previous call sites.
 */
export function inferThirdsInViceroyDomain(opts: {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    taken: TakenState;
    domain: { from: number; to: number };
    viceroy?: { index: number; taam: any };
    king?: { index: number; taam: any };
}): Inference[] {
    const leader: ViceroyLeader = {
        index: opts.viceroy?.index ?? opts.domain.to,
        taam: (opts.viceroy?.taam as any) ?? "UNKNOWN",
        king: opts.king ? { index: opts.king.index, taam: opts.king.taam as any } : undefined,
    };

    return inferThirds({
        tokens: opts.tokens,
        step2: opts.step2,
        taken: opts.taken,
        scope: { from: opts.domain.from, to: opts.domain.to, prior: [] },
        leader,
    });
}
