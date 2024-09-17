class DFA {
    private acceptStates: Set<string>;
    private table: DFATransitionTable;

    constructor(acceptStates: string[], table: DFATransitionTable) {
        this.acceptStates = new Set(acceptStates);
        this.table = table;
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
    
    getStates(): string[] {
        return Object.keys(this.table);
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
