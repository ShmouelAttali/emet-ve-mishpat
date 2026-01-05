export type DisplayToken = {
    displayIndex: number;
    sourceIndex: number;
    id: string;
    raw: string;
    suffixPasek: boolean;
    suffixSofPasuq: boolean;
};

export function buildDisplayTokens(
    tokens: Array<{ id: string; raw: string; isPasek?: boolean; isSofPasuq?: boolean }>
) {
    const displayTokens: DisplayToken[] = [];
    const sourceToDisplay = new Map<number, number>();
    const displayToSource: number[] = [];

    let d = 0;
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.isPasek || t.isSofPasuq) continue;

        const next = tokens[i + 1];
        const suffixPasek = !!next?.isPasek;
        const suffixSofPasuq = !!next?.isSofPasuq;

        displayTokens.push({
            displayIndex: d,
            sourceIndex: i,
            id: t.id,
            raw: t.raw,
            suffixPasek,
            suffixSofPasuq,
        });

        sourceToDisplay.set(i, d);
        displayToSource[d] = i;
        d++;
    }

    return { displayTokens, sourceToDisplay, displayToSource };
}

export function spanToDisplayRange(
    span: { from: number; to: number },
    sourceToDisplay: Map<number, number>
) {
    let a = span.from;
    let b = span.to;

    while (a <= b && !sourceToDisplay.has(a)) a++;
    while (b >= a && !sourceToDisplay.has(b)) b--;

    if (!sourceToDisplay.has(a) || !sourceToDisplay.has(b)) return null;

    return {
        from: sourceToDisplay.get(a)!,
        to: sourceToDisplay.get(b)!,
    };
}
