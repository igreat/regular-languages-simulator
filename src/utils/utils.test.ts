import type { NFAJson } from "~/simulator/nfa";
import type { GraphData } from "./utils";
import { getNodeToIndexMap, NFAJsonToGraphData } from "./utils";

describe("NFAJsonToGraphData", () => {
    let json: NFAJson;
    let data: GraphData;
    let nodeToIndex: Map<string, number>;
    beforeAll(() => {
        json = {
            acceptStates: ["1", "3"],
            table: {
                "0": { "~": ["1", "3"] },
                "1": { "0": ["2"], "1": ["1"] },
                "2": { "0": ["1"], "1": ["2"] },
                "3": { "0": ["3"], "1": ["4"] },
                "4": { "0": ["4"], "1": ["3"] },
            },
        };
        data = NFAJsonToGraphData(json);
        nodeToIndex = getNodeToIndexMap(json);
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
        expect(data.acceptStates).toEqual(new Set(["1", "3"]));
    });

    test("Correct links", () => {
        expect(data.links).toEqual([
            { source: nodeToIndex.get("0"), target: nodeToIndex.get("1") },
            { source: nodeToIndex.get("0"), target: nodeToIndex.get("3") },
            { source: nodeToIndex.get("1"), target: nodeToIndex.get("2") },
            { source: nodeToIndex.get("1"), target: nodeToIndex.get("1") },
            { source: nodeToIndex.get("2"), target: nodeToIndex.get("1") },
            { source: nodeToIndex.get("2"), target: nodeToIndex.get("2") },
            { source: nodeToIndex.get("3"), target: nodeToIndex.get("3") },
            { source: nodeToIndex.get("3"), target: nodeToIndex.get("4") },
            { source: nodeToIndex.get("4"), target: nodeToIndex.get("4") },
            { source: nodeToIndex.get("4"), target: nodeToIndex.get("3") },
        ]);
    });
});