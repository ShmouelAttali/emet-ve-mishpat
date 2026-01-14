"use client";

import { useState } from "react";
import { MultiLayerTimeline } from "./ui/MultiLayerTimeline";
import { SelectedTokenPanel } from "./ui/SelectedTokenPanel";
import styles from "./ToolsPage.module.css";
import {AnalyzeResult} from "@/lib/taamim/types";

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

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
        <main className={styles.main}>
            <div className={styles.card}>
                <h1 className={styles.title}>טעמי אמ&quot;ת - כלים</h1>

                <div className={styles.textareaWrap}>
          <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className={styles.textarea}
          />
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={run}
                        disabled={loading}
                        className={cx(
                            styles.runBtn,
                            loading ? styles.runBtnLoading : styles.runBtnIdle
                        )}
                    >
                        {loading ? "מעיין..." : "עיין"}
                    </button>
                </div>

                {result && (
                    <>
                        <h2 className={styles.sectionTitle}>Domains (Roles)</h2>

                        <div className={styles.panel}>
                            <MultiLayerTimeline
                                tokens={result.tokens}
                                layers={result.layers}
                                selectedSourceIndex={selectedSourceIndex}
                                onSelectSourceIndex={setSelectedSourceIndex}
                                debug={result.debug}
                                taamim={result.taamim}
                            />
                        </div>

                        <h2 className={styles.sectionTitle}>Selected token</h2>

                        {selectedSourceIndex != null ? (
                            <SelectedTokenPanel result={result} sourceIndex={selectedSourceIndex} />
                        ) : (
                            <div className={styles.hint}>לחץ על מילה למעלה כדי לראות פרטים.</div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
