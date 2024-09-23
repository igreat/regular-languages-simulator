"use client";
import '~/styles/globals.css';

import type { GraphData } from "../utils/utils";
import type { NFAJson } from '~/simulator/nfa';

import { useEffect, useState } from "react";
import Graph from "./Graph";
import InputTable from "./InputTable";
import { NFA } from '~/simulator/nfa';
import { GNFAJsonToGraphData, NFAJsonToGraphData } from "../utils/utils";
import exampleNFAJson from "../../data/even_0s_or_1s_nfa.json";
import { GNFA } from '~/simulator/gnfa';
import { EmptySet, parseRegex } from '~/simulator/regex';

export default function HomePage() {
  const [currentStates, setCurrentStates] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<Generator<string[], boolean> | null>(null);
  const [input, setInput] = useState<string>("");
  const [inputPos, setInputPos] = useState<number>(0);
  const [nfaJson, setNFAJson] = useState<string>(
    JSON.stringify(exampleNFAJson, null, 2)
  );
  const [tableNfaJson, setTableNfaJson] = useState<NFAJson>(exampleNFAJson);
  const [nfa, setNFA] = useState<NFA | null>(
    new NFA(exampleNFAJson.startState, exampleNFAJson.acceptStates, exampleNFAJson.table)
  );
  const [data, setData] = useState<GraphData>(
    NFAJsonToGraphData(exampleNFAJson as NFAJson)
  );
  const [regexInput, setRegexInput] = useState<string>("");
  const [regexInputError, setRegexInputError] = useState<string>("");

  const [isReducingToRegex, setIsReducingToRegex] = useState<boolean>(false);
  const [isGNFA, setIsGNFA] = useState<boolean>(false);
  const [isRemovingState, setIsRemovingState] = useState<boolean>(false);
  const [gnfa, setGnfa] = useState<GNFA | null>(null);
  const [finalRegex, setFinalRegex] = useState<string>("");
  const [trashStateHidden, setTrashStateHidden] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (inputPos > input.length) return;
      const nextStates = simulation?.next().value;
      if (typeof nextStates === "boolean")
        return;
      setCurrentStates(nextStates ?? []);
      setInputPos((prev) => prev + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [nfa, input, currentStates, inputPos, simulation]);

  // Handle NFA changes from InputTable
  const handleNFAChange = (nfaJson: string) => {
    setNFAJson(nfaJson);
  };

  const handleDeleteState = (node: string) => {
    if (gnfa) {
      const newGnfa = gnfa.reduced(node);
      setGnfa(newGnfa);
      const initialPositions: Record<string, [number, number]> = {};
      const nodeToIndex = data.nodeToIndex;
      const indexToNode = new Map<number, string>();
      for (const [key, value] of nodeToIndex) {
        indexToNode.set(value, key);
      }

      for (let i = 0; i < data.nodes.length; i++) {
        const nodeKey = indexToNode.get(i);
        const node = data.nodes[i];
        if (nodeKey && node) {
          initialPositions[nodeKey] = [node.x!, node.y!];
        }
      }

      setData(GNFAJsonToGraphData(newGnfa.toJSON(), initialPositions));
      if (newGnfa.isFinal()) {
        const regexStrings = newGnfa.getRegexStrings();
        const startState = newGnfa.getStartState();
        const acceptState = newGnfa.getAcceptState();

        if (regexStrings[startState]?.[acceptState] !== undefined) {
          setFinalRegex(regexStrings[startState][acceptState]);
        } else {
          setFinalRegex("");
        }
      } else {
        setFinalRegex("");
      }
    }
  }

  const handleRelabel = () => {
    if (!nfa)
      return;

    const relabeled = nfa.relabeled();
    const relabelMap = nfa.getRelabelingMap();
    const initialPositions: Record<string, [number, number]> = {};
    const nodeToIndex = data.nodeToIndex;
    const indexToNode = new Map<number, string>();
    for (const [key, value] of nodeToIndex) {
      indexToNode.set(value, relabelMap.get(key)!);
    }

    for (let i = 0; i < data.nodes.length; i++) {
      const nodeKey = indexToNode.get(i);
      const node = data.nodes[i];
      if (nodeKey && node) {
        initialPositions[nodeKey] = [node.x!, node.y!];
      }
    }

    setNFA(relabeled);
    setData(NFAJsonToGraphData(relabeled.toJSON(), initialPositions));
    setCurrentStates([]);
    setInputPos(0);
    setSimulation(null);
    setIsGNFA(false);
    setIsRemovingState(false);
    setIsReducingToRegex(false);
    setGnfa(null);
    setFinalRegex("");
  }

  const handleToggleTrashState = () => {
    setTrashStateHidden(prev => !prev);
    if (nfa) {
      const newNFA = trashStateHidden ? nfa.trashStatesAdded() : nfa.trashStatesRemoved();
      setNFA(newNFA);
      const initialPositions: Record<string, [number, number]> = {};
      const nodeToIndex = data.nodeToIndex;
      const indexToNode = new Map<number, string>();
      for (const [key, value] of nodeToIndex) {
        indexToNode.set(value, key);
      }

      for (let i = 0; i < data.nodes.length; i++) {
        const nodeKey = indexToNode.get(i);
        const node = data.nodes[i];
        if (nodeKey && node) {
          initialPositions[nodeKey] = [node.x!, node.y!];
        }
      }

      setData(NFAJsonToGraphData(newNFA.toJSON(), initialPositions));
      setCurrentStates([]);
      setInputPos(0);
      setSimulation(null);
      setIsGNFA(false);
      setIsRemovingState(false);
      setIsReducingToRegex(false);
      setGnfa(null);
      setFinalRegex("");
    }
  }

  return (
    <>
      <main className="flex flex-col items-center justify-center w-full px-6">
        <div className="flex flex-col md:flex-row justify-start w-full max-w-6xl mx-auto py-4 gap-6">
          {/* NFA and Buttons Section*/}
          <div className="md:w-1/2 flex flex-col items-center justify-start gap-4 text-sm">
            {/* Regex to NFA input box & button */}
            <div className="flex flex-row items-center justify-center w-full gap-4">
              <input
                type="text"
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                placeholder="Enter a regular expression"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
                className="p-2 text-blue-300 w-full bg-gray-800 font-mono border-2 border-gray-600 rounded-md"
              />
              <button
                onClick={() => {
                  try {
                    if (!regexInput) {
                      setRegexInputError("Are you sure you want empty regex? Enter () for empty regex.");
                      return;
                    }
                    const parsed = parseRegex(regexInput) ?? new EmptySet();
                    const nfa = parsed.toNFA();
                    setNFA(nfa);
                    setData(NFAJsonToGraphData(nfa.toJSON()));
                    setCurrentStates([]);
                    setInputPos(0);
                    setSimulation(null);
                    setIsGNFA(false);
                    setIsRemovingState(false);
                    setIsReducingToRegex(false);
                    setGnfa(null);
                    setRegexInputError("");
                    setFinalRegex("");
                  } catch (e) {
                    setRegexInputError((e as Error).message);
                  }
                }}
                className="bg-cyan-900 text-white rounded-md py-2 px-4 font-bold border-2 border-cyan-800 w-2/5">
                Regex to NFA
              </button>
            </div>
            {/* error message here */}
            {regexInputError && <p className="text-red-500 font-bold">{regexInputError}</p>}

            {/* Buttons: Convert to DFA, Minimize, Relabel and Copy to Table */}
            <div className="flex flex-row justify-between gap-4 w-full">
              <button
                onClick={() => {
                  if (!nfa)
                    return;
                  const newNFA = nfa.toDFA().toNFA();
                  setNFA(newNFA);
                  setData(NFAJsonToGraphData(newNFA.toJSON()));
                  setCurrentStates([]);
                  setInputPos(0);
                  setSimulation(null);
                  setIsGNFA(false);
                  setIsRemovingState(false);
                  setIsReducingToRegex(false);
                  setGnfa(null);
                  setFinalRegex("");
                }}
                className="bg-green-700 text-white font-bold rounded-md py-2 px-2 border-2 border-green-600 w-full"
              >
                NFA to DFA
              </button>
              <button
                onClick={() => {
                  if (!nfa)
                    return;

                  // nfa needs to be a DFA, otherwise display an error message
                  if (!nfa.isDFA()) {
                    alert("NFA needs to be a DFA to minimize"); // TODO: make this more user friendly
                    return;
                  }

                  const minimized = nfa.toDFA().minimized().toNFA();
                  setNFA(minimized);
                  setData(NFAJsonToGraphData(minimized.toJSON()));
                  setCurrentStates([]);
                  setInputPos(0);
                  setSimulation(null);
                  setIsGNFA(false);
                  setIsRemovingState(false);
                  setIsReducingToRegex(false);
                  setGnfa(null);
                  setFinalRegex("");
                }}
                className="bg-green-700 text-white font-bold rounded-md py-2 px-2 border-2 border-green-600 w-full"
              >
                Minimize
              </button>
              <button
                onClick={handleRelabel}
                className="bg-green-700 text-white font-bold rounded-md py-2 px-2 border-2 border-green-600 w-full"
              >
                Relabel
              </button>
              <button
                onClick={() => {
                  if (!nfa)
                    return;
                  setTableNfaJson(nfa.toJSON());
                }}
                className="bg-green-700 text-white font-bold rounded-md py-2 px-2 border-2 border-green-600 w-full"
              >
                Copy to Table
              </button>
            </div>
            {/* Buttons: Simplify to Regex, Convert to GNFA */}
            <div className="flex flex-row justify-left gap-4 w-full">
              <button
                onClick={() => {
                  setIsReducingToRegex(true);
                }}
                className="bg-green-700 text-white font-bold rounded-md py-2 px-2 border-2 border-green-600 w-full"
              >
                Simplify to Regex
              </button>
              {isReducingToRegex && <button
                onClick={() => {
                  setIsGNFA(true);
                  if (!nfa) return;
                  const newGnfa = GNFA.fromNFA(nfa);
                  setGnfa(newGnfa);
                  setData(GNFAJsonToGraphData(newGnfa.toJSON()));
                  setCurrentStates([]);
                  setInputPos(0);
                  setSimulation(null);
                  if (newGnfa.isFinal()) {
                    const regexStrings = newGnfa.getRegexStrings();
                    const startState = newGnfa.getStartState();
                    const acceptState = newGnfa.getAcceptState();

                    if (regexStrings[startState]?.[acceptState] !== undefined) {
                      setFinalRegex(regexStrings[startState][acceptState]);
                    } else {
                      setFinalRegex("");
                    }
                  } else {
                    setFinalRegex("");
                  }

                }}
                className="bg-green-700 text-white font-bold rounded-md py-2 px-2 border-2 border-green-600 w-full"
              >
                Convert to GNFA
              </button>}
              {isGNFA && (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  {/* Toggle remove state */}
                  <button
                    className={`${isRemovingState ? "bg-blue-500" : "bg-red-500"} text-white text-sm font-bold py-2 px-2 rounded w-full`}
                    onClick={() => setIsRemovingState(prev => !prev)}
                  >
                    {isRemovingState ? "Stop Removing States" : "Start Removing States"}
                  </button>
                </div>
              )}
            </div>
            {/* Simulation Part */}
            <div style={{ position: 'relative' }}>
              <Graph data={data} activeNodes={new Set(currentStates)} isRemovingState={isRemovingState} handleDeleteState={handleDeleteState} />

              {!isRemovingState && <button
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 100,
                }}
                className={`${trashStateHidden ? "bg-green-500 border-green-600" : "bg-red-500 border-red-600"} text-white font-bold rounded-md py-2 px-1 text-xs border-2 max-w-24`}
                onClick={handleToggleTrashState}
                title="Trash States are states that have no path to the accept state"
              >
                {/* Hide Trash States */}
                {trashStateHidden ? "Show" : "Hide"} Trash States
              </button>}
            </div>
            {finalRegex && <textarea
              className="p-2 text-green-500 w-full h-10 bg-gray-800 border-2 border-green-600 rounded-md resize-none"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
              rows={10}
              cols={50}
              value={finalRegex}
              readOnly
            />}
            <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input string"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
                className="p-2 text-blue-300 w-full sm:w-2/3 bg-gray-800 font-mono border-2 border-gray-600 rounded-md"
              />
              <button
                onClick={() => {
                  setInputPos(0);
                  setCurrentStates([]);
                  if (nfa) {
                    setSimulation(nfa.simulation(input));
                  }
                }}
                className="bg-cyan-900 text-white rounded-md py-2 text-sm font-bold border-2 border-cyan-800 w-full sm:w-1/3"
              >
                Simulate
              </button>
            </div>
            {/* Buttons Below */}
            <div className="flex flex-row justify-center gap-4 w-full">
              <button
                onClick={() => {
                  // Navigate or open the "Build Your Own" page/modal
                }}
                className="bg-blue-700 text-white font-bold rounded-md py-2 px-4 border-2 border-blue-600 flex-1 sm:flex-none"
              >
                Save NFA
              </button>
              <button
                onClick={() => {
                  // Open file dialog or navigate to "Load" functionality
                }}
                className="bg-green-700 text-white font-bold rounded-md py-2 px-4 border-2 border-green-600 flex-1 sm:flex-none"
              >
                Load NFA
              </button>
            </div>

          </div>

          {/* Input Table Section */}
          <div className="md:w-1/2 flex flex-col items-center justify-start gap-4">
            {/* Text box to enter a custom NFA JSON */}
            <InputTable onNFAChange={handleNFAChange} initialNFA={tableNfaJson} />
            <textarea
              className="p-2 text-blue-300 w-full h-52 bg-gray-800 font-mono border-2 border-gray-600 rounded-md text-xs resize-none"
              rows={10}
              cols={50}
              value={nfaJson}
              onChange={(e) => {
                setNFAJson(e.target.value);
              }}
            />
            <button
              onClick={() => {
                try {
                  const json = JSON.parse(nfaJson) as NFAJson;
                  setNFA(new NFA(json.startState, json.acceptStates, json.table));
                  setData(NFAJsonToGraphData(json));
                  setCurrentStates([]);
                  setInputPos(0);
                  setSimulation(null);
                  setIsGNFA(false);
                  setIsRemovingState(false);
                  setIsReducingToRegex(false);
                  setGnfa(null);
                  setFinalRegex("");
                } catch (error) {
                  console.error("Invalid JSON:", error);
                  // Optionally, add user feedback for invalid JSON
                }
              }}
              className="bg-cyan-900 text-white rounded-md py-2 px-4 text-sm font-bold border-2 border-cyan-800 w-full"
            >
              Build NFA
            </button>
          </div>
        </div>
      </main>
      <footer>
        {/* Basic padding for now */}
        <div className="py-16"></div>
      </footer>
    </>
  );
}
