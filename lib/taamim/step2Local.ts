import type {Mark, TokenGlyph} from "../text/tokenize";
import {type AmtGlyphKey, GLYPH_TO_KEY} from "./amtRegistry";
import {Taam} from "@/lib/taamim/model/taam";

export type Role = "mesharet" | "mafsik";

export type IdentifiedTaam = { kind: "KNOWN" | "UNKNOWN"; key: Taam; hebName: string; role: Role; consumedU: string[] };

export type TokenStep2 = {
    tokenId: string;
    observed: { hasPasekAfter: boolean; hasSofPasuqAfter: boolean };
    identified: IdentifiedTaam | undefined;
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

function firstIdentifiedTaam(
    cur: TokenGlyph,
    prev: TokenGlyph | undefined,
    ctx: {
        hasPasekAfter: boolean;
        hasSofPasuqAfter: boolean;
        isLastWordContext: boolean;
    }
): IdentifiedTaam | undefined {
    const add = (k: KnownBuilder): IdentifiedTaam => ({
        kind: "KNOWN",
        key: k.key,
        hebName: k.hebName,
        role: k.role,
        consumedU: uniq(k.consumedU),
    });

    // 1) SILUQ: meteg in last-word context
    if (ctx.isLastWordContext && hasMeteg(cur)) {
        return add({key: "SILLUQ", hebName: "סילוק", role: "mafsik", consumedU: []});
    }

    // 2) ATNACH
    if (hasKey(cur, "ATNACH")) {
        return add({key: "ATNACH", hebName: "אתנח", role: "mafsik", consumedU: ["U+0591"]});
    }

    // 3) REVIa_MUGRASH (שים לפני REVIa הרגיל אם זה אמור “לנצח” אותו)
    if (hasKey(cur, "REVIa") && hasKey(cur, "MUGRASH_MARK")) {
        return add({
            key: "REVIa_MUGRASH",
            hebName: "רביע מוגרש",
            role: "mafsik",
            consumedU: ["U+0597", "U+059D"],
        });
    }

    // 4) REVIa
    if (hasKey(cur, "REVIa")) {
        return add({key: "REVIa", hebName: "רביע", role: "mafsik", consumedU: ["U+0597"]});
    }

    // 5) PAZER
    if (hasKey(cur, "PAZER")) {
        return add({key: "PAZER", hebName: "פזר", role: "mafsik", consumedU: ["U+05A1"]});
    }

    // 6) TSINOR / TSINORIT
    if (hasKey(cur, "TSINOR")) {
        const isTsinor = isTaamOnLastLetter(cur, "U+05AE");
        return add({
            key: isTsinor ? "TSINOR" : "TSINORIT",
            hebName: isTsinor ? "צינור" : "צינורית",
            role: isTsinor ? "mafsik" : "mesharet",
            consumedU: ["U+05AE"],
        });
    }

    // 7) DCHI
    if (hasKey(cur, "DCHI")) {
        return add({key: "DCHI", hebName: "דחי", role: "mafsik", consumedU: ["U+05AD"]});
    }

    // 8) QADMA / AZLA_LEGARMEH
    if (hasKey(cur, "QADMA")) {
        return add({
            key: ctx.hasPasekAfter ? "AZLA_LEGARMEH" : "QADMA",
            hebName: ctx.hasPasekAfter ? "אזלא לגרמיה" : "קדמא",
            role: ctx.hasPasekAfter ? "mafsik" : "mesharet",
            consumedU: ["U+05A8"],
        });
    }

    // 9) MAHAPAKH / MAHAPAKH_LEGARMEH
    if (hasKey(cur, "MAHAPAKH")) {
        return add({
            key: ctx.hasPasekAfter ? "MAHAPAKH_LEGARMEH" : "MAHAPAKH",
            hebName: ctx.hasPasekAfter ? "מהפך לגרמיה" : "מהפך",
            role: ctx.hasPasekAfter ? "mafsik" : "mesharet",
            consumedU: ["U+05A4"],
        });
    }

    // 10) SHALSHELET (לפי פסק אחרי)
    if (hasTaamU(cur, "U+0593")) {
        return add({
            key: ctx.hasPasekAfter ? "SHALSHELET_GEDOLA" : "SHALSHELET_KETANA",
            hebName: ctx.hasPasekAfter ? "שלשלת גדולה" : "שלשלת קטנה",
            role: ctx.hasPasekAfter ? "mafsik" : "mesharet",
            consumedU: ["U+0593"],
        });
    }

    // 11) YORED: U+05A5 => OLEH_VEYORED if OLE exists on same token or previous token, else MERCHA
    const hasYored = hasKey(cur, "YORED");
    if (hasYored) {
        const hasOleSame = hasTaamU(cur, "U+05AB"); // OLE glyph on same token

        const hasOlePrev =
            !!prev &&
            !prev.isPasek &&
            !prev.isSofPasuq &&
            hasTaamU(prev, "U+05AB"); // חשוב: לבדוק glyph בפועל, לא key (כי אצלך OLE לא תמיד "KNOWN")

        if (hasOleSame || hasOlePrev) {
            // אם ה-OLE נמצא בטוקן הקודם, זה "נצרך" לשילוב, אבל אין לנו מערכים כבר.
            // אז פשוט מזהים OLEH_VEYORED פה, ולגבי prev – נטפל בהסרה של UNKNOWN OLE בהמשך (ראה סעיף 3).
            const consumed = ["U+05A5"];
            if (hasOleSame) consumed.push("U+05AB"); // אם ה-OLE על אותו טוקן – נצרך גם הוא

            return add({
                key: "OLEH_VEYORED",
                hebName: "עולה ויורד",
                role: "mafsik",
                consumedU: consumed,
            });
        }

        return add({key: "MERCHA", hebName: "מירכא", role: "mesharet", consumedU: ["U+05A5"]});
    }

    // 12) TIPCHA
    if (hasKey(cur, "TIPCHA")) {
        return add({key: "TIPCHA", hebName: "טיפחא", role: "mesharet", consumedU: ["U+0596"]});
    }

    // 13) ILUY
    if (hasKey(cur, "ILUY")) {
        return add({key: "ILUY", hebName: "עילוי", role: "mesharet", consumedU: ["U+05AC"]});
    }

    // 14) MUNACH
    if (hasKey(cur, "MUNACH")) {
        return add({key: "MUNACH", hebName: "מונח", role: "mesharet", consumedU: ["U+05A3"]});
    }

    // 15) GALGAL
    if (hasKey(cur, "GALGAL")) {
        return add({key: "GALGAL", hebName: "גלגל", role: "mesharet", consumedU: ["U+05AA"]});
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

        const prevTok = i > 0 ? tokens[i - 1] : undefined;

        const identified = firstIdentifiedTaam(tok, prevTok, {
            hasPasekAfter,
            hasSofPasuqAfter,
            isLastWordContext,
        });

        if (identified?.kind === "KNOWN" && identified.key === "SILLUQ") {
            if (isLastWordContext) silluqIndex = i;
        }

        out.push({
            tokenId: tok.id,
            observed: {hasPasekAfter, hasSofPasuqAfter},
            identified,
        });
    }

    // NOTE: הפוסט-פאס שלך לגבי OLEH_VEYORED צריך התאמה, כי אין יותר מערכים.
    // אם אתה עדיין רוצה את הלוגיקה הזו, עדיף לטפל ב-OLEH_VEYORED בתוך הלולאה
    // (כשיש לך prev) ולקבוע identified בהתאם.

    return {
        tokens: out,
        anchors: {silluqIndex, sofPasuqIndex: sofPasuqIndex >= 0 ? sofPasuqIndex : undefined},
    };
}

