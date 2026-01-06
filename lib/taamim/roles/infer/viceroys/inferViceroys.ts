import type { TokenGlyph } from "@/lib/text/tokenize";
import type { TokenStep2 } from "@/lib/taamim/step2Local";
import type { Inference } from "@/lib/taamim/model/inferred";
import type { TakenState } from "@/lib/taamim/roles/engine/taken";
import { isTaken } from "@/lib/taamim/roles/engine/taken";

import type { KingLeader, ViceroyRule, ViceroyRuleInput } from "./types";

import { inferDchiViceroy } from "./inferDchi";
import { inferTsinorViceroy } from "./inferTsinor";
import { inferReviaViceroy } from "./inferRevia";

function sanitize(infs: Inference[], input: ViceroyRuleInput): Inference[] {
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
 * Entry point (as requested): viceroys inference within a king-domain.
 */
export function inferViceroys(input: ViceroyRuleInput): Inference[] {
    // order = priority
    const rules: ViceroyRule[] = [inferDchiViceroy, inferTsinorViceroy, inferReviaViceroy];

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
 * Backwards-compatible wrapper for older call sites.
 */
export function inferViceroysInKingDomain(opts: {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    taken: TakenState;
    domain: { from: number; to: number };
    /** index of Oleh-Veyored king in the pasuk (if exists) */
    oleVeyoredIndex?: number;
    /** index of Atnach king in the pasuk (if exists) */
    atnachRoleIndex?: number;
    /** index of Silluq (end of emperor) */
    silluqIndex?: number;
    /** controlling king for this domain (if known) */
    king?: { index: number; taam: any };
}): Inference[] {
    const leader: KingLeader = {
        index: opts.king?.index ?? (opts.atnachRoleIndex ?? opts.oleVeyoredIndex ?? opts.domain.to),
        taam: (opts.king?.taam as any) ?? "UNKNOWN",
        oleVeyoredIndex: opts.oleVeyoredIndex,
        atnachIndex: opts.atnachRoleIndex,
        silluqIndex: opts.silluqIndex,
    };

    return inferViceroys({
        tokens: opts.tokens,
        step2: opts.step2,
        taken: opts.taken,
        scope: { from: opts.domain.from, to: opts.domain.to, prior: [] },
        leader,
    });
}
