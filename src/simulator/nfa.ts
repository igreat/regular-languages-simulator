import { Queue } from "@datastructures-js/queue";
import { DFA, DFATransitionTable } from "./dfa";

class NFA {
    private acceptStates: Set<string>;
    private table: NFATransitionTable;
    private symbols: string[];
    private states: string[];

    constructor(acceptStates: string[], table: NFATransitionTable) {
        this.acceptStates = new Set(acceptStates);
        this.table = table;
        this.states = [];

        const symbolSet = new Set<string>();
        for (const [state, transitions] of Object.entries(this.table)) {
            this.states.push(state);
            for (const symbol of Object.keys(transitions)) {
                symbolSet.add(symbol);
            }
        }
        this.symbols = Array.from(symbolSet).sort()
    }

    *simulation(input: string): Generator<string[], boolean, unknown> {
        const queue = new Queue<string>(Array.from(this.epsilonClosure("0")));
        let i = 0;

        let currentLevel: string[] = [];
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

    isAcceptState(state: string): boolean {
        return this.acceptStates.has(state);
    }

    containsAcceptState(states: string[]): boolean {
        return states.some((state) => this.isAcceptState(state));
    }

    toDFA(): DFA {
        // represent state as a set?
        // then to hash the set I join it into a string
        const table: DFATransitionTable = {};
        const acceptStates = new Set<string>();
        const queue = new Queue<Set<string>>([this.epsilonClosure("0")]);


        return new DFA(Array.from(acceptStates), table);
    }

    // symbol for epsilon is "~"
    // this will skip all epsilon (aka, free) transitions
    epsilonClosure(state: string): Set<string> {
        const closure = new Set<string>();
        const dfs = (node: string) => {
            if (closure.has(node))
                return;
            closure.add(node);

            for (const neighbor of this.table[node]?.["~"] ?? []) {
                dfs(neighbor);
            }
        }
        dfs(state);
        return closure;
    }

    getNextStates(state: string, symbol: string): Set<string> {
        const closure = new Set<string>();
        for (const neighbor of this.table[state]?.[symbol] ?? []) {
            this.epsilonClosure(neighbor).forEach((u) => closure.add(u));
        }
        return closure;
    }

    toJSON(): NFAJson {
        return {
            acceptStates: Array.from(this.acceptStates),
            table: this.table
        };
    }
}


type NFATransitionTable = Record<string, Record<string, string[]>>;
type NFAJson = {
    acceptStates: string[];
    table: NFATransitionTable;
};

export { NFA };
export type { NFAJson, NFATransitionTable }