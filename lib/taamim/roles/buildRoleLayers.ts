import type { TokenGlyph } from "../../text/tokenize";
import type { TokenStep2 } from "../step2Local";
import type { Taam } from "../model/taam";
import { TAAM_META } from "../model/taam";
import type { Inference } from "../model/inferred";

import { applyInference } from "./apply/applyInference";
import { inferAtnach } from "./infer/inferAtnach";
import { inferOlehVeyored } from "./infer/inferOlehVeyored";

import { createTaken, tryTake } from "./engine/taken";
import { buildAfterAtnachKingSpan, buildSpansToAnchors } from "./engine/spanBuilder";
import { inferViceroysInKingDomain } from "./infer/inferViceroys";
import { inferThirdsInViceroyDomain } from "./infer/inferThirds";

export type TokenEffective = {
    taam: Taam;
    inferredCode: string;
    hebName: string;
    role: "mesharet" | "mafsik";
    reason: string;
};

export type TokenStep2Enriched = TokenStep2 & {
    effective: TokenEffective;
};

export type Span = {
    id: string;
    layer: 1 | 2 | 3 | 4;
    name: string;
    from: number;
    to: number;
    causedBy?: { tokenIndex: number; label: string };
    parentId?: string;
};

export type RoleLayers = {
    emperor: Span[];
    kings: Span[];
    viceroys: Span[];
    thirds: Span[];
};

export type RolesDebug = {
    silluqIndex?: number;
    atnachRoleIndex?: number;
    oleVeyoredIndex?: number;
    taken: Array<{ idx: number; layer: string }>;
    kingAnchors: Array<{ tokenIndex: number; role: string; label: string }>;
};

function firstKnownTaam(t: TokenStep2): Taam {
    const k = t.identified.find((x) => x.kind === "KNOWN") as any;
    return (k?.key as Taam) ?? "UNKNOWN";
}

function inferenceAnchorLabel(inf: Inference): { label: string; name: string } {
    // שמות להצגה על span anchors
    const taam = inf.effectiveTaam;
    if (taam === "OLEH_VEYORED") return { label: "עולה־ויורד", name: "מלך: עולה־ויורד" };
    if (taam === "ATNACH") return { label: "אתנח", name: "מלך: אתנח" };

    if (taam === "DCHI") return { label: "דחי", name: "משנה: דחי" };
    if (taam === "TSINOR") return { label: "צינור", name: "משנה: צינור" };
    if (taam === "REVIa_QATAN") return { label: "רביע קטן", name: "משנה: רביע קטן" };
    if (taam === "REVIa_GADOL") return { label: "רביע גדול", name: "משנה: רביע גדול" };
    if (taam === "REVIa_MUGRASH") return { label: "רביע מוגרש", name: "אחרי אתנח: רביע מוגרש" };

    if (taam === "MAHAPAKH_LEGARMEH") return { label: "מהפך לגרמיה", name: "שליש: מהפך לגרמיה" };
    if (taam === "AZLA_LEGARMEH") return { label: "אזלא לגרמיה", name: "שליש: אזלא לגרמיה" };
    if (taam === "PAZER") return { label: "פזר", name: "שליש: פזר" };

    return { label: taam, name: taam };
}

export function buildRoleLayers(
    tokens: TokenGlyph[],
    step2: TokenStep2[],
    silluqIndex?: number
): { layers: RoleLayers; debug: RolesDebug; tokens: TokenStep2Enriched[] } {
    // 0) Determine emperor boundary from silluqIndex
    if (silluqIndex == null) {
        let last = tokens.length - 1;
        while (last >= 0 && (tokens[last]?.isPasek || tokens[last]?.isSofPasuq)) last--;
        silluqIndex = Math.max(0, last);
    }

    // 1) Create enriched tokens with default effective = firstKnownTaam
    const enriched: TokenStep2Enriched[] = step2.map((t) => {
        const taam = firstKnownTaam(t);
        const meta = TAAM_META[taam] ?? TAAM_META.UNKNOWN;
        return {
            ...t,
            effective: {
                taam,
                inferredCode: "EFFECTIVE_ORIGINAL",
                hebName: meta.hebName,
                role: meta.role,
                reason: "הטעם המקורי",
            },
        };
    });

    // taken map
    const taken = createTaken();

    // 2) Emperor span
    const emperor: Span = {
        id: "EMPEROR",
        layer: 1,
        name: "קיסר (סילוק)",
        from: 0,
        to: silluqIndex,
        causedBy: { tokenIndex: silluqIndex, label: "סילוק" },
    };

    // 3) Kings inference
    const atnachInf = inferAtnach(tokens, enriched, emperor.to);
    applyInference(enriched, atnachInf);
    const atnachRoleIndex = atnachInf.index;
    if (atnachRoleIndex != null) tryTake(taken, atnachRoleIndex, "KING");

    const ovDomainTo = atnachRoleIndex ?? emperor.to;
    const oleInf = inferOlehVeyored({
        tokens,
        step2: enriched,
        domainFrom: emperor.from,
        domainToInclusive: ovDomainTo,
    });
    if (oleInf){
        applyInference(enriched, oleInf);
    }
    const oleVeyoredIndex = oleInf?.index;
    if (oleVeyoredIndex != null) tryTake(taken, oleVeyoredIndex, "KING");

    const kingInfs: Inference[] = [];
    if (oleInf && oleVeyoredIndex != null) kingInfs.push(oleInf);
    if (atnachRoleIndex != null) kingInfs.push(atnachInf);
    kingInfs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    const kingAnchors = kingInfs
        .filter((k) => k.index != null)
        .map((k) => {
            const { label, name } = inferenceAnchorLabel(k);
            return { tokenIndex: k.index!, label, name, role: k.effectiveTaam };
        });

    // 4) Build king spans and special after-atnach
    const kingsToAnchors = buildSpansToAnchors({
        layer: 2,
        parent: { id: emperor.id, from: emperor.from, to: emperor.to },
        anchors: kingAnchors.map((k) => ({ tokenIndex: k.tokenIndex, label: k.label, name: k.name })),
    });

    const afterAtnach =
        atnachRoleIndex != null
            ? buildAfterAtnachKingSpan({
                parent: { id: emperor.id, from: emperor.from, to: emperor.to },
                atnachIndex: atnachRoleIndex,
                silluqIndex: emperor.to,
            })
            : null;

    const kings: Span[] = [...kingsToAnchors, ...(afterAtnach ? [afterAtnach] : [])];

    // 5) Viceroys: infer inside each KING span, respecting taken
    const viceroyInfs: Inference[] = [];
    for (const k of kings) {
        const infs = inferViceroysInKingDomain({
            tokens,
            step2: enriched,
            taken,
            domain: { from: k.from, to: k.to },
            oleVeyoredIndex,
            atnachRoleIndex,
            silluqIndex
        });

        for (const inf of infs) {
            if (inf.index == null) continue;
            if (!tryTake(taken, inf.index, "VICEROY")) continue;
            applyInference(enriched, inf);
            viceroyInfs.push(inf);
        }
    }
    viceroyInfs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    // build viceroy spans per king-span
    const viceroys: Span[] = [];
    for (const k of kings) {
        const anchors = viceroyInfs
            .filter((inf) => inf.index != null && inf.index! >= k.from && inf.index! <= k.to)
            .map((inf) => {
                const { label, name } = inferenceAnchorLabel(inf);
                return { tokenIndex: inf.index!, label, name };
            });

        const spans = buildSpansToAnchors({
            layer: 3,
            parent: { id: k.id, from: k.from, to: k.to },
            anchors,
        });

        viceroys.push(...spans);
    }

    // 6) Thirds: infer inside each VICEROY span, respecting taken
    const thirdInfs: Inference[] = [];
    for (const v of viceroys) {
        const infs = inferThirdsInViceroyDomain({
            tokens,
            step2: enriched,
            taken,
            domain: { from: v.from, to: v.to },
        });

        for (const inf of infs) {
            if (inf.index == null) continue;
            if (!tryTake(taken, inf.index, "THIRD")) continue;
            applyInference(enriched, inf);
            thirdInfs.push(inf);
        }
    }
    thirdInfs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    // build third spans per viceroy-span
    const thirds: Span[] = [];
    for (const v of viceroys) {
        const anchors = thirdInfs
            .filter((inf) => inf.index != null && inf.index! >= v.from && inf.index! <= v.to)
            .map((inf) => {
                const { label, name } = inferenceAnchorLabel(inf);
                return { tokenIndex: inf.index!, label, name };
            });

        const spans = buildSpansToAnchors({
            layer: 4,
            parent: { id: v.id, from: v.from, to: v.to },
            anchors,
        });

        thirds.push(...spans);
    }

    const layers: RoleLayers = {
        emperor: [emperor],
        kings,
        viceroys,
        thirds,
    };

    const debug: RolesDebug = {
        silluqIndex: emperor.to,
        atnachRoleIndex,
        oleVeyoredIndex,
        taken: Array.from(taken.takenBy.entries()).map(([idx, layer]) => ({ idx, layer })),
        kingAnchors: kingAnchors.map((x) => ({ tokenIndex: x.tokenIndex, role: x.role, label: x.label })),
    };

    return { layers, debug, tokens: enriched };
}
