import type { AnalyzeResult, TokenStep2Enriched } from "@/lib/taamim/types";
import { countSyllablesInRange, countVowelNucleiInRange } from "@/lib/taamim/syllables";

export type VerseAnalysisTokenRow = {
    verse_id: number;
    analysis_version: string;

    token_index: number; // 1-based
    token_id: string;

    raw: string | null;
    letters: string | null;
    is_pasek: boolean;
    is_sof_pasuq: boolean;

    has_pasek_after: boolean | null;
    has_sof_pasuq_after: boolean | null;

    identified_kind: string | null;
    identified_key: string | null;
    identified_role: string | null;
    identified_heb_name: string | null;

    // ✅ keys (לא U)
    consumed_keys: string[] | null;

    effective_taam: string | null;
    effective_role: string | null;
    inferred_code: string | null;
    effective_reason: string | null;
    effective_heb_name: string | null;

    vowel_nuclei_total: number | null;
    vowel_nuclei_until_anchor: number | null;

    syllables_total: number | null;
    syllables_until_anchor: number | null;
};

export function extractVerseAnalysisTokenRows(opts: {
    verseId: number;
    analysisVersion: string;
    result: AnalyzeResult;
}): VerseAnalysisTokenRow[] {
    const { verseId, analysisVersion, result } = opts;

    const taamByTokenId = new Map<string, TokenStep2Enriched>();
    for (const t of result.taamim ?? []) taamByTokenId.set(t.tokenId, t);

    return (result.tokens ?? []).map((tok, idx0) => {
        const tokenIndex = idx0 + 1; // 1-based
        const t = taamByTokenId.get(tok.id);

        const isPasek = !!tok.isPasek;
        const isSof = !!tok.isSofPasuq;

        // ✅ בלי fallback: או שיש taamClusterIndex, או שאין.
        const taamClusterIndex =
            t?.identified?.taamClusterIndex != null ? t.identified.taamClusterIndex : null;

        const nClusters = tok.clusters.length;

        const vowelTotal =
            (isPasek || isSof || nClusters === 0) ? null :
                countVowelNucleiInRange(tok as any, 0, nClusters - 1);

        const vowelUntil =
            (isPasek || isSof || nClusters === 0) ? null :
                (taamClusterIndex == null ? null : countVowelNucleiInRange(tok as any, 0, taamClusterIndex));

        const syllTotal =
            (isPasek || isSof || nClusters === 0) ? null :
                countSyllablesInRange(tok as any, 0, nClusters - 1);

        const syllUntil =
            (isPasek || isSof || nClusters === 0) ? null :
                (taamClusterIndex == null ? null : countSyllablesInRange(tok as any, 0, taamClusterIndex));


        const consumedKeys = t?.identified?.consumedKeys ?? null;

        return {
            verse_id: verseId,
            analysis_version: analysisVersion,

            token_index: tokenIndex,
            token_id: tok.id,

            raw: tok.raw ?? null,
            letters: tok.letters ?? null,
            is_pasek: isPasek,
            is_sof_pasuq: isSof,

            has_pasek_after: t?.observed?.hasPasekAfter ?? null,
            has_sof_pasuq_after: t?.observed?.hasSofPasuqAfter ?? null,

            identified_kind: t?.identified?.kind ?? null,
            identified_key: t?.identified?.key  ?? null,
            identified_role: t?.identified?.role ?? null,
            identified_heb_name: t?.identified?.hebName ?? null,

            consumed_keys: t?.identified?.consumedKeys ?? null,

            effective_taam: (t?.effective?.taam as any) ?? null,
            effective_role: t?.effective?.role ?? null,
            inferred_code: (t?.effective?.inferredCode as any) ?? null,
            effective_reason: t?.effective?.reason ?? null,
            effective_heb_name: t?.effective?.hebName ?? null,
            taam_cluster_index: taamClusterIndex,

            vowel_nuclei_total: vowelTotal,
            vowel_nuclei_until_anchor: vowelUntil,

            syllables_total: syllTotal,
            syllables_until_anchor: syllUntil,
        };
    });
}
