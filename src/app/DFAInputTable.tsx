"use client";
import React, { useEffect } from "react";
import type { DFAJson, TransitionTable } from "../simulator/dfa";

type DFAInputTableProps = {
    onDFAChange: (dfaJson: string) => void;
    initialDFA?: DFAJson;
};

function DFAInputTable({ onDFAChange, initialDFA }: DFAInputTableProps) {
    const [states, setStates] = React.useState<number[]>([]);
    const [inputSymbols, setInputSymbols] = React.useState<string[]>([]);
    const [acceptStates, setAcceptStates] = React.useState<number[]>([]);
    const [table, setTable] = React.useState<TransitionTable>({});

    useEffect(() => {
        if (initialDFA) {
            const stateIds = Object.keys(initialDFA.table).map(Number);
            setStates(stateIds);
            const symbols = new Set<string>();
            stateIds.forEach((state) => {
                if (!initialDFA.table[state])
                    return;
                Object.keys(initialDFA.table[state]).forEach((sym) => {
                    symbols.add(sym);
                });
            });
            setInputSymbols(Array.from(symbols));
            setAcceptStates(initialDFA.acceptStates);
            setTable(initialDFA.table);
        } else {
            // initialize
            setStates([0]);
            setInputSymbols(["a", "b"]);
            setAcceptStates([0]);
            setTable({ 0: { a: 0, b: 0 } });
        }
    }, [initialDFA]);

    // Update the parent component with the new DFA data
    useEffect(() => {
        onDFAChange(JSON.stringify({ acceptStates, table }, null, 2));
    }, [acceptStates, table, onDFAChange]);

    return (
        <div className="p-4 bg-gray-800 text-white rounded-md w-full max-w-md overflow-x-auto">
            <h2 className="text-lg font-bold mb-4">DFA Input Table</h2>
            <table className="min-w-full border border-gray-700">
                <thead>
                    <tr>
                        <th className="border border-gray-700 px-2 py-1">State</th>
                        {inputSymbols.map((sym) => (
                            <th key={sym} className="border border-gray-700 px-2 py-1">
                                {sym}
                            </th>
                        ))}
                        <th className="border border-gray-700 px-2 py-1">Accept</th>
                    </tr>
                </thead>
                <tbody>
                    {states.map((state) => (
                        <tr
                            key={state}
                            className={acceptStates.includes(state) ? "bg-green-700" : ""}
                        >
                            <td className="border border-gray-700 px-2 py-1">{state}</td>
                            {inputSymbols.map((sym) => (
                                <td key={sym} className="border border-gray-700 px-2 py-1 text-center">
                                    <input
                                        type="text"
                                        defaultValue={
                                            table[state]?.[sym] !== undefined
                                                ? `${table[state]?.[sym]}`
                                                : ""
                                        }
                                        className="w-full bg-gray-700 text-white px-1 py-0.5 rounded"
                                        placeholder={`q${state}`}
                                        onChange={(e) => {
                                            const newTable = { ...table };
                                            if (!newTable[state]) newTable[state] = {};
                                            const value = e.target.value;
                                            newTable[state][sym] = value ? Number(value) : 0;
                                            setTable(newTable);
                                        }}
                                    />
                                </td>
                            ))}
                            <td className="border border-gray-700 px-2 py-1 text-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={acceptStates.includes(state)}
                                    className="w-4 h-4"
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (checked) {
                                            setAcceptStates([...acceptStates, state]);
                                        } else {
                                            setAcceptStates(acceptStates.filter((s) => s !== state));
                                        }
                                    }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DFAInputTable;
