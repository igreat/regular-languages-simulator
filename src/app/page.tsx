"use client";
import '~/styles/globals.css';

import type { DFAData } from "./DFAGraph";
import type { DFAJson } from "../simulator/dfa";

import { DFA } from "../simulator/dfa";
import DFAGraph from "./DFAGraph";
import { DFAJsonToDFAData } from "~/utils/utils";
import { useEffect, useState } from "react";
import exampleDFAJson from "../../data/postfix_aba_dfa.json";

export default function HomePage() {
  const [currentState, setCurrentState] = useState<number | null>(null);
  const [input, setInput] = useState<string>("");
  const [inputPos, setInputPos] = useState<number>(0);
  const [dfaJson, setDFAJson] = useState<string>(
    JSON.stringify(exampleDFAJson, null, 2)
  );
  const [dfa, setDFA] = useState<DFA | null>(
    new DFA(exampleDFAJson.acceptStates, exampleDFAJson.table)
  );
  const [data, setData] = useState<DFAData>(
    DFAJsonToDFAData(exampleDFAJson as DFAJson)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentState === null || inputPos >= input.length) return;
      setCurrentState((prev) => {
        if (dfa && inputPos <= input.length) {
          return dfa.run(input.charAt(inputPos), prev ?? 0) ?? null;
        }
        return null;
      });
      setInputPos((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [dfa, input, currentState, inputPos]);

  return (<>
    <main className="flex flex-col items-center justify-center">
      <div className="flex flex-col md:flex-row justify-start px-4 py-2 gap-8">
        {/* Simulation Part */}
        <div className="flex flex-col items-center justify-start gap-3">
          <DFAGraph data={data} activeNode={currentState} />
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
              setCurrentState(0);
            }}
            className="bg-cyan-900 text-white rounded-md py-1 px-2 text-sm font-bold border-2 border-cyan-800"
          >
            Simulate
          </button>

          {/* Text box to enter a custom DFA JSON */}
          <textarea
            className="p-1 text-blue-300 w-60 h-52 bg-gray-800 font-mono border-2 border-gray-600 rounded-md text-xs"
            rows={10}
            cols={50}
            value={dfaJson}
            onChange={(e) => {
              setDFAJson(e.target.value);
            }}
          />
          <button
            onClick={() => {
              const json = JSON.parse(dfaJson) as DFAJson;
              setDFA(new DFA(json.acceptStates, json.table));
              setData(DFAJsonToDFAData(json));
            }}
            className="bg-cyan-900 text-white rounded-md py-1 px-2 text-sm font-bold border-2 border-cyan-800"
          >
            Build DFA
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
            Build Your Own DFA
          </button>
          <button
            onClick={() => {
              // Open file dialog or navigate to "Load DFA" functionality
            }}
            className="bg-green-700 text-white font-bold rounded-md py-2 px-4 border-2 border-green-600"
          >
            Load DFA
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
