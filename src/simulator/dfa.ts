class DFA {
    private acceptStates: Set<number>;
    private table: TransitionTable;

    constructor(acceptStates: number[], table: TransitionTable) {
        this.acceptStates = new Set(acceptStates);
        this.table = table;
    }

    run(input: string, state: number): number | null {
        if (this.table[state] && input in this.table[state]) {
            return this.table[state][input] ?? null;
        }
        return null;
    }

    isAcceptState(state: number): boolean {
        return this.acceptStates.has(state);
    }

    accepts(input: string): boolean {
        let state = 0;
        for (let c of input) {
            let next = this.run(c, state);
            if (next != null) state = next;
        }
        return this.isAcceptState(state);
    }

    toJSON(): DFAJson {
        return {
            acceptStates: Array.from(this.acceptStates),
            table: this.table,
        };
    }
}

type TransitionTable = {
    [key: number]: {
        [key: string]: number;
    };
};

type DFAJson = {
    acceptStates: number[];
    table: TransitionTable;
};

export { DFA };
export type { TransitionTable, DFAJson };
