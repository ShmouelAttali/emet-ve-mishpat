import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL_READONLY!);

const ALLOWED = [
    "public.v_tokens_latest",
    "public.v_verses_latest",
    "public.v_verse_taam_set",
    "public.v_tokens",
];

const FORBIDDEN = [
    "insert", "update", "delete", "drop", "alter", "truncate", "copy",
    "create", "grant", "revoke", "vacuum", "analyze",
];

function normalize(s: string) {
    return s.replace(/\s+/g, " ").trim();
}

function must(cond: any, msg: string) {
    if (!cond) throw new Error(msg);
}

function hasAllowedFrom(q: string) {
    const ql = q.toLowerCase();
    return ALLOWED.some((t) => ql.includes(`from ${t}`) || ql.includes(`join ${t}`));
}

function enforceLimit(q: string, maxLimit = 500, defaultLimit = 200) {
    const qn = normalize(q);
    const m = qn.match(/\blimit\s+(\d+)\b/i);
    if (!m) return `${qn} limit ${defaultLimit}`;
    const n = Math.min(parseInt(m[1]!, 10), maxLimit);
    return qn.replace(/\blimit\s+\d+\b/i, `limit ${n}`);
}

function basicValidate(q: string) {
    const qn = normalize(q);
    const ql = qn.toLowerCase();

    must(qn.length > 0, "Missing SQL");
    must(!qn.includes(";"), "Only a single statement is allowed (no ';').");
    must(ql.startsWith("select") || ql.startsWith("with"), "Only SELECT/CTE queries are allowed.");

    for (const w of FORBIDDEN) {
        must(!new RegExp(`\\b${w}\\b`, "i").test(qn), `Forbidden keyword: ${w}`);
    }

    must(
        hasAllowedFrom(qn),
        `Query must read from allowed views only: ${ALLOWED.join(", ")}`
    );

    return enforceLimit(qn);
}

async function explainGate(query: string) {
    const rows = await sql`explain (format json) ${sql.unsafe(query)}`;
    const plan = rows?.[0]?.["QUERY PLAN"]?.[0];
    const totalCost = plan?.Plan?.["Total Cost"];
    const planRows = plan?.Plan?.["Plan Rows"];
    return { totalCost, planRows };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const input = String(body?.sql ?? "");
        const safeSql = basicValidate(input);

        // זמן מקסימום לבקשה
        await sql`set local statement_timeout = '3000ms'`;

        // gate לפני ריצה
        const { totalCost, planRows } = await explainGate(safeSql);

        if (typeof totalCost === "number" && totalCost > 200000) {
            return NextResponse.json(
                { ok: false, error: `Query too expensive (cost=${totalCost}). Add filters.` },
                { status: 400 }
            );
        }
        if (typeof planRows === "number" && planRows > 200000) {
            return NextResponse.json(
                { ok: false, error: `Too many rows estimated (${planRows}). Add filters.` },
                { status: 400 }
            );
        }

        const data = await sql`${sql.unsafe(safeSql)}`;
        return NextResponse.json({ ok: true, sql: safeSql, rows: data });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
    }
}
