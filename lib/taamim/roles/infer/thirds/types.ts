import type { Anchor, InferInput, InferRule } from "../types";

export type ViceroyLeader = Anchor & {
    /** Optional: the containing king (useful for rare third-level rules) */
    king?: Anchor;
};

export type ThirdRuleInput = InferInput<ViceroyLeader>;
export type ThirdRule = InferRule<ViceroyLeader>;
