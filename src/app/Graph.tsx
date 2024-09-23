"use client";

import React, { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { curvePath, getBezierMidpoint, getSelfLoopMidpoint } from "../utils/utils";
import type { GraphData } from "../utils/utils";

export default function Graph({
  data,
  activeNodes,
  isRemovingState,
  handleDeleteState,
}: {
  data: GraphData;
  activeNodes: Set<string>;
  isRemovingState: boolean;
  handleDeleteState: (node: string) => void;
}) {
  const indexToNode = useMemo(() => {
    const map = new Map<number, string>();
    data.nodeToIndex?.forEach((value, key) => map.set(value, key));
    return map;
  }, [data.nodeToIndex]);
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current) as SVGSelection;
    const width = 450;
    const height = 400;
    const margin = { top: 5, right: 5, bottom: 5, left: 5 };

    svg.selectAll("*").remove();

    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("style", "max-width: 100%; height: auto;");

    setupMarkers(svg);

    // Create a container group for all graph elements
    const container = svg.append("g").attr("class", "graph-container");

    const simulation = setupSimulation(data);
    const link = renderLinks(container, data.links);
    const node = renderNodes(container, data.nodes, simulation, isRemovingState, handleDeleteState, indexToNode);
    const { nodeLabel, linkLabel } = renderLabels(
      container,
      data.nodes,
      data.nodeLabels,
      data.links,
      data.linkLabels,
    );

    setupZoom(svg, container);

    simulation.on("tick", () =>
      updateGraph(node, link, nodeLabel, linkLabel),
    );

  }, [data, indexToNode, isRemovingState, handleDeleteState]);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);

      svg
        .selectAll("circle")
        .style("fill", (_, i) => {
          if (activeNodes.has(indexToNode.get(i) ?? "")) {
            return "red";
          }
          return (indexToNode.get(i) ?? "") == data.startState ? "#7f7f7f" : "#000";
        })
        .attr("stroke-width", (_, i) => (data.acceptStates.has(indexToNode.get(i) ?? "") ? 3 : 2))
        .attr("stroke", (_, i) => (data.acceptStates.has(indexToNode.get(i) ?? "") ? "lightgreen" : "#fff"))
        // make dotted line for isRemovingState, except for startState and acceptStates
        .attr("stroke-dasharray", (_, i) => {
          if (isRemovingState && !data.acceptStates.has(indexToNode.get(i) ?? "") && indexToNode.get(i) !== data.startState) {
            return "5,5";
          }
          return "";
        });


    }
  }, [activeNodes, data.acceptStates, data.startState, indexToNode, isRemovingState]);

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

function setupSimulation(data: GraphData) {
  return d3
    .forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).strength(0.005))
    .force("collide", d3.forceCollide().radius(20))
    .force("center", d3.forceCenter().strength(1))
    .force("charge", d3.forceManyBody().strength(-150))
    .force("y", d3.forceY().strength(0.02))
    .force("x", d3.forceX().strength(0.02));
}

function setupZoom(svg: SVGSelection, container: d3.Selection<SVGGElement, unknown, null, undefined>) {
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 8])
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      container.attr("transform", event.transform.toString());
    });

  svg.call(zoom);
}


function renderLinks(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[],
): LinkSelection {
  const link = container
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
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: d3.SimulationNodeDatum[],
  simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>,
  isRemovingState: boolean,
  handleDeleteState: (node: string) => void,
  indexToNode: Map<number, string>,
): NodeSelection {
  const node = container
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2.0)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 20)
    .style("fill", "#000")
    .on("click", (event: MouseEvent, d) => {
      if (isRemovingState) {
        event.stopPropagation();
        handleDeleteState(indexToNode.get(d.index!) ?? "");
      }
    }) as NodeSelection;

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
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: d3.SimulationNodeDatum[],
  nodeLabels: string[],
  links: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[],
  linkLabels: string[],
): {
  nodeLabel: NodeLabelSelection;
  linkLabel: LinkLabelSelection;
} {
  const nodeLabel = container
    .append("g")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("font-weight", "bold")
    .attr("font-family", "JetBrains Mono, monospace")
    .attr("fill", "white")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text((_, i) => nodeLabels[i] ?? "");

  const linkLabel = container
    .append("g")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("font-weight", "bold")
    .attr("font-family", "JetBrains Mono, monospace")
    .attr("fill", "#fff")
    .selectAll("text")
    .data(links)
    .join("text")
    .text((_, i) => linkLabels[i] ?? "");

  return { nodeLabel, linkLabel };
}

function updateGraph(
  node: NodeSelection,
  link: LinkSelection,
  nodeLabel: NodeLabelSelection,
  linkLabel: LinkLabelSelection,
) {
  link.attr("d", curvePath);

  node.attr("cx", (d) => d?.x ?? 0).attr("cy", (d) => d?.y ?? 0);
  nodeLabel.attr("x", (d) => d?.x ?? 0).attr("y", (d) => (d?.y ?? 0) + 4);

  linkLabel
    .attr("x", (d) => {
      const src = d.source as d3.SimulationNodeDatum;
      const tgt = d.target as d3.SimulationNodeDatum;

      const x1 = src.x ?? 0;
      const y1 = src.y ?? 0;
      const x2 = tgt.x ?? 0;
      const y2 = tgt.y ?? 0;

      if (src.index === tgt.index) {
        return getSelfLoopMidpoint(x1, y1)[0];
      }

      return getBezierMidpoint(x1, y1, x2, y2)[0];
    })
    .attr("y", (d) => {
      const src = d.source as d3.SimulationNodeDatum;
      const tgt = d.target as d3.SimulationNodeDatum;

      const x1 = src.x ?? 0;
      const y1 = src.y ?? 0;
      const x2 = tgt.x ?? 0;
      const y2 = tgt.y ?? 0;

      if (src.index === tgt.index) {
        return getSelfLoopMidpoint(x1, y1)[1];
      }

      return getBezierMidpoint(x1, y1, x2, y2)[1];
    });
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