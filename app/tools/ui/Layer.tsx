import { Span } from "../types";
import { spanToDisplayRange } from "./displayModel";
import styles from "./Layer.module.css";
import {rtlRangeToGridColumns} from "@/app/tools/ui/rtlGrid";

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

export function Layer({
                          n,
                          spans,
                          sourceToDisplay,
                          height,
                          borderWidth,
                          opacity,
                          onHoverSpan,
                          pinnedSpanId,
                          onTogglePin,
                      }: {
    n: number;
    spans: Span[];
    sourceToDisplay: Map<number, number>;
    height: number;
    borderWidth: number;
    opacity: number;
    onHoverSpan?: (span: Span | null) => void;
    pinnedSpanId?: string | null;
    onTogglePin?: (span: Span) => void;
}) {
    const gridCols = `repeat(${n}, minmax(72px, 1fr))`;

    return (
        <div className={styles.row} style={{ gridTemplateColumns: gridCols }}>
            {spans.map((s) => {
                const range = spanToDisplayRange(s, sourceToDisplay);
                if (!range) return null;

                const { colStart, colEnd } = rtlRangeToGridColumns(
                    n,
                    range.from,
                    range.to
                );

                const isPinned = pinnedSpanId === s.id;

                return (
                    <div
                        key={s.id}
                        onMouseEnter={() => onHoverSpan?.(s)}
                        onMouseLeave={() => onHoverSpan?.(null)}
                        onClick={() => onTogglePin?.(s)}
                        role="button"
                        className={cx(
                            styles.span,
                            isPinned ? styles.pinned : styles.notPinned
                        )}
                        style={
                            {
                                gridColumn: `${colStart} / ${colEnd}`, // דינמי
                                "--layer-height": `${height}px`,
                                "--layer-border-width": `${borderWidth}px`,
                                "--layer-opacity": String(opacity),
                            } as React.CSSProperties
                        }
                        title={`${s.name} (${s.from}–${s.to})${
                            s.causedBy ? ` | ${s.causedBy.label}#${s.causedBy.tokenIndex}` : ""
                        }`}
                    >
                        <span className={styles.name}>{s.name}</span>

                        <span className={styles.right}>
              {s.causedBy && (
                  <span className={styles.cause}>
                  ← {s.causedBy.label}#{s.causedBy.tokenIndex}
                </span>
              )}

                            {isPinned && <span className={styles.pinBadge}>PIN</span>}
            </span>
                    </div>
                );
            })}
        </div>
    );
}
