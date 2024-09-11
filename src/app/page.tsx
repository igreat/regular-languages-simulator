"use client";

import type { DFAData } from "./DFAGraph";
import type { DFAJson } from "../simulator/dfa";

import DFAGraph from "./DFAGraph";
import { DFAJsonToDFAData } from "~/utils/utils";
import { useEffect, useState } from "react";
import dfaJson from "../../data/postfix_aba_dfa.json";

const data: DFAData = DFAJsonToDFAData(dfaJson as DFAJson);

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
