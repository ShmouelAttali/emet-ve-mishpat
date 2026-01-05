import type { TokenGlyph, Mark } from "../text/tokenize";
import { GLYPH_TO_KEY, type AmtGlyphKey } from "./amtRegistry";
import {Taam} from "@/lib/taamim/model/taam";

export type Role = "mesharet" | "mafsik";

export type IdentifiedTaam =
    | { kind: "KNOWN"; key: string; hebName: string; role: Role; consumedU: string[] }
    | { kind: "UNKNOWN"; u: string };

export type TokenStep2 = {
    tokenId: string;
    observed: { hasPasekAfter: boolean; hasSofPasuqAfter: boolean };
    identified: IdentifiedTaam[];
};

export type Step2LocalResult = {
    tokens: TokenStep2[];
    anchors: {
        silluqIndex?: number;       // token index of the word with silluq (meteg in last-word context)
        sofPasuqIndex?: number;     // index of ׃ token if exists
    };
};

const METEG_U = "U+05BD"; // ֽ (niqqud; becomes SILUQ by context)

function allMarks(tok: TokenGlyph): Mark[] {
    return tok.clusters.flatMap((c) => c.marks);
}

function taamUs(tok: TokenGlyph): string[] {
    return allMarks(tok)
        .filter((m) => m.kind === "TAAM")
        .map((m) => m.u);
}

function hasTaamU(tok: TokenGlyph, u: string): boolean {
    return taamUs(tok).includes(u);
}

function niqqudUs(tok: TokenGlyph): string[] {
    return allMarks(tok)
        .filter((m) => m.kind === "NIQQUD")
        .map((m) => m.u);
}

function hasMeteg(tok: TokenGlyph): boolean {
    return niqqudUs(tok).includes(METEG_U);
}

function markKeys(tok: TokenGlyph): AmtGlyphKey[] {
    return allMarks(tok)
        .filter((m) => m.kind === "TAAM")
        .map((m) => GLYPH_TO_KEY[m.u])
        .filter(Boolean);
}

function hasKey(tok: TokenGlyph, key: AmtGlyphKey): boolean {
    return markKeys(tok).includes(key);
}

function isTaamOnLastLetter(tok: TokenGlyph, taamU: string): boolean {
    const last = tok.clusters.length - 1;
    return tok.clusters.some(
        (c, idx) => idx === last && c.marks.some((m) => m.kind === "TAAM" && m.u === taamU)
    );
}

function uniq(arr: string[]) {
    return Array.from(new Set(arr));
}

type KnownBuilder = { key: Taam; hebName: string; role: Role; consumedU: string[] };

export function identifyStep2Local(tokens: TokenGlyph[]): Step2LocalResult {
    const out: TokenStep2[] = [];

    const sofPasuqIndex = tokens.findIndex((t) => !!t.isSofPasuq);
    const lastWordIndex = sofPasuqIndex >= 0 ? sofPasuqIndex - 1 : tokens.length - 1;

    let silluqIndex: number | undefined = undefined;

    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];

        if (tok.isPasek || tok.isSofPasuq) {
            out.push({
                tokenId: tok.id,
                observed: { hasPasekAfter: false, hasSofPasuqAfter: false },
                identified: [],
            });
            continue;
        }

        const next = tokens[i + 1];
        const hasPasekAfter = !!next?.isPasek;
        const hasSofPasuqAfter = !!next?.isSofPasuq;
        const isLastToken = i === tokens.length - 1;

        const known: KnownBuilder[] = [];
        const consumedHere: string[] = [];

        const addKnown = (k: KnownBuilder) => {
            k.consumedU = uniq(k.consumedU);
            known.push(k);
            consumedHere.push(...k.consumedU);
        };

        // SILUQ (role anchor): meteg in last-word context (before ׃), or fallback if last token in text
        if ((hasSofPasuqAfter || i === lastWordIndex || isLastToken) && hasMeteg(tok)) {
            addKnown({ key: "SILLUQ", hebName: "סילוק", role: "mafsik", consumedU: [] });
            // Prefer the real last-word position if possible
            if (i === lastWordIndex || hasSofPasuqAfter || isLastToken) silluqIndex = i;
        }

        // ATNACH explicit: U+0591
        if (hasKey(tok, "ATNACH")) {
            addKnown({ key: "ATNACH", hebName: "אתנח", role: "mafsik", consumedU: ["U+0591"] });
        }

        // REVIa glyph: U+0597 (local)
        if (hasKey(tok, "REVIa")) {
            addKnown({ key: "REVIa", hebName: "רביע", role: "mafsik", consumedU: ["U+0597"] });
        }

        // PAZER: U+05A1
        if (hasKey(tok, "PAZER")) {
            addKnown({ key: "PAZER", hebName: "פזר", role: "mafsik", consumedU: ["U+05A1"] });
        }

        // TSINOR / TSINORIT: U+05AE by last-letter position
        if (hasKey(tok, "TSINOR")) {
            const isTsinor = isTaamOnLastLetter(tok, "U+05AE");
            addKnown({
                key: isTsinor ? "TSINOR" : "TSINORIT",
                hebName: isTsinor ? "צינור" : "צינורית",
                role: isTsinor ? "mafsik" : "mesharet",
                consumedU: ["U+05AE"],
            });
        }

        // DCHI: U+05AD (distinct from TIPCHA)
        if (hasKey(tok, "DCHI")) {
            addKnown({ key: "DCHI", hebName: "דחי", role: "mafsik", consumedU: ["U+05AD"] });
        }

        // QADMA / AZLA_LEGARMEH (pasek after word)
        if (hasKey(tok, "QADMA")) {
            addKnown({
                key: hasPasekAfter ? "AZLA_LEGARMEH" : "QADMA",
                hebName: hasPasekAfter ? "אזלא לגרמיה" : "קדמא",
                role: hasPasekAfter ? "mafsik" : "mesharet",
                consumedU: ["U+05A8"],
            });
        }

        // MAHAPAKH / MAHAPAKH_LEGARMEH
        if (hasKey(tok, "MAHAPAKH")) {
            addKnown({
                key: hasPasekAfter ? "MAHAPAKH_LEGARMEH" : "MAHAPAKH",
                hebName: hasPasekAfter ? "מהפך לגרמיה" : "מהפך",
                role: hasPasekAfter ? "mafsik" : "mesharet",
                consumedU: ["U+05A4"],
            });
        }

        // SHALSHELET glyph: U+0593 (local only; role later)
        if (hasTaamU(tok, "U+0593")) {
            addKnown({
                key: hasPasekAfter ? "SHALSHELET_GEDOLA" : "SHALSHELET_KETANA",
                hebName: hasPasekAfter ? "שלשלת גדולה" : "שלשלת קטנה",
                role: hasPasekAfter ? "mafsik" : "mesharet",
                consumedU: ["U+0593"],
            });
        }

        // YORED: U+05A5 => OLEH_VEYORED if OLE exists on same or previous token, else MERCHA
        const hasYored = hasKey(tok, "YORED");
        if (hasYored) {
            const prev = tokens[i - 1];
            const hasOleSame = hasKey(tok, "OLE");
            const hasOlePrev =
                !!prev && !prev.isPasek && !prev.isSofPasuq && hasKey(prev, "OLE");

            if (hasOleSame || hasOlePrev) {
                const consumed = ["U+05A5"];
                if (hasOleSame) consumed.push("U+05AB");
                addKnown({ key: "OLEH_VEYORED", hebName: "עולה ויורד", role: "mafsik", consumedU: consumed });
            } else {
                addKnown({ key: "MERCHA", hebName: "מירכא", role: "mesharet", consumedU: ["U+05A5"] });
            }
        }

        // TIPCHA: U+0596 (mesharet)
        if (hasKey(tok, "TIPCHA")) {
            addKnown({ key: "TIPCHA", hebName: "טיפחא", role: "mesharet", consumedU: ["U+0596"] });
        }

        // ILUY: U+05AC
        if (hasKey(tok, "ILUY")) {
            addKnown({ key: "ILUY", hebName: "עילוי", role: "mesharet", consumedU: ["U+05AC"] });
        }

        // MUNACH: U+05A3
        if (hasKey(tok, "MUNACH")) {
            addKnown({ key: "MUNACH", hebName: "מונח", role: "mesharet", consumedU: ["U+05A3"] });
        }

        // GALGAL: U+05AA
        if (hasKey(tok, "GALGAL")) {
            addKnown({ key: "GALGAL", hebName: "גלגל", role: "mesharet", consumedU: ["U+05AA"] });
        }

        // REVIa_MUGRASH: U+0597 + U+059D
        if (hasKey(tok, "REVIa") && hasKey(tok, "MUGRASH_MARK")) {
            addKnown({
                key: "REVIa_MUGRASH",
                hebName: "רביע מוגרש",
                role: "mafsik",
                consumedU: ["U+0597", "U+059D"],
            });
        }

        // UNKNOWN = (all taam glyphs) - (consumed by known taamim)
        const allTaams = taamUs(tok);
        const consumedSet = new Set(consumedHere);
        const unknown = allTaams
            .filter((u) => !consumedSet.has(u))
            .map((u) => ({ kind: "UNKNOWN", u } as const));

        const identified: IdentifiedTaam[] = [
            ...known.map((k) => ({ kind: "KNOWN", ...k } as const)),
            ...unknown,
        ];

        out.push({
            tokenId: tok.id,
            observed: { hasPasekAfter, hasSofPasuqAfter },
            identified,
        });
    }

    // Post-pass: consume OLE (U+05AB) from previous token when it partners with OLEH_VEYORED
    for (let i = 1; i < tokens.length; i++) {
        const cur = out[i];
        const prev = out[i - 1];
        if (!cur || !prev) continue;

        const ov = cur.identified.find((x) => x.kind === "KNOWN" && x.key === "OLEH_VEYORED");
        if (!ov) continue;

        const prevHasOleGlyph = hasTaamU(tokens[i - 1], "U+05AB");
        const curHasOleSame = hasTaamU(tokens[i], "U+05AB");
        if (prevHasOleGlyph && !curHasOleSame) {
            prev.identified = prev.identified.filter((x) => !(x.kind === "UNKNOWN" && x.u === "U+05AB"));
        }
    }

    return { tokens: out, anchors: { silluqIndex, sofPasuqIndex: sofPasuqIndex >= 0 ? sofPasuqIndex : undefined } };
}
