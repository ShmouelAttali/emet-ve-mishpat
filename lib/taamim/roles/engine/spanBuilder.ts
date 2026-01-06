import type { Span } from "../types";

export function buildSpansToAnchors(opts: {
    layer: 1 | 2 | 3 | 4;
    parent: { id: string; from: number; to: number };
    anchors: Array<{ tokenIndex: number; label: string; name: string }>;
}): Span[] {
    const { layer, parent } = opts;

    const anchors = opts.anchors
        .filter((a) => a.tokenIndex >= parent.from && a.tokenIndex <= parent.to)
        .sort((a, b) => a.tokenIndex - b.tokenIndex);

    const spans: Span[] = [];
    let start = parent.from;

    for (const a of anchors) {
        if (a.tokenIndex < start) continue;
        spans.push({
            id: `${parent.id}/L${layer}/${a.name}@${a.tokenIndex}`,
            layer,
            name: a.name,
            from: start,
            to: a.tokenIndex,
            causedBy: { tokenIndex: a.tokenIndex, label: a.label },
            parentId: parent.id,
        });
        start = a.tokenIndex + 1;
    }

    return spans;
}

export function buildAfterAtnachKingSpan(opts: {
    parent: { id: string; from: number; to: number };
    atnachIndex: number;
    silluqIndex: number;
}): Span | null {
    const from = opts.atnachIndex + 1;
    const to = opts.silluqIndex;
    if (from > to) return null;

    return {
        id: `${opts.parent.id}/L2/AFTER_ATNACH`,
        layer: 2,
        name: "אחרי אתנח",
        from,
        to,
        causedBy: { tokenIndex: opts.silluqIndex, label: "סילוק" },
        parentId: opts.parent.id,
    };
}
