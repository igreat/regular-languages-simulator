"use client";
import React, { useEffect } from "react";
import type { NFAJson, NFATransitionTable } from "~/simulator/nfa";

type InputTableProps = {
    onNFAChange: (nfaJson: string) => void;
    initialNFA?: NFAJson;
};

function DFAInputTable({ onNFAChange, initialNFA }: InputTableProps) {
    const [states, setStates] = React.useState<number[]>([]);
    const [statesSet, setStatesSet] = React.useState<Set<number>>(new Set());
    const [inputSymbols, setInputSymbols] = React.useState<string[]>([]);
    const [acceptStates, setAcceptStates] = React.useState<number[]>([]);
    // before setting table I need to validate and parse it
    const [tableText, setTableText] = React.useState<Record<number, Record<string, string>>>({});
    const [table, setTable] = React.useState<NFATransitionTable>({});
    const [inputError, setInputError] = React.useState<string>("");
    const [newSymbol, setNewSymbol] = React.useState<string>("");

    useEffect(() => {
        if (initialNFA) {
            const stateIds = Object.keys(initialNFA.table).map(Number);
            setStates(stateIds);
            const symbols = new Set<string>();
            stateIds.forEach((state) => {
                if (!initialNFA.table[state]) return;
                Object.keys(initialNFA.table[state]).forEach((sym) => {
                    symbols.add(sym);
                });
            });
            setStatesSet(new Set(Object.keys(initialNFA.table).map(Number)));
            setInputSymbols(Array.from(symbols));
            setAcceptStates(initialNFA.acceptStates);
            setTable(initialNFA.table);
        } else {
            // Initialize with default DFA
            setStates([0]);
            setStatesSet(new Set([0]));
            setInputSymbols(["a", "b"]);
            setAcceptStates([0]);
            setTable({ 0: { a: [0], b: [0] } });
        }
    }, [initialNFA]);

    useEffect(() => {
        onNFAChange(JSON.stringify({ acceptStates, table }, null, 2));
    }, [acceptStates, table, onNFAChange]);

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
        <div className="p-4 bg-gray-800 text-white rounded-md w-full overflow-x-auto">
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
                        <th className="border border-gray-700 px-2 py-1"></th>
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
                                        value={tableText[state]?.[sym] ?? ""}
                                        className="w-full bg-gray-700 text-white px-1 py-0.5 rounded"
                                        placeholder={`${state}`}
                                        onChange={(e) => {
                                            const newTableText = { ...tableText };
                                            if (!newTableText[state]) newTableText[state] = {};
                                            newTableText[state][sym] = e.target.value;
                                            setTableText(newTableText);
                                            // validate and parse
                                            try {
                                                const newTable = validateTableText(newTableText, statesSet);
                                                setTable(newTable);
                                                setInputError("");
                                            } catch (e: any) {
                                                setInputError(e.message);
                                            }
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
                                        setStatesSet(new Set(states.filter((s) => s !== state)));
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
                                    setStatesSet(new Set([...states, newState]));
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
            {inputError && <p className="text-red-500 mt-2">{inputError}</p>}
        </div>
    );
}

function validateTableText(tableText: Record<number, Record<string, string>>, statesSet: Set<number>): NFATransitionTable {
    const table: NFATransitionTable = {};
    for (const state in tableText) {
        const stateTransitions = tableText[state];
        const transitions: Record<string, number[]> = {};
        for (const symbol in stateTransitions) {
            let transition = stateTransitions[symbol];
            if (!transition) continue;
            // if last character is comma, remove it
            if (transition[transition.length - 1] == ',') {
                transition = transition.slice(0, -1);
            }
            const states = transition.split(",").map((s) => parseInt(s));
            if (states?.some((s) => isNaN(s))) {
                throw new Error(`Non numeric target state for state ${state} and symbol ${symbol}`);
            } else if (states?.some((s) => !statesSet.has(s))) {
                throw new Error(`Target state for state ${state} and symbol ${symbol} is not in the list of states`);
            }
            transitions[symbol] = states ?? [];
        }
        table[parseInt(state)] = transitions;
    }
    return table;
}


export default DFAInputTable;