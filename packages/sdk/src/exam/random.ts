export function createSeededRandom(seed: string) {
    let state = 0;

    for (let index = 0; index < seed.length; index += 1) {
        state = Math.imul(31, state) + seed.charCodeAt(index) | 0;
    }

    return () => {
        state = Math.imul(state ^ (state >>> 15), state | 1);
        state ^= state + Math.imul(state ^ (state >>> 7), state | 61);

        return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
    };
}

export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
    const random = createSeededRandom(seed);
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return shuffled;
}

export function pickWithSeed<T>(items: T[], count: number, seed: string): T[] {
    if (count > items.length) {
        throw new Error(`Cannot pick ${count} questions from a pool of ${items.length}.`);
    }

    return shuffleWithSeed(items, seed).slice(0, count);
}
