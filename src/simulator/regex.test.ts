import { Char, Concat, Union, Star, EmptyString, EmptySet, parseRegex } from "./regex";

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

    console.log(regex);
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