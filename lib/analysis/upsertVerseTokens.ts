import type { NeonQueryFunction } from "@neondatabase/serverless";
import type { VerseAnalysisTokenRow } from "./extractVerseTokens";

const COLS = [
    "verse_id",
    "analysis_version",
    "token_index",
    "token_id",
    "raw",
    "letters",
    "is_pasek",
    "is_sof_pasuq",
    "has_pasek_after",
    "has_sof_pasuq_after",
    "identified_kind",
    "identified_key",
    "identified_role",
    "identified_heb_name",
    "consumed_keys",
    "effective_taam",
    "effective_role",
    "inferred_code",
    "effective_reason",
    "effective_heb_name",
    "vowel_nuclei_total",
    "vowel_nuclei_until_anchor",
    "syllables_total",
    "syllables_until_anchor",
] as const;

type Col = (typeof COLS)[number];

function pickValues(r: VerseAnalysisTokenRow): any[] {
    return [
        r.verse_id,
        r.analysis_version,
        r.token_index,
        r.token_id,
        r.raw,
        r.letters,
        r.is_pasek,
        r.is_sof_pasuq,
        r.has_pasek_after,
        r.has_sof_pasuq_after,
        r.identified_kind,
        r.identified_key,
        r.identified_role,
        r.identified_heb_name,
        r.consumed_keys,
        r.effective_taam,
        r.effective_role,
        r.inferred_code,
        r.effective_reason,
        r.effective_heb_name,
        r.vowel_nuclei_total,
        r.vowel_nuclei_until_anchor,
        r.syllables_total,
        r.syllables_until_anchor,
    ];
}

export async function upsertVerseAnalysisTokens(
    sql: NeonQueryFunction<any, any>,
    rows: VerseAnalysisTokenRow[]
) {
    if (!rows.length) return;

    const colsSql = COLS.join(", ");

    const params: any[] = [];
    const valuesSql = rows
        .map((r) => {
            const vals = pickValues(r);
            const start = params.length;
            params.push(...vals);
            const placeholders = vals.map((_, i) => `$${start + i + 1}`).join(", ");
            return `(${placeholders})`;
        })
        .join(", ");

    const updateCols: Col[] = COLS.filter(
        (c) => !["verse_id", "analysis_version", "token_index"].includes(c)
    );

    const updateSql = updateCols.map((c) => `${c} = excluded.${c}`).join(", ");

    const query = `
        insert into verse_analysis_tokens (${colsSql})
        values ${valuesSql}
            on conflict (verse_id, analysis_version, token_index)
    do update set ${updateSql}
    `;

    await sql.query(query, params);
}
