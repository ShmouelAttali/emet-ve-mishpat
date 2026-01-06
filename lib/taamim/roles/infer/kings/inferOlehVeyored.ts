import type { TokenGlyph } from "@/lib/text/tokenize";
import type { TokenStep2 } from "@/lib/taamim/step2Local";
import type { Inference } from "@/lib/taamim/model/inferred";
import {hasKnown} from "@/lib/taamim/roles/infer/inferUtils";



export function inferOlehVeyored(opts: {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    domainFrom: number;          // תחילת תחום המלך (בדרך כלל 0)
    domainToInclusive: number;   // סוף התחום (עד אתנח כולל)
}): Inference | undefined {
    const { tokens, step2, domainFrom, domainToInclusive } = opts;

    // 1) explicit OLEH_VEYORED anywhere in domain
    for (let i = domainFrom; i <= domainToInclusive; i++) {
        if (tokens[i]?.isPasek || tokens[i]?.isSofPasuq) continue;
        if (hasKnown(step2[i], "OLEH_VEYORED")) {
            return { index: i, inferredCode: "OLEH_VEYORED_EXPLICIT", effectiveTaam: "OLEH_VEYORED" };
        }
    }

    // 2) substitution: if the first word in pasuk is AZLA_LEGARMEH, it acts as OLEH_VEYORED
    if (hasKnown(step2[domainFrom], "AZLA_LEGARMEH")) {
        return {
            index: domainFrom,
            inferredCode: "OLEH_VEYORED_SUB_AZLA_LEGARMEH_FIRST",
            effectiveTaam: "OLEH_VEYORED",
        };
    }


    // not found => no override
    return undefined;
}
