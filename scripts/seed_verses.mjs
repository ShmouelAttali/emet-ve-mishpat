import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");
const sql = neon(process.env.DATABASE_URL);

const BOOK = "Psalms";

// שנה את זה לשם הקובץ שלך
const INPUT_FILE = path.resolve(process.cwd(), "psalms-mgketer.json");

function cleanText(s) {
    return String(s ?? "")
        .normalize("NFC")
        .replace(/\u00A0/g, " ")      // NBSP -> space
        .replace(/\s*־\s*/g, "־")     // maqaf spacing
        .replace(/\s+/g, " ")         // collapse spaces
        .trim();
}

async function main() {
    if (!fs.existsSync(INPUT_FILE)) {
        throw new Error(`Input file not found: ${INPUT_FILE}`);
    }

    const raw = fs.readFileSync(INPUT_FILE, "utf8");
    const arr = JSON.parse(raw);

    if (!Array.isArray(arr)) {
        throw new Error("Expected JSON array of {chapter, verse, text}");
    }

    // ולידציה בסיסית
    for (const [i, v] of arr.entries()) {
        if (!v || typeof v !== "object") throw new Error(`Bad item at index ${i}`);
        if (!Number.isInteger(v.chapter) || v.chapter < 1) throw new Error(`Bad chapter at index ${i}`);
        if (!Number.isInteger(v.verse) || v.verse < 1) throw new Error(`Bad verse at index ${i}`);
        if (typeof v.text !== "string") throw new Error(`Bad text at index ${i}`);
    }

    // ממיינים ליציבות
    arr.sort((a, b) => a.chapter - b.chapter || a.verse - b.verse);

    console.log(`Loaded ${arr.length} verses from ${path.basename(INPUT_FILE)}`);

    const chunkSize = 300;
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);

        for (const v of chunk) {
            const text = cleanText(v.text);

            await sql`
                insert into verses (book, chapter, verse, text)
                values (${BOOK}, ${v.chapter}, ${v.verse}, ${text})
                    on conflict (book, chapter, verse)
        do update set text = excluded.text
            `;
        }

        console.log(`✅ Seeded ${Math.min(i + chunkSize, arr.length)}/${arr.length}`);
    }

    console.log("✅ verses seed completed");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
