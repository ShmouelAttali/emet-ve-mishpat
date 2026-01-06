import type { Inference } from "@/lib/taamim/model/inferred";
import { isTaken } from "@/lib/taamim/roles/engine/taken";
import { hasKnown } from "@/lib/taamim/roles/infer/inferUtils";
import type { ViceroyRuleInput } from "./types";
import {countSyllablesFromStartToTaamAnchor} from "@/lib/taamim/syllables";

function hasAnyMesharet(step2Tok: any): boolean {
    return !!step2Tok?.identified?.some((x: any) => x.kind === "KNOWN" && x.role === "mesharet");
}

function findLastMesharetBeforeIndex(input: ViceroyRuleInput, idxExclusive: number): number | undefined {
    for (let i = idxExclusive - 1; i >= input.scope.from; i--) {
        const t = input.tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(input.taken, i)) continue;
        if (hasAnyMesharet(input.step2[i])) return i;
    }
    return undefined;
}

export function inferDchiViceroy(input: ViceroyRuleInput): Inference[] {
    const { tokens, step2, taken, scope, leader } = input;

    // DCHI is a viceroy under ATNACH king-domain.
    // We treat "ATNACH domain" as a domain that ends exactly at the atnach king index.
    if (!leader || leader.taam !== "ATNACH") return [];
    if (leader.index == null || scope.to !== leader.index) return [];

    const out: Inference[] = [];

    // 1) explicit DCHI anywhere in ATNACH domain
    for (let i = scope.from; i <= scope.to; i++) {
        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;

        if (hasKnown(step2[i], "DCHI")) {
            out.push({ index: i, inferredCode: "DCHI_EXPLICIT", effectiveTaam: "DCHI" });
            return out; // explicit wins, stop
        }
    }

    // 2) hidden DCHI:
    // if atnachRoleIndex exists, and from-start-of-atnach-word until taam <= 3 syllables,
    // then the last mesharet before atnach becomes DCHI.
    if (leader.index != null) {
        const atIdx = leader.index;
        const atTok = tokens[atIdx];
        if (atTok && !atTok.isPasek && !atTok.isSofPasuq) {
            const syll = countSyllablesFromStartToTaamAnchor(atTok, "ATNACH");
            if (syll != null && syll <= 3) {
                const mesharetIdx = findLastMesharetBeforeIndex(input, atIdx);
                if (mesharetIdx != null) {
                    out.push({
                        index: mesharetIdx,
                        inferredCode: "DCHI_HIDDEN_NEAR_ATNACH_SHORT",
                        effectiveTaam: "DCHI",
                    });
                    return out;
                }
            }
        }
    }

    return out;
}
