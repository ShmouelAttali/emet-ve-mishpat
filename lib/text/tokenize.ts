import { isHebrewLetter, isNiqqud, isTaam, PASEK, SOF_PASUQ } from "./unicode";

export type MarkKind = "TAAM" | "NIQQUD";

export type Mark = {
    kind: MarkKind;
    cp: string;
    u: string;            // U+XXXX
    letterIndex: number;  // index of base letter in token
    orderInLetter: number;// order among marks on that letter
};

export type LetterCluster = {
    letter: string;
    marks: Mark[]; // marks for THIS letter, in order
};

export type TokenGlyph = {
    id: string;
    raw: string;
    letters: string;
    clusters: LetterCluster[];
    isPasek?: boolean;
    isSofPasuq?: boolean;
};

let _id = 0;
const nextId = () => String(++_id);

function uPlus(ch: string) {
    const hex = (ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0");
    return `U+${hex}`;
}

export function tokenizeNormalizedText(normalized: string): TokenGlyph[] {
    _id = 0;
    const parts = normalized.split(" ").filter(Boolean);

    return parts.map((part) => {
        if (part === PASEK) {
            return { id: nextId(), raw: part, letters: "", clusters: [], isPasek: true };
        }
        if (part === SOF_PASUQ) {
            return { id: nextId(), raw: part, letters: "", clusters: [], isSofPasuq: true };
        }

        const clusters: LetterCluster[] = [];
        let letters = "";
        let currentLetterIndex = -1;
        let orderInLetter = 0;

        for (const ch of part) {
            if (isHebrewLetter(ch)) {
                letters += ch;
                currentLetterIndex++;
                orderInLetter = 0;
                clusters.push({ letter: ch, marks: [] });
                continue;
            }

            if (currentLetterIndex < 0) continue;

            if (isTaam(ch) || isNiqqud(ch)) {
                const kind: MarkKind = isTaam(ch) ? "TAAM" : "NIQQUD";
                clusters[currentLetterIndex].marks.push({
                    kind,
                    cp: ch,
                    u: uPlus(ch),
                    letterIndex: currentLetterIndex,
                    orderInLetter,
                });
                orderInLetter++;
            }
        }

        return { id: nextId(), raw: part, letters, clusters };
    });
}
