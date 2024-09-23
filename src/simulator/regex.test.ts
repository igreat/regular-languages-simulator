import { Char, Concat, Union, Star, EmptyString, EmptySet, parseRegex } from "./regex";
import type { NFA } from "./nfa";

test("Regex '0' parsed correctly", () => {
    const regex = parseRegex("0");
    const target = new Char('0');

    expect(regex.equals(target)).toBe(true);
});

test("Regex '0|1' parsed correctly", () => {
    const regex = parseRegex("0|1");
    const target = new Union(new Char('0'), new Char('1'));

    expect(regex.equals(target)).toBe(true);
});

test("Regex '01' parsed correctly", () => {
    const regex = parseRegex("01");
    const target = new Concat(new Char('0'), new Char('1'));

    expect(regex.equals(target)).toBe(true);
});

test("Regex '0*' parsed correctly", () => {
    const regex = parseRegex("0*");
    const target = new Star(new Char('0'));

    expect(regex.equals(target)).toBe(true);
});

test("Regex '(0|1)0*' parsed correctly", () => {
    const regex = parseRegex("(0|1)0*");
    const target = new Concat(
        new Union(new Char('0'), new Char('1')),
        new Star(new Char('0'))
    );

    expect(regex.equals(target)).toBe(true);
});

test("Regex '0(1|0)*' parsed correctly", () => {
    const regex = parseRegex("0(1|0)*");
    const target = new Concat(
        new Char('0'),
        new Star(new Union(new Char('1'), new Char('0')))
    );

    expect(regex.equals(target)).toBe(true);
});

test("Regex '0(1|0)*1' parsed correctly", () => {
    const regex = parseRegex("0(1|0)*1");
    const target = new Concat(
        new Concat(
            new Char('0'),
            new Star(new Union(new Char('1'), new Char('0')))
        ),
        new Char('1')
    );

    expect(regex.equals(target)).toBe(true);
});

test("Regex '0(1|0)*1|0' parsed correctly", () => {
    const regex = parseRegex("0(1|0)*1|0");
    const target = new Union(
        new Concat(
            new Concat(
                new Char('0'),
                new Star(new Union(new Char('1'), new Char('0')))
            ),
            new Char('1')
        ),
        new Char('0')
    );

    expect(regex.equals(target)).toBe(true);
});

test("Regex '(0(1|0)*1|0)*(0|1)*' parsed correctly", () => {
    const regex = parseRegex("(0(1|0)*1|0)*(0|1)*");
    const target = new Concat(
        new Star(
            new Union(
                new Concat(
                    new Concat(
                        new Char('0'),
                        new Star(new Union(new Char('1'), new Char('0')))
                    ),
                    new Char('1')
                ),
                new Char('0')
            )
        ),
        new Star(new Union(new Char('0'), new Char('1')))
    );

    expect(regex.equals(target)).toBe(true);
});

test("Regex '(0(1|0)*1|0)∅' parsed correctly", () => {
    const regex = parseRegex("(0(1|0)*1|0)∅");
    const target = new Concat(
        new Union(
            new Concat(
                new Concat(
                    new Char('0'),
                    new Star(new Union(new Char('1'), new Char('0')))
                ),
                new Char('1')
            ),
            new Char('0')
        ),
        new EmptySet()
    );

    expect(regex.equals(target)).toBe(true);
});

test("Regex '0~*1|0∅' parsed correctly", () => {
    const regex = parseRegex("0~*1|0∅");
    const target = new Union(
        new Concat(
            new Concat(
                new Char('0'),
                new Star(new EmptyString())
            ),
            new Char('1')
        ),
        new Concat(
            new Char('0'),
            new EmptySet()
        )
    );

    expect(regex.equals(target)).toBe(true);
});

describe("Regex '0|1' converted to NFA", () => {
    let nfa: NFA;

    beforeAll(() => {
        const regex = parseRegex("0|1");
        nfa = regex.toNFA();
    });

    test("NFA accepts '0'", () => {
        expect(nfa.accepts("0")).toBe(true);
    });

    test("NFA accepts '1'", () => {
        expect(nfa.accepts("1")).toBe(true);
    });

    test("NFA does not accept '01'", () => {
        expect(nfa.accepts("01")).toBe(false);
    });

    test("NFA does not accept '10'", () => {
        expect(nfa.accepts("10")).toBe(false);
    });
});

describe("Regex '0*' converted to NFA", () => {
    let nfa: NFA;

    beforeAll(() => {
        const regex = parseRegex("0*");
        nfa = regex.toNFA();
    });

    test("NFA accepts ''", () => {
        expect(nfa.accepts("")).toBe(true);
    });

    test("NFA accepts '0'", () => {
        expect(nfa.accepts("0")).toBe(true);
    });

    test("NFA accepts '0000'", () => {
        expect(nfa.accepts("0000")).toBe(true);
    });

    test("NFA does not accept '1'", () => {
        expect(nfa.accepts("1")).toBe(false);
    });

    test("NFA does not accept '01'", () => {
        expect(nfa.accepts("01")).toBe(false);
    });
});

describe("Regex '010' converted to NFA", () => {
    let nfa: NFA;

    beforeAll(() => {
        const regex = parseRegex("010");
        nfa = regex.toNFA();
    });

    test("NFA accepts '010'", () => {
        expect(nfa.accepts("010")).toBe(true);
    });

    test("NFA does not accept '0'", () => {
        expect(nfa.accepts("0")).toBe(false);
    });

    test("NFA does not accept '1'", () => {
        expect(nfa.accepts("1")).toBe(false);
    });

    test("NFA does not accept '0010'", () => {
        expect(nfa.accepts("0010")).toBe(false);
    });
});

describe("Regex '(0|1)0*' converted to NFA", () => {
    let nfa: NFA;

    beforeAll(() => {
        const regex = parseRegex("(0|1)0*");
        nfa = regex.toNFA();
    });

    test("NFA accepts '0'", () => {
        expect(nfa.accepts("0")).toBe(true);
    });

    test("NFA accepts '1'", () => {
        expect(nfa.accepts("1")).toBe(true);
    });

    test("NFA accepts '00'", () => {
        expect(nfa.accepts("00")).toBe(true);
    });

    test("NFA accepts '1000000'", () => {
        expect(nfa.accepts("1000000")).toBe(true);
    });

    test("NFA does not accepts '101'", () => {
        expect(nfa.accepts("101")).toBe(false);
    });

    test("NFA does not accept '11'", () => {
        expect(nfa.accepts("11")).toBe(false);
    });

    test("NFA does not accept '01'", () => {
        expect(nfa.accepts("01")).toBe(false);
    });
});

describe("Regex '0(1|0)*' converted to NFA", () => {
    let nfa: NFA;

    beforeAll(() => {
        const regex = parseRegex("0(1|0)*");
        nfa = regex.toNFA();
    });

    test("NFA accepts '0'", () => {
        expect(nfa.accepts("0")).toBe(true);
    });

    test("NFA accepts '01'", () => {
        expect(nfa.accepts("01")).toBe(true);
    });

    test("NFA accepts '001101'", () => {
        expect(nfa.accepts("001101")).toBe(true);
    });

    test("NFA does not accept '1001101'", () => {
        expect(nfa.accepts("1001101")).toBe(false);
    });

    test("NFA does not accept '10'", () => {
        expect(nfa.accepts("10")).toBe(false);
    });
});