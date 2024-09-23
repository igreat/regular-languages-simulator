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
        const states = new Set<string>([startState, ...acceptStates]);

        const symbolSet = new Set<string>();
        for (const [state, transitions] of Object.entries(this.table)) {
            states.add(state);
            for (const [symbol, targets] of Object.entries(transitions)) {
                symbolSet.add(symbol);
                targets.forEach((target) => { states.add(target) });
            }
        }

        this.states = Array.from(states).sort();
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
        const trashState = "∅";
        const states = [...this.states, trashState];

        const nfaTable = this.getTable();
        // add trash state to the table
        for (const state of states) {
            if (!nfaTable[state]) {
                nfaTable[state] = {};
            }
            for (const symbol of this.symbols) {
                if (!nfaTable[state][symbol]) {
                    nfaTable[state][symbol] = [trashState];
                }
            }
        }

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
                if (!nfaTable[state])
                    continue;
                for (const symbol of this.symbols) {
                    const targets = nfaTable[state][symbol] ?? [];
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

    getRelabelingMap(): Map<string, string> {
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

        return newLabels;
    }

    relabeled(): NFA {
        const newLabels = this.getRelabelingMap();

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

    reversed(): NFA {
        let newStartState = "ST_REV";
        const newTable: NFATransitionTable = {};
        for (const [src, transitions] of Object.entries(this.table)) {
            if (src === newStartState) {
                newStartState += "_";
            }
            for (const [symbol, targets] of Object.entries(transitions)) {
                for (const target of targets) {
                    if (target === newStartState) {
                        newStartState += "_";
                    }
                    if (!newTable[target]) {
                        newTable[target] = {};
                    }
                    // reverse the transition
                    if (!newTable[target][symbol]) {
                        newTable[target][symbol] = [];
                    }
                    newTable[target][symbol].push(src);
                }
            }
        }

        // epsilon transitions from new start state to all accept states of the original NFA
        newTable[newStartState] = { "~": Array.from(this.acceptStates) };

        return new NFA(newStartState, [this.startState], newTable);
    }

    trashStatesRemoved(): NFA {
        const reversed = this.reversed();
        const nonTrashStates = reversed.getReachableStates();
        nonTrashStates.delete(reversed.startState);
        // if start state is a trash state, the entire NFA is trash
        if (!nonTrashStates.has(this.startState)) {
            return new NFA(this.startState, [], {});
        }

        const newTable: NFATransitionTable = {};
        for (const state of nonTrashStates) {
            newTable[state] = {};
            for (const [symbol, targets] of Object.entries(this.table[state] ?? [])) {
                newTable[state][symbol] = targets.filter((t) => nonTrashStates.has(t));
            }
        }

        return new NFA(this.startState, Array.from(this.acceptStates), newTable);
    }

    trashStatesAdded(): NFA {
        const trashState = "∅";
        // basically all null transitions are replaced with transitions to trash state
        const newTable: NFATransitionTable = {};
        for (const state of this.states) {
            newTable[state] = {};
            for (const symbol of this.symbols) {
                newTable[state][symbol] = (!this.table[state]?.[symbol]?.length)
                    ? [trashState]
                    : this.table[state]?.[symbol] ?? [];
            }
            // include epsilon transitions if exist
            newTable[state]["~"] = this.table[state]?.["~"] ?? [];
        }

        // trash state transitions to itself for all symbols
        newTable[trashState] = {};
        for (const symbol of this.symbols) {
            newTable[trashState][symbol] = [trashState];
        }

        return new NFA(this.startState, Array.from(this.acceptStates), newTable);
    }

    getReachableStates(): Set<string> {
        const reachable = new Set<string>();
        const queue = new Queue<string>(Array.from(this.epsilonClosure(this.startState)));
        while (!queue.isEmpty()) {
            const state = queue.pop();
            if (reachable.has(state))
                continue;
            reachable.add(state);
            for (const transitions of Object.values(this.table[state] ?? [])) {
                for (const target of transitions) {
                    this.epsilonClosure(target).forEach((u) => queue.enqueue(u));
                }
            }
        }

        return reachable;
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
        return JSON.parse(JSON.stringify(this.table)) as NFATransitionTable;
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