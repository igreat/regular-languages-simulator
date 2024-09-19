import { NFA, NFATransitionTable } from "./nfa";

abstract class Regex {
    abstract match(input: string): boolean; // not necessary for now
    abstract equals(other: Regex): boolean;
}

class Concat extends Regex {
    constructor(public left: Regex, public right: Regex) {
        super();
    }

    match(input: string): boolean {
        return true;
    }

    equals(other: Regex): boolean {
        return other instanceof Concat
            && this.left.equals(other.left)
            && this.right.equals(other.right);
    }
}

class Union extends Regex {
    constructor(public left: Regex, public right: Regex) {
        super();
    }

    match(input: string): boolean {
        return true;
    }

    equals(other: Regex): boolean {
        return other instanceof Union
            && this.left.equals(other.left)
            && this.right.equals(other.right);
    }
}

class Star extends Regex {
    constructor(public inner: Regex) {
        super();
    }

    match(input: string): boolean {
        return true;
    }

    equals(other: Regex): boolean {
        return other instanceof Star
            && this.inner.equals(other.inner);
    }
}

class Char extends Regex {
    constructor(public value: string | "~") {
        super();
    }

    match(input: string): boolean {
        return true;
    }

    equals(other: Regex): boolean {
        return other instanceof Char
            && this.value === other.value;
    }
}

class EmptyString extends Regex {
    match(input: string): boolean {
        return input.length === 0;
    }

    equals(other: Regex): boolean {
        return other instanceof EmptyString;
    }
}

class EmptySet extends Regex {
    match(_input: string): boolean {
        return false; // Empty never matches anything
    }

    equals(other: Regex): boolean {
        return other instanceof EmptySet;
    }
}

function parseRegex(input: string): Regex {
    input = insertImplicitConcats(input);
    console.log(input);

    let operations: string[] = [];
    let operands: Regex[] = [];
    for (let i = 0; i < input.length; i++) {
        switch (input[i]) {
            case "*":
                operands.push(new Star(operands.pop()!));
                break;
            case ")":
                while (operations.length > 0 && operations.at(-1) !== "(") {
                    let operation = operations.pop()!;
                    console.assert(operation === "|", "Expected union operation");
                    let right = operands.pop()!;
                    operands.push(new Union(operands.pop()!, right));
                }
                operations.pop(); // remove the last (
                break;
            case "(":
                operations.push(input[i]!);
                break;
            case "|":
            case "^":
                processConcat(operands, operations);
                operations.push(input[i]!);
                break;
            case "~":
                operands.push(new EmptyString());
                break;
            case "∅":
                operands.push(new EmptySet());
                break;
            default:
                operands.push(new Char(input[i]!));
        }
    }

    processConcat(operands, operations);

    // what's left is necessarily a sequence of unions (all concatenations have been processed)
    let final_expression = operands.pop()!;
    while (operands.length > 0) {
        let left = operands.pop()!;
        final_expression = new Union(left, final_expression);
    }

    return final_expression;
}

function processConcat(operands: Regex[], operations: string[]): void {
    if (operations.length == 0 || operations.at(-1) !== "^")
        return;

    // useful because I always want to immediately concatenate
    let right = operands.pop()!;
    let left = operands.pop()!;
    if (left instanceof Char && left.value === "~") {
        operands.push(right);
    } else {
        operands.push(new Concat(left, right));
    }
    operations.pop();
}

function insertImplicitConcats(input: string): string {
    let output: string[] = [];
    for (let i = 0; i < input.length; i++) {
        output.push(input[i]!);
        if (i < input.length - 1 &&
            input[i] !== "|" && input[i + 1] !== "|" &&
            input[i + 1] !== "*" &&
            input[i] !== "(" && input[i + 1] !== ")") {
            output.push("^");
        }
    }
    return output.join("");
}

export { Regex, Char, Concat, Union, Star, EmptyString, EmptySet, parseRegex };