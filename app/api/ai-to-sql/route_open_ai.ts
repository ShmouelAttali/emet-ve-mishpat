import {NextResponse} from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function stripCodeFences(s: string) {
    // לפעמים מודל מחזיר ```sql ... ```
    return s
        .replace(/^```(?:sql)?\s*/i, "")
        .replace(/```$/i, "")
        .trim();
}

function basicPostValidate(sql: string) {
    const q = sql.trim();
    const ql = q.toLowerCase();

    if (!q) throw new Error("AI returned empty SQL");
    if (q.includes(";")) throw new Error("AI returned multiple statements (contains ';')");
    if (!(ql.startsWith("select") || ql.startsWith("with")))
        throw new Error("AI did not return a SELECT/CTE query");

    // חייב להיות על ה-views שלנו
    const allowed =
        ql.includes("public.v_tokens_latest") || ql.includes("public.v_verses_latest");
    if (!allowed) {
        throw new Error("AI query must use public.v_tokens_latest and/or public.v_verses_latest only");
    }

    // חייב LIMIT (<=200). אם אין, נוסיף.
    const m = q.match(/\blimit\s+(\d+)\b/i);
    if (!m) return `${q}\nlimit 200`;
    const n = Math.min(parseInt(m[1]!, 10), 200);
    return q.replace(/\blimit\s+\d+\b/i, `limit ${n}`);
}

export async function POST(req: Request) {
    try {
        console.log("Has key:", !!process.env.OPENAI_API_KEY);
        const body = await req.json();
        const question = String(body?.question ?? "").trim();

        if (!question) {
            return NextResponse.json({ok: false, error: "Missing question"}, {status: 400});
        }

        const model = process.env.AI_SQL_MODEL || "gpt-4o-mini";

        const system = `
You generate safe PostgreSQL queries for a UI that will run them.

Hard rules:
- Return SQL ONLY. No markdown, no commentary.
- Only SELECT or WITH...SELECT. One statement. No semicolons.
- Use ONLY these views:
  - public.v_tokens_latest (token-level)
  - public.v_verses_latest (verse-level)
- Prefer EXISTS subqueries on public.v_tokens_latest for "verses that contain X and Y".
- Always include a LIMIT (<= 200).
- Avoid heavy queries: do not build huge aggregates unless the user asks explicitly for counts.
- Do not use array operators like @>.
- Use explicit filters when reasonable (e.g., add "where v.book='Psalms'" if user mentions Psalms/Tehillim).

Schema (views):
public.v_verses_latest:
  verse_id, book, chapter, verse, text, analysis_version

public.v_tokens_latest:
  verse_id, book, chapter, verse, verse_text,
  analysis_version, token_index, token_id, raw, letters,
  is_pasek, is_sof_pasuq,
  identified_kind, identified_key, identified_role, consumed_keys,
  effective_taam, effective_role, inferred_code, effective_reason, effective_heb_name,
  vowel_nuclei_total, vowel_nuclei_until_anchor,
  syllables_total, syllables_until_anchor,
  taam_cluster_index, created_at
`;

        const user = `
User request (Hebrew):
${question}

Examples (style guide):

-- Verses with ATNACH
select v.book, v.chapter, v.verse, v.text
from public.v_verses_latest v
where exists (
  select 1 from public.v_tokens_latest t
  where t.verse_id = v.verse_id
    and t.effective_taam = 'ATNACH'
)
limit 200

-- Count DCHI by inferred_code
select t.inferred_code, count(*) as n
from public.v_tokens_latest t
where t.effective_taam = 'DCHI'
group by t.inferred_code
order by n desc
limit 200
`;

        const resp = await client.chat.completions.create({
            model,
            temperature: 0,
            messages: [
                {role: "system", content: system},
                {role: "user", content: user},
            ],
        });

        const raw = resp.choices?.[0]?.message?.content ?? "";
        const sql = basicPostValidate(stripCodeFences(raw));

        return NextResponse.json({ok: true, sql});
    } catch (e: any) {
        return NextResponse.json(
            {ok: false, error: e?.message ?? String(e)},
            {status: 400}
        );
    }
}
