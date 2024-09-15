import type { DFAJson } from "~/simulator/dfa";
import type { NFAJson } from "~/simulator/nfa";
import { DFAJsonToGraphData, NFAJsonToGraphData, GraphData } from "./utils";

describe("DFAJsonToDFAData", () => {
    let json: DFAJson;
    let data: GraphData;
    beforeAll(() => {
        json = {
            acceptStates: [3],
            table: {
                0: { a: 1, b: 0 },
                1: { a: 1, b: 2 },
                2: { a: 3, b: 0 },
                3: { a: 1, b: 2 },
            },
        };
        data = DFAJsonToGraphData(json);
    });

    test("Correct number of nodes", () => {
        expect(data.nodes.length).toBe(4);
    });

    test("Correct node labels", () => {
        expect(data.nodeLabels).toEqual(["0", "1", "2", "3"]);
    });

    test("Correct link labels", () => {
        expect(data.linkLabels).toEqual(["a", "b", "a", "b", "a", "b", "a", "b"]);
    });

    test("Correct accept states", () => {
        expect(data.acceptStates).toEqual(new Set([3]));
    });

    test("Correct links", () => {
        expect(data.links).toEqual([
            { source: 0, target: 1 },
            { source: 0, target: 0 },
            { source: 1, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 3 },
            { source: 2, target: 0 },
            { source: 3, target: 1 },
            { source: 3, target: 2 },
        ]);
    });
});

describe("NFAJsonToGraphData", () => {
    let json: NFAJson;
    let data: GraphData;
    beforeAll(() => {
        json = {
            acceptStates: [1, 3],
            table: {
                0: { "~": [1, 3] },
                1: { "0": [2], "1": [1] },
                2: { "0": [1], "1": [2] },
                3: { "0": [3], "1": [4] },
                4: { "0": [4], "1": [3] },
            },
        };
        data = NFAJsonToGraphData(json);
    });

    test("Correct number of nodes", () => {
        expect(data.nodes.length).toBe(5);
    });

    test("Correct node labels", () => {
        expect(data.nodeLabels).toEqual(["0", "1", "2", "3", "4"]);
    });

    test("Correct link labels", () => {
        expect(data.linkLabels).toEqual(["~", "~", "0", "1", "0", "1", "0", "1", "0", "1"]);
    });

    test("Correct accept states", () => {
        expect(data.acceptStates).toEqual(new Set([1, 3]));
    });

    test("Correct links", () => {
        expect(data.links).toEqual([
            { source: 0, target: 1 },
            { source: 0, target: 3 },
            { source: 1, target: 2 },
            { source: 1, target: 1 },
            { source: 2, target: 1 },
            { source: 2, target: 2 },
            { source: 3, target: 3 },
            { source: 3, target: 4 },
            { source: 4, target: 4 },
            { source: 4, target: 3 },
        ]);
    });
});