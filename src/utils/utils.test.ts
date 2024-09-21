import type { NFAJson } from "~/simulator/nfa";
import type { GraphData } from "./utils";
import { GNFAJsonToGraphData, NFAJsonToGraphData } from "./utils";
import type { GNFAJson } from "~/simulator/gnfa";

describe("NFAJsonToGraphData", () => {
    let json: NFAJson;
    let data: GraphData;
    beforeAll(() => {
        json = {
            startState: "0",
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
            { source: data.nodeToIndex.get("0"), target: data.nodeToIndex.get("1") },
            { source: data.nodeToIndex.get("0"), target: data.nodeToIndex.get("3") },
            { source: data.nodeToIndex.get("1"), target: data.nodeToIndex.get("2") },
            { source: data.nodeToIndex.get("1"), target: data.nodeToIndex.get("1") },
            { source: data.nodeToIndex.get("2"), target: data.nodeToIndex.get("1") },
            { source: data.nodeToIndex.get("2"), target: data.nodeToIndex.get("2") },
            { source: data.nodeToIndex.get("3"), target: data.nodeToIndex.get("3") },
            { source: data.nodeToIndex.get("3"), target: data.nodeToIndex.get("4") },
            { source: data.nodeToIndex.get("4"), target: data.nodeToIndex.get("4") },
            { source: data.nodeToIndex.get("4"), target: data.nodeToIndex.get("3") },
        ]);
    });
});

describe("GNFAJsonToGraphData", () => {
    let json: GNFAJson;
    let data: GraphData;
    beforeAll(() => {
        json = {
            startState: "ST",
            acceptState: "AC",
            table: {
                "0": { "1": "~", "3": "~" },
                "1": { "1": "1", "2": "(0|1)", AC: "~" },
                "2": { "1": "0", "2": "1" },
                "3": { "3": "0", "4": "1", AC: "~" },
                "4": { "3": "1", "4": "0" },
                ST: { "0": "~" },
            },
        };

        data = GNFAJsonToGraphData(json);
    });

    test("Correct number of nodes", () => {
        expect(data.nodes.length).toBe(7);
    });

    test("Correct node labels", () => {
        expect(data.nodeLabels.sort()).toEqual(["AC", "0", "1", "2", "3", "4", "ST"].sort());
    });

    test("Correct link labels", () => {
        expect(data.linkLabels.sort()).toEqual([
            "(0|1)",
            "0", "0", "0",
            "1", "1", "1", "1",
            "~", "~", "~", "~", "~"
        ].sort());
    });
});