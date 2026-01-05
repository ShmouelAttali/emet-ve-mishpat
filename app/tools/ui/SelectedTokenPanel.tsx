import { AnalyzeResult } from "../types";

export function SelectedTokenPanel({
                                       result,
                                       sourceIndex,
                                   }: {
    result: AnalyzeResult;
    sourceIndex: number;
}) {
    const token = result.tokens[sourceIndex];
    const s2 = result.step3.tokens.find((x) => x.tokenId === token.id) ?? null;

    // Step3 effective (אם קיים)
    const s3 = result.step3?.tokens?.find?.((x: any) => x.tokenId === token.id) ?? null;
    const effective = s3?.effective ?? null;

    const step2Known =
        (s2?.identified?.filter((x) => x.kind === "KNOWN") as
            | Array<{ kind: "KNOWN"; hebName: string; key: string; role: "mesharet" | "mafsik" }>
            | undefined) ?? [];

    const step2RoleText =
        step2Known.length === 0
            ? "—"
            : step2Known.some((k) => k.role === "mafsik")
                ? "מפסיק"
                : "משרת";

    const taamMarks = token.clusters
        .flatMap((c) => c.marks.filter((m) => m.kind === "TAAM"))
        .map((m) => `${m.cp} ${m.u}@${m.letterIndex}`)
        .join(", ");

    return (
        <div
            style={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 14,
                padding: 12,
                background: "#fff",
                direction: "rtl",
                textAlign: "right",
                unicodeBidi: "plaintext",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <div style={{ fontSize: 22 }}>{token.raw}</div>

                {/* technical ids should be LTR */}
                <div style={{ fontSize: 12, opacity: 0.7, direction: "ltr" }}>
                    sourceIndex #{sourceIndex} • tokenId {token.id}
                </div>
            </div>

            <div style={{ marginTop: 10 }}>
                <b>Step 3 effective (התוצאה “האמיתית”):</b>{" "}
                {effective ? (
                    <>
                        <span>{effective.hebName}</span>{" "}
                        <span style={{ opacity: 0.75 }}>({effective.role === "mafsik" ? "מפסיק" : "משרת"})</span>
                        {effective.reason ? (
                            <div style={{ marginTop: 6, opacity: 0.8 }}>{effective.reason}</div>
                        ) : null}
                    </>
                ) : (
                    <span style={{ opacity: 0.75 }}>
            — (אין פלט perToken מ־Step3 כרגע. אם תוסיף ב־buildRoleLayers, כאן יופיע “אתנח נסתר” וכו׳)
          </span>
                )}
            </div>

            <div style={{ marginTop: 10 }}>
                <b>Step 2 identified (תו במילה):</b>{" "}
                <span style={{ opacity: 0.85 }}>{step2Known.length ? "" : "—"}</span>
                {step2Known.length ? (
                    <ul style={{ margin: "8px 0 0", paddingInlineStart: 18 }}>
                        {s2!.identified.map((x, idx) =>
                            x.kind === "KNOWN" ? (
                                <li key={x.key + idx}>
                                    {x.hebName} <span style={{ opacity: 0.75 }}>({x.key}, {x.role})</span>
                                </li>
                            ) : (
                                <li key={x.u + idx}>
                                    UNKNOWN <span style={{ opacity: 0.75 }}>({x.u})</span>
                                </li>
                            )
                        )}
                    </ul>
                ) : null}
            </div>

            <div style={{ marginTop: 10 }}>
                <b>סיווג “משרת/מפסיק” לפי Step2:</b> {step2RoleText}
            </div>

            <div style={{ marginTop: 10 }}>
                <b>Observed:</b>{" "}
                {s2
                    ? [
                    s2.observed.hasPasekAfter ? "hasPasekAfter" : "",
                    s2.observed.hasSofPasuqAfter ? "hasSofPasuqAfter" : "",
                ]
                    .filter(Boolean)
                    .join(" | ") || "—"
                    : "—"}
            </div>

            <div style={{ marginTop: 10 }}>
                <b>Step 1 marks (TAAM):</b> {taamMarks || "—"}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                הערה: Step2 = “איזה תו יש במילה”; Step3 effective = “מה הטעם בפועל אחרי הכללים (כולל אתנח נסתר וכו׳)”.
            </div>
        </div>
    );
}
