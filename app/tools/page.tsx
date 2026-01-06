"use client";

import { useState } from "react";
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
                                taamim={result.taamim}
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
