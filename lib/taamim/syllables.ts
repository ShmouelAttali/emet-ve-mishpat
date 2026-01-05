import type { TokenGlyph, Mark } from "../text/tokenize";

// Rough vowel marks that indicate a syllable nucleus.
// (This is "good enough" for your rule-of-thumb; we can refine later.)
const VOWEL_US = new Set([
    "U+05B0", // sheva
    "U+05B1", // hataf segol
    "U+05B2", // hataf patah
    "U+05B3", // hataf qamats
    "U+05B4", // hiriq
    "U+05B5", // tsere
    "U+05B6", // segol
    "U+05B7", // patah
    "U+05B8", // qamats
    "U+05B9", // holam
    "U+05BB", // qubuts
    "U+05BC", // dagesh/mappiq (not vowel, but often accompanies; keep OUT)
    "U+05C7", // qamats qatan
]);

const METEG_U = "U+05BD";

function marksForLetter(token: TokenGlyph, letterIndex: number): Mark[] {
    const c = token.clusters[letterIndex];
    return c ? c.marks : [];
}

function hasVowel(marks: Mark[]): boolean {
    return marks.some((m) => m.kind === "NIQQUD" && VOWEL_US.has(m.u));
}

export function findMetegLetterIndex(token: TokenGlyph): number | null {
    for (let i = 0; i < token.clusters.length; i++) {
        const marks = marksForLetter(token, i);
        if (marks.some((m) => m.kind === "NIQQUD" && m.u === METEG_U)) return i;
    }
    return null;
}

export function syllablesFromSilluqToEnd(token: TokenGlyph): number | null {
    const sIdx = findMetegLetterIndex(token);
    if (sIdx == null) return null;

    let count = 0;
    for (let i = sIdx; i < token.clusters.length; i++) {
        if (hasVowel(marksForLetter(token, i))) count += 1;
    }
    if (count === 0) count = 1;
    return count;
}
