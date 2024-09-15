import type { DFAJson } from "../simulator/dfa";
import { DFAJsonToGraphData, GraphData } from "./utils";

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
        expect(data.acceptStates).toEqual([3]);
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