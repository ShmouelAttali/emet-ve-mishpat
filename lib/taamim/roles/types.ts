import type { TokenStep2 } from "../step2Local";
import type { Taam } from "../model/taam";

export type TokenEffective = {
    taam: Taam;
    inferredCode: string;
    hebName: string;
    role: "mesharet" | "mafsik";
    reason: string;
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
