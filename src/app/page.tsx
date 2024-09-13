"use client";

import type { DFAData } from "./DFAGraph";
import type { DFAJson } from "../simulator/dfa";

import { DFA } from "../simulator/dfa"
import DFAGraph from "./DFAGraph";
import { DFAJsonToDFAData } from "~/utils/utils";
import { useEffect, useState } from "react";
import exampleDFAJson from "../../data/postfix_aba_dfa.json";

// const data: DFAData = DFAJsonToDFAData(exampleDFAJson as DFAJson);

export default function HomePage() {
  const [currentState, setCurrentState] = useState<number | null>(null);
  const [input, setInput] = useState<string>("");
  const [inputPos, setInputPos] = useState<number>(0);
  const [dfaJson, setDFAJson] = useState<string>(JSON.stringify(exampleDFAJson, null, 2));
  const [dfa, setDFA] = useState<DFA | null>(new DFA(exampleDFAJson.acceptStates, exampleDFAJson.table));
  const [data, setData] = useState<DFAData>(DFAJsonToDFAData(exampleDFAJson as DFAJson));

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentState === null || inputPos >= input.length)
        return;
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

  return (
    <main className="flex flex-col items-center justify-center">
      <div className="container flex flex-row items-center justify-start gap-12 px-2 py-2">
        <div className="container flex flex-col items-center justify-start gap-3">
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

          {/* text box to enter a custom dfa json */}
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
      </div>
    </main>
  );
}
