import { Span } from "../types";
import { spanToDisplayRange } from "./displayModel";

function toRtlColumns(n: number, from: number, to: number) {
    // display indices: 0..n-1 (logical)
    // visual RTL: column 0 appears on the RIGHT, so we flip
    const vf = n - 1 - from;
    const vt = n - 1 - to;

    const start = Math.min(vf, vt);
    const end = Math.max(vf, vt);

    // CSS grid columns are 1-based and end is exclusive
    return { colStart: start + 1, colEnd: end + 2 };
}

export function Layer({
                          n,
                          spans,
                          sourceToDisplay,
                          height,
                          borderWidth,
                          opacity,
                      }: {
    n: number;
    spans: Span[];
    sourceToDisplay: Map<number, number>;
    height: number;
    borderWidth: number;
    opacity: number;
}) {
    const gridCols = `repeat(${n}, minmax(72px, 1fr))`;

    return (
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 8 }}>
            {spans.map((s) => {
                const range = spanToDisplayRange(s, sourceToDisplay);
                if (!range) return null;

                const { colStart, colEnd } = toRtlColumns(n, range.from, range.to);

                return (
                    <div
                        key={s.id}
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
                        }}
                        title={`${s.name} (${s.from}–${s.to})${s.causedBy ? ` | ${s.causedBy.label}#${s.causedBy.tokenIndex}` : ""}`}
                    >
            <span style={{ fontSize: 12, fontWeight: 700, direction: "rtl", unicodeBidi: "plaintext" }}>
              {s.name}
            </span>

                        {s.causedBy && (
                            <span style={{ fontSize: 11, opacity: 0.65, direction: "rtl", unicodeBidi: "plaintext" }}>
                ← {s.causedBy.label}#{s.causedBy.tokenIndex}
              </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
