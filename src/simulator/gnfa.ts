import { NFA } from "./nfa";
import { Regex, Union, Concat, Star, EmptySet, EmptyString, Char } from "./regex";

class GNFA {
    private startState: string;
    private acceptState: string;
    private states: Set<string>;
    private table: GNFATransitionTable;

    constructor(startState: string, acceptState: string, table: GNFATransitionTable) {
        this.startState = startState;
        this.acceptState = acceptState;
        this.table = table;
        this.states = new Set<string>([startState, acceptState, ...Object.keys(table)]);
    }

    public static fromNFA(nfa: NFA): GNFA {
        const startState = "ST";
        const acceptState = "AC";

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

    reduced(to_remove?: string): GNFA {
        if (to_remove && !this.states.has(to_remove)) {
            throw new Error(`State '${to_remove}' does not exist`);
        }
        if (to_remove && (to_remove === this.startState || to_remove === this.acceptState)) {
            throw new Error(`Cannot remove start or accept state`);
        }

        if (!to_remove) {
            // find a state to remove
            for (const state of this.states) {
                if (state === this.startState || state === this.acceptState) continue;
                to_remove = state;
                break;
            }
            to_remove = to_remove!;
        }

        const table = this.getTable(); // deep copy
        const states = new Set<string>(this.states);
        states.delete(to_remove);
        const startState = this.startState;
        const acceptState = this.acceptState;

        // this should do one single reduction step, reducing the number of states exactly by 1
        for (const src of states) {
            if (src === acceptState) continue;
            for (const tgt of states) {
                if (tgt === startState) continue;

                const src_to_remove = table[src]![to_remove]!;             // src -> to_remove -> tgt
                const to_remove_to_remove = table[to_remove]![to_remove]!; // to_remove -> to_remove
                const src_tgt = table[src]![tgt]!;                         // src -> tgt
                const to_remove_tgt = table[to_remove]![tgt]!;             // to_remove -> tgt

                // src -> tgt = src -> to_remove -> tgt + src -> tgt
                table[src]![tgt] = (new Union(
                    new Concat(new Concat(src_to_remove, new Star(to_remove_to_remove)), to_remove_tgt),
                    src_tgt
                )).simplify();
            }
        }

        // remove to_remove from states
        delete table[to_remove];
        for (const src of states) {
            delete table[src]![to_remove];
        }

        return new GNFA(startState, acceptState, table);
    }

    getStates(): string[] {
        return [...this.states];
    }

    getStartState(): string {
        return this.startState;
    }

    getAcceptState(): string {
        return this.acceptState;
    }

    getTable(): GNFATransitionTable {
        const table: GNFATransitionTable = {};
        for (const [src, transitions] of Object.entries(this.table)) {
            table[src] = {};
            for (const [tgt, regex] of Object.entries(transitions)) {
                table[src][tgt] = regex;
            }
        }
        return table;
    }

    getRegexStrings() {
        const regexes: Record<string, Record<string, string>> = {};
        for (const src of this.states) {
            for (const tgt of this.states) {
                if (!this.table[src] || !this.table[src][tgt]) continue;
                const regex = this.table[src][tgt];
                if (!(regex instanceof EmptySet)) {
                    regexes[src] = regexes[src] || {};
                    regexes[src][tgt] = regex.toString();
                }
            }
        }
        return regexes;
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