import type {TokenGlyph} from "@/lib/text/tokenize";
import type {Inference} from "@/lib/taamim/model/inferred";


import {inferAtnach} from "./inferAtnach";
import {inferOlehVeyored} from "./inferOlehVeyored";
import {TokenStep2} from "@/lib/taamim/types";
import {Anchor, InferInput, InferRule} from "@/lib/taamim/roles/infer/types";

export type EmperorLeader = Anchor & {
    /** end of pasuk (silluq index) */
    silluqIndex: number;
};

export type KingRuleInput = InferInput<EmperorLeader>;
export type KingRule = InferRule<EmperorLeader>;

function sanitize(infs: Inference[], input: KingRuleInput): Inference[] {
    const out: Inference[] = [];
    for (const inf of infs) {
        if (inf.index == null) continue;
        const t = input.tokens[inf.index];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (out.some((x) => x.index === inf.index)) continue;
        out.push(inf);
    }
    return out;
}

const inferAtnachKing: KingRule = (input) => {
    const emperorTo = input.scope.to;
    const inf = inferAtnach(input.tokens, input.step2, emperorTo);
    if (inf.effectiveTaam === "UNKNOWN") return [];
    return [inf];
};

const inferOlehVeyoredKing: KingRule = (input) => {
    const emperorFrom = input.scope.from;
    const emperorTo = input.scope.to;

    // OV domain ends at ATNACH if it exists; otherwise it ends at SILLUQ.
    const atnach = input.scope.prior.find((x) => x.effectiveTaam === "ATNACH" && x.index != null);
    const ovTo = atnach?.index ?? emperorTo;

    const inf = inferOlehVeyored({
        tokens: input.tokens,
        step2: input.step2,
        domainFrom: emperorFrom,
        domainToInclusive: ovTo,
    });

    return inf ? [inf] : [];
};

/**
 * Entry point (as requested): infer all king anchors for the pasuk.
 *
 * IMPORTANT:
 * - This does NOT mark `taken` and does NOT apply the inference to tokens.
 *   The engine (buildRoleLayers) stays the single source of truth for that.
 */
export function inferKings(input: KingRuleInput): Inference[] {
    // Order = priority (ATNACH first, because OV may depend on it)
    const rules: KingRule[] = [inferAtnachKing, inferOlehVeyoredKing];

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
 * Backwards-compatible wrapper for call sites that haven't migrated yet.
 */
export function inferKingsInEmperorDomain(opts: {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    silluqIndex: number;
}): Inference[] {
    return inferKings({
        tokens: opts.tokens,
        step2: opts.step2,
        // kings don't consume `taken`, but we keep the signature uniform
        taken: {takenBy: new Map()} as any,
        scope: {from: 0, to: opts.silluqIndex, prior: []},
        leader: {index: opts.silluqIndex, taam: "SILLUQ" as any, silluqIndex: opts.silluqIndex},
    });
}
