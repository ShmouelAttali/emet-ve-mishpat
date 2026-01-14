import { sql } from "@/lib/db/db";
import { extractVerseAnalysisTokenRows } from "./extractVerseTokens";
import { upsertVerseAnalysisTokens } from "./upsertVerseTokens";
import type { AnalyzeResult } from "@/lib/taamim/types";

export async function saveVerseAnalysisTokens(args: {
    verseId: number;
    analysisVersion: string;
    result: AnalyzeResult;
}) {
    const rows = extractVerseAnalysisTokenRows({
        verseId: args.verseId,
        analysisVersion: args.analysisVersion,
        result: args.result,
    });

    await upsertVerseAnalysisTokens(sql, rows);
}
