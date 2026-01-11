import {DisplayToken} from "@/app/tools/ui/displayModel";
import {TokenStep2Enriched} from "@/lib/taamim/roles/types";
import {TAAM_META} from "@/lib/taamim/model/taam";
import styles from "./TokensRow.module.css";
import {rtlRangeToGridColumns} from "@/app/tools/ui/rtlGrid";
import {INFERRED_CODE_REASON} from "@/lib/taamim/model/inferred";
import {TokenTooltip} from "@/app/components/TokenTooltip";

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

export function TokensRow({
                              tokens,
                              selectedSourceIndex,
                              onSelect,
                              taamim,
                              highlightedSourceIndexes,
                              gridCols
                          }: {
    tokens: DisplayToken[];
    selectedSourceIndex?: number | null;
    onSelect?: (sourceIndex: number) => void;
    taamim: Array<TokenStep2Enriched>;
    highlightedSourceIndexes?: Set<number>;
    hoveredLabel?: string;
    gridCols: string;
}) {
    const n = tokens.length;

    return (
        <div className={styles.row} style={{gridTemplateColumns: gridCols}}>
            {tokens.map((t) => {
                const selected = t.sourceIndex === selectedSourceIndex;
                const highlighted = highlightedSourceIndexes?.has(t.sourceIndex) ?? false;

                const {colStart} = rtlRangeToGridColumns(n, t.displayIndex, t.displayIndex);

                let taamimElement = taamim?.[t.sourceIndex];
                const id = taamimElement?.identified;
                const hebName = id?.key ? TAAM_META[id.key]?.hebName ?? "—" : "—";
                let effective = taamimElement?.effective;
                const hasHiddenTaam = effective?.taam != id?.key && effective?.inferredCode != "EFFECTIVE_ORIGINAL";
                let effectiveTaamHebrewName = TAAM_META[effective?.taam]?.hebName;
                const isMesharet = id?.role === "mesharet";
                const roleLabel = isMesharet ? "משרת" : "מפסיק";

                return (
                    <TokenTooltip key={t.id}
                                  enabled={hasHiddenTaam}
                                  content={
                                      <>
                                          {hasHiddenTaam && effective?.inferredCode && (
                                              <div>
                                                  <b>טעם נסתר:</b>{" "}
                                                  {INFERRED_CODE_REASON[effective.inferredCode]}
                                              </div>
                                          )}
                                      </>
                                  }
                    >
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
                                <br/>
                                <span>{hasHiddenTaam ? `טעם נסתר - ${effectiveTaamHebrewName}` : ''}</span>
                            </div>
                        </button>
                    </TokenTooltip>
                );
            })}
        </div>
    );
}
