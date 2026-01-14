// app/api/psalms/[chapter]/[verse]/route.ts
import {sql} from "@/lib/db/db";

export const dynamic = "force-dynamic";

type Params = { book: string, chapter: string; verse: string };

async function getLatestAnalysisVersion(): Promise<string | null> {
    const rows = await sql`
        select analysis_version
        from verse_analyses
        order by created_at desc limit 1
    `;
    return rows[0]?.analysis_version ?? null;
}

export async function GET(
    req: Request,
    ctx: { params: Promise<Params> } // ✅ params is a Promise in your Next version
) {
    const {book: bookStr, chapter: chStr, verse: vStr} = await ctx.params; // ✅ unwrap

    const chapter = Number(chStr);
    const verse = Number(vStr);

    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
        return new Response("Bad chapter", {status: 400});
    }
    if (!Number.isInteger(verse) || verse < 1) {
        return new Response("Bad verse", {status: 400});
    }

    const url = new URL(req.url);
    const requestedVersion = url.searchParams.get("version")?.trim() || null;

    // 1) מצא את הפסוק
    const vRows = await sql`
        select id, book, chapter, verse, text
        from verses
        where book = ${bookStr}
          and chapter = ${chapter}
          and verse = ${verse} limit 1
    `;

    if (vRows.length === 0) {
        return new Response("Verse not found", {status: 404});
    }

    const verseRow = vRows[0];
    const verseId = verseRow.id as number;

    // 2) קבע גרסה אפקטיבית
    let effectiveVersion = requestedVersion;
    if (!effectiveVersion) {
        effectiveVersion = await getLatestAnalysisVersion();
    }

    if (!effectiveVersion) {
        return Response.json({
            verse: verseRow,
            analysisVersion: null,
            analysis: null,
            message: "No analyses found in DB yet",
        });
    }

    // 3) נסה להביא ניתוח לפי הגרסה שביקשו/הגרסה האחרונה
    let aRows = await sql`
        select analysis_version, created_at, result_json
        from verse_analyses
        where verse_id = ${verseId}
          and analysis_version = ${effectiveVersion} limit 1
    `;

    if (requestedVersion && aRows.length === 0) {
        return new Response(`Analysis not found for version=${requestedVersion}`, {
            status: 404,
        });
    }

    // 4) fallback לגרסה האחרונה של הפסוק עצמו (אם לא ביקשו version ספציפית)
    if (!requestedVersion && aRows.length === 0) {
        aRows = await sql`
            select analysis_version, created_at, result_json
            from verse_analyses
            where verse_id = ${verseId}
            order by created_at desc limit 1
        `;
    }

    if (aRows.length === 0) {
        return Response.json({
            verse: verseRow,
            analysisVersion: effectiveVersion,
            analysis: null,
            message: "No analysis for this verse yet",
        });
    }

    const analysisRow = aRows[0];

    return Response.json({
        verse: verseRow,
        analysisVersion: analysisRow.analysis_version,
        analysisCreatedAt: analysisRow.created_at,
        analysis: analysisRow.result_json,
    });
}
