import type { Inference } from "@/lib/taamim/model/inferred";
import { isTaken } from "@/lib/taamim/roles/engine/taken";

import type { ViceroyRule, ViceroyRuleInput } from "./types";

import { inferDchiViceroy } from "./inferDchi";
import { inferTsinorViceroy } from "./inferTsinor";
import { inferReviaViceroy } from "./inferRevia";
import {
    inferMahapakhLegarmehAfterAtnachViceroy
} from "@/lib/taamim/roles/infer/viceroys/inferMahapachLegarmehAfterAtnach";

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
    const rules: ViceroyRule[] = [inferDchiViceroy, inferTsinorViceroy, inferReviaViceroy, inferMahapakhLegarmehAfterAtnachViceroy];

    const collected: Inference[] = [];

    for (const rule of rules) {
        const infs = sanitize(rule(input), input);
        input.scope.prior.push(...infs);
        collected.push(...infs);
    }

    collected.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return collected;
}
