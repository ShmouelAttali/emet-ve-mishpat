import React from "react";
import { Span } from "../types";
import { buildDisplayTokens } from "./displayModel";
import { Layer } from "./Layer";
import { TokensRow } from "./TokensRow";
import { TokenStep2Enriched } from "@/lib/taamim/roles/types";

/**
 * MultiLayerTimeline
 * - Hover על Span בשכבות => מדגיש את הטווח ב-TokensRow
 * - Click על Span => Pin (ננעל) עד קליק נוסף / Esc
 * - אם יש Pin פעיל: Hover לא משנה את ההדגשה (רק Pin שולט)
 */
export function MultiLayerTimeline({
                                       tokens,
                                       taamim,
                                       layers,
                                       selectedSourceIndex,
                                       onSelectSourceIndex,
                                       debug,
                                   }: {
    tokens: Array<{ id: string; raw: string; isPasek?: boolean; isSofPasuq?: boolean }>;
    taamim: Array<TokenStep2Enriched>;
    layers: { emperor: Span[]; kings: Span[]; viceroys: Span[]; thirds: Span[] };
    selectedSourceIndex?: number | null;
    onSelectSourceIndex?: (sourceIndex: number) => void;
    debug?: any;
}) {
    const { displayTokens, sourceToDisplay } = buildDisplayTokens(tokens);
    const n = displayTokens.length;

    const [hoveredSpan, setHoveredSpan] = React.useState<Span | null>(null);
    const [pinnedSpan, setPinnedSpan] = React.useState<Span | null>(null);

    // Pin גובר על hover
    const activeSpan = pinnedSpan ?? hoveredSpan;

    const highlightedSourceIndexes = React.useMemo(() => {
        if (!activeSpan) return undefined;
        const s = new Set<number>();
        for (let i = activeSpan.from; i <= activeSpan.to; i++) s.add(i);
        return s;
    }, [activeSpan]);

    // Esc מבטל pin
    const onKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Escape") {
                setPinnedSpan(null);
            }
        },
        []
    );

    // Helpers כדי לא לשכפל לוגיקה בכל Layer
    const makeHoverHandler = React.useCallback(
        (layerName: string) => (s: Span | null) => {
            // אם יש pin, לא משנים highlight ב-hover
            if (pinnedSpan) return;
            setHoveredSpan(s);
        },
        [pinnedSpan]
    );

    const makeTogglePinHandler = React.useCallback(
        (layerName: string) => (s: Span) => {
            setPinnedSpan((prev) => (prev?.id === s.id ? null : s));
            setHoveredSpan(null);
        },
        []
    );

    return (
        <div
            tabIndex={0}
            onKeyDown={onKeyDown}
            style={{ display: "flex", flexDirection: "column", gap: 10, outline: "none" }}
        >
            <Layer
                n={n}
                spans={layers.emperor}
                sourceToDisplay={sourceToDisplay}
                height={44}
                borderWidth={3}
                opacity={0.85}
                pinnedSpanId={pinnedSpan?.id ?? null}
                onHoverSpan={makeHoverHandler("emperor")}
                onTogglePin={makeTogglePinHandler("emperor")}
            />

            <Layer
                n={n}
                spans={layers.kings}
                sourceToDisplay={sourceToDisplay}
                height={40}
                borderWidth={2}
                opacity={0.75}
                pinnedSpanId={pinnedSpan?.id ?? null}
                onHoverSpan={makeHoverHandler("kings")}
                onTogglePin={makeTogglePinHandler("kings")}
            />

            <Layer
                n={n}
                spans={layers.viceroys}
                sourceToDisplay={sourceToDisplay}
                height={36}
                borderWidth={2}
                opacity={0.6}
                pinnedSpanId={pinnedSpan?.id ?? null}
                onHoverSpan={makeHoverHandler("viceroys")}
                onTogglePin={makeTogglePinHandler("viceroys")}
            />

            <Layer
                n={n}
                spans={layers.thirds}
                sourceToDisplay={sourceToDisplay}
                height={32}
                borderWidth={1}
                opacity={0.5}
                pinnedSpanId={pinnedSpan?.id ?? null}
                onHoverSpan={makeHoverHandler("thirds")}
                onTogglePin={makeTogglePinHandler("thirds")}
            />

            <div style={{ height: 2, background: "rgba(0,0,0,0.10)", borderRadius: 999 }} />

            <TokensRow
                tokens={displayTokens}
                selectedSourceIndex={selectedSourceIndex}
                onSelect={onSelectSourceIndex}
                taamim={taamim}
                highlightedSourceIndexes={highlightedSourceIndexes}
                hoveredLabel={activeSpan ? `${pinnedSpan ? "PIN" : "HOVER"} • ${activeSpan.name}` : undefined}
            />

            {debug && (
                <div style={{ fontSize: 12, opacity: 0.75, color: "#111" }}>
                    debug: silluqIndex={String(debug.silluqIndex)} • atnachRoleIndex={String(debug.atnachRoleIndex)}
                </div>
            )}
        </div>
    );
}
