"use client";

import { useMemo, useState } from "react";

type QueryResp =
    | { ok: true; sql: string; rows: any[] }
    | { ok: false; error: string };

type GenResp =
    | { ok: true; sql: string }
    | { ok: false; error: string };

const EXAMPLES: { title: string; sql: string }[] = [
    {
        title: "20 טוקנים עם אתנח (latest)",
        sql: `select book, chapter, verse, verse_text, token_index, raw, effective_taam
              from public.v_tokens_latest
              where effective_taam = 'ATNACH'
              order by book, chapter, verse, token_index
                  limit 20`,
    },
    {
        title: "ספירה לפי inferred_code לדחי",
        sql: `select inferred_code, count(*) as n
              from public.v_tokens_latest
              where effective_taam = 'DCHI'
              group by inferred_code
              order by n desc
                  limit 200`,
    },
];

function toTable(rows: any[]) {
    const cols = new Set<string>();
    for (const r of rows) Object.keys(r ?? {}).forEach((k) => cols.add(k));
    return { columns: Array.from(cols), rows };
}

export default function QueryLabPage() {
    const [question, setQuestion] = useState(
        "תן לי פסוקים שיש בהם אתנח בלי דחי לפניו"
    );
    const [sqlText, setSqlText] = useState(EXAMPLES[0].sql);

    const [runLoading, setRunLoading] = useState(false);
    const [genLoading, setGenLoading] = useState(false);

    const [runResp, setRunResp] = useState<QueryResp | null>(null);
    const [genResp, setGenResp] = useState<GenResp | null>(null);

    const table = useMemo(() => {
        if (!runResp || !runResp.ok) return null;
        return toTable(runResp.rows ?? []);
    }, [runResp]);

    async function run() {
        setRunLoading(true);
        setRunResp(null);
        try {
            const r = await fetch("/api/query", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ sql: sqlText }),
            });
            const data = (await r.json()) as QueryResp;
            setRunResp(data);
        } catch (e: any) {
            setRunResp({ ok: false, error: e?.message ?? String(e) });
        } finally {
            setRunLoading(false);
        }
    }

    async function generateSql() {
        setGenLoading(true);
        setGenResp(null);
        try {
            const r = await fetch("/api/ai-to-sql", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ question }),
            });

            const data = (await r.json()) as any;

            // תומך גם בפורמט { ok:true, sql } וגם אם החזרת רק { ok:true, sql } או { sql }
            if (data?.ok === false) {
                setGenResp({ ok: false, error: data.error ?? "Failed to generate SQL" });
            } else {
                const generated = String(data?.sql ?? "").trim();
                if (!generated) {
                    setGenResp({ ok: false, error: "AI returned empty SQL" });
                } else {
                    setSqlText(generated);
                    setGenResp({ ok: true, sql: generated });
                }
            }
        } catch (e: any) {
            setGenResp({ ok: false, error: e?.message ?? String(e) });
        } finally {
            setGenLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
            <h1 style={{ margin: 0 }}>Query Lab</h1>
            <p style={{ marginTop: 8, opacity: 0.8 }}>
                Generate SQL מהשאלה → Preview → Run (SELECT בלבד).
            </p>

            {/* Question → Generate */}
            <div
                style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "white",
                }}
            >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>שאלה (עברית)</div>

                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="לדוגמה: תן לי ספירה של כל סוגי הדחי במערכת"
              style={{
                  flex: 1,
                  minHeight: 64,
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.2)",
                  outline: "none",
                  direction: "rtl",
                  fontSize: 15,
              }}
          />

                    <button
                        onClick={generateSql}
                        disabled={genLoading || !question.trim()}
                        style={{
                            border: "1px solid rgba(0,0,0,0.2)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            background: genLoading ? "#f3f3f3" : "white",
                            cursor: genLoading ? "not-allowed" : "pointer",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            height: 44,
                        }}
                        title="יוצר SQL (לא מריץ)"
                    >
                        {genLoading ? "Generating..." : "Generate SQL"}
                    </button>
                </div>

                {genResp && !genResp.ok && (
                    <div
                        style={{
                            marginTop: 10,
                            padding: 10,
                            borderRadius: 12,
                            border: "1px solid rgba(255,0,0,0.25)",
                            background: "rgba(255,0,0,0.06)",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        <b>Generate Error:</b> {genResp.error}
                    </div>
                )}

                {genResp && genResp.ok && (
                    <div style={{ marginTop: 10, opacity: 0.8 }}>
                        ✅ SQL נוצר והוזן למטה. אפשר לערוך ואז Run.
                    </div>
                )}
            </div>

            {/* Examples */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0 8px" }}>
                {EXAMPLES.map((ex) => (
                    <button
                        key={ex.title}
                        onClick={() => setSqlText(ex.sql)}
                        style={{
                            border: "1px solid rgba(0,0,0,0.15)",
                            borderRadius: 10,
                            padding: "8px 10px",
                            background: "white",
                            cursor: "pointer",
                        }}
                        title={ex.title}
                    >
                        {ex.title}
                    </button>
                ))}
            </div>

            {/* SQL Editor */}
            <textarea
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                spellCheck={false}
                style={{
                    width: "100%",
                    minHeight: 240,
                    fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 14,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.2)",
                    outline: "none",
                }}
            />

            {/* Run */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                <button
                    onClick={run}
                    disabled={runLoading}
                    style={{
                        border: "1px solid rgba(0,0,0,0.2)",
                        borderRadius: 12,
                        padding: "10px 14px",
                        background: runLoading ? "#f3f3f3" : "white",
                        cursor: runLoading ? "not-allowed" : "pointer",
                        fontWeight: 700,
                    }}
                >
                    {runLoading ? "Running..." : "Run"}
                </button>

                {runResp?.ok && (
                    <span style={{ opacity: 0.8 }}>
            Returned <b>{runResp.rows.length}</b> rows
          </span>
                )}
            </div>

            {runResp && !runResp.ok && (
                <div
                    style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid rgba(255,0,0,0.25)",
                        background: "rgba(255,0,0,0.06)",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    <b>Run Error:</b> {runResp.error}
                </div>
            )}

            {table && (
                <div
                    style={{
                        marginTop: 14,
                        overflowX: "auto",
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 12,
                    }}
                >
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr>
                            {table.columns.map((c) => (
                                <th
                                    key={c}
                                    style={{
                                        textAlign: "left",
                                        padding: "10px 10px",
                                        borderBottom: "1px solid rgba(0,0,0,0.12)",
                                        position: "sticky",
                                        top: 0,
                                        background: "white",
                                    }}
                                >
                                    {c}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {table.rows.map((r, i) => (
                            <tr key={i}>
                                {table.columns.map((c) => (
                                    <td
                                        key={c}
                                        style={{
                                            padding: "8px 10px",
                                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                                            verticalAlign: "top",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {r?.[c] == null ? "" : String(r[c])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {table.rows.length === 0 && (
                            <tr>
                                <td colSpan={table.columns.length} style={{ padding: 12, opacity: 0.7 }}>
                                    No rows
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
