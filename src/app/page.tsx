"use client";

import type { DFAData } from "./DFAGraph";
import type { DFAJson } from "../simulator/dfa";

import { DFA } from "../simulator/dfa"
import DFAGraph from "./DFAGraph";
import { DFAJsonToDFAData } from "~/utils/utils";
import { useEffect, useState } from "react";
import dfaJson from "../../data/postfix_aba_dfa.json";

const data: DFAData = DFAJsonToDFAData(dfaJson as DFAJson);

export default function HomePage() {
  const [currentState, setCurrentState] = useState<number | null>(null);
  const [input, setInput] = useState<string>("");
  const [inputPos, setInputPos] = useState<number>(0);
  const [dfa, setDFA] = useState<DFA | null>(null);

  useEffect(() => {
    setDFA(new DFA(dfaJson.acceptStates, dfaJson.table));
  }, []);

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-8">
        <DFAGraph data={data} activeNode={currentState} />
      </div>
      <div className="container flex flex-col items-center justify-center gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="p-1 text-black"
        />
        <button
          onClick={() => {
            setInputPos(0);
            setCurrentState(0);
          }}
          className="bg-blue-500 text-white rounded-md py-2 px-4"
        >
          Simulate
        </button>
      </div>
    </main>
  );
}
