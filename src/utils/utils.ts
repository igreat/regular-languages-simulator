import type { DFAData } from "../app/DFAGraph";
import type { DFAJson } from "../simulator/dfa";
import * as d3 from "d3";

export function DFAJsonToDFAData(data: DFAJson): DFAData {
    let nodes: d3.SimulationNodeDatum[] = Array.from({ length: Object.keys(data.table).length }, () => ({}));
    let nodeLabels: string[] = Object.keys(data.table);
    let links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[] = [];
    let linkLabels: string[] = [];
    for (const [source, targets] of Object.entries(data.table)) {
        for (const [symbol, target] of Object.entries(targets)) {
            links.push({ source: Number(source), target });
            linkLabels.push(symbol);
        }
    }

    return { nodes, links, nodeLabels, linkLabels, acceptStates: data.acceptStates };
}