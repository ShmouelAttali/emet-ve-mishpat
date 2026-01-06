import type {TokenStep2} from "@/lib/taamim/step2Local";
import {Taam} from "@/lib/taamim/model/taam";

export function hasKnown(step2Tok: TokenStep2 | undefined, key: Taam) {
    return step2Tok?.identified?.key === key;
}