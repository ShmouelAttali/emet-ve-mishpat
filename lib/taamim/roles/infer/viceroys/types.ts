import {Anchor, InferInput, InferRule} from "@/lib/taamim/roles/infer/types";


/**
 * The controlling King of the current king-domain.
 *
 * You asked to avoid per-level ctx objects; this stays generic and is shared
 * across all viceroy rules.
 */
export type KingLeader = Anchor & {
    /** Optional: index of Oleh-Veyored king in the pasuk, if it exists */
    oleVeyoredIndex?: number;
    /** Optional: index of Atnach king in the pasuk, if it exists */
    atnachIndex?: number;
    /** Optional: silluq index (end of emperor domain) */
    silluqIndex?: number;
    isAfterAtnach: boolean;
};

export type ViceroyRuleInput = InferInput<KingLeader>;
export type ViceroyRule = InferRule<KingLeader>;
