// number -> Hebrew numerals (gematria), e.g. 1="א", 11="י״א", 15="ט״ו", 116="קט״ז"
export function toHebrewNumeral(n: number): string {
    if (!Number.isFinite(n) || n <= 0 || Math.floor(n) !== n) return String(n);

    const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
    const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
    const hundreds = ["", "ק", "ר", "ש", "ת"]; // 100..400

    let x = n;
    let out = "";

    // thousands (optional): use repeated ת? In common UI we usually omit thousands for Tehillim.
    // If you do want, implement separately. For chapters/verses you likely don't need it.

    // 400s
    while (x >= 400) {
        out += "ת";
        x -= 400;
    }

    // 100..300
    if (x >= 100) {
        const h = Math.floor(x / 100); // 1..3 (or 4 handled above)
        out += hundreds[h];
        x %= 100;
    }

    // special cases 15/16
    if (x === 15) {
        out += "טו";
        x = 0;
    } else if (x === 16) {
        out += "טז";
        x = 0;
    }

    // tens
    if (x >= 10) {
        const t = Math.floor(x / 10); // 1..9
        out += tens[t];
        x %= 10;
    }

    // ones
    if (x > 0) out += ones[x];

    // add geresh/gershayim
    if (out.length === 1) return out + "׳";
    // put gershayim before last char
    return out.slice(0, -1) + "״" + out.slice(-1);
}
