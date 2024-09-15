import { Queue } from "@datastructures-js/queue";

class NFA {
    private acceptStates: Set<number>;
    private table: NFATransitionTable;

    constructor(acceptStates: number[], table: NFATransitionTable) {
        this.acceptStates = new Set(acceptStates);
        this.table = table;
    }

    *simulation(input: string): Generator<number[], boolean, unknown> {
        const queue = new Queue<number>(this.epsilonClosure(0));
        let i = 0;

        let currentLevel: number[] = [];
        while (i == input.length || !queue.isEmpty()) {
            const levelSize = queue.size();
            currentLevel = [];
            const c = input[i] ?? "";

            for (let k = 0; k < levelSize; k++) {
                const node = queue.pop();
                currentLevel.push(node);

                for (const neighbor of this.table[node]?.[c] ?? []) {
                    this.epsilonClosure(neighbor).forEach((u) => queue.enqueue(u));
                }
            }

            yield currentLevel;
            i++;
        }

        return currentLevel.some(
            (node, _i, _arr) => this.acceptStates.has(node)
        );
    }

    accepts(input: string): boolean {
        const iter = this.simulation(input);
        let curr = iter.next();
        while (!curr.done) {
            curr = iter.next();
        }
        return curr.value;
    }

    isAcceptState(state: number): boolean {
        return this.acceptStates.has(state);
    }

    // symbol for epsilon is "~"
    // this will skip all epsilon (aka, free) transitions
    epsilonClosure(state: number): number[] {
        const closure = new Set<number>();
        const dfs = (node: number) => {
            if (closure.has(node))
                return;
            closure.add(node);

            for (const neighbor of this.table[node]?.["~"] ?? []) {
                dfs(neighbor);
            }
        }
        dfs(state);
        return Array.from(closure);
    }

    toJSON(): NFAJson {
        return {
            acceptStates: Array.from(this.acceptStates),
            table: this.table
        };
    }
}


type NFATransitionTable = Record<number, Record<string, number[]>>;
type NFAJson = {
    acceptStates: number[];
    table: NFATransitionTable;
};

export { NFA };
export type { NFAJson, NFATransitionTable }