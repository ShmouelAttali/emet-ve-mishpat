import type { TokenGlyph } from "../../text/tokenize";
import type { TokenStep2 } from "../step2Local";
import type { Taam } from "../model/taam";
import { TAAM_META } from "../model/taam";
import type { Inference } from "../model/inferred";

import type { RoleLayers, RolesDebug, Span, TokenStep2Enriched } from "./types";

import { applyInference } from "./apply/applyInference";
import { inferKings } from "./infer/kings/inferKings";

import { createTaken, tryTake } from "./engine/taken";
import { buildKingDomains } from "./domains/kingDomains";
import { buildViceroyDomains } from "./domains/viceroyDomains";
import { buildThirdDomains } from "./domains/thirdDomains";
import { inferViceroys } from "./infer/viceroys/inferViceroys";
import { inferThirds } from "./infer/thirds/inferThirds";

// Note: types moved to ./types to avoid cycles and allow domains modules.

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

    // 3) Kings inference (single coherent entry point)
    const kingInfs = inferKings({
        tokens,
        step2: enriched,
        taken,
        scope: { from: emperor.from, to: emperor.to, prior: [] },
        leader: { index: emperor.to, taam: "SILLUQ" as any, silluqIndex: emperor.to },
    });

    // apply + take
    for (const inf of kingInfs) {
        if (inf.index == null) continue;
        if (!tryTake(taken, inf.index, "KING")) continue;
        applyInference(enriched, inf);
    }

    const { kings, atnachRoleIndex, oleVeyoredIndex, kingLeaderBySpanId } = buildKingDomains({
        emperor,
        kingInfs,
        toAnchor: (k) => {
            const { label, name } = inferenceAnchorLabel(k);
            return { tokenIndex: k.index!, label, name };
        },
    });

    // 5) Viceroys: infer inside each KING span, respecting taken
    const viceroyInfs: Inference[] = [];
    for (const k of kings) {
        const king = kingLeaderBySpanId.get(k.id);

        const leader = {
            index: king?.index ?? k.to,
            taam: (king?.taam as any) ?? "UNKNOWN",
            oleVeyoredIndex,
            atnachIndex: atnachRoleIndex,
            silluqIndex,
        };

        const infs = inferViceroys({
            tokens,
            step2: enriched,
            taken,
            scope: { from: k.from, to: k.to, prior: [] },
            leader,
        });

        for (const inf of infs) {
            if (inf.index == null) continue;
            if (!tryTake(taken, inf.index, "VICEROY")) continue;
            applyInference(enriched, inf);
            viceroyInfs.push(inf);
        }
    }
    viceroyInfs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    // build viceroy domains (spans) per king-domain
    const viceroys: Span[] = buildViceroyDomains({
        kings,
        viceroyInfs,
        toAnchor: (inf) => {
            const { label, name } = inferenceAnchorLabel(inf);
            return { tokenIndex: inf.index!, label, name };
        },
    });

    // 6) Thirds: infer inside each VICEROY span, respecting taken
    const thirdInfs: Inference[] = [];
    for (const v of viceroys) {
        // derive leader (viceroy anchor) and optional containing king
        const viceroyIndex = v.causedBy?.tokenIndex ?? v.to;
        const viceroyInf = viceroyInfs.find((x) => x.index === viceroyIndex);

        const containingKing = kings.find((k) => v.from >= k.from && v.to <= k.to);
        const kingLeader = containingKing ? kingLeaderBySpanId.get(containingKing.id) : undefined;

        const leader = {
            index: viceroyIndex,
            taam: (viceroyInf?.effectiveTaam as any) ?? "UNKNOWN",
            king: kingLeader?.index != null ? { index: kingLeader.index, taam: kingLeader.taam as any } : undefined,
        };

        const infs = inferThirds({
            tokens,
            step2: enriched,
            taken,
            scope: { from: v.from, to: v.to, prior: [] },
            leader,
        });

        for (const inf of infs) {
            if (inf.index == null) continue;
            if (!tryTake(taken, inf.index, "THIRD")) continue;
            applyInference(enriched, inf);
            thirdInfs.push(inf);
        }
    }
    thirdInfs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    // build third domains (spans) per viceroy-domain
    const thirds: Span[] = buildThirdDomains({
        viceroys,
        thirdInfs,
        toAnchor: (inf) => {
            const { label, name } = inferenceAnchorLabel(inf);
            return { tokenIndex: inf.index!, label, name };
        },
    });

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
        kingAnchors: kingInfs
            .filter((k) => k.index != null)
            .map((k) => {
                const { label } = inferenceAnchorLabel(k);
                return { tokenIndex: k.index!, role: k.effectiveTaam, label };
            }),
    };

    return { layers, debug, tokens: enriched };
}
