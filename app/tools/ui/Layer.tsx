import {Span} from "../types";
import {spanToDisplayRange} from "./displayModel";

function toRtlColumns(n: number, from: number, to: number) {
    const vf = n - 1 - from;
    const vt = n - 1 - to;
    const start = Math.min(vf, vt);
    const end = Math.max(vf, vt);
    return {colStart: start + 1, colEnd: end + 2};
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
        <div style={{display: "grid", gridTemplateColumns: gridCols, gap: 8}}>
            {spans.map((s) => {
                const range = spanToDisplayRange(s, sourceToDisplay);
                if (!range) return null;

                const {colStart, colEnd} = toRtlColumns(n, range.from, range.to);
                const isPinned = pinnedSpanId === s.id;

                return (
                    <div
                        key={s.id}
                        onMouseEnter={() => onHoverSpan?.(s)}
                        onMouseLeave={() => onHoverSpan?.(null)}
                        onClick={() => onTogglePin?.(s)}
                        role="button"
                        style={{
                            gridColumn: `${colStart} / ${colEnd}`,
                            gridRow: 1,
                            gridAutoFlow: "row",
                            height,
                            border: `${borderWidth}px solid rgba(0,0,0,${opacity})`,
                            borderRadius: 14,
                            padding: "6px 10px",
                            background: `rgba(0,0,0,${0.02 + 0.03 * opacity})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            userSelect: "none",
                            transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
                            transform: isPinned ? "translateY(-1px)" : "translateY(0px)",
                            boxShadow: isPinned ? "0 10px 24px rgba(0,0,0,0.12)" : "none",
                        }}
                        title={`${s.name} (${s.from}–${s.to})${
                            s.causedBy ? ` | ${s.causedBy.label}#${s.causedBy.tokenIndex}` : ""
                        }`}
                    >
            <span style={{fontSize: 12, fontWeight: 700, direction: "rtl", unicodeBidi: "plaintext"}}>
              {s.name}
            </span>

                        <span style={{display: "flex", alignItems: "center", gap: 8, minWidth: 0}}>
              {s.causedBy && (
                  <span style={{fontSize: 11, opacity: 0.65, direction: "rtl", unicodeBidi: "plaintext"}}>
                  ← {s.causedBy.label}#{s.causedBy.tokenIndex}
                </span>
              )}

                            {/* "Pin" badge קטן שמבהיר שהקליק נועל */}
                            {isPinned && (
                                <span
                                    style={{
                                        fontSize: 10,
                                        padding: "2px 6px",
                                        borderRadius: 999,
                                        border: "1px solid rgba(0,0,0,0.25)",
                                        background: "rgba(255,255,255,0.7)",
                                        opacity: 0.9,
                                        flexShrink: 0,
                                    }}
                                >
                  PIN
                </span>
                            )}
            </span>
                    </div>
                );
            })}
        </div>
    );
}
