import { NFA } from "./nfa";

class DFA {
    private acceptStates: Set<string>;
    private table: DFATransitionTable;
    private symbols: Set<string>;

    constructor(acceptStates: string[], table: DFATransitionTable) {
        this.acceptStates = new Set(acceptStates);
        this.table = table;
        console.assert("0" in this.table);
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
        let state = "0";
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
        return new NFA(Array.from(this.acceptStates), table);
    }

    // returns a minimized version of this DFA
    // https://en.wikipedia.org/wiki/DFA_minimization
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

        // TODO: allow start state to have a customizable name saved within the json
        // for now I explicitly change start state to "0"
        const newTable: DFATransitionTable = {};
        // for (let i = 0; i < currEquivs.length; i++) {
        for (const curr of currEquivs) {
            curr.sort();
            // TODO: hacky way of forcing the start state to be "0", fix this after refactoring
            const srcKey = curr.includes("0") ? "0" : curr.join(",");
            const state = curr[0]!;
            newTable[srcKey] = {};
            for (const symbol of symbols) {
                const target = this.table[state]?.[symbol];
                if (!target) continue;
                const tgtId = belongsTo.get(target)!;
                const tgtList = currEquivs[tgtId]!.sort();
                // TODO: hacky way of forcing the start state to be "0", fix this after refactoring
                const tgtKey = tgtList.includes("0") ? "0" : tgtList.join(",");
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
        
        return new DFA(Array.from(newAcceptStates), newTable);
    }

    getStates(): string[] {
        return Object.keys(this.table);
    }

    getReachableStates(): Set<string> {
        const reachableStates = new Set<string>("0");
        let newStates = new Set<string>("0");
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

    toJSON(): DFAJson {
        return {
            acceptStates: Array.from(this.acceptStates),
            table: this.table,
        };
    }
}

type DFATransitionTable = Record<string, Record<string, string>>;
type DFAJson = {
    acceptStates: string[];
    table: DFATransitionTable;
};

export { DFA };
export type { DFATransitionTable, DFAJson };
