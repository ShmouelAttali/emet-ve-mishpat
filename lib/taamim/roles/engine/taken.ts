export type LayerKind = "KING" | "VICEROY" | "THIRD";

export type TakenState = {
    takenBy: Map<number, LayerKind>;
};

export function createTaken(): TakenState {
    return { takenBy: new Map() };
}

export function isTaken(taken: TakenState, index: number) {
    return taken.takenBy.has(index);
}

export function tryTake(taken: TakenState, index: number, layer: LayerKind): boolean {
    if (taken.takenBy.has(index)) return false;
    taken.takenBy.set(index, layer);
    return true;
}