"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

type Data = {
  nodes: d3.SimulationNodeDatum[];
  links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[];
  nodeLabels: string[];
  linkLabels: string[];
};

const data: Data = {
  nodes: Array.from({ length: 10 }, () => ({})),
  links: [
    { source: 0, target: 2 },
    { source: 1, target: 5 },
    { source: 1, target: 6 },
    { source: 2, target: 3 },
    { source: 2, target: 7 },
    { source: 3, target: 4 },
    { source: 8, target: 3 },
    { source: 4, target: 5 },
    { source: 4, target: 9 },
    { source: 5, target: 9 },
  ],
  nodeLabels: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
  linkLabels: [
    "A->C",
    "B->F",
    "B->G",
    "C->D",
    "C->H",
    "D->E",
    "I->D",
    "E->F",
    "E->J",
    "F->J",
  ],
};

export default function GraphTest() {
  const ref = useRef(null);

  useEffect(() => {
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(ref.current);

    const simulation = d3
      .forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).strength(0.05))
      .force("collide", d3.forceCollide().radius(20))
      .force("center", d3.forceCenter())
      .force("charge", d3.forceManyBody().strength(-200))
      .force("y", d3.forceY().strength(0.03));

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10") // viewBox for the arrow marker
      .attr("refX", 10) // must adjust
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5") // shape of the arrow
      .attr("fill", "#aaa");

    const link = svg
      .append("g")
      .attr("stroke", "#aaa")
      .attr("stroke-opacity", 1)
      .selectAll("path")
      .data(data.links)
      .join("path")
      .attr("marker-end", "url(#arrow)")
      .attr("stroke-width", 2)
      .attr("fill", "none") as d3.Selection<
      SVGPathElement,
      d3.SimulationLinkDatum<d3.SimulationNodeDatum>,
      SVGGElement,
      unknown
    >;

    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.0)
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 20) as d3.Selection<
      SVGCircleElement,
      d3.SimulationNodeDatum,
      SVGGElement,
      unknown
    >;

    const nodeLabel = svg
      .append("g")
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "white")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text((_, i) => data.nodeLabels[i] ?? "");

    const linkLabel = svg
      .append("g")
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .selectAll("text")
      .data(data.links)
      .join("text")
      .text((_, i) => data.linkLabels[i] ?? "");

    node.append("title").text((d) => `${d.index}`);

    node.call(
      d3
        .drag<SVGCircleElement, d3.SimulationNodeDatum>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended),
    );

    simulation.on("tick", () => {
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
    });

    function dragstarted(
      event: d3.D3DragEvent<
        SVGCircleElement,
        d3.SimulationNodeDatum,
        d3.SimulationNodeDatum
      >,
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
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  }, []);

  return <svg ref={ref}></svg>;
}

const curvePath = (d: d3.SimulationLinkDatum<d3.SimulationNodeDatum>) => {
  if (typeof d.source !== "object" || typeof d.target !== "object") return "";

  const x1 = d.source.x ?? 0;
  const y1 = d.source.y ?? 0;
  const x2 = d.target.x ?? 0;
  const y2 = d.target.y ?? 0;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dr = Math.sqrt(dx * dx + dy * dy);

  const normX = dx / dr;
  const normY = dy / dr;

  const sourceRadius = 20;
  const targetRadius = 20;

  const sourceX = x1 + normX * sourceRadius;
  const sourceY = y1 + normY * sourceRadius;
  const targetX = x2 - normX * targetRadius;
  const targetY = y2 - normY * targetRadius;

  const controlX = (sourceX + targetX) / 2 + dr * 0.1;
  const controlY = (sourceY + targetY) / 2 - dr * 0.1;

  return `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
};