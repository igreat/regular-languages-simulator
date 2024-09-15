import type { DFAJson } from "../simulator/dfa";
import type { NFAJson } from "~/simulator/nfa";
import type * as d3 from "d3";

export type GraphData = {
    nodes: d3.SimulationNodeDatum[];
    links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[];
    nodeLabels: string[];
    linkLabels: string[];
    acceptStates?: Set<number>;
};

export function DFAJsonToGraphData(data: DFAJson): GraphData {
    const nodes: d3.SimulationNodeDatum[] = Array.from({ length: Object.keys(data.table).length }, () => ({}));
    const nodeLabels: string[] = Object.keys(data.table);
    const links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[] = [];
    const linkLabels: string[] = [];
    for (const [source, targets] of Object.entries(data.table)) {
        for (const [symbol, target] of Object.entries(targets)) {
            links.push({ source: Number(source), target });
            linkLabels.push(symbol);
        }
    }

    return { nodes, links, nodeLabels, linkLabels, acceptStates: new Set(data.acceptStates) };
}

export function curvePath(d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>) {
    const src = d.source as d3.SimulationNodeDatum;
    const tgt = d.target as d3.SimulationNodeDatum;

    const x1 = src.x ?? 0;
    const y1 = src.y ?? 0;
    const x2 = tgt.x ?? 0;
    const y2 = tgt.y ?? 0;

    if (src.index === tgt.index) {
        const direction = ((x1 > 0 ? -1 : 1) * Math.PI) / 4;
        const [x1Rotated, y1Rotated] = rotatePoint(x1 + 16, y1 + 16, x1, y1, direction);
        const [x2Rotated, y2Rotated] = rotatePoint(x1 + 16, y1 + 16, x1, y1, direction + Math.PI / 3);
        return `M ${x1Rotated} ${y1Rotated} A ${18} ${18} ${0} ${1} ${1} ${x2Rotated} ${y2Rotated}`;
    }

    const sourceRadius = 21;
    const targetRadius = 25;

    const orientation = getOrientation(x1, y1, x2, y2);
    const [x1Outer, y1Outer, x2Outer, y2Outer] = getOuterPoints(x1, y1, x2, y2, sourceRadius, targetRadius);
    const [x1Rotated, y1Rotated] = rotatePoint(x1Outer, y1Outer, x1, y1, orientation * Math.PI / 5);
    const [x2Rotated, y2Rotated] = rotatePoint(x2Outer, y2Outer, x2, y2, -orientation * Math.PI / 5);
    const [controlX, controlY] = getControlPoint(x1Rotated, y1Rotated, x2Rotated, y2Rotated);

    return `M ${x1Rotated} ${y1Rotated} Q ${controlX} ${controlY} ${x2Rotated} ${y2Rotated}`;
}

export function getOrientation(x1: number, y1: number, x2: number, y2: number) {
    if (x1 < x2 && y1 < y2) return 1;
    if (x1 < x2 && y1 >= y2) return -1;
    if (x1 >= x2 && y1 < y2) return -1;
    return 1;
}

export function getCurveDirection(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
): [number, number] {
    if (x1 < x2 && y1 < y2) return [-1, 1];
    if (x1 < x2 && y1 >= y2) return [-1, -1];
    if (x1 >= x2 && y1 < y2) return [1, 1];
    return [1, -1];
}

export function rotatePoint(
    x: number,
    y: number,
    cx: number,
    cy: number,
    angle: number,
): [number, number] {
    const translatedX = x - cx;
    const translatedY = y - cy;

    const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
    const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);

    const finalX = rotatedX + cx;
    const finalY = rotatedY + cy;

    return [finalX, finalY];
}

function getOuterPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    sourceRadius: number,
    targetRadius: number
): [number, number, number, number] {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dr = Math.sqrt(dx * dx + dy * dy);
    const normX = dx / dr;
    const normY = dy / dr;

    const x1Outer = x1 + normX * sourceRadius;
    const y1Outer = y1 + normY * sourceRadius;

    const x2Outer = x2 - normX * targetRadius;
    const y2Outer = y2 - normY * targetRadius;

    return [x1Outer, y1Outer, x2Outer, y2Outer];
}

function getControlPoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
): [number, number] {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dr = Math.sqrt(dx * dx + dy * dy);
    const [curveDirX, curveDirY] = getCurveDirection(x1, y1, x2, y2);
    const controlX = (x1 + x2) / 2 + curveDirX * dr * 0.15;
    const controlY = (y1 + y2) / 2 + curveDirY * dr * 0.15;
    return [controlX, controlY];
}

export function getBezierMidpoint(
    x1: number, y1: number,
    x2: number, y2: number
): [number, number] {
    const orientation = getOrientation(x1, y1, x2, y2);
    const [x1Outer, y1Outer, x2Outer, y2Outer] = getOuterPoints(x1, y1, x2, y2, 21, 25);
    const [x1Rotated, y1Rotated] = rotatePoint(x1Outer, y1Outer, x1, y1, orientation * Math.PI / 5);
    const [x2Rotated, y2Rotated] = rotatePoint(x2Outer, y2Outer, x2, y2, -orientation * Math.PI / 5);
    const [cx, cy] = getControlPoint(x1Rotated, y1Rotated, x2Rotated, y2Rotated);
    const midX = (0.25 * x1Rotated) + (0.5 * cx) + (0.25 * x2Rotated);
    const midY = (0.25 * y1Rotated) + (0.5 * cy) + (0.25 * y2Rotated);
    return [midX, midY];
}