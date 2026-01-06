import {TokenStep2Enriched} from "@/lib/taamim/roles/types";

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

    layers: {
        emperor: Span[];
        kings: Span[];
        viceroys: Span[];
        thirds: Span[];
    };
    debug: any;

    taamim: Array<TokenStep2Enriched>;
};

