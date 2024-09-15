import { NFA } from "./nfa";
import type { NFAJson } from "./nfa";

describe("Loading and saving DFA", () => {
    let nfa: NFA;
    let jsonString: string;
    beforeAll(() => {
        nfa = new NFA([1, 3], {
            0: { "~": [1, 3] },
            1: { "0": [2], "1": [1] },
            2: { "0": [1], "1": [2] },
            3: { "0": [3], "1": [4] },
            4: { "0": [4], "1": [3] }
        })

        jsonString = `{
            "acceptStates": [1, 3],
            "table": {
                "0": { "~": [1, 3] },
                "1": { "0": [2], "1": [1] },
                "2": { "0": [1], "1": [2] },
                "3": { "0": [3], "1": [4] },
                "4": { "0": [4], "1": [3] }
            }
        }`;
    });

    test("Load NFA from JSON string", () => {
        const json = JSON.parse(jsonString) as NFAJson;
        const nfa = new NFA(json.acceptStates, json.table);

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
        nfa = new NFA([1, 3], {
            0: { "~": [1, 3] },
            1: { "0": [2], "1": [1] },
            2: { "0": [1], "1": [2] },
            3: { "0": [3], "1": [4] },
            4: { "0": [4], "1": [3] }
        })
    });

    test("Initial epislon transition sends to states 0, 1 and 3", () => {
        expect(nfa.epsilonClosure(0).sort()).toEqual([0, 1, 3]);
    });

    test("Input of 01 gives ends at states 2, 4", () => {
        const iter = nfa.simulation("01");
        let curr = iter.next();
        curr = iter.next();
        curr = iter.next();
        expect(curr.value).toBeInstanceOf(Array);
        expect((curr.value as number[]).sort()).toEqual([2, 4]);
    });

    test("Input of 010 gives ends at states 1, 4", () => {
        const iter = nfa.simulation("010");
        let curr = iter.next();
        curr = iter.next();
        curr = iter.next();
        curr = iter.next();
        expect(curr.value).toBeInstanceOf(Array);
        expect((curr.value as number[]).sort()).toEqual([1, 4]);
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