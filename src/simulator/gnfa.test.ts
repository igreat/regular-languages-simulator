import { NFA } from "./nfa";
import { Regex, Union, Concat, Star, EmptySet, EmptyString, Char } from "./regex";
import { GNFA } from "./gnfa";

describe("NFA that accepts even number of 0s or even number of 1s converted to GNFA correctly", () => {
    let nfa: NFA;
    let targetGnfa: GNFA;
    let generatedGnfa: GNFA;

    beforeAll(() => {
        nfa = new NFA("0", ["1", "3"], {
            "0": { "~": ["1", "3"] },
            "1": { "0": ["2"], "1": ["1"] },
            "2": { "0": ["1"], "1": ["2"] },
            "3": { "0": ["3"], "1": ["4"] },
            "4": { "0": ["4"], "1": ["3"] }
        })

        generatedGnfa = GNFA.fromNFA(nfa);

        targetGnfa = new GNFA("start", "accept", {
            "start": {
                "0": new EmptyString(), "1": new EmptySet(),
                "2": new EmptySet(), "3": new EmptyString(),
                "4": new EmptySet(), "accept": new EmptySet()
            },
            "0": {
                "0": new EmptySet(), "1": new EmptyString(),
                "2": new EmptySet(), "3": new EmptyString(),
                "4": new EmptySet(), "accept": new EmptySet()
            },
            "1": {
                "0": new EmptySet(), "1": new Char('1'),
                "2": new Char('0'), "3": new EmptySet(),
                "4": new EmptySet(), "accept": new EmptyString()
            },
            "2": {
                "0": new EmptySet(), "1": new Char('0'),
                "2": new Char('1'), "3": new EmptySet(),
                "4": new EmptySet(), "accept": new EmptySet()
            },
            "3": {
                "0": new EmptySet(), "1": new EmptySet(),
                "2": new EmptySet(), "3": new Char('0'),
                "4": new Char('1'), "accept": new EmptyString()
            },
            "4": {
                "0": new EmptySet(), "1": new EmptySet(),
                "2": new EmptySet(), "3": new Char('1'),
                "4": new Char('0'), "accept": new EmptySet()
            },
            "accept": {},
        });
    });

    test("Generated GNFA is equivalent to target GNFA", () => {
        // convert to json
        const generatedJson = generatedGnfa.toJSON();
        const targetJson = targetGnfa.toJSON();        
        // compare json
        expect(generatedJson).toEqual(targetJson);
    });
});