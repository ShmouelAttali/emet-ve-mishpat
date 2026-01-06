import {normalizeHebrewText} from "./text/normalize";
import {tokenizeNormalizedText} from "./text/tokenize";
import {identifyStep2Local} from "./taamim/step2Local";
import {buildRoleLayers} from "./taamim/roles/buildRoleLayers";
import {AnalyzeResult} from "@/app/tools/types";

function buildTaamInventory(tokens: ReturnType<typeof tokenizeNormalizedText>) {
    const map = new Map<
        string,
        { u: string; cp: string; count: number; lastLetterCount: number; examples: string[] }
    >();

    for (const t of tokens) {
        if (t.isPasek || t.isSofPasuq) continue;
        const last = t.clusters.length - 1;

        for (const c of t.clusters) {
            for (const m of c.marks) {
                if (m.kind !== "TAAM") continue;

                const entry =
                    map.get(m.u) ?? {u: m.u, cp: m.cp, count: 0, lastLetterCount: 0, examples: []};

                entry.count += 1;
                if (m.letterIndex === last) entry.lastLetterCount += 1;
                if (entry.examples.length < 6 && !entry.examples.includes(t.raw)) entry.examples.push(t.raw);

                map.set(m.u, entry);
            }
        }
    }

    return Array.from(map.values()).sort((a, b) => a.u.localeCompare(b.u));
}

export function analyzeHebrewTaamim(text: string): AnalyzeResult {
    const normalized = normalizeHebrewText(text);
    const tokens = tokenizeNormalizedText(normalized);

    const taamInventory = buildTaamInventory(tokens);

    const taams = identifyStep2Local(tokens);

    const enrichedTaamim = buildRoleLayers(tokens, taams.tokens, taams.anchors.silluqIndex);

    return {
        normalized,
        tokens,
        layers: enrichedTaamim.layers,
        taamim: enrichedTaamim.tokens,
        debug: enrichedTaamim.debug
    };
}
