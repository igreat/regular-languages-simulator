import { Queue } from "@datastructures-js/queue";
import { DFA } from "./dfa";
import type { DFATransitionTable } from "./dfa";

class NFA {
    private startState: string;
    private acceptStates: Set<string>;
    private table: NFATransitionTable;
    private symbols: string[];
    private states: string[];

    constructor(startState: string, acceptStates: string[], table: NFATransitionTable) {
        this.startState = startState;
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
        symbolSet.delete("~");
        this.symbols = Array.from(symbolSet).sort()
    }

    *simulation(input: string): Generator<string[], boolean, unknown> {
        const queue = new Queue<string>(Array.from(this.epsilonClosure(this.startState)));
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
        const table: DFATransitionTable = {};
        const acceptStates = new Set<string>();
        const startState = Array.from(this.epsilonClosure(this.startState)).sort().join(",");
        const queue = new Queue<Set<string>>([this.epsilonClosure(this.startState)]);
        const visited = new Set<string>();
        while (!queue.isEmpty()) {
            const srcStates = queue.pop();
            const srcKey = Array.from(srcStates).sort().join(",");
            if (visited.has(srcKey))
                continue;

            if (this.containsAcceptState(Array.from(srcStates)))
                acceptStates.add(srcKey);

            table[srcKey] = {};
            visited.add(srcKey);
            const transitions: Record<string, Set<string>> = {};
            for (const state of srcStates) {
                if (!this.table[state])
                    continue;
                for (const symbol of this.symbols) {
                    const targets = this.table[state][symbol] ?? [];
                    if (!transitions[symbol])
                        transitions[symbol] = new Set<string>();
                    for (const closure of targets.flatMap((t) => this.epsilonClosure(t))) {
                        closure.forEach((s) => transitions[symbol]?.add(s));
                    }
                }
            }

            for (const [symbol, tgtStates] of Object.entries(transitions)) {
                const tgtKey = Array.from(tgtStates).sort().join(",");
                table[srcKey][symbol] = tgtKey;
                queue.push(tgtStates);
            }
        }

        return new DFA(startState, Array.from(acceptStates), table);
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

    equals(other: NFA): boolean {
        const currentDfa = this.toDFA();
        const otherDfa = other.toDFA();
        return currentDfa.equals(otherDfa);
    }

    isDFA(): boolean {
        for (const transitions of Object.values(this.table)) {
            if (Object.entries(transitions)
                .some(([symbol, targets]) => symbol === "~" || targets.length > 1))
                return false;
        }
        return true;
    }

    relabeled(): NFA {
        const newLabels = new Map<string, string>();
        const queue = new Queue<string>(Array.from(this.epsilonClosure(this.startState)));
        let curr = 0;
        const visited = new Set<string>();
        while (!queue.isEmpty()) {
            const state = queue.pop();
            if (visited.has(state))
                continue;
            visited.add(state);
            newLabels.set(state, curr.toString());
            curr++;

            for (const symbol of this.symbols) {
                const nextState = this.table[state]?.[symbol];
                if (!nextState) continue;
                for (const neighbor of nextState) {
                    this.epsilonClosure(neighbor).forEach((u) => queue.enqueue(u));
                }
            }
        }

        const newTable: NFATransitionTable = {};
        for (const [src, transitions] of Object.entries(this.table)) {
            const srcLabel = newLabels.get(src)!;
            newTable[srcLabel] = {};
            for (const [symbol, targets] of Object.entries(transitions)) {
                newTable[srcLabel][symbol] = targets.map((target) => newLabels.get(target)!);
            }
        }

        const newStartState = newLabels.get(this.startState)!;
        const newAcceptStates = new Set<string>();
        this.acceptStates.forEach((state) => {
            newAcceptStates.add(newLabels.get(state)!);
        });

        return new NFA(newStartState, Array.from(newAcceptStates), newTable);
    }

    getStates(): string[] {
        // return a copy of the states
        return [...this.states];
    }

    getStartState(): string {
        return this.startState;
    }

    getAcceptStates(): string[] {
        return Array.from(this.acceptStates);
    }

    getSymbols(): string[] {
        return [...this.symbols];
    }

    getTable(): NFATransitionTable {
        return JSON.parse(JSON.stringify(this.table));
    }

    toJSON(): NFAJson {
        return {
            startState: this.startState,
            acceptStates: Array.from(this.acceptStates),
            table: this.table
        };
    }
}


type NFATransitionTable = Record<string, Record<string, string[]>>;
type NFAJson = {
    startState: string;
    acceptStates: string[];
    table: NFATransitionTable;
};

export { NFA };
export type { NFAJson, NFATransitionTable }