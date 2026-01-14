import type {Mark, TokenGlyph} from "../text/tokenize";
import {type AmtGlyphKey, GLYPH_TO_KEY, uOf} from "./amtRegistry";
import {Taam, TAAM_META} from "@/lib/taamim/model/taam";
import {IdentifiedTaam, Step2LocalResult, TokenStep2} from "@/lib/taamim/types";

function findFirstClusterIndexOfAnyKey(tok: TokenGlyph, keys: AmtGlyphKey[]): number | undefined {
    for (const k of keys) {
        const u = uOf(k);
        const idx = findFirstClusterIndexOfAnyU(tok, u);
        if (idx != null) return idx;
    }
    return undefined;
}

function findAllClusterIndicesOfU(tok: TokenGlyph, u: string): number[] {
    const out: number[] = [];
    for (let i = 0; i < tok.clusters.length; i++) {
        if (tok.clusters[i].marks.some((m) => m.u === u)) out.push(i);
    }
    return out;
}

function findFirstClusterIndexOfAnyU(tok: TokenGlyph, u: string): number | undefined {
    const idx = findAllClusterIndicesOfU(tok, u)[0];
    if (idx != null) return idx;
    return undefined;
}

function allMarks(tok: TokenGlyph): Mark[] {
    return tok.clusters.flatMap((c) => c.marks);
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

function firstIdentifiedTaam(
    cur: TokenGlyph,
    ctx: {
        hasPasekAfter: boolean;
        hasSofPasuqAfter: boolean;
        isLastWordContext: boolean;
        silluqClusterIndex?: number; // חדש
    }
): IdentifiedTaam | undefined {
    const add = (taam: Taam, opts?: { taamClusterIndex?: number }): IdentifiedTaam => {
        let taamMetaElement = TAAM_META[taam];
        const taamClusterIndex =
            opts?.taamClusterIndex ?? findFirstClusterIndexOfAnyKey(cur, taamMetaElement.glyphs);
        return {
            kind: "KNOWN",
            key: taam,
            hebName: taamMetaElement.hebName,
            role: taamMetaElement.role,
            consumedKeys: taamMetaElement.glyphs,
            taamClusterIndex,
        };
    };

    if (ctx.silluqClusterIndex != null) {
        return add("SILLUQ", {taamClusterIndex: ctx.silluqClusterIndex});
    }

    // 2) ATNACH
    if (hasKey(cur, "ATNACH")) {
        return add("ATNACH");
    }

    // 3) REVIa_MUGRASH (שים לפני REVIa הרגיל אם זה אמור “לנצח” אותו)
    if (hasKey(cur, "REVIa") && hasKey(cur, "MUGRASH_MARK")) {
        return add("REVIa_MUGRASH");
    }

    // 4) REVIa
    if (hasKey(cur, "REVIa")) {
        return add("REVIa");
    }

    // 5) PAZER
    if (hasKey(cur, "PAZER")) {
        return add("PAZER");
    }

    // 6) TSINOR / TSINORIT
    if (hasKey(cur, "TSINOR")) {
        const isTsinor = isTaamOnLastLetter(cur, uOf("TSINOR"));
        return add(isTsinor ? "TSINOR" : "TSINORIT");
    }

    // 7) DCHI
    if (hasKey(cur, "DCHI")) {
        return add("DCHI");
    }

    // 8) QADMA / AZLA_LEGARMEH
    if (hasKey(cur, "QADMA")) {
        return add(ctx.hasPasekAfter ? "AZLA_LEGARMEH" : "QADMA");
    }

    // 9) MAHAPAKH / MAHAPAKH_LEGARMEH
    if (hasKey(cur, "MAHAPAKH")) {
        return add(ctx.hasPasekAfter ? "MAHAPAKH_LEGARMEH" : "MAHAPAKH");
    }

    // 10) SHALSHELET (לפי פסק אחרי)
    if (hasKey(cur, "SHALSHELET")) {
        return add(ctx.hasPasekAfter ? "SHALSHELET_GEDOLA" : "SHALSHELET_KETANA");
    }

    // 11) YORED: U+05A5
// STEP2 מזהה OLEH_VEYORED רק אם גם OLE וגם YORED על אותה מילה.
// אחרת YORED הוא תמיד MERCHA.
// (אין יותר הסתכלות על המילה הקודמת בשלב הזה)
    const hasYored = hasKey(cur, "YORED");
    if (hasYored) {
        const hasOleSame = hasKey(cur, "OLE");

        if (hasOleSame) {
            return add("OLEH_VEYORED");
        }

        return add("MERCHA");
    }

    // 12) TIPCHA
    if (hasKey(cur, "TIPCHA")) {
        return add("TIPCHA");
    }

    // 13) ILUY
    if (hasKey(cur, "ILUY")) {
        return add("ILUY");
    }

    // 14) MUNACH
    if (hasKey(cur, "MUNACH")) {
        return add("MUNACH");
    }

    // 15) GALGAL
    if (hasKey(cur, "GALGAL")) {
        return add("GALGAL");
    }

    return undefined;
}


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
                observed: {hasPasekAfter: false, hasSofPasuqAfter: false},
                identified: undefined,
            });
            continue;
        }

        const next = tokens[i + 1];
        const hasPasekAfter = !!next?.isPasek;
        const hasSofPasuqAfter = !!next?.isSofPasuq;
        const isLastToken = i === tokens.length - 1;

        const isLastWordContext = hasSofPasuqAfter || i === lastWordIndex || isLastToken;

        const metegClusters = findAllClusterIndicesOfU(tok, uOf("METEG")); // U+05BD

        let metegClusterIndex: number | undefined;
        let silluqClusterIndex: number | undefined;

        if (!isLastWordContext) {
            // לא מילה אחרונה: 0 או 1 מתג זה תקין
            if (metegClusters.length === 1) {
                metegClusterIndex = metegClusters[0];
            } else if (metegClusters.length > 1) {
                console.warn(`Found ${metegClusters.length} metegs in a non-last word: ${tok.raw}`);
                // אפשר לבחור ראשון כדי "להמשיך לחיות":
                metegClusterIndex = metegClusters[0];
            }
        } else {
            // מילה אחרונה:
            // 0 => אין כלום
            // 1 => סילוק
            // 2 => ראשון מתג, שני סילוק
            if (metegClusters.length === 1) {
                silluqClusterIndex = metegClusters[0];
            } else if (metegClusters.length === 2) {
                metegClusterIndex = metegClusters[0];
                silluqClusterIndex = metegClusters[1];
            } else if (metegClusters.length > 2) {
                console.warn(`Found ${metegClusters.length} metegs in last-word context: ${tok.raw}`);
                // fallback: ראשון מתג, אחרון סילוק
                metegClusterIndex = metegClusters[0];
                silluqClusterIndex = metegClusters[metegClusters.length - 1];
            }
        }

        const identified = firstIdentifiedTaam(tok, {
            hasPasekAfter,
            hasSofPasuqAfter,
            isLastWordContext,
            silluqClusterIndex,
        });

        if (identified?.kind === "KNOWN" && identified.key === "SILLUQ") {
            if (isLastWordContext) silluqIndex = i;
        }

        out.push({
            tokenId: tok.id,
            observed: {hasPasekAfter, hasSofPasuqAfter},
            identified,
            metegClusterIndex,
        });
    }

    return {
        tokens: out,
        anchors: {silluqIndex, sofPasuqIndex: sofPasuqIndex >= 0 ? sofPasuqIndex : undefined},
    };
}

