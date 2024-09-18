import { Queue } from "@datastructures-js/queue";
import { NFA } from "./nfa";

class DFA {
    private startState: string;
    private acceptStates: Set<string>;
    private table: DFATransitionTable;
    private symbols: Set<string>;

    constructor(startState: string, acceptStates: string[], table: DFATransitionTable) {
        this.startState = startState;
        this.acceptStates = new Set(acceptStates);
        this.table = table;
        this.symbols = new Set<string>();
        for (const transitions of Object.values(this.table)) {
            for (const symbol of Object.keys(transitions)) {
                this.symbols.add(symbol);
            }
        }
    }

    run(input: string, state: string): string | null {
        if (this.table[state] && input in this.table[state]) {
            return this.table[state][input] ?? null;
        }
        return null;
    }

    isAcceptState(state: string): boolean {
        return this.acceptStates.has(state);
    }

    accepts(input: string): boolean {
        let state = this.startState;
        for (const c of input) {
            const next = this.run(c, state);
            if (next != null) state = next;
        }
        return this.isAcceptState(state);
    }

    toNFA(): NFA {
        const table: Record<string, Record<string, string[]>> = {};
        for (const [state, transitions] of Object.entries(this.table)) {
            table[state] = {};
            for (const [symbol, target] of Object.entries(transitions)) {
                table[state][symbol] = [target];
            }
        }
        return new NFA(this.startState, Array.from(this.acceptStates), table);
    }

    // returns a minimized version of this DFA
    minimized(): DFA {
        const symbols = Array.from(this.symbols);
        const states = this.getReachableStates();
        const rejectStates = states;
        this.acceptStates.forEach((s) => rejectStates.delete(s));

        const belongsTo = new Map<string, number>();
        rejectStates.forEach((s) => belongsTo.set(s, 0));
        this.acceptStates.forEach((s) => belongsTo.set(s, 1));

        let currEquivs: string[][] = [Array.from(rejectStates), Array.from(this.acceptStates)];
        let prevEquivs: string[][] = [];

        do {
            prevEquivs = currEquivs;
            currEquivs = [];
            for (const equiv of prevEquivs) {
                const joined = Array(equiv.length).fill(false);
                for (let i = 0; i < equiv.length; i++) {
                    if (joined[i]) continue;
                    const newEquiv = [equiv[i]!];
                    for (let j = i + 1; j < equiv.length; j++) {
                        if (joined[j]) continue;
                        if (symbols.every((symbol) => {
                            const idI = equiv[i], idJ = equiv[j];
                            if (!idI || !idJ) return false;
                            const stateI = this.table[idI]?.[symbol];
                            const stateJ = this.table[idJ]?.[symbol];
                            if (!stateI || !stateJ) return false;
                            return belongsTo.get(stateI) == belongsTo.get(stateJ);
                        })) {
                            belongsTo.set(equiv[j]!, currEquivs.length);
                            newEquiv.push(equiv[j]!);
                            joined[j] = true;
                        }
                    }
                    joined[i] = true;
                    belongsTo.set(equiv[i]!, currEquivs.length);
                    currEquivs.push(newEquiv);
                }
            }
        } while (prevEquivs.length != currEquivs.length);

        let startState: string | null = null;
        const newTable: DFATransitionTable = {};
        for (const curr of currEquivs) {
            curr.sort();
            const srcKey = curr.join("-");
            if (curr.includes(this.startState)) {
                startState = srcKey;
            }
            const state = curr[0]!;
            newTable[srcKey] = {};
            for (const symbol of symbols) {
                const target = this.table[state]?.[symbol];
                if (!target) continue;
                const tgtId = belongsTo.get(target)!;
                const tgtList = currEquivs[tgtId]!.sort();
                const tgtKey = tgtList.join("-");
                if (tgtKey !== undefined) {
                    newTable[srcKey][symbol] = tgtKey;
                }
            }
        }

        const newAcceptStates = new Set<string>();
        for (const equiv of currEquivs) {
            if (equiv.some((state) => this.acceptStates.has(state))) {
                newAcceptStates.add(equiv[0]!);
            }
        }

        console.assert(startState != null);
        return new DFA(startState ?? "0", Array.from(newAcceptStates), newTable);
    }

    /* 
    relabels DFA in a consistent and efficient way such that structurally equivalent DFAs 
    will end up with equivalent labels
    */
    relabeled(): DFA {
        const newLabels = new Map<string, string>();
        const symbols = Array.from(this.symbols).sort();
        let curr = 0;
        const queue = new Queue<string>([this.startState]);
        const visited = new Set<string>();
        while (!queue.isEmpty()) {
            const state = queue.pop();
            if (visited.has(state))
                continue;
            visited.add(state);
            newLabels.set(state, curr.toString());
            curr++;

            for (const symbol of symbols) {
                const nextState = this.table[state]?.[symbol];
                if (nextState)
                    queue.push(nextState);
            }
        }

        const newTable: DFATransitionTable = {};
        for (const [src, transitions] of Object.entries(this.table)) {
            const srcLabel = newLabels.get(src)!;
            newTable[srcLabel] = {};
            for (const [symbol, target] of Object.entries(transitions)) {
                const tgtLabel = newLabels.get(target)!;
                newTable[srcLabel][symbol] = tgtLabel;
            }
        }

        const newStartState = newLabels.get(this.startState)!;
        const newAcceptStates = new Set<string>();
        this.acceptStates.forEach((state) => {
            newAcceptStates.add(newLabels.get(state)!);
        });

        return new DFA(newStartState, Array.from(newAcceptStates), newTable);
    }

    equals(other: DFA): boolean {
        const currentDfa = this.minimized().relabeled();
        const otherDfa = other.minimized().relabeled();
        const currentJson = currentDfa.toJSON();
        const otherJson = otherDfa.toJSON();
        return JSON.stringify(currentJson) === JSON.stringify(otherJson);
    }

    getStates(): string[] {
        return Object.keys(this.table);
    }

    // https://en.wikipedia.org/wiki/DFA_minimization
    getReachableStates(): Set<string> {
        const reachableStates = new Set<string>([this.startState]);
        let newStates = new Set<string>([this.startState]);
        do {
            const temp = new Set<string>();
            for (const state of newStates) {
                for (const symbol of this.symbols) {
                    const next = this.table[state]?.[symbol];
                    if (next) temp.add(next);
                }
            }
            newStates = temp;
            temp.forEach((state) => {
                if (reachableStates.has(state))
                    newStates.delete(state);
            });
            newStates.forEach((state) => reachableStates.add(state));
        } while (newStates.size != 0);

        return reachableStates;
    }

    getStartState(): string {
        return this.startState;
    }

    toJSON(): DFAJson {
        return {
            startState: this.startState,
            acceptStates: Array.from(this.acceptStates),
            table: this.table,
        };
    }
}

type DFATransitionTable = Record<string, Record<string, string>>;
type DFAJson = {
    startState: string,
    acceptStates: string[];
    table: DFATransitionTable;
};

export { DFA };
export type { DFATransitionTable, DFAJson };
