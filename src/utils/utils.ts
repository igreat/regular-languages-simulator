import type { DFAData } from "../app/DFAGraph";
import type { DFAJson } from "../simulator/dfa";
import type * as d3 from "d3";

export function DFAJsonToDFAData(data: DFAJson): DFAData {
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

    return { nodes, links, nodeLabels, linkLabels, acceptStates: data.acceptStates };
}

export function curvePath(d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>) {
    if (typeof d.source !== "object" || typeof d.target !== "object") return "";

    const x1 = d.source.x ?? 0;
    const y1 = d.source.y ?? 0;
    const x2 = d.target.x ?? 0;
    const y2 = d.target.y ?? 0;

    if (d.source.index === d.target.index) {
        const direction = ((x1 > 0 ? -1 : 1) * Math.PI) / 4;
        const [x1Rotated, y1Rotated] = rotatePoint(
            x1 + 16,
            y1 + 16,
            x1,
            y1,
            direction,
        );
        const [x2Rotated, y2Rotated] = rotatePoint(
            x1 + 16,
            y1 + 16,
            x1,
            y1,
            direction + Math.PI / 3,
        );
        return `M ${x1Rotated} ${y1Rotated} A ${18} ${18} ${0} ${1} ${1} ${x2Rotated} ${y2Rotated}`;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dr = Math.sqrt(dx * dx + dy * dy);

    const normX = dx / dr;
    const normY = dy / dr;

    const sourceRadius = 21;
    const targetRadius = 25;

    const orientation = getOrientation(x1, y1, x2, y2);
    const [curveDirX, curveDirY] = getCurveDirection(x1, y1, x2, y2);

    const x1Outer = x1 + normX * sourceRadius;
    const y1Outer = y1 + normY * sourceRadius;
    const [x1Rotated, y1Rotated] = rotatePoint(
        x1Outer,
        y1Outer,
        x1,
        y1,
        (orientation * Math.PI) / 5,
    );

    const x2Outer = x2 - normX * targetRadius;
    const y2Outer = y2 - normY * targetRadius;
    const [x2Rotated, y2Rotated] = rotatePoint(
        x2Outer,
        y2Outer,
        x2,
        y2,
        -(orientation * Math.PI) / 5,
    );

    const controlX = (x1Rotated + x2Rotated) / 2 + curveDirX * dr * 0.15;
    const controlY = (y1Rotated + y2Rotated) / 2 + curveDirY * dr * 0.15;

    return `M ${x1Rotated} ${y1Rotated} Q ${controlX} ${controlY} ${x2Rotated} ${y2Rotated}`;
}

function getOrientation(x1: number, y1: number, x2: number, y2: number) {
    if (x1 < x2 && y1 < y2) return -1;
    if (x1 < x2 && y1 >= y2) return 1;
    if (x1 >= x2 && y1 < y2) return 1;
    return -1;
}

function getCurveDirection(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
): [number, number] {
    if (x1 < x2 && y1 < y2) return [1, -1];
    if (x1 < x2 && y1 >= y2) return [1, 1];
    if (x1 >= x2 && y1 < y2) return [-1, -1];
    return [-1, 1];
}

function rotatePoint(
    x: number,
    y: number,
    cx: number,
    cy: number,
    angle: number,
): [number, number] {
    const translatedX = x - cx;
    const translatedY = y - cy;

    const rotatedX =
        translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
    const rotatedY =
        translatedX * Math.sin(angle) + translatedY * Math.cos(angle);

    const finalX = rotatedX + cx;
    const finalY = rotatedY + cy;

    return [finalX, finalY];
}
