import {Taam} from "@/lib/taamim/model/taam";
import {TokenStep2} from "@/lib/taamim/types";

export function hasKnown(step2Tok: TokenStep2 | undefined, key: Taam) {
    return step2Tok?.identified?.key === key;
}