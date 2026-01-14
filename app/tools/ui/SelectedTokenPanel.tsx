import {AnalyzeResult} from "@/lib/taamim/types";

export function SelectedTokenPanel({
                                       result,
                                       sourceIndex,
                                   }: {
    result: AnalyzeResult;
    sourceIndex: number;
}) {
    const token = result.tokens[sourceIndex];
    const s2 = result.taamim.find((x) => x.tokenId === token.id) ?? null;

    // Step3 effective (אם קיים)
    const s3 = result.taamim?.find?.((x: any) => x.tokenId === token.id) ?? null;
    const effective = s3?.effective ?? null;

    const step2RoleText =
        s2?.identified ?
            (s2?.identified.role === "mafsik" ? "מפסיק" : "משרת")
            : "—";

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
            <div style={{display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline"}}>
                <div style={{fontSize: 22}}>{token.raw}</div>

                {/* technical ids should be LTR */}
                <div style={{fontSize: 12, opacity: 0.7, direction: "ltr"}}>
                    sourceIndex #{sourceIndex} • tokenId {token.id}
                </div>
            </div>

            <div style={{marginTop: 10}}>
                <b>הסימנים שעל המילה:</b> {taamMarks || "—"}
            </div>

            <div style={{marginTop: 10}}>
                <b>הטעם שזוהה (תו במילה):</b>{" "}
                <ul style={{margin: "8px 0 0", paddingInlineStart: 18}}>
                    {s2!.identified ? (
                        <li key={s2!.identified.key}>
                            {s2!.identified.hebName} <span
                            style={{opacity: 0.75}}>({s2!.identified.key}, {s2!.identified.role})</span>
                        </li>
                    ) : (
                        <li key={'unknown-taamim-identified-key'}>
                            UNKNOWN
                        </li>
                    )
                    }
                </ul>
            </div>

            <div style={{marginTop: 10}}>
                <b>סיווג “משרת/מפסיק”:</b> {step2RoleText}
            </div>

            <div style={{marginTop: 10}}>
                <b>תפקיד הטעם:</b>{" "}
                {effective ? (
                    <>
                        <span>{effective.hebName}</span>{" "}
                        <span style={{opacity: 0.75}}>({effective.role === "mafsik" ? "מפסיק" : "משרת"})</span>
                        {effective.reason ? (
                            <div style={{marginTop: 6, opacity: 0.8}}>{effective.reason}</div>
                        ) : null}
                    </>
                ) : (
                    <span style={{opacity: 0.75}}>
            — (אין פלט perToken מ־Step3 כרגע. אם תוסיף ב־buildRoleLayers, כאן יופיע “אתנח נסתר” וכו׳)
          </span>
                )}
            </div>

            <div style={{marginTop: 10}}>
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
        </div>
    );
}
