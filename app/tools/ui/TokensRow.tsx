import {DisplayToken} from "./displayModel";

function rtlIndex(n: number, displayIndex: number) {
    return n - 1 - displayIndex;
}

export function TokensRow({
                              tokens,
                              selectedSourceIndex,
                              onSelect,
                              tokenBadges
                          }: {
    tokens: DisplayToken[];
    selectedSourceIndex?: number | null;
    onSelect?: (sourceIndex: number) => void;
    tokenBadges?: Record<number, string>;
}) {
    const n = tokens.length;
    const gridCols = `repeat(${n}, minmax(72px, 1fr))`;

    return (
        <div style={{display: "grid", gridTemplateColumns: gridCols, gap: 8}}>
            {tokens.map((t) => {
                const selected = t.sourceIndex === selectedSourceIndex;

                // place this token in RTL visual column
                const col = rtlIndex(n, t.displayIndex) + 1;
                const badge = tokenBadges?.[t.sourceIndex];

                return (
                    <button
                        key={t.id}
                        onClick={() => onSelect?.(t.sourceIndex)}
                        style={{
                            gridColumn: `${col} / ${col + 1}`,
                            gridRow: 1,
                            gridAutoFlow: "row",
                            border: selected ? "2px solid #000" : "1px solid #cfcfcf",
                            borderRadius: 12,
                            background: "#fff",
                            color: "#000",
                            padding: "12px 10px",
                            minHeight: 64,
                            cursor: "pointer",
                            position: "relative",
                            boxShadow: selected ? "0 0 0 2px rgba(0,0,0,0.08)" : "none",
                        }}
                        title={`sourceIndex=${t.sourceIndex} displayIndex=${t.displayIndex}`}
                    >
                        <div style={{fontSize: 18, color: "#000", direction: "rtl", unicodeBidi: "plaintext"}}>
                            {t.raw}
                        </div>
                        <div style={{fontSize: 11, opacity: 0.65, marginTop: 6}}>
                            {badge ?? "—"}
                        </div>

                        {(t.suffixPasek || t.suffixSofPasuq) && (
                            <div style={{
                                position: "absolute",
                                left: 10,
                                bottom: 8,
                                fontSize: 16,
                                opacity: 0.9,
                                color: "#000"
                            }}>
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
