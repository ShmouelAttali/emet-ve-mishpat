import {InferredCode} from "@/lib/taamim/model/inferred";
import type {AmtGlyphKey} from "@/lib/taamim/amtRegistry";
import {Taam} from "@/lib/taamim/model/taam";

export type EmetBook = "Psalms" | "Job" | "Proverbs";

export type TokenEffective = {
    taam: Taam;
    inferredCode: InferredCode;
    hebName: string;
    role: "mesharet" | "mafsik";
    reason: string;
};

export type Role = "mesharet" | "mafsik";
export type IdentifiedTaam = {
    kind: "KNOWN" | "UNKNOWN";
    key: Taam;
    hebName: string;
    role: Role;
    consumedKeys: AmtGlyphKey[];
    taamClusterIndex?: number;
};

export type TokenStep2 = {
    tokenId: string;
    observed: { hasPasekAfter: boolean; hasSofPasuqAfter: boolean };
    identified?: IdentifiedTaam;
    metegClusterIndex?: number;
};

export type TokenStep2Enriched = TokenStep2 & {
    effective: TokenEffective;
};

export type Span = {
    id: string;
    layer: 1 | 2 | 3 | 4;
    name: string;
    from: number;
    to: number;
    causedBy?: { tokenIndex: number; label: string };
    parentId?: string;
};

export type RoleLayers = {
    emperor: Span[];
    kings: Span[];
    viceroys: Span[];
    thirds: Span[];
};

export type RolesDebug = {
    silluqIndex?: number;
    atnachRoleIndex?: number;
    oleVeyoredIndex?: number;
    taken: Array<{ idx: number; layer: string }>;
    kingAnchors: Array<{ tokenIndex: number; role: string; label: string }>;
};

export type AnalyzeResult = {
    normalized: string;
    chapter?: number;
    verse?: number;
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
export type Step2LocalResult = {
    tokens: TokenStep2[];
    anchors: {
        silluqIndex?: number;       // token index of the word with silluq (meteg in last-word context)
        sofPasuqIndex?: number;     // index of ׃ token if exists
    };
};