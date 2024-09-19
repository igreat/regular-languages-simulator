import { NFA } from "./nfa";
import { Regex, Union, Concat, Star, EmptySet, EmptyString, Char } from "./regex";

class GNFA {
    private startState: string;
    private acceptState: string;
    private table: GNFATransitionTable;

    constructor(startState: string, acceptState: string, table: GNFATransitionTable) {
        this.startState = startState;
        this.acceptState = acceptState;
        this.table = table;
    }

    public static fromNFA(nfa: NFA): GNFA {
        const startState = "start";
        const acceptState = "accept";

        if (nfa.getStates().includes(startState)) {
            throw new Error(`Start state name '${startState}' is already used`);
        }
        if (nfa.getStates().includes(acceptState)) {
            throw new Error(`Accept state name '${acceptState}' is already used`);
        }

        const table: GNFATransitionTable = {};

        // Initialize transitions to EmptySet
        for (const src of nfa.getStates()) {
            table[src] = {};
            for (const tgt of nfa.getStates()) {
                table[src][tgt] = new EmptySet();
            }
        }

        // Transform NFA transitions
        for (const src of nfa.getStates()) {
            for (const [symbol, tgts] of Object.entries(nfa.getTable()[src]!)) {
                const regex = symbol === "~" ? new EmptyString() : new Char(symbol);
                for (const tgt of tgts) {
                    if (table[src]![tgt] instanceof EmptySet) {
                        table[src]![tgt] = regex;
                    } else {
                        table[src]![tgt] = new Union(table[src]![tgt]!, regex);
                    }
                }
            }
        }

        // Set up start state transitions
        table[startState] = { [nfa.getStartState()]: new EmptyString() };
        for (const src of nfa.getStates()) {
            if (src === nfa.getStartState()) continue;
            table[startState][src] = new EmptySet();
        }
        table[startState][acceptState] = new EmptySet();

        // Set up accept state transitions
        table[acceptState] = {};
        for (const src of nfa.getStates()) {
            table[src]![acceptState] = new EmptySet();
        }
        for (const accept of nfa.getAcceptStates()) {
            table[accept]![acceptState] = new EmptyString();
        }

        return new GNFA(startState, acceptState, table);
    }

    toJSON(): GNFAJson {
        return {
            startState: this.startState,
            acceptState: this.acceptState,
            table: this.table
        };
    }
}


// very different from NFATransitionTable:
// here, table[src][tgt] gives a single regex
type GNFATransitionTable = Record<string, Record<string, Regex>>;

type GNFAJson = {
    startState: string,
    acceptState: string,
    table: GNFATransitionTable;
};

export { GNFA };