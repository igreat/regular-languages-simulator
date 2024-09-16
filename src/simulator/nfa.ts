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

    // returns true if both NFAs have the same language
    equals(other: NFA): boolean {
        const symbols = new Set<string>([...this.symbols, ...other.symbols]);
        symbols.delete("~");

        // memoization map
        const memo = new Map<string, boolean>();
        const inCall = new Set<string>();

        const isEqualPath = (node1: number, node2: number): boolean => {
            const key = `${node1},${node2}`;
            if (memo.has(key))
                return memo.get(key) ?? false;
        
            if (inCall.has(key))
                return false;

            inCall.add(key);
            for (const symbol of symbols) {
                const transitions1 = this.getNextStates(node1, symbol);
                const transitions2 = other.getNextStates(node2, symbol);

                const accept1 = this.containsAcceptState(transitions1);
                const accept2 = this.containsAcceptState(transitions2);

                if (accept1 != accept2) {
                    memo.set(key, false);
                    inCall.delete(key);
                    return false;
                }

                for (const n1 of transitions1) {
                    for (const n2 of transitions2) {
                        if (isEqualPath(n1, n2)) {
                            memo.set(key, true);
                            inCall.delete(key);
                            return true;
                        }
                    }
                }
            }

            memo.set(key, false);
            inCall.delete(key);
            return false;
        }

        return isEqualPath(0, 0);
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

    getNextStates(state: number, symbol: string): number[] {
        return Array.from(
            new Set(
                this.table[state]?.[symbol]?.flatMap(next => this.epsilonClosure(next)) ?? []
            )
        );
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