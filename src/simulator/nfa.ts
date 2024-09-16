import { Queue } from "@datastructures-js/queue";

class NFA {
    private acceptStates: Set<number>;
    private table: NFATransitionTable;
    private symbols: string[];
    private states: number[];

    constructor(acceptStates: number[], table: NFATransitionTable) {
        this.acceptStates = new Set(acceptStates);
        this.table = table;
        this.states = [];

        const symbolSet = new Set<string>();
        for (const [state, transitions] of Object.entries(this.table)) {
            this.states.push(Number(state));
            for (const symbol of Object.keys(transitions)) {
                symbolSet.add(symbol);
            }
        }
        this.symbols = Array.from(symbolSet).sort()
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

    containsAcceptState(states: number[]): boolean {
        return states.some((state) => this.isAcceptState(state));
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

    // returns true if both NFAs have the same language
    equals(other: NFA): boolean {
        const visited = new Map<number, Set<number>>(
            this.states.map(state => [state, new Set<number>()])
        );

        const isEqualPath = (node1: number, node2: number): boolean => {
            if (this.isAcceptState(node1) != this.isAcceptState(node2))
                return false;
            if (visited.get(node1)?.has(node2))
                return true;
            visited.get(node1)?.add(node2);

            for (const symbol of this.symbols) {
                const transitions1 = this.table[node1]?.[symbol]?.flatMap(next1 => this.epsilonClosure(next1)) ?? [];
                const transitions2 = other.table[node2]?.[symbol]?.flatMap(next2 => other.epsilonClosure(next2)) ?? [];

                for (const n1 of transitions1) {
                    let matchFound = true;
                    for (const n2 of transitions2) {
                        if (isEqualPath(n1, n2)) {
                            matchFound = true;
                            break;
                        }
                    }
                    if (!matchFound)
                        return false;
                }

                for (const n2 of transitions2) {
                    let matchFound = true;
                    for (const n1 of transitions1) {
                        if (isEqualPath(n1, n2)) {
                            matchFound = true;
                            break;
                        }
                    }
                    if (!matchFound)
                        return false;
                }
            }
            return true;
        }

        return isEqualPath(0, 0);
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