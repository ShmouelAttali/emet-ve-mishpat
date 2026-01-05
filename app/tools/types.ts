export type Span = {
    id: string;
    layer: 1 | 2 | 3 | 4;
    name: string;
    from: number;
    to: number;
    causedBy?: { tokenIndex: number; label: string };
    parentId?: string;
};

export type AnalyzeResult = {
    normalized: string;

    tokens: Array<{
        id: string;
        raw: string;
        letters: string;
        clusters: Array<{
            letter: string;
            marks: Array<{
                kind: "TAAM" | "NIQQUD";
                cp: string;
                u: string;
                letterIndex: number;
                orderInLetter: number;
            }>;
        }>;
        isPasek?: boolean;
        isSofPasuq?: boolean;
    }>;

    taamInventory: Array<{
        u: string;
        cp: string;
        count: number;
        lastLetterCount: number;
        examples: string[];
    }>;

    step3: {
        layers: {
            emperor: Span[];
            kings: Span[];
            viceroys: Span[];
            thirds: Span[];
        };
        debug: any;

        tokens: Array<{
            tokenId: string;
            observed: { hasPasekAfter: boolean; hasSofPasuqAfter: boolean };
            identified: Array<
                | { kind: "KNOWN"; key: string; hebName: string; role: "mesharet" | "mafsik"; consumedU: string[] }
                | { kind: "UNKNOWN"; u: string }
            >;
            effective: {
                key: string;
                hebName: string;
                role: "mesharet" | "mafsik";
                reason: string;
            };
        }>;
    };
};

