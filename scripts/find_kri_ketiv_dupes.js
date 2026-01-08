const fs = require("fs");

const file = process.argv[2];
if (!file) {
    console.error("Usage: node find_same_taam_diff_ending.js <tehillim.json>");
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));

// ניקוי סימני פיסוק מהקצוות (לא נוגע בטעמים/ניקוד)
function stripEdgePunct(s) {
    return s
        .replace(/^[\s"'“”‘’()\[\]{}<>.,;:!?]+/g, "")
        .replace(/[\s"'“”‘’()\[\]{}<>.,;:!?]+$/g, "")
        // מקף/פסק/סוף פסוק/פסיק עילי וכד'
        .replace(/^[\u05BE\u05C0\u05C3\u05C6|׀]+/g, "")
        .replace(/[\u05BE\u05C0\u05C3\u05C6|׀]+$/g, "");
}

// פיצול מילה לגרפמות (אות + כל הניקוד/טעמים שלה)
const seg = new Intl.Segmenter("he", { granularity: "grapheme" });
function graphemes(word) {
    const w = stripEdgePunct(word).normalize("NFC");
    return [...seg.segment(w)].map(x => x.segment).filter(Boolean);
}

function isHebrewish(word) {
    // לפחות אות עברית אחת
    return /[\u0590-\u05FF]/.test(word);
}

function findPairsInVerse(entry) {
    const words = entry.text.split(/\s+/).filter(Boolean);

    const hits = [];
    for (let i = 0; i < words.length - 1; i++) {
        const a0 = words[i];
        const b0 = words[i + 1];
        if (!isHebrewish(a0) || !isHebrewish(b0)) continue;

        const a = graphemes(a0);
        const b = graphemes(b0);

        if (a.length < 2 || b.length < 2) continue; // צריך לפחות "שורש"+סוף

        const aPrefix = a.slice(0, -1).join("");
        const bPrefix = b.slice(0, -1).join("");

        // "אותו דבר עם אותם טעמים" = זהות מוחלטת של כל הגרפמות עד הסוף
        if (aPrefix === bPrefix) {
            const aLast = a[a.length - 1];
            const bLast = b[b.length - 1];

            // "רק נגמרות אחרת"
            if (aLast !== bLast) {
                hits.push({
                    word1: stripEdgePunct(a0),
                    word2: stripEdgePunct(b0),
                    sharedPrefix: aPrefix,
                    ending1: aLast,
                    ending2: bLast,
                    wordIndex: i,
                    context: words.slice(Math.max(0, i - 4), Math.min(words.length, i + 6)).join(" "),
                });
            }
        }
    }
    return hits;
}

const results = [];

if (Array.isArray(data)) {
    for (const entry of data) {
        if (!entry?.text) continue;
        const hits = findPairsInVerse(entry);
        for (const h of hits) {
            results.push({
                chapter: entry.chapter,
                verse: entry.verse,
                ...h,
            });
        }
    }
} else {
    console.error("Expected JSON root to be an array of {chapter, verse, text} objects.");
    process.exit(1);
}

console.log(`Found ${results.length} pairs`);
for (const r of results) {
    console.log("—".repeat(70));
    console.log(`Tehillim ${r.chapter}:${r.verse}  (word #${r.wordIndex})`);
    console.log(`"${r.word1}"  +  "${r.word2}"`);
    console.log(`shared: "${r.sharedPrefix}"`);
    console.log(`end1 : "${r.ending1}"`);
    console.log(`end2 : "${r.ending2}"`);
    console.log(`ctx  : ${r.context}`);
}