"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

type Data = {
  nodes: d3.SimulationNodeDatum[];
  links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[];
};

export default function GraphTest() {
  const ref = useRef(null);

  const data: Data = {
    // set random x and y
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
  };

  useEffect(() => {
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(ref.current);

    const simulation = d3
      .forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links))
      .force("charge", d3.forceManyBody())
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line");

    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 5);

    node.append("title").text((d) => {
      return `Node ${d.index}`;
    });

    (node as d3.Selection<SVGCircleElement, d3.SimulationNodeDatum, SVGGElement, unknown>).call(
      d3
        .drag<SVGCircleElement, d3.SimulationNodeDatum>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => {
          if (typeof d.source == "object" && d.source.x != undefined) {
            return d.source.x;
          }
          return 0;
        })
        .attr("y1", (d) => {
          if (typeof d.source == "object" && d.source.y != undefined) {
            return d.source.y;
          }
          return 0;
        })
        .attr("x2", (d) => {
          if (typeof d.target == "object" && d.target.x != undefined) {
            return d.target.x;
          }
          return 0;
        })
        .attr("y2", (d) => {
          if (typeof d.target == "object" && d.target.y != undefined) {
            return d.target.y;
          }
          return 0;
        });

      node
        .attr("cx", (d) => d?.x ?? 0)
        .attr("cy", (d) => d?.y ?? 0);
    });

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event: d3.D3DragEvent<SVGCircleElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, d3.SimulationNodeDatum, d3.SimulationNodeDatum>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  }, []);

  return <svg ref={ref}></svg>;
}
