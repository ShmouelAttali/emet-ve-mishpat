import { neon } from "@neondatabase/serverless";
import { analyzeHebrewTaamim } from "@/lib/analyze";

import { extractVerseAnalysisTokenRows } from "@/lib/analysis/extractVerseTokens";
import { upsertVerseAnalysisTokens } from "@/lib/analysis/upsertVerseTokens";

if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");
const sql = neon(process.env.DATABASE_URL);

// עדכן כשמשנים לוגיקה של הניתוח
const ANALYSIS_VERSION = "v0.1.0";

const BOOK = "Job";

// כמה פסוקים לטעינה מה-DB בכל פעם
const CHUNK_SIZE = 50;

// כמה פסוקים לעבד במקביל (מומלץ 4-6. אפשר להעלות ל-8 אם יציב)
const CONCURRENCY = 6;

type VerseRow = {
    id: number;
    chapter: number;
    verse: number;
    text: string;
};

async function processVerse(v: VerseRow) {
    // 1) ניתוח (CPU)
    const result = analyzeHebrewTaamim(v.text);

    // אופציונלי: להקטין JSON
    // delete (result as any).debug;

    // 2) שמירת JSON גולמי
    await sql`
    insert into verse_analyses (verse_id, analysis_version, result_json)
    values (${v.id}, ${ANALYSIS_VERSION}, ${JSON.stringify(result)}::jsonb)
    on conflict (verse_id, analysis_version)
    do update set result_json = excluded.result_json, created_at = now()
  `;

    // 3) פירוק לטבלת טוקנים + upsert
    const tokenRows = extractVerseAnalysisTokenRows({
        verseId: v.id,
        analysisVersion: ANALYSIS_VERSION,
        result,
    });

    await upsertVerseAnalysisTokens(sql as any, tokenRows);
}

function groupByChapter(verses: VerseRow[]): Map<number, VerseRow[]> {
    const m = new Map<number, VerseRow[]>();
    for (const v of verses) {
        const arr = m.get(v.chapter);
        if (arr) arr.push(v);
        else m.set(v.chapter, [v]);
    }
    return m;
}

async function main() {
    const verses = (await sql`
    select id, chapter, verse, text
    from verses
    where book = ${BOOK}
    order by chapter asc, verse asc
  `) as VerseRow[];

    // verses.splice(100); // בדיקה מקומית

    console.log(`Found ${verses.length} verses`);
    console.log(
        `Settings: chunk=${CHUNK_SIZE}, concurrency=${CONCURRENCY}, version=${ANALYSIS_VERSION}`
    );

    let ok = 0;
    let failed = 0;

    // כדי שהלוג "Starting Chapter X" יהיה עקבי גם עם מקביליות,
    // נרוץ פרק-פרק, ובתוך כל פרק נעשה batching + concurrency.
    const byChapter = groupByChapter(verses);

    const chapters = [...byChapter.keys()].sort((a, b) => a - b);

    for (const chapter of chapters) {
        console.log(`Starting Chapter ${chapter}`);

        const chapterVerses = byChapter.get(chapter)!;

        for (let i = 0; i < chapterVerses.length; i += CHUNK_SIZE) {
            const batch = chapterVerses.slice(i, i + CHUNK_SIZE);

            // עיבוד מקבילי מבוקר: מחלקים את ה-batch לתת-קבוצות בגודל CONCURRENCY
            for (let j = 0; j < batch.length; j += CONCURRENCY) {
                const slice = batch.slice(j, j + CONCURRENCY);

                await Promise.all(
                    slice.map(async (v) => {
                        try {
                            await processVerse(v);
                            ok++;
                        } catch (e: any) {
                            failed++;
                            console.error(
                                `❌ Failed chapter=${v.chapter} verse=${v.verse} id=${v.id}:`,
                                e?.message ?? e
                            );
                        }
                    })
                );
            }

            const done = ok + failed;
            console.log(
                `✅ Progress ${done}/${verses.length} (ok=${ok}, failed=${failed})`
            );
        }
    }

    console.log(`✅ Done. ok=${ok}, failed=${failed}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
