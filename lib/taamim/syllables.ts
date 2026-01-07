import type { TokenGlyph, Mark } from "../text/tokenize";
import type { Taam } from "../taamim/model/taam";
import { GLYPH_TO_KEY, TAAM_TO_AMT_GLYPH_KEY, type AmtGlyphKey } from "../taamim/amtRegistry";

// ---------------------------
// Vowel detection (nuclei)
// ---------------------------

// Rough vowel marks that indicate a syllable nucleus.
// Keep this conservative; refine later if needed.
const VOWEL_US = new Set([
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
    // NOTE: U+05BC dagesh/mappiq is NOT a vowel nucleus
    "U+05C7", // qamats qatan
]);

function marksForLetter(token: TokenGlyph, letterIndex: number): Mark[] {
    return token.clusters[letterIndex]?.marks ?? [];
}

function hasVowelNucleus(marks: Mark[]): boolean {
    return marks.some((m) => m.kind === "NIQQUD" && VOWEL_US.has(m.u));
}

// ---------------------------
// Glyph lookup helpers
// ---------------------------

/**
 * Builds the inverse mapping: AmtGlyphKey -> U+XXXX
 * based on GLYPH_TO_KEY.
 */
const KEY_TO_GLYPH_U: Record<AmtGlyphKey, string> = (() => {
    const out = {} as Record<AmtGlyphKey, string>;
    for (const [u, key] of Object.entries(GLYPH_TO_KEY)) {
        if (!out[key]) out[key] = u;
    }
    return out;
})();

/**
 * Finds the letterIndex (cluster index) of a glyph key inside a token.
 * Works for both TAAM and NIQQUD because it matches by m.u only.
 */
export function findLetterIndexOfGlyphKey(token: TokenGlyph, key: AmtGlyphKey): number | null {
    const u = KEY_TO_GLYPH_U[key];
    if (!u) return null;

    for (let i = 0; i < token.clusters.length; i++) {
        const marks = marksForLetter(token, i);
        if (marks.some((m) => m.u === u)) return i;
    }
    return null;
}

/**
 * For a given Taam, finds the chosen glyph (via TAAM_TO_AMT_GLYPH_KEY) and returns its letterIndex.
 * Example: SILLUQ -> METEG -> finds meteg letter index.
 */
export function findLetterIndexForTaamAnchor(token: TokenGlyph, taam: Taam): number | null {
    const key = TAAM_TO_AMT_GLYPH_KEY[taam];
    if (!key) return null;
    return findLetterIndexOfGlyphKey(token, key);
}

// ---------------------------
// Syllable counting
// ---------------------------

/**
 * Counts syllable nuclei between two letter indices (inclusive).
 * Returns null if indices are invalid/out of bounds.
 *
 * Rule-of-thumb behavior: if there are 0 vowel nuclei in the range,
 * returns 1 (at least one syllable).
 */
export function countSyllablesInRange(
    token: TokenGlyph,
    fromLetterIndex: number,
    toLetterIndexInclusive: number
): number | null {
    const n = token.clusters.length;
    if (n === 0) return null;

    if (
        fromLetterIndex < 0 ||
        toLetterIndexInclusive < 0 ||
        fromLetterIndex >= n ||
        toLetterIndexInclusive >= n
    ) {
        return null;
    }

    const from = Math.min(fromLetterIndex, toLetterIndexInclusive);
    const to = Math.max(fromLetterIndex, toLetterIndexInclusive);

    let count = 0;
    for (let i = from; i <= to; i++) {
        if (hasVowelNucleus(marksForLetter(token, i))) count += 1;
    }

    // If we found no vowel marks, treat it as one syllable word/segment.
    return count === 0 ? 1 : count;
}

/**
 * Main API you asked for:
 * Count syllables from START OF WORD up to the chosen anchor glyph of a Taam.
 *
 * Examples:
 * - SILLUQ -> METEG anchor -> counts syllables from start to meteg letter.
 * - ATNACH -> ATNACH glyph -> counts syllables from start to that letter.
 */
export function countSyllablesFromStartToTaamAnchor(token: TokenGlyph, taam: Taam): number | null {
    const anchorIdx = findLetterIndexForTaamAnchor(token, taam);
    if (anchorIdx == null) return null;
    return countSyllablesInRange(token, 0, anchorIdx);
}

/**
 * Convenience: count syllables from start to a glyph key directly (no Taam).
 * Useful for special cases (like METEG without calling it SILLUQ).
 */
export function countSyllablesFromStartToGlyphKey(token: TokenGlyph, key: AmtGlyphKey): number | null {
    const anchorIdx = findLetterIndexOfGlyphKey(token, key);
    if (anchorIdx == null) return null;
    return countSyllablesInRange(token, 0, anchorIdx);
}

export function countVowelNucleiInRange(
    token: TokenGlyph,
    fromLetterIndex: number,
    toLetterIndexInclusive: number
): number | null {
    const n = token.clusters.length;
    if (n === 0) return null;

    if (
        fromLetterIndex < 0 ||
        toLetterIndexInclusive < 0 ||
        fromLetterIndex >= n ||
        toLetterIndexInclusive >= n
    ) {
        return null;
    }

    const from = Math.min(fromLetterIndex, toLetterIndexInclusive);
    const to = Math.max(fromLetterIndex, toLetterIndexInclusive);

    let count = 0;
    for (let i = from; i <= to; i++) {
        if (hasVowelNucleus(marksForLetter(token, i))) count += 1;
    }
    return count;
}

export function vowelNucleusLetterIndices(token: TokenGlyph): number[] {
    const out: number[] = [];
    for (let i = 0; i < token.clusters.length; i++) {
        if (hasVowelNucleus(marksForLetter(token, i))) out.push(i);
    }
    return out;
}

export function lastSyllableLetterRange(token: TokenGlyph): { from: number; toInclusive: number } | null {
    const nuclei = vowelNucleusLetterIndices(token);
    if (nuclei.length === 0) return null;

    // const lastNucleus = nuclei[nuclei.length - 1];
    const prevNucleus = nuclei.length >= 2 ? nuclei[nuclei.length - 2] : null;

    const from = prevNucleus == null ? 0 : prevNucleus + 1;
    const toInclusive = token.clusters.length - 1;

    // safety
    if (from < 0 || from > toInclusive) return null;
    return { from, toInclusive };
}


export function hasTaamOnLastSyllable(token: TokenGlyph): boolean {
    const r = lastSyllableLetterRange(token);
    if (!r) return false;

    for (let i = r.from; i <= r.toInclusive; i++) {
        if (marksForLetter(token, i).some((m) => m.kind === "TAAM")) return true;
    }
    return false;
}


export function hasVowelNucleusBeforeLetterIndex(token: TokenGlyph, letterIndexExclusive: number): boolean {
    if (letterIndexExclusive <= 0) return false;
    const to = Math.min(letterIndexExclusive - 1, token.clusters.length - 1);
    for (let i = 0; i <= to; i++) {
        if (hasVowelNucleus(marksForLetter(token, i))) return true;
    }
    return false;
}


