// scripts/scrape_mgketer_psalms.mjs
import fs from "fs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hebNumToInt(h) {
    const map = {א:1,ב:2,ג:3,ד:4,ה:5,ו:6,ז:7,ח:8,ט:9,י:10,כ:20,ל:30,מ:40,נ:50,ס:60,ע:70,פ:80,צ:90,ק:100,ר:200,ש:300,ת:400, ך:20, ם:40, ן:50, ף:80, ץ:90};
    return [...h].reduce((s,ch)=>s+(map[ch]||0),0);
}

function parseChapterText(html, chapter) {
    // מחלץ הכל בין [א] ... : [ב] ... :
    // בדף לדוגמה יש נקודתיים בסוף כל פסוק.
    const text = html
        .replace(/\s+/g, " ")
        .replace(/<[^>]+>/g, " "); // strip tags (פשוט)

    const re = /\[([\u05D0-\u05EA"׳״]{1,6})\]\s*(.+?)(?=\s*\[[\u05D0-\u05EA"׳״]{1,6}\]\s*|$)/g;

    const verses = [];
    let m;
    while ((m = re.exec(text)) !== null) {
        const verseHeb = m[1].replace(/["׳״]/g, "");
        const verse = hebNumToInt(verseHeb);
        const verseText = m[2]
            .trim()
            .replace(/:\s*$/, "") // מוריד ':' בסוף אם יש
            .normalize("NFC");

        if (verse > 0 && verseText) {
            verses.push({ chapter, verse, text: verseText });
        }
    }

    verses.sort((a,b)=>a.verse-b.verse);
    return verses;
}

async function main() {
    const all = [];

    for (let chapter = 1; chapter <= 150; chapter++) {
        const url = `https://www.mgketer.org/mikra/27/${chapter}`;
        const res = await fetch(url, {
            headers: { "user-agent": "emet-ve-mishpat/1.0 (personal research)" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const html = await res.text();

        const verses = parseChapterText(html, chapter);
        console.log(`Chapter ${chapter}: ${verses.length} verses`);
        all.push(...verses);

        await sleep(800); // חשוב: לא להפיל להם את האתר
    }

    fs.writeFileSync("psalms-mgketer.json", JSON.stringify(all, null, 2), "utf8");
    console.log(`✅ total verses: ${all.length}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
