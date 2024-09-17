import { DFA } from "./dfa";
import type { DFAJson } from "./dfa";
import { NFA } from "./nfa";

describe("Loading and saving DFA", () => {
    let dfa: DFA;
    let jsonString: string;
    beforeAll(() => {
        dfa = new DFA(["3"], {
            "0": { a: "1", b: "0" },
            "1": { a: "1", b: "2" },
            "2": { a: "3", b: "0" },
            "3": { a: "1", b: "2" }
        });

        jsonString = `{
            "acceptStates": ["3"],
            "table": {
                "0": { "a": "1", "b": "0" },
                "1": { "a": "1", "b": "2" },
                "2": { "a": "3", "b": "0" },
                "3": { "a": "1", "b": "2" }
            }
        }`;
    });

    test("Load DFA from JSON string", () => {
        const json = JSON.parse(jsonString) as DFAJson;
        const dfa = new DFA(json.acceptStates, json.table);

        expect(dfa.accepts("aba")).toBe(true);
        expect(dfa.accepts("abaa")).toBe(false);
    });

    test("Serialize DFA to JSON string", () => {
        expect(
            JSON.stringify(dfa.toJSON()).replace(/\s/g, ""))
            .toBe(jsonString.replace(/\s/g, "")
            );
    });
});


describe("Even DFA", () => {
    let dfa: DFA;

    beforeAll(() => {
        dfa = new DFA(["0"], {
            "0": { a: "1" },
            "1": { a: "0" },
        });
    });

    test("Transitions from 0 to 1 and 1 to 0", () => {
        expect(dfa.run("a", "0")).toBe("1");
        expect(dfa.run("a", "1")).toBe("0");
    });

    test("Accepts empty string", () => {
        expect(dfa.accepts("")).toBe(true);
    });

    test("Accepts 6 a's", () => {
        expect(dfa.accepts("aaaaaa")).toBe(true);
    });

    test("Does not accept 7 a's", () => {
        expect(dfa.accepts("aaaaaaa")).toBe(false);
    });

    test("Does not accept b", () => {
        expect(dfa.run("b", "0")).toBeNull();
    });

});

describe("DFA that accepts any 'aba' suffix", () => {
    let dfa: DFA;

    beforeAll(() => {
        dfa = new DFA(["3"], {
            "0": { a: "1", b: "0" },
            "1": { a: "1", b: "2" },
            "2": { a: "3", b: "0" },
            "3": { a: "1", b: "2" }
        });
    });

    test("Accepts aba", () => {
        expect(dfa.accepts("aba")).toBe(true);
    });

    test("Accepts aaba", () => {
        expect(dfa.accepts("aaba")).toBe(true);
    });

    test("Accepts aaaba", () => {
        expect(dfa.accepts("aaaba")).toBe(true);
    });

    test("Does not accept aab", () => {
        expect(dfa.accepts("aab")).toBe(false);
    });

    test("Does not accept abab", () => {
        expect(dfa.accepts("abab")).toBe(false);
    });
});

describe("DFA converts to equivalent NFA", () => {
    let dfa: DFA;
    let generated_nfa: NFA;
    let target_nfa: NFA;

    beforeAll(() => {
        dfa = new DFA(["0"], {
            "0": { a: "1" },
            "1": { a: "0" },
        });

        generated_nfa = dfa.toNFA();

        target_nfa = new NFA(["0"], {
            "0": { a: ["1"] },
            "1": { a: ["0"] },
        });
    });

    test("Generated NFA structure matches the target NFA", () => {
        const generatedNFAJson = generated_nfa.toJSON();
        const targetNFAJson = target_nfa.toJSON();

        // Compare accepting states
        expect(generatedNFAJson.acceptStates.sort()).toEqual(targetNFAJson.acceptStates.sort());

        // Compare transition tables
        expect(generatedNFAJson.table).toEqual(targetNFAJson.table);
    });

    test("NFA correctly accepts the same strings as the DFA", () => {
        const testCases = [
            { input: "", expected: true },    // DFA accepts the empty string
            { input: "a", expected: false },  // "a" leads to state "1" (non-accepting)
            { input: "aa", expected: true },  // "aa" leads back to state "0" (accepting)
            { input: "aaa", expected: false }, // "aaa" leads to state "1" (non-accepting)
            { input: "aaaa", expected: true }, // "aaaa" leads back to state "0" (accepting)
        ];

        testCases.forEach(({ input, expected }) => {
            const nfaResult = generated_nfa.accepts(input);
            const dfaResult = dfa.accepts(input);
            expect(nfaResult).toBe(expected);
            expect(dfaResult).toBe(expected);
        });
    });

    test("Generated NFA accepts the same language as the target NFA", () => {
        const testCases = [
            { input: "", expected: true },
            { input: "a", expected: false },
            { input: "aa", expected: true },
            { input: "aaa", expected: false },
            { input: "aaaa", expected: true },
            { input: "aaaaa", expected: false },
            { input: "aaaaaa", expected: true },
        ];

        testCases.forEach(({ input, expected }) => {
            const generatedAccepts = generated_nfa.accepts(input);
            const targetAccepts = target_nfa.accepts(input);
            expect(generatedAccepts).toBe(targetAccepts);
            expect(targetAccepts).toBe(expected);
        });
    });
});

describe("DFA minimizes to correct DFA 1", () => {
    let initialDfa: DFA;
    let minimizedDfa: DFA;
    beforeAll(() => {
        initialDfa = new DFA(["4"], {
            "0": { "0": "1", "1": "2" },
            "1": { "0": "1", "1": "3" },
            "2": { "0": "1", "1": "2" },
            "3": { "0": "1", "1": "4" },
            "4": { "0": "1", "1": "2" }
        })

        minimizedDfa = initialDfa.minimized();
    });

    test("Minimized DFA should have 4 states", () => {
        expect(minimizedDfa.getStates().length).toEqual(4);
    })

    // few tests
    test("Minimized DFA should accept same strings as the initial DFA", () => {
        const testCases = [
            "", "0", "1", "00", "01", "10", "11", "000", "001", "010", "011", "100", "101", "110", "111",
            "0000", "0001", "0010", "0011", "0100", "0101", "0110", "0111", "1000", "1001", "1010", "1011", 
            "1100", "1101", "1110", "1111"
        ]

        testCases.forEach((input) => {
            const initialAccepts = initialDfa.accepts(input);
            const minimizedAccepts = minimizedDfa.accepts(input);
            expect(minimizedAccepts).toBe(initialAccepts);
        });
    });
});

describe("DFA minimizes to correct DFA 1", () => {
    let initialDfa: DFA;
    let minimizedDfa: DFA;
    beforeAll(() => {
        initialDfa = new DFA(["2"], {
            "0": { "0": "1", "1": "5" },
            "1": { "0": "6", "1": "2" },
            "2": { "0": "0", "1": "2" },
            "3": { "0": "2", "1": "6" },
            "4": { "0": "7", "1": "5" },
            "5": { "0": "2", "1": "6" },
            "6": { "0": "6", "1": "4" },
            "7": { "0": "6", "1": "2" },
        })

        minimizedDfa = initialDfa.minimized();
    });

    test("Minimized DFA should have 5 states", () => {
        expect(minimizedDfa.getStates().length).toEqual(5);
    });

    // few tests
    test("Minimized DFA should accept same strings as the initial DFA", () => {
        const testCases = [
            "", "0", "1", "00", "01", "10", "11", "000", "001", "010", "011", "100", "101", "110", "111",
            "0000", "0001", "0010", "0011", "0100", "0101", "0110", "0111", "1000", "1001", "1010", "1011", 
            "1100", "1101", "1110", "1111"
        ]

        testCases.forEach((input) => {
            const initialAccepts = initialDfa.accepts(input);
            const minimizedAccepts = minimizedDfa.accepts(input);
            expect(minimizedAccepts).toBe(initialAccepts);
        });
    });
});