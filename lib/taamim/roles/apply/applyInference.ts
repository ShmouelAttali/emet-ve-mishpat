import type { TokenStep2Enriched } from "../buildRoleLayers";
import { TAAM_META } from "../../model/taam";
import { INFERRED_CODE_REASON, type Inference } from "../../model/inferred";

export function applyInference(enriched: TokenStep2Enriched[], inf: Inference) {
    if (inf.index == null) return;

    const meta = TAAM_META[inf.effectiveTaam] ?? TAAM_META.UNKNOWN;

    enriched[inf.index].effective = {
        taam: inf.effectiveTaam,
        inferredCode: inf.inferredCode,
        hebName: meta.hebName,
        role: meta.role,
        reason: INFERRED_CODE_REASON[inf.inferredCode] ?? inf.inferredCode,
    };
}
