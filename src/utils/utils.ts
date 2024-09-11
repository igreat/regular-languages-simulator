import type { DFAData } from "../app/DFAGraph";
import type { DFAJson } from "../simulator/dfa";
import * as d3 from "d3";

export function DFAJsonToDFAData(data: DFAJson): DFAData {
    const nodes: d3.SimulationNodeDatum[] = Array.from({ length: Object.keys(data.table).length }, () => ({}));
    const  nodeLabels: string[] = Object.keys(data.table);
    const links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[] = [];
    const linkLabels: string[] = [];
    for (const [source, targets] of Object.entries(data.table)) {
        for (const [symbol, target] of Object.entries(targets)) {
            links.push({ source: Number(source), target });
            linkLabels.push(symbol);
        }
    }

    return { nodes, links, nodeLabels, linkLabels, acceptStates: data.acceptStates };
}