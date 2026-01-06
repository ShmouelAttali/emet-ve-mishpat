import type {Inference} from "../../model/inferred";
import type {Span} from "../types";
import {buildAfterAtnachKingSpan, buildSpansToAnchors} from "../engine/spanBuilder";
import {KingLeader} from "@/lib/taamim/roles/infer/viceroys/types";

export type AnchorInfo = { tokenIndex: number; label: string; name: string };

export type EmperorSpan = Pick<Span, "id" | "from" | "to">;

export function buildKingDomains(opts: {
    emperor: EmperorSpan;
    kingInfs: Inference[];
    toAnchor: (inf: Inference) => AnchorInfo;
}): {
    kings: Span[];
    atnachRoleIndex?: number;
    oleVeyoredIndex?: number;
    kingLeaderBySpanId: Map<string, KingLeader | undefined>;
} {
    const {emperor, kingInfs} = opts;

    const atnachRoleIndex = kingInfs.find((x) => x.effectiveTaam === "ATNACH")?.index;
    const oleVeyoredIndex = kingInfs.find((x) => x.effectiveTaam === "OLEH_VEYORED")?.index;

    const kingAnchors = kingInfs
        .filter((k) => k.index != null)
        .map((k) => {
            const a = opts.toAnchor(k);
            return {tokenIndex: a.tokenIndex, label: a.label, name: a.name, role: k.effectiveTaam};
        });

    const baseKings = buildSpansToAnchors({
        layer: 2,
        parent: {id: emperor.id, from: emperor.from, to: emperor.to},
        anchors: kingAnchors.map((k) => ({tokenIndex: k.tokenIndex, label: k.label, name: k.name})),
    });

    const afterAtnach =
        atnachRoleIndex != null
            ? buildAfterAtnachKingSpan({
                parent: {id: emperor.id, from: emperor.from, to: emperor.to},
                atnachIndex: atnachRoleIndex,
                silluqIndex: emperor.to,
            })
            : null;

    const kings: Span[] = [...baseKings, ...(afterAtnach ? [afterAtnach] : [])];

    // Map span -> leader
    const byIndex = new Map<number, Inference>();
    for (const inf of kingInfs) {
        if (inf.index != null) byIndex.set(inf.index, inf);
    }

    const kingLeaderBySpanId = new Map<string, KingLeader | undefined>();
    for (const k of kings) {
        const isAfterAtnach = k.id.endsWith("/L2/AFTER_ATNACH");
        const leaderInf = isAfterAtnach
            ? (atnachRoleIndex != null ? byIndex.get(atnachRoleIndex) : undefined)
            : (k.causedBy?.tokenIndex != null ? byIndex.get(k.causedBy.tokenIndex) : undefined);

        const leader: KingLeader | undefined = leaderInf?.index != null ? {
            index: leaderInf.index,
            taam: leaderInf.effectiveTaam,
            isAfterAtnach
        } : undefined;
        kingLeaderBySpanId.set(k.id, leader);
    }

    return {kings, atnachRoleIndex, oleVeyoredIndex, kingLeaderBySpanId};
}
