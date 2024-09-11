"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function DFAGraph({
  data,
  activeNode,
}: {
  data: DFAData;
  activeNode: number | null;
}) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current) as SVGSelection;
    const width = 1000;
    const height = 500;
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    setupMarkers(svg);
    const simulation = setupSimulation(data);
    const link = renderLinks(svg, data.links);
    const node = renderNodes(svg, data.nodes, simulation);
    const { nodeLabel, linkLabel } = renderLabels(
      svg,
      data.nodes,
      data.nodeLabels,
      data.links,
      data.linkLabels,
    );

    simulation.on("tick", () =>
      updateGraph(svg, node, link, nodeLabel, linkLabel),
    );
  }, [data]);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);

      svg
        .selectAll("circle")
        .style("fill", (d, i) => (i === activeNode ? "red" : "#000"));
    }
  }, [activeNode]);

  return <svg ref={ref}></svg>;
}

function setupMarkers(svg: SVGSelection) {
  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("markerWidth", 5)
    .attr("markerHeight", 5)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#aaa");
}

function setupSimulation(data: DFAData) {
  return d3
    .forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).strength(0.05))
    .force("collide", d3.forceCollide().radius(20))
    .force("center", d3.forceCenter())
    .force("charge", d3.forceManyBody().strength(-250))
    .force("y", d3.forceY().strength(0.04))
    .force("x", d3.forceX().strength(0.02));
}

function renderLinks(
  svg: SVGSelection,
  links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[],
): LinkSelection {
  const link = svg
    .append("g")
    .attr("stroke", "#aaa")
    .attr("stroke-opacity", 1)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("marker-end", "url(#arrow)")
    .attr("stroke-width", 2)
    .attr("fill", "none") as LinkSelection;

  return link;
}

function renderNodes(
  svg: SVGSelection,
  nodes: d3.SimulationNodeDatum[],
  simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>,
): NodeSelection {
  const node = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2.0)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 20)
    .style("fill", "#000") as NodeSelection;

  type DragEvent = d3.D3DragEvent<
    SVGCircleElement,
    d3.SimulationNodeDatum,
    d3.SimulationNodeDatum
  >;
  node.call(
    d3
      .drag<SVGCircleElement, d3.SimulationNodeDatum>()
      .on("start", (event: DragEvent) => dragstarted(event, simulation))
      .on("drag", (event: DragEvent) => dragged(event))
      .on("end", (event: DragEvent) => dragended(event)),
  );

  node.append("title").text((d) => `${d.index}`);

  return node;
}

function renderLabels(
  svg: SVGSelection,
  nodes: d3.SimulationNodeDatum[],
  nodeLabels: string[],
  links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[],
  linkLabels: string[],
): {
  nodeLabel: NodeLabelSelection;
  linkLabel: LinkLabelSelection;
} {
  const nodeLabel = svg
    .append("g")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "white")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text((_, i) => nodeLabels[i] ?? "");

  const linkLabel = svg
    .append("g")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("font-weight", "bold")
    .attr("fill", "#fff")
    .selectAll("text")
    .data(links)
    .join("text")
    .text((_, i) => linkLabels[i] ?? "");

  return { nodeLabel, linkLabel };
}

function updateGraph(
  svg: SVGSelection,
  node: NodeSelection,
  link: LinkSelection,
  nodeLabel: NodeLabelSelection,
  linkLabel: LinkLabelSelection,
) {
  link.attr("d", curvePath);

  node.attr("cx", (d) => d?.x ?? 0).attr("cy", (d) => d?.y ?? 0);
  nodeLabel.attr("x", (d) => d?.x ?? 0).attr("y", (d) => (d?.y ?? 0) + 4);
  linkLabel
    .attr(
      "x",
      (d) =>
        (((d.source as d3.SimulationNodeDatum).x ?? 0) +
          ((d.target as d3.SimulationNodeDatum).x ?? 0)) /
        2,
    )
    .attr(
      "y",
      (d) =>
        (((d.source as d3.SimulationNodeDatum).y ?? 0) +
          ((d.target as d3.SimulationNodeDatum).y ?? 0)) /
        2,
    );
}

function curvePath(d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>) {
  if (typeof d.source !== "object" || typeof d.target !== "object") return "";

  const x1 = d.source.x ?? 0;
  const y1 = d.source.y ?? 0;
  const x2 = d.target.x ?? 0;
  const y2 = d.target.y ?? 0;

  if (d.source.index === d.target.index) {
    console.log("self loop");
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

  const curveDir = x1 < x2 || y2 < y1 ? -1 : 1;
  const orientation = -curveDir * Math.sign(dy);

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
    (-orientation * Math.PI) / 5,
  );

  const controlX = (x1Rotated + x2Rotated) / 2 + curveDir * dr * 0.15;
  const controlY = (y1Rotated + y2Rotated) / 2 + curveDir * dr * 0.15;

  return `M ${x1Rotated} ${y1Rotated} Q ${controlX} ${controlY} ${x2Rotated} ${y2Rotated}`;
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

function dragstarted(
  event: d3.D3DragEvent<
    SVGCircleElement,
    d3.SimulationNodeDatum,
    d3.SimulationNodeDatum
  >,
  simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>,
) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

function dragged(
  event: d3.D3DragEvent<
    SVGCircleElement,
    d3.SimulationNodeDatum,
    d3.SimulationNodeDatum
  >,
) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

function dragended(
  event: d3.D3DragEvent<
    SVGCircleElement,
    d3.SimulationNodeDatum,
    d3.SimulationNodeDatum
  >,
) {
  if (!event.active) event.subject.fx = null;
  event.subject.fy = null;
}

type DFAData = {
  nodes: d3.SimulationNodeDatum[];
  links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[];
  nodeLabels: string[];
  linkLabels: string[];
  acceptStates?: number[];
};

type SVGSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;

type NodeSelection = d3.Selection<
  SVGCircleElement,
  d3.SimulationNodeDatum,
  SVGGElement,
  unknown
>;

type LinkSelection = d3.Selection<
  SVGPathElement,
  d3.SimulationLinkDatum<d3.SimulationNodeDatum>,
  SVGGElement,
  unknown
>;

type NodeLabelSelection = d3.Selection<
  d3.BaseType | SVGTextElement,
  d3.SimulationNodeDatum,
  SVGGElement,
  unknown
>;

type LinkLabelSelection = d3.Selection<
  d3.BaseType | SVGTextElement,
  d3.SimulationLinkDatum<d3.SimulationNodeDatum>,
  SVGGElement,
  unknown
>;

export type { DFAData };
