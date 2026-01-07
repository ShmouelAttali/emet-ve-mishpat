import { DisplayToken } from "@/app/tools/ui/displayModel";
import { TokenStep2Enriched } from "@/lib/taamim/roles/types";
import { TAAM_META } from "@/lib/taamim/model/taam";
import styles from "./TokensRow.module.css";
import {rtlRangeToGridColumns} from "@/app/tools/ui/rtlGrid";

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
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
        <div className={styles.row} style={{ gridTemplateColumns: gridCols }}>
            {tokens.map((t) => {
                const selected = t.sourceIndex === selectedSourceIndex;
                const highlighted = highlightedSourceIndexes?.has(t.sourceIndex) ?? false;

                const { colStart } = rtlRangeToGridColumns(n, t.displayIndex, t.displayIndex);

                const id = taamim?.[t.sourceIndex]?.identified;
                const hebName = id?.key ? TAAM_META[id.key]?.hebName ?? "—" : "—";
                const isMesharet = id?.role === "mesharet";
                const roleLabel = isMesharet ? "משרת" : "מפסיק";

                return (
                    <button
                        key={t.id}
                        onClick={() => onSelect?.(t.sourceIndex)}
                        className={cx(
                            styles.tokenBtn,
                            selected && styles.selected,
                            highlighted && styles.highlighted,
                            highlighted ? styles.bgHighlighted : selected ? styles.bgSelected : null
                        )}
                        style={{
                            gridColumn: `${colStart} / ${colStart + 1}`,
                        }}
                        title={`sourceIndex=${t.sourceIndex} displayIndex=${t.displayIndex}`}
                    >
                        <div
                            className={cx(
                                styles.accentBar,
                                isMesharet ? styles.accentMesharet : styles.accentMafsiq,
                                highlighted ? styles.accentStrong : styles.accentDim
                            )}
                        />

                        <div className={cx("biblical", styles.raw)}>
                            {t.raw}
                            {t.suffixPasek ? "׀" : ""}
                            {t.suffixSofPasuq ? "׃" : ""}
                        </div>

                        <div className={styles.meta}>
                            <span>{`${hebName} (${roleLabel})`}</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
