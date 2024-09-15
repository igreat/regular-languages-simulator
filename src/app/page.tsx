"use client";
import '~/styles/globals.css';

import type { GraphData } from "../utils/utils";

import { useEffect, useState } from "react";
import Graph from "./Graph";
import DFAInputTable from "./DFAInputTable";
import { NFA, NFAJson } from '~/simulator/nfa';
import { NFAJsonToGraphData } from "../utils/utils";
import exampleDFAJson from "../../data/postfix_aba_dfa.json";
import exampleNFAJson from "../../data/even_0s_or_1s_nfa.json";

export default function HomePage() {
  const [currentStates, setCurrentStates] = useState<number[]>([]);
  const [simulation, setSimulation] = useState<Generator<number[], boolean> | null>(null);
  const [input, setInput] = useState<string>("");
  const [inputPos, setInputPos] = useState<number>(0);
  const [nfaJson, setNFAJson] = useState<string>(
    JSON.stringify(exampleNFAJson, null, 2)
  );
  const [nfa, setNFA] = useState<NFA | null>(
    new NFA(exampleNFAJson.acceptStates, exampleNFAJson.table)
  );
  const [data, setData] = useState<GraphData>(
    NFAJsonToGraphData(exampleNFAJson as NFAJson)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (inputPos > input.length) return;
      const nextStates = simulation?.next().value;
      console.log(nextStates);
      if (typeof nextStates === "boolean")
        return;
      setCurrentStates(nextStates ?? []);
      setInputPos((prev) => prev + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [nfa, input, currentStates, inputPos]);

  // Handle DFA changes from DFAInputTable
  const handleDFAChange = (nfaJson: string) => {
    setNFAJson(nfaJson);
  };

  return (<>
    <main className="flex flex-col items-center justify-center">
      <div className="flex flex-col md:flex-row justify-start px-4 py-2 gap-8">
        {/* Simulation Part */}
        <div className="flex flex-col items-center justify-start gap-3">
          <Graph data={data} activeNodes={new Set(currentStates)} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter input string"
            className="p-1 text-blue-300 w-64 bg-gray-800 font-mono border-2 border-gray-600 rounded-md text-xs"
          />
          <button
            onClick={() => {
              setInputPos(0);
              setCurrentStates([]);
              if (nfa) {
                setSimulation(nfa.simulation(input));
              }
            }}
            className="bg-cyan-900 text-white rounded-md py-1 px-2 text-sm font-bold border-2 border-cyan-800"
          >
            Simulate
          </button>

          {/* Text box to enter a custom DFA JSON */}
          <DFAInputTable onDFAChange={handleDFAChange} initialDFA={exampleDFAJson} />
          <textarea
            className="p-1 text-blue-300 w-60 h-52 bg-gray-800 font-mono border-2 border-gray-600 rounded-md text-xs"
            rows={10}
            cols={50}
            value={nfaJson}
            onChange={(e) => {
              setNFAJson(e.target.value);
            }}
          />
          <button
            onClick={() => {
              const json = JSON.parse(nfaJson) as NFAJson;
              setNFA(new NFA(json.acceptStates, json.table));
              setData(NFAJsonToGraphData(json));
            }}
            className="bg-cyan-900 text-white rounded-md py-1 px-2 text-sm font-bold border-2 border-cyan-800"
          >
            Build NFA
          </button>
        </div>

        {/* Buttons on the Right */}
        <div className="flex flex-col md:justify-center pb-28 gap-4 text-xl">
          <button
            onClick={() => {
              // Navigate or open the "Build Your Own DFA" page/modal
            }}
            className="bg-blue-700 text-white font-bold rounded-md py-2 px-4 border-2 border-blue-600"
          >
            Build Your Own NFA
          </button>
          <button
            onClick={() => {
              // Open file dialog or navigate to "Load DFA" functionality
            }}
            className="bg-green-700 text-white font-bold rounded-md py-2 px-4 border-2 border-green-600"
          >
            Load NFA
          </button>
        </div>
      </div>
    </main>
    <footer>
      {/* basic padding for now */}
      <div className="py-16"></div>
    </footer>
  </>);
}
