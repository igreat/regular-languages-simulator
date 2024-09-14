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
    const [newSymbol, setNewSymbol] = React.useState<string>("");

    useEffect(() => {
        if (initialDFA) {
            const stateIds = Object.keys(initialDFA.table).map(Number);
            setStates(stateIds);
            const symbols = new Set<string>();
            stateIds.forEach((state) => {
                if (!initialDFA.table[state]) return;
                Object.keys(initialDFA.table[state]).forEach((sym) => {
                    symbols.add(sym);
                });
            });
            setInputSymbols(Array.from(symbols));
            setAcceptStates(initialDFA.acceptStates);
            setTable(initialDFA.table);
        } else {
            // Initialize with default DFA
            setStates([0]);
            setInputSymbols(["a", "b"]);
            setAcceptStates([0]);
            setTable({ 0: { a: 0, b: 0 } });
        }
    }, [initialDFA]);

    useEffect(() => {
        onDFAChange(JSON.stringify({ acceptStates, table }, null, 2));
    }, [acceptStates, table, onDFAChange]);

    const handleAddSymbol = () => {
        const sym = newSymbol.trim();
        if (sym.length !== 1) {
            alert("Input symbol must be a single character.");
            return;
        }
        if (inputSymbols.includes(sym)) {
            return;
        }
        setInputSymbols([...inputSymbols, sym]);
    };

    // Allow adding symbol by pressing Enter key
    const handleNewSymbolKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddSymbol();
        }
    }

    return (
        <div className="p-4 bg-gray-800 text-white rounded-md w-full max-w-md overflow-x-auto">
            {/* Section to add a new input symbol */}
            <div className="flex items-center mb-4">
                <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    onKeyDown={handleNewSymbolKeyPress}
                    maxLength={1}
                    className="w-12 bg-gray-700 text-white px-2 py-1 rounded-md mr-2"
                    placeholder="Symbol"
                />
                <button
                    onClick={handleAddSymbol}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                    disabled={newSymbol.trim().length !== 1 || inputSymbols.includes(newSymbol.trim())}
                    title={
                        newSymbol.trim().length !== 1
                            ? "Enter a single character"
                            : inputSymbols.includes(newSymbol.trim())
                                ? "Symbol already exists"
                                : "Add Symbol"
                    }
                >
                    +
                </button>
            </div>

            {/* DFA Transition Table */}
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
                        <th className="border border-gray-700 px-2 py-1">Delete</th>
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
                                        value={
                                            table[state]?.[sym] !== undefined
                                                ? `${table[state][sym]}`
                                                : ""
                                        }
                                        className="w-full bg-gray-700 text-white px-1 py-0.5 rounded"
                                        placeholder={`${state}`}
                                        onChange={(e) => {
                                            const newTable = { ...table };
                                            if (!newTable[state]) newTable[state] = {};
                                            const value = e.target.value;
                                            // Ensure that the input is a number
                                            const num = value != "" ? Number(value) : Number.NaN;
                                            if (!isNaN(num) && Number.isInteger(num) && num >= 0 && states.includes(num)) {
                                                newTable[state][sym] = num;
                                            } else {
                                                delete newTable[state][sym];
                                            }
                                            setTable(newTable);
                                        }}
                                    />
                                </td>
                            ))}
                            <td className="border border-gray-700 px-2 py-1 text-center">
                                <input
                                    type="checkbox"
                                    checked={acceptStates.includes(state)}
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
                            <td className="border border-gray-700 px-2 py-1 text-center">
                                <button
                                    onClick={() => {
                                        const newTable = { ...table };
                                        delete newTable[state];
                                        setTable(newTable);
                                        setStates(states.filter((s) => s !== state));
                                        setAcceptStates(acceptStates.filter((s) => s !== state));
                                    }}
                                    className="bg-red-800 text-white rounded-md px-2.5 py-0.5 font-bold w-full"
                                    title="Delete State"
                                >
                                    ✘
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td className="border border-gray-700 px-2 py-1">
                            <button
                                onClick={() => {
                                    const newState = states.length > 0 ? Math.max(...states) + 1 : 0;
                                    setStates([...states, newState]);
                                    setTable({ ...table, [newState]: {} });
                                }}
                                className="bg-blue-500 text-white rounded-md px-2.5 py-0.5 font-bold text-xl w-full"
                                title="Add State"
                            >
                                +
                            </button>
                        </td>
                        {inputSymbols.map((sym) => (
                            <td key={sym} className="border border-gray-700 px-2 py-1"></td>
                        ))}
                        <td className="border border-gray-700 px-2 py-1"></td>
                        <td className="border border-gray-700 px-2 py-1"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}


export default DFAInputTable;
