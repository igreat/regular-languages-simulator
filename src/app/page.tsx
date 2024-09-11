"use client";

import DFAGraph from "./DFAGraph";
import type { DFAData } from "./DFAGraph";
import { useEffect, useState } from "react";

const data: DFAData = {
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

export default function HomePage() {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev === null ? 0 : (prev + 1) % data.nodes.length));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <DFAGraph data={data} activeNode={activeNode} />
      </div>
    </main>
  );
}
