import { DFA } from "./dfa";
import { NFA } from "./nfa";
import type { NFAJson } from "./nfa";

describe("Loading and saving NFA", () => {
    let nfa: NFA;
    let jsonString: string;
    beforeAll(() => {
        nfa = new NFA("0", ["1", "3"], {
            "0": { "~": ["1", "3"] },
            "1": { "0": ["2"], "1": ["1"] },
            "2": { "0": ["1"], "1": ["2"] },
            "3": { "0": ["3"], "1": ["4"] },
            "4": { "0": ["4"], "1": ["3"] }
        })

        jsonString = `{
            "startState": "0",
            "acceptStates": ["1", "3"],
            "table": {
                "0": { "~": ["1", "3"] },
                "1": { "0": ["2"], "1": ["1"] },
                "2": { "0": ["1"], "1": ["2"] },
                "3": { "0": ["3"], "1": ["4"] },
                "4": { "0": ["4"], "1": ["3"] }
            }
        }`;
    });

    test("Load NFA from JSON string", () => {
        const json = JSON.parse(jsonString) as NFAJson;
        const nfa = new NFA(json.startState, json.acceptStates, json.table);

        expect(nfa.getStartState()).toBe("0");
        expect(nfa.accepts("")).toBe(true);
        expect(nfa.accepts("010")).toBe(true);
        expect(nfa.accepts("101")).toBe(true);
        expect(nfa.accepts("1010")).toBe(true);
        expect(nfa.accepts("01")).toBe(false);
    });

    test("Serialize NFA to JSON string", () => {
        expect(
            JSON.stringify(nfa.toJSON()).replace(/\s/g, ""))
            .toBe(jsonString.replace(/\s/g, "")
            );
    });
});

describe("NFA that determines if input contains an even number of 0s or an even number of 1s", () => {
    let nfa: NFA;

    beforeAll(() => {
        nfa = new NFA("0", ["1", "3"], {
            "0": { "~": ["1", "3"] },
            "1": { "0": ["2"], "1": ["1"] },
            "2": { "0": ["1"], "1": ["2"] },
            "3": { "0": ["3"], "1": ["4"] },
            "4": { "0": ["4"], "1": ["3"] }
        })
    });

    test("Initial epislon transition sends to states 0, 1 and 3", () => {
        expect(Array.from(nfa.epsilonClosure("0")).sort()).toEqual(["0", "1", "3"]);
    });

    test("Input of 01 gives ends at states 2, 4", () => {
        const iter = nfa.simulation("01");
        let curr = iter.next();
        curr = iter.next();
        curr = iter.next();
        expect(curr.value).toBeInstanceOf(Array);
        expect((curr.value as string[]).sort()).toEqual(["2", "4"]);
    });

    test("Input of 010 gives ends at states 1, 4", () => {
        const iter = nfa.simulation("010");
        let curr = iter.next();
        curr = iter.next();
        curr = iter.next();
        curr = iter.next();
        expect(curr.value).toBeInstanceOf(Array);
        expect((curr.value as string[]).sort()).toEqual(["1", "4"]);
    });

    test("Accepts empty string", () => {
        expect(nfa.accepts("")).toBe(true);
    });

    test("Accepts 010", () => {
        expect(nfa.accepts("010")).toBe(true);
    });

    test("Accepts 101", () => {
        expect(nfa.accepts("101")).toBe(true);
    });

    test("Accepts 1010", () => {
        expect(nfa.accepts("1010")).toBe(true);
    });

    test("Does not accept 01", () => {
        expect(nfa.accepts("01")).toBe(false);
    });

    test("Does not accept 0010", () => {
        expect(nfa.accepts("10")).toBe(false);
    });
});

describe("Convert NFA that accepts strings ending with 'ab' to equivalent DFA", () => {
    let nfa: NFA;
    let generated_dfa: DFA;
    let target_dfa: DFA;

    beforeAll(() => {
        nfa = new NFA("0", ["2"], {
            "0": { a: ["0", "1"], b: ["0"] },
            "1": { b: ["2"] },
            "2": {}
        });

        generated_dfa = nfa.toDFA();

        target_dfa = new DFA("0", ["0,2", "0,2,∅"], {
            "0": { a: "0,1", b: "0" },
            "0,1": { a: "0,1,∅", b: "0,2" },
            "0,1,∅": { a: "0,1,∅", b: "0,2,∅" },
            "0,2": { a: "0,1,∅", b: "0,∅" },
            "0,2,∅": { a: "0,1,∅", b: "0,∅" },
            "0,∅": { a: "0,1,∅", b: "0,∅" },
        });
});

test("Generated DFA structure matches the target DFA", () => {
    const generatedDFAJson = generated_dfa.toJSON();
    const targetDFAJson = target_dfa.toJSON();

    // Compare accepting states
    expect(generatedDFAJson.acceptStates.sort()).toEqual(targetDFAJson.acceptStates.sort());

    // Compare transition tables
    expect(generatedDFAJson.table).toEqual(targetDFAJson.table);
});

test("DFA correctly accepts strings ending with 'ab'", () => {
    const testCases = [
        { input: "ab", expected: true },
        { input: "aab", expected: true },
        { input: "aaab", expected: true },
        { input: "cab", expected: true },
        { input: "cabab", expected: true },
        { input: "abcab", expected: true },
        { input: "aabb", expected: false },
        { input: "aba", expected: false },
        { input: "aaba", expected: false },
        { input: "baba", expected: false },
        { input: "", expected: false },
        { input: "a", expected: false },
        { input: "b", expected: false },
        { input: "ba", expected: false },
        { input: "abab", expected: true },
        { input: "abbaab", expected: true },
        { input: "abbbab", expected: true },
        { input: "ababab", expected: true },
        { input: "ababa", expected: false }
    ];

    testCases.forEach(({ input, expected }) => {
        expect(generated_dfa.accepts(input)).toBe(expected);
    });
});

test("Generated DFA is equivalent to the target DFA", () => {
    // Helper function to generate all possible strings up to a certain length
    const generateStrings = (alphabet: string[], maxLength: number): string[] => {
        const results: string[] = [''];
        for (let length = 1; length <= maxLength; length++) {
            const newStrings: string[] = [];
            for (const str of results.slice(results.length - Math.pow(alphabet.length, length - 1))) {
                for (const char of alphabet) {
                    newStrings.push(str + char);
                }
            }
            results.push(...newStrings);
        }
        return results;
    };

    const alphabet = ['a', 'b'];
    const maxLength = 5; // Adjust as needed for thoroughness
    const allStrings = generateStrings(alphabet, maxLength);

    allStrings.forEach(str => {
        const generatedAccepts = generated_dfa.accepts(str);
        const targetAccepts = target_dfa.accepts(str);
        expect(generatedAccepts).toBe(targetAccepts);
    });
});
});

test("NFA is DFA", () => {
    const nfa = new NFA("0", ["3"], {
        "0": { a: ["1"], b: ["0"] },
        "1": { a: ["1"], b: ["2"] },
        "2": { a: ["3"], b: ["0"] },
        "3": { a: ["1"], b: ["2"] }
    });

    expect(nfa.isDFA()).toBe(true);
});

test("NFA is not DFA", () => {
    const nfa = new NFA("0", ["4"], {
        "0": { "~": ["1"], a: ["0"], b: ["0"] },
        "1": { a: ["2"] },
        "2": { b: ["3"] },
        "3": { a: ["4"] },
    });

    expect(nfa.isDFA()).toBe(false);
});


describe("Two NFAs that determine if input contains 'aba' suffix should be equal", () => {
    let nfa1: NFA;
    let nfa2: NFA;

    beforeAll(() => {
        nfa1 = new NFA("0", ["4"], {
            "0": { "~": ["1"], a: ["0"], b: ["0"] },
            "1": { a: ["2"] },
            "2": { b: ["3"] },
            "3": { a: ["4"] },
        });

        nfa2 = new NFA("0", ["3"], {
            "0": { a: ["1"], b: ["0"] },
            "1": { a: ["1"], b: ["2"] },
            "2": { a: ["3"], b: ["0"] },
            "3": { a: ["1"], b: ["2"] }
        });
    });

    test("Both NFAs should accept the same language", () => {
        expect(nfa1.equals(nfa2)).toBe(true);
    });
});


describe("NFA that determine if input contains 'aba' suffix should not be equal to 'bab' suffix", () => {
    let nfa1: NFA;
    let nfa2: NFA;

    beforeAll(() => {
        nfa1 = new NFA("0", ["3"], {
            "0": { a: ["0", "1"], b: ["0"] },
            "1": { b: ["2"] },
            "2": { a: ["3"] }
        });

        nfa2 = new NFA("0", ["3"], {
            "0": { a: ["0"], b: ["0", "1"] },
            "1": { a: ["2"] },
            "2": { b: ["3"] }
        });
    });

    test("NFAs should not accept the same language", () => {
        expect(nfa1.equals(nfa2)).toBe(false);
    });
});

