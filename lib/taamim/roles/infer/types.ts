import type { TokenGlyph } from "@/lib/text/tokenize";
import type { TokenStep2 } from "@/lib/taamim/step2Local";
import type { Taam } from "@/lib/taamim/model/taam";
import type { Inference } from "@/lib/taamim/model/inferred";
import type { TakenState } from "@/lib/taamim/roles/engine/taken";

/** Inclusive range */
export type Domain = { from: number; to: number };

/** Minimal information about the anchor that "rules" a domain. */
export type Anchor = {
    index: number;
    taam: Taam;
};

/** A domain + what was already inferred inside it (ordered by time of inference). */
export type InferScope = Domain & {
    prior: Inference[];
};

/**
 * Unified input to every inference rule (kings / viceroys / thirds).
 *
 * - scope: where the rule is allowed to look + what was already found in this scope
 * - leader: the controlling anchor of this scope (king for viceroys, viceroy for thirds, etc.)
 */
export type InferInput<TLeader extends Anchor | undefined = Anchor | undefined> = {
    tokens: TokenGlyph[];
    step2: TokenStep2[];
    taken: TakenState;
    scope: InferScope;
    leader: TLeader;
};

/** A single inference rule. Must be pure (no side-effects, no taking). */
export type InferRule<TLeader extends Anchor | undefined = Anchor | undefined> = (
    input: InferInput<TLeader>
) => Inference[];
