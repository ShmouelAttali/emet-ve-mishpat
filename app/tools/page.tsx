"use client";

import { useMemo, useState } from "react";
import { AnalyzeResult } from "./types";
import { MultiLayerTimeline } from "./ui/MultiLayerTimeline";
import { SelectedTokenPanel } from "./ui/SelectedTokenPanel";

export default function ToolsPage() {
    const [text, setText] = useState(
        "רַבִּים֮ אֹמְרִ֪ים לְנַ֫פְשִׁ֥י אֵ֤ין יְֽשׁוּעָ֓תָה לּ֬וֹ בֵֽאלֹהִ֬ים סֶֽלָה:"
    );
    const [result, setResult] = useState<AnalyzeResult | null>(null);
    const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    async function run() {
        setLoading(true);
        setSelectedSourceIndex(null);
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            setResult(await res.json());
        } finally {
            setLoading(false);
        }
    }

    // Step3 per-token effective map (אם קיים)
    const effectiveByTokenId = useMemo(() => {
        const m = new Map<string, { hebName: string; role: "mesharet" | "mafsik"; reason?: string }>();
        const perToken = result?.taamim ?? [];
        for (const x of perToken) {
            if (x?.tokenId && x?.effective?.hebName && x?.effective?.role) {
                m.set(x.tokenId, x.effective);
            }
        }
        return m;
    }, [result]);

    // Badge text על כל מילה: קודם Step3 effective (אם קיים), אחרת Step2
    const tokenBadges = useMemo(() => {
        if (!result) return undefined;

        const out: Record<number, string> = {};

        // Step2 map מהיר
        const step2ById = new Map(result.taamim.map((x) => [x.tokenId, x]));

        for (let i = 0; i < result.tokens.length; i++) {
            const t = result.tokens[i];
            if (t.isPasek || t.isSofPasuq) continue;

            const eff = effectiveByTokenId.get(t.id);
            if (eff) {
                out[i] = eff.role === "mafsik" ? "מפסיק" : "משרת";
                continue;
            }

            const s2 = step2ById.get(t.id);
            const known = (s2?.identified ?? []).filter((x) => x.kind === "KNOWN") as Array<{
                kind: "KNOWN";
                role: "mesharet" | "mafsik";
            }>;

            if (known.length === 0) out[i] = "—";
            else if (known.some((k) => k.role === "mafsik")) out[i] = "מפסיק";
            else out[i] = "משרת";
        }

        return out;
    }, [result, effectiveByTokenId]);

    return (
        <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
            <div
                style={{
                    background: "#fff",
                    color: "#000",
                    borderRadius: 16,
                    padding: 18,
                    border: "1px solid rgba(0,0,0,0.12)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
                }}
            >
                <h1 style={{ margin: 0, fontSize: 22 }}>AMT Taʿamim Tools</h1>

                <div style={{ marginTop: 12 }}>
          <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              style={{
                  width: "100%",
                  fontSize: 18,
                  direction: "rtl",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.2)",
                  outline: "none",
              }}
          />
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                    <button
                        onClick={run}
                        disabled={loading}
                        style={{
                            padding: "10px 14px",
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.25)",
                            background: loading ? "rgba(0,0,0,0.06)" : "#000",
                            color: loading ? "#000" : "#fff",
                            fontSize: 16,
                            cursor: loading ? "default" : "pointer",
                        }}
                    >
                        {loading ? "Analyzing..." : "Analyze"}
                    </button>
                </div>

                {result && (
                    <>
                        <h2 style={{ marginTop: 18, fontSize: 16 }}>Domains (Roles)</h2>

                        <div
                            style={{
                                border: "1px solid rgba(0,0,0,0.12)",
                                borderRadius: 14,
                                padding: 12,
                                background: "rgba(0,0,0,0.02)",
                            }}
                        >
                            <MultiLayerTimeline
                                tokens={result.tokens}
                                layers={result.layers}
                                selectedSourceIndex={selectedSourceIndex}
                                onSelectSourceIndex={setSelectedSourceIndex}
                                debug={result.debug}
                                tokenBadges={tokenBadges}
                            />
                        </div>

                        <h2 style={{ marginTop: 18, fontSize: 16 }}>Selected token</h2>

                        {selectedSourceIndex != null ? (
                            <SelectedTokenPanel
                                result={result}
                                sourceIndex={selectedSourceIndex}
                            />
                        ) : (
                            <div style={{ opacity: 0.7, direction: "rtl", textAlign: "right" }}>
                                לחץ על מילה למעלה כדי לראות פרטים.
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
