import React from "react";
import {buildDisplayTokens} from "./displayModel";
import {Layer} from "./Layer";
import {TokensRow} from "./TokensRow";
import {Span, TokenStep2Enriched} from "@/lib/taamim/types";
import styles from "./MultiLayerTimeline.module.css";

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
                                       mobileWindowSize = 0, // 0 = לא מופעל
                                   }: {
    tokens: Array<{ id: string; raw: string; isPasek?: boolean; isSofPasuq?: boolean }>;
    taamim: Array<TokenStep2Enriched>;
    layers: { emperor: Span[]; kings: Span[]; viceroys: Span[]; thirds: Span[] };
    selectedSourceIndex?: number | null;
    onSelectSourceIndex?: (sourceIndex: number) => void;
    debug?: any;
    mobileWindowSize?: number;
}) {
    function useIsMobile(breakpointPx = 640) {
        const [isMobile, setIsMobile] = React.useState(false);
        React.useEffect(() => {
            const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
            const onChange = () => setIsMobile(mq.matches);
            onChange();
            mq.addEventListener?.("change", onChange);
            return () => mq.removeEventListener?.("change", onChange);
        }, [breakpointPx]);
        return isMobile;
    }

    const isMobile = useIsMobile(640);

    const windowSize = isMobile ? mobileWindowSize : 0;

    const center = selectedSourceIndex ?? 0;
    const half = windowSize > 0 ? Math.floor(windowSize / 2) : 0;

    const windowFrom = windowSize > 0 ? Math.max(0, center - half) : 0;
    const windowTo = windowSize > 0 ? Math.min(tokens.length - 1, windowFrom + windowSize - 1) : tokens.length - 1;

// אם נחתכנו בסוף, נגלגל את ההתחלה אחורה כדי לשמור על גודל חלון
    const fixedFrom =
        windowSize > 0 ? Math.max(0, windowTo - windowSize + 1) : 0;

    const slicedTokens = windowSize > 0 ? tokens.slice(fixedFrom, windowTo + 1) : tokens;
    const {displayTokens, sourceToDisplay} = buildDisplayTokens(slicedTokens);
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
    const onKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") setPinnedSpan(null);
    }, []);

    // Helpers כדי לא לשכפל לוגיקה בכל Layer
    const makeHoverHandler = React.useCallback(
        (_layerName: string) => (s: Span | null) => {
            // אם יש pin, לא משנים highlight ב-hover
            if (pinnedSpan) return;
            setHoveredSpan(s);
        },
        [pinnedSpan]
    );

    const makeTogglePinHandler = React.useCallback(
        (_layerName: string) => (s: Span) => {
            setPinnedSpan((prev) => (prev?.id === s.id ? null : s));
            setHoveredSpan(null);
        },
        []
    );

    const selectedInWindow =
        selectedSourceIndex == null ? null : selectedSourceIndex - fixedFrom;

    const enableHover = !isMobile;
    const gridCols = React.useMemo(() => {
        if (isMobile) {
            // מובייל: תן יותר רוחב כדי שהמילה לא תיחתך
            // 72px זה מינימום סביר למילים + טעמים
            return `repeat(${n}, minmax(72px, max-content))`;
        }

        // דסקטופ: למלא את כל הרוחב (ולא להשאיר ריק)
        return `repeat(${n}, minmax(56px, 1fr))`;
    }, [isMobile, n]);


    return (
        <div tabIndex={0} onKeyDown={onKeyDown} className={styles.root}>
            <div className={styles.scrollX}>
                <div className={styles.inner}>
                    <Layer
                        n={n}
                        spans={layers.emperor}
                        sourceToDisplay={sourceToDisplay}
                        height={44}
                        borderWidth={3}
                        opacity={0.85}
                        pinnedSpanId={pinnedSpan?.id ?? null}
                        onHoverSpan={enableHover ? makeHoverHandler("emperor") : undefined}
                        onTogglePin={makeTogglePinHandler("emperor")}
                        gridCols={gridCols}

                    />

                    <Layer
                        n={n}
                        spans={layers.kings}
                        sourceToDisplay={sourceToDisplay}
                        height={40}
                        borderWidth={2}
                        opacity={0.75}
                        pinnedSpanId={pinnedSpan?.id ?? null}
                        onHoverSpan={enableHover ? makeHoverHandler("kings") : undefined}
                        onTogglePin={makeTogglePinHandler("kings")}
                        gridCols={gridCols}

                    />

                    <Layer
                        n={n}
                        spans={layers.viceroys}
                        sourceToDisplay={sourceToDisplay}
                        height={36}
                        borderWidth={2}
                        opacity={0.6}
                        pinnedSpanId={pinnedSpan?.id ?? null}
                        onHoverSpan={enableHover ? makeHoverHandler("viceroys") : undefined}
                        onTogglePin={makeTogglePinHandler("viceroys")}
                        gridCols={gridCols}

                    />

                    <Layer
                        n={n}
                        spans={layers.thirds}
                        sourceToDisplay={sourceToDisplay}
                        height={32}
                        borderWidth={1}
                        opacity={0.5}
                        pinnedSpanId={pinnedSpan?.id ?? null}
                        onHoverSpan={enableHover ? makeHoverHandler("thirds") : undefined}
                        onTogglePin={makeTogglePinHandler("thirds")}
                        gridCols={gridCols}

                    />

                    <div className={styles.divider}/>

                    <TokensRow
                        tokens={displayTokens}
                        selectedSourceIndex={windowSize > 0 ? selectedInWindow : selectedSourceIndex}
                        onSelect={(idxInWindow) => {
                            if (windowSize > 0) {
                                onSelectSourceIndex?.(fixedFrom + idxInWindow);
                            } else {
                                onSelectSourceIndex?.(idxInWindow);
                            }
                        }}
                        taamim={taamim}
                        highlightedSourceIndexes={highlightedSourceIndexes}
                        hoveredLabel={
                            activeSpan ? `${pinnedSpan ? "PIN" : "HOVER"} • ${activeSpan.name}` : undefined
                        }
                        gridCols={gridCols}
                    />
                </div>
            </div>

            {debug && (
                <div className={styles.debug}>
                    debug: silluqIndex={String(debug.silluqIndex)} • atnachRoleIndex={String(debug.atnachRoleIndex)}
                </div>
            )}
        </div>
    );
}
