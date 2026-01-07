import type {Inference} from "@/lib/taamim/model/inferred";
import {isTaken} from "@/lib/taamim/roles/engine/taken";
import {hasKnown} from "@/lib/taamim/roles/infer/inferUtils";
import type {ViceroyRuleInput} from "./types";

function hasAnyMesharet(step2Tok: any): boolean {
    return step2Tok?.identified?.role === "mesharet";
}

/**
 * Finds last mesharet before idxExclusive, but only inside [from..to] range.
 */
function findLastMesharetBeforeIndexInRange(
    input: ViceroyRuleInput,
    from: number,
    to: number,
    idxExclusive: number
): number | undefined {
    const {tokens, step2, taken} = input;

    for (let i = idxExclusive - 1; i >= from; i--) {
        if (i > to) continue;

        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;

        if (hasAnyMesharet(step2[i])) return i;
    }
    return undefined;
}

export function inferMahapakhLegarmehAfterAtnachViceroy(input: ViceroyRuleInput): Inference[] {
    const {tokens, step2, taken, scope, leader} = input;
    const out: Inference[] = [];

    // We apply these rules only in the SILLUQ king-domain (domain ends at the silluq word).
    if (!leader || !leader.isAfterAtnach) return [];

    const silluqIdx = scope.to;
    // Identify the ATNACH inside this silluq-domain, then restrict to "after atnach".

    // Scan the "after-atnach" area for:
    // - explicit REVIa_MUGRASH (anywhere)
    // - SHALSHELET_GEDOLA (counts as revia mugrash role)
    // - observed MAHAPAKH_LEGARMEH (actual mahapakh+pasq)
    let hasReviaMugrashSomewhere = false;
    let hasShalsheletGedolaSomewhere = false;
    let observedMahapakhLegarmehIdx: number | undefined = undefined;

    for (let i = scope.from; i <= scope.to; i++) {
        const t = tokens[i];
        if (!t || t.isPasek || t.isSofPasuq) continue;
        if (isTaken(taken, i)) continue;

        if (hasKnown(step2[i], "REVIa_MUGRASH")) hasReviaMugrashSomewhere = true;
        if (hasKnown(step2[i], "SHALSHELET_GEDOLA")) hasShalsheletGedolaSomewhere = true;

        if (observedMahapakhLegarmehIdx == null && hasKnown(step2[i], "MAHAPAKH_LEGARMEH")) {
            observedMahapakhLegarmehIdx = i;
        }
    }
    console.log('hasReviaMugrash', hasReviaMugrashSomewhere, 'hasShalshelet', hasShalsheletGedolaSomewhere, observedMahapakhLegarmehIdx)
    // Rule guard:
    // "אין מצב של מהפך לגרמיה אחרי אתנח בלי רביע מוגרש לפניו בתחום"
    // => if no revia-mugrash-in-domain (including shalshelet gedola), do nothing.
    if (!hasReviaMugrashSomewhere && !hasShalsheletGedolaSomewhere) return [];

    // Rule A:
    // If there is an actual observed MAHAPAKH_LEGARMEH anywhere in this after-atnach area,
    // then that token is the role MAHAPAKH_LEGARMEH.
    if (observedMahapakhLegarmehIdx != null) {
        out.push({
            index: observedMahapakhLegarmehIdx,
            inferredCode: "MAHAPAKH_LEGARMEH_ROLE_AFTER_ATNACH_BY_REVIa_MUGRASH_IN_DOMAIN",
            effectiveTaam: "MAHAPAKH_LEGARMEH",
        });
        return out;
    }

    // Rule B:
    // If the "revia-mugrash role" is realized by SHALSHELET_GEDOLA somewhere in the domain,
    // then MAHAPAKH_LEGARMEH role sits on the LAST mesharet before silluq.
    if (hasShalsheletGedolaSomewhere) {
        const idx = findLastMesharetBeforeIndexInRange(input, scope.from, scope.to, silluqIdx);
        if (idx != null) {
            out.push({
                index: idx,
                inferredCode: "MAHAPAKH_LEGARMEH_ROLE_AFTER_ATNACH_WHEN_SHALSHELET_GEDOLA_PRESENT",
                effectiveTaam: "MAHAPAKH_LEGARMEH",
            });
            return out;
        }
    }

    return out;
}
