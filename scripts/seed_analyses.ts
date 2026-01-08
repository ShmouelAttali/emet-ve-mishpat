import {neon} from "@neondatabase/serverless";
import {analyzeHebrewTaamim} from "@/lib/analyze";

if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");
const sql = neon(process.env.DATABASE_URL);

// עדכן כשמשנים לוגיקה של הניתוח
const ANALYSIS_VERSION = "v0.1.0";

const BOOK = "Psalms";
const CHUNK_SIZE = 25; // ניתוח כבד יחסית; אפשר להעלות ל-50 אחרי בדיקה

async function main() {
    // תביא את כל הפסוקים (id + text)
    const verses = await sql`
        select id, chapter, verse, text
        from verses
        where book = ${BOOK}
        order by chapter asc, verse asc
    `;

    console.log(`Found ${verses.length} verses`);

    let ok = 0;
    let failed = 0;
    let curChapter = 0;
    for (let i = 0; i < verses.length; i += CHUNK_SIZE) {

        const batch = verses.slice(i, i + CHUNK_SIZE);

        for (const v of batch) {
            if (curChapter != v.chapter) {
                curChapter = v.chapter;
                console.log('Starting Chapter ' + curChapter);
            }
            try {
                const result = analyzeHebrewTaamim(v.text);

                // אופציונלי: אם debug ממש גדול ואתה לא צריך אותו, תוכל לכבות:
                // delete (result as any).debug;

                await sql`
                    insert into verse_analyses (verse_id, analysis_version, result_json)
                    values (${v.id}, ${ANALYSIS_VERSION}, ${JSON.stringify(result)}::jsonb) on conflict (verse_id, analysis_version)
          do
                    update set result_json = excluded.result_json, created_at = now()
                `;

                ok++;
            } catch (e: any) {
                failed++;
                console.error(
                    `❌ Failed chapter=${v.chapter} verse=${v.verse} id=${v.id}:`,
                    e?.message ?? e
                );

                // ממשיכים הלאה כדי לא להיתקע על פסוק בעייתי
            }
        }

        console.log(
            `✅ Progress ${Math.min(i + CHUNK_SIZE, verses.length)}/${verses.length} (ok=${ok}, failed=${failed})`
        );
    }

    console.log(`✅ Done. ok=${ok}, failed=${failed}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
