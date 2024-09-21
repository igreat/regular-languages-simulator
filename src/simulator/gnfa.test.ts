import { NFA } from "./nfa";
import { Regex, Union, Concat, Star, EmptySet, EmptyString, Char, parseRegex } from "./regex";
import { GNFA } from "./gnfa";

describe("NFA that accepts even number of 0s or even number of 1s converted to GNFA correctly", () => {
    let nfa: NFA;
    let targetGnfa: GNFA;
    let generatedGnfa: GNFA;

    beforeAll(() => {
        nfa = new NFA("0", ["1", "3"], {
            "0": { "~": ["1", "3"] },
            "1": { "0": ["2"], "1": ["1", "2"] },
            "2": { "0": ["1"], "1": ["2"] },
            "3": { "0": ["3"], "1": ["4"] },
            "4": { "0": ["4"], "1": ["3"] }
        })

        generatedGnfa = GNFA.fromNFA(nfa);

        targetGnfa = new GNFA("ST", "AC", {
            "ST": {
                "0": new EmptyString(), "1": new EmptySet(),
                "2": new EmptySet(), "3": new EmptySet(),
                "4": new EmptySet(), "AC": new EmptySet()
            },
            "0": {
                "0": new EmptySet(), "1": new EmptyString(),
                "2": new EmptySet(), "3": new EmptyString(),
                "4": new EmptySet(), "AC": new EmptySet()
            },
            "1": {
                "0": new EmptySet(), "1": new Char('1'),
                "2": new Union(new Char('0'), new Char('1')), "3": new EmptySet(),
                "4": new EmptySet(), "AC": new EmptyString()
            },
            "2": {
                "0": new EmptySet(), "1": new Char('0'),
                "2": new Char('1'), "3": new EmptySet(),
                "4": new EmptySet(), "AC": new EmptySet()
            },
            "3": {
                "0": new EmptySet(), "1": new EmptySet(),
                "2": new EmptySet(), "3": new Char('0'),
                "4": new Char('1'), "AC": new EmptyString()
            },
            "4": {
                "0": new EmptySet(), "1": new EmptySet(),
                "2": new EmptySet(), "3": new Char('1'),
                "4": new Char('0'), "AC": new EmptySet()
            },
            "AC": {},
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

describe("NFA that checks if string has a 'b' correctly reduces after removing one state", () => {
    let nfa: NFA;
    let gnfa: GNFA;
    let reducedGnfa1: GNFA;
    let reducedGnfa2: GNFA;

    beforeAll(() => {
        nfa = new NFA("1", ["2"], {
            "1": { a: ["1"], b: ["2"] },
            "2": { a: ["2"], b: ["2"] }
        });

        gnfa = GNFA.fromNFA(nfa);
        reducedGnfa1 = gnfa.reduced("2");
        reducedGnfa2 = reducedGnfa1.reduced("1");
    });

    test("Reduced GNFA after removing state '2' is correct", () => {
        const targetRegexes = {
            "1": {
                "1": "a",
                "AC": "(b(a|b)*)",
            },
            "ST": {
                "1": "~",
            }
        }
        expect(reducedGnfa1.getRegexStrings()).toEqual(targetRegexes);
    });

    test("Reduced GNFA after removing state '2' then '1' is correct", () => {
        const targetRegexes = {
            "ST": {
                "AC": "(a*b(a|b)*)",
            }
        }
        expect(reducedGnfa2.getRegexStrings()).toEqual(targetRegexes);
    });

});

test("Regex '(a|((b|c)|d))' prints as '(a|b|c|d)'", () => {
    const regexStr = parseRegex("(a|((b|c)|d))").simplify().toString();
    const targetStr = "(a|b|c|d)";
    expect(regexStr).toEqual(targetStr);
})