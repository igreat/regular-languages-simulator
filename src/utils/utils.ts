import type { NFAJson } from "~/simulator/nfa";
import type * as d3 from "d3";
import type { GNFAJson } from "~/simulator/gnfa";

export type GraphData = {
    nodes: d3.SimulationNodeDatum[];
    links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[];
    nodeLabels: string[];
    linkLabels: string[];
    startState: string;
    acceptStates: Set<string>;
    nodeToIndex: Map<string, number>;
};

function NFAJsonToNodeToIndexMap(data: NFAJson): Map<string, number> {
    let index = 0;
    const nodeToIndex = new Map<string, number>();
    for (const [src, transitions] of Object.entries(data.table)) {
        if (!nodeToIndex.has(src)) {
            nodeToIndex.set(src, index);
            index++;
        }
        for (const targets of Object.values(transitions)) {
            targets.forEach((tgt) => {
                if (!(nodeToIndex.has(tgt))) {
                    nodeToIndex.set(tgt, index);
                    index++;
                }
            });
        }
    }
    return nodeToIndex;
}

export function NFAJsonToGraphData(data: NFAJson): GraphData {
    const nodeToIndex = NFAJsonToNodeToIndexMap(data);
    const nodes: d3.SimulationNodeDatum[] = Array.from({ length: nodeToIndex.size }, () => ({}));
    const nodeLabels: string[] = Array.from({ length: nodeToIndex.size }, () => (""));
    for (const [node, index] of nodeToIndex) {
        nodeLabels[index] = node.toString()
    }

    // multiple of the same link can have different symbols, so the linkLabel should just be one comma separated string
    const srcToTarget = new Map<number, Map<number, string[]>>();
    for (const [source, targets] of Object.entries(data.table)) {
        const srcIndex = nodeToIndex.get(source) ?? 0;
        if (!srcToTarget.has(srcIndex)) {
            srcToTarget.set(srcIndex, new Map());
        }
        for (const [symbol, target] of Object.entries(targets)) {
            target.forEach((tgt) => {
                const tgtIndex = nodeToIndex.get(tgt) ?? 0;
                if (!srcToTarget.get(srcIndex)?.has(tgtIndex)) {
                    srcToTarget.get(srcIndex)?.set(tgtIndex, []);
                }
                srcToTarget.get(srcIndex)?.get(tgtIndex)?.push(symbol);
            });
        }
    }

    const links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[] = [];
    const linkLabels: string[] = [];
    for (const [source, targets] of srcToTarget) {
        for (const [target, symbols] of targets) {
            links.push({ source: source, target: target });
            linkLabels.push(symbols.join("|"));
        }
    }

    return {
        nodes, links, nodeLabels,
        linkLabels, startState: data.startState,
        acceptStates: new Set(data.acceptStates), nodeToIndex
    };
}

function GNFAJsonToNodeToIndexMap(data: GNFAJson): Map<string, number> {
    let index = 0;
    const nodeToIndex = new Map<string, number>();
    for (const [src, transitions] of Object.entries(data.table)) {
        if (!nodeToIndex.has(src)) {
            nodeToIndex.set(src, index);
            index++;
        }
        for (const tgt of Object.keys(transitions)) {
            if (!(nodeToIndex.has(tgt))) {
                nodeToIndex.set(tgt, index);
                index++;
            }
        }
    }
    return nodeToIndex;
}


export function GNFAJsonToGraphData(data: GNFAJson, initialPositions?: Record<string, [number, number]>): GraphData {
    const nodeToIndex = GNFAJsonToNodeToIndexMap(data);
    const nodes: d3.SimulationNodeDatum[] = Array.from({ length: nodeToIndex.size }, () => ({}));
    if (initialPositions) {
        for (const [node, index] of nodeToIndex) {
            if (initialPositions[node]) {
                nodes[index] = { x: initialPositions[node][0], y: initialPositions[node][1] };
            }
        }
    }

    const nodeLabels: string[] = Array.from({ length: nodeToIndex.size }, () => (""));
    for (const [node, index] of nodeToIndex) {
        nodeLabels[index] = node.toString()
    }

    // GNFA is a bit simpler here, the table is src -> tgt -> linkLabel
    const links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[] = [];
    const linkLabels: string[] = [];
    for (const [source, transitions] of Object.entries(data.table)) {
        const srcIndex = nodeToIndex.get(source) ?? 0;
        for (const [target, regex] of Object.entries(transitions)) {
            const tgtIndex = nodeToIndex.get(target) ?? 0;
            links.push({ source: srcIndex, target: tgtIndex });
            linkLabels.push(regex);
        }
    }

    return {
        nodes, links, nodeLabels, linkLabels,
        startState: data.startState,
        acceptStates: new Set([data.acceptState]), nodeToIndex
    };
}

const SEPARATION_DEGREE = Math.PI / 5;
function getSelfLoopPath(x: number, y: number): string {
    if (x === 0 && y === 0) {
        [x, y] = [1, 1];
    }
    const size = Math.sqrt(x * x + y * y);
    const directionX = x !== 0 ? x / size : 1e-5;
    const directionY = y / size;
    /*
            |
            |
            |
    ---------
    tan(theta) = h / x
    theta = arctan(h / x)
    */
    const [x1Rotated, y1Rotated] = rotatePoint(x + directionX * 22, y + directionY * 22, x, y, -SEPARATION_DEGREE);
    const [x2Rotated, y2Rotated] = rotatePoint(x + directionX * 22, y + directionY * 22, x, y, SEPARATION_DEGREE);
    return `M ${x1Rotated} ${y1Rotated} A ${18} ${18} ${0} ${1} ${1} ${x2Rotated} ${y2Rotated}`;
}

export function curvePath(d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>): string {
    const src = d.source as d3.SimulationNodeDatum;
    const tgt = d.target as d3.SimulationNodeDatum;

    const x1 = src.x ?? 0;
    const y1 = src.y ?? 0;
    const x2 = tgt.x ?? 0;
    const y2 = tgt.y ?? 0;

    if (src.index === tgt.index) {
        return getSelfLoopPath(x1, y1);
    }

    const sourceRadius = 21;
    const targetRadius = 25;

    const [x1Outer, y1Outer, x2Outer, y2Outer] = getOuterPoints(x1, y1, x2, y2, sourceRadius, targetRadius);
    const [x1Rotated, y1Rotated] = rotatePoint(x1Outer, y1Outer, x1, y1, Math.PI / 5);
    const [x2Rotated, y2Rotated] = rotatePoint(x2Outer, y2Outer, x2, y2, -Math.PI / 5);
    const [controlX, controlY] = getControlPoint(x1Rotated, y1Rotated, x2Rotated, y2Rotated);

    return `M ${x1Rotated} ${y1Rotated} Q ${controlX} ${controlY} ${x2Rotated} ${y2Rotated}`;
}

const CURVE_FACTOR = 1.2;
export function getCurveDirection(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
): [number, number] {
    // should simply be the normal of the two points
    const diffx = x2 - x1;
    const diffy = y2 - y1;
    // then rotate 90 degrees backward, aka (x, y) -> (-y, x)
    // and normalize
    const size = Math.sqrt(diffx * diffx + diffy * diffy);
    return [-diffy / size * CURVE_FACTOR, diffx / size * CURVE_FACTOR];
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
    const [x1Outer, y1Outer, x2Outer, y2Outer] = getOuterPoints(x1, y1, x2, y2, 21, 25);
    const [x1Rotated, y1Rotated] = rotatePoint(x1Outer, y1Outer, x1, y1, Math.PI / 5);
    const [x2Rotated, y2Rotated] = rotatePoint(x2Outer, y2Outer, x2, y2, -Math.PI / 5);
    const [cx, cy] = getControlPoint(x1Rotated, y1Rotated, x2Rotated, y2Rotated);
    const midX = (0.25 * x1Rotated) + (0.5 * cx) + (0.25 * x2Rotated);
    const midY = (0.25 * y1Rotated) + (0.5 * cy) + (0.25 * y2Rotated);
    return [midX, midY];
}

export function getSelfLoopMidpoint(x: number, y: number): [number, number] {
    if (x === 0 && y === 0) {
        [x, y] = [1, 1];
    }
    const size = Math.sqrt(x * x + y * y);
    const directionX = x !== 0 ? x / size : 1e-5;
    const directionY = y / size;
    /*
            |
            |
            |
    ---------
    tan(theta) = h / x
    theta = arctan(h / x)
    */
    const [x1Rotated, y1Rotated] = rotatePoint(x + directionX * 22, y + directionY * 22, x, y, -SEPARATION_DEGREE);
    const [x2Rotated, y2Rotated] = rotatePoint(x + directionX * 22, y + directionY * 22, x, y, SEPARATION_DEGREE);
    const diffX = x2Rotated - x1Rotated;
    const diffY = y2Rotated - y1Rotated;
    const diffSize = Math.sqrt(diffX * diffX + diffY * diffY);
    // computing the norm
    const [normX, normY] = [diffY / diffSize, -diffX / diffSize];
    const [midX, midY] = [(x1Rotated + x2Rotated) / 2, (y1Rotated + y2Rotated) / 2];
    const SHIFT_FACTOR = 32;
    return [midX + normX * SHIFT_FACTOR, midY + normY * SHIFT_FACTOR];
}
