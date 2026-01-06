export const PASEK = "\u05C0";     // ׀
export const SOF_PASUQ = "\u05C3"; // ׃

export function isHebrewLetter(ch: string): boolean {
    const code = ch.codePointAt(0);
    if (code === undefined) return false;
    return code >= 0x05d0 && code <= 0x05ea;
}

// TAAM glyphs: U+0591..U+05AF  (no meaning here)
export function isTaam(ch: string): boolean {
    const code = ch.codePointAt(0);
    if (code === undefined) return false;
    return code >= 0x0591 && code <= 0x05af;
}

// NIQQUD: vowel marks + meteg + shin/sin dots + qamats qatan
export function isNiqqud(ch: string): boolean {
    const code = ch.codePointAt(0);
    if (code === undefined) return false;

    if (code >= 0x05b0 && code <= 0x05bc) return true;
    return (
        code === 0x05bd || // meteg (later may act as silluq by context)
        code === 0x05bf || // rafe
        code === 0x05c1 || // shin dot
        code === 0x05c2 || // sin dot
        code === 0x05c7    // qamats qatan
    );
}
