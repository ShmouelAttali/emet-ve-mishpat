import {Span} from "../types";
import {buildDisplayTokens} from "./displayModel";
import {Layer} from "./Layer";
import {TokensRow} from "./TokensRow";

export function MultiLayerTimeline({
                                       tokens,
                                       tokenBadges,
                                       layers,
                                       selectedSourceIndex,
                                       onSelectSourceIndex,
                                       debug,
                                   }: {
    tokens: Array<{ id: string; raw: string; isPasek?: boolean; isSofPasuq?: boolean }>;
    tokenBadges?: Record<number, string>; // sourceIndex -> "משרת" | "מפסיק" | "—"
    layers: { emperor: Span[]; kings: Span[]; viceroys: Span[]; thirds: Span[] };
    selectedSourceIndex?: number | null;
    onSelectSourceIndex?: (sourceIndex: number) => void;
    debug?: any;
}) {
    const {displayTokens, sourceToDisplay} = buildDisplayTokens(tokens);
    const n = displayTokens.length;

    return (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            <Layer n={n} spans={layers.emperor} sourceToDisplay={sourceToDisplay} height={44} borderWidth={3}
                   opacity={0.85}/>
            <Layer n={n} spans={layers.kings} sourceToDisplay={sourceToDisplay} height={40} borderWidth={2}
                   opacity={0.75}/>
            <Layer n={n} spans={layers.viceroys} sourceToDisplay={sourceToDisplay} height={36} borderWidth={2}
                   opacity={0.6}/>
            <Layer n={n} spans={layers.thirds} sourceToDisplay={sourceToDisplay} height={32} borderWidth={1}
                   opacity={0.5}/>

            <div style={{height: 2, background: "rgba(0,0,0,0.10)", borderRadius: 999}}/>

            <TokensRow tokens={displayTokens} selectedSourceIndex={selectedSourceIndex} onSelect={onSelectSourceIndex}
                       tokenBadges={tokenBadges}
            />

            {debug && (
                <div style={{fontSize: 12, opacity: 0.75, color: "#111"}}>
                    debug: silluqIndex={String(debug.silluqIndex)} • atnachRoleIndex={String(debug.atnachRoleIndex)}
                </div>
            )}
        </div>
    );
}
