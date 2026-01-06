import type { Inference } from "../../model/inferred";
import type { Span } from "../types";
import { buildSpansToAnchors } from "../engine/spanBuilder";

export type AnchorInfo = { tokenIndex: number; label: string; name: string };

export function buildThirdDomains(opts: {
    viceroys: Span[];
    thirdInfs: Inference[];
    toAnchor: (inf: Inference) => AnchorInfo;
}): Span[] {
    const { viceroys, thirdInfs } = opts;

    const thirds: Span[] = [];
    for (const v of viceroys) {
        const anchors = thirdInfs
            .filter((inf) => inf.index != null && inf.index! >= v.from && inf.index! <= v.to)
            .map((inf) => {
                const a = opts.toAnchor(inf);
                return { tokenIndex: a.tokenIndex, label: a.label, name: a.name };
            });

        const spans = buildSpansToAnchors({
            layer: 4,
            parent: { id: v.id, from: v.from, to: v.to },
            anchors,
        });

        thirds.push(...spans);
    }

    return thirds;
}
