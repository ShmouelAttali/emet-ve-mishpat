import {DisplayToken} from "@/app/tools/ui/displayModel";
import {TokenStep2Enriched} from "@/lib/taamim/roles/types";
import {TAAM_META} from "@/lib/taamim/model/taam";

function rtlIndex(n: number, displayIndex: number) {
    return n - 1 - displayIndex;
}

export function TokensRow({
                              tokens,
                              selectedSourceIndex,
                              onSelect,
                              taamim,
                              highlightedSourceIndexes,
                          }: {
    tokens: DisplayToken[];
    selectedSourceIndex?: number | null;
    onSelect?: (sourceIndex: number) => void;
    taamim: Array<TokenStep2Enriched>;
    highlightedSourceIndexes?: Set<number>;
    hoveredLabel?: string;
}) {
    const n = tokens.length;
    const gridCols = `repeat(${n}, minmax(72px, 1fr))`;

    return (
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 8 }}>
            {tokens.map((t) => {
                const selected = t.sourceIndex === selectedSourceIndex;
                const highlighted = highlightedSourceIndexes?.has(t.sourceIndex) ?? false;

                const col = rtlIndex(n, t.displayIndex) + 1;

                const id = taamim?.[t.sourceIndex]?.identified;
                const hebName = id?.key ? (TAAM_META[id.key]?.hebName ?? "—") : "—";
                const isMesharet = id?.role === "mesharet";
                const roleLabel = isMesharet ? "משרת" : "מפסיק";

                // צבעים עדינים (מומלץ להשאיר ניטרלי)
                const accent = isMesharet ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.75)";
                const softBg = highlighted
                    ? "rgba(0,0,0,0.06)"
                    : selected
                        ? "rgba(0,0,0,0.03)"
                        : "#fff";

                return (
                    <button
                        key={t.id}
                        onClick={() => onSelect?.(t.sourceIndex)}
                        style={{
                            gridColumn: `${col} / ${col + 1}`,
                            gridRow: 1,
                            border: selected ? "2px solid #000" : highlighted ? "1px solid rgba(0,0,0,0.6)" : "1px solid #cfcfcf",
                            borderRadius: 14,
                            background: softBg,
                            color: "#000",
                            padding: "12px 10px 10px",
                            minHeight: 76,
                            cursor: "pointer",
                            position: "relative",
                            boxShadow: selected
                                ? "0 8px 22px rgba(0,0,0,0.10)"
                                : highlighted
                                    ? "0 6px 16px rgba(0,0,0,0.08)"
                                    : "none",
                            transform: selected ? "translateY(-1px)" : "translateY(0px)",
                            transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background 120ms ease",
                            overflow: "hidden",
                        }}
                        title={`sourceIndex=${t.sourceIndex} displayIndex=${t.displayIndex}`}
                    >
                        {/* Accent bar */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 5,
                                background: accent,
                                opacity: highlighted ? 0.9 : 0.55,
                            }}
                        />

                        <div style={{ fontSize: 18, direction: "rtl", unicodeBidi: "plaintext", marginTop: 2 }}>
                            {t.raw}
                        </div>

                        <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8, display: "flex", justifyContent: "space-between", gap: 6 }}>
                            <span>{`${hebName} (${roleLabel})`}</span>
                        </div>

                        {(t.suffixPasek || t.suffixSofPasuq) && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: 10,
                                    bottom: 10,
                                    fontSize: 16,
                                    opacity: 0.9,
                                }}
                            >
                                {t.suffixPasek ? "׀" : ""}
                                {t.suffixSofPasuq ? "׃" : ""}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
