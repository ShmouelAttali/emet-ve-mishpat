import type { Inference } from "../../model/inferred";
import type { Span } from "../types";
import { buildSpansToAnchors } from "../engine/spanBuilder";

export type AnchorInfo = { tokenIndex: number; label: string; name: string };

export function buildViceroyDomains(opts: {
    kings: Span[];
    viceroyInfs: Inference[];
    toAnchor: (inf: Inference) => AnchorInfo;
}): Span[] {
    const { kings, viceroyInfs } = opts;

    const viceroys: Span[] = [];
    for (const k of kings) {
        const anchors = viceroyInfs
            .filter((inf) => inf.index != null && inf.index! >= k.from && inf.index! <= k.to)
            .map((inf) => {
                const a = opts.toAnchor(inf);
                return { tokenIndex: a.tokenIndex, label: a.label, name: a.name };
            });

        const spans = buildSpansToAnchors({
            layer: 3,
            parent: { id: k.id, from: k.from, to: k.to },
            anchors,
        });

        viceroys.push(...spans);
    }

    return viceroys;
}
