"use client";
import React, { useEffect, useRef } from "react";
import type { NFAJson, NFATransitionTable } from "~/simulator/nfa";

type InputTableProps = {
    onNFAChange: (nfaJson: string) => void;
    initialNFA?: NFAJson;
};

function InputTable({ onNFAChange, initialNFA }: InputTableProps) {
    const [states, setStates] = React.useState<string[]>([]);
    const [startState, setStartState] = React.useState<string>(""); // if not provided, default to first state in states
    const [statesSet, setStatesSet] = React.useState<Set<string>>(new Set());
    const [inputSymbols, setInputSymbols] = React.useState<string[]>([]);
    const [acceptStates, setAcceptStates] = React.useState<string[]>([]);
    // before setting table I need to validate and parse it
    const [tableText, setTableText] = React.useState<Record<string, Record<string, string>>>({});
    const [table, setTable] = React.useState<NFATransitionTable>({});
    const [inputError, setInputError] = React.useState<string>("");
    const [newSymbol, setNewSymbol] = React.useState<string>("");

    useEffect(() => {
        if (initialNFA) {
            const stateLabels = Object.keys(initialNFA.table);
            setStates(stateLabels);
            const symbols = new Set<string>();
            stateLabels.forEach((state) => {
                if (!initialNFA.table[state]) return;
                Object.keys(initialNFA.table[state]).forEach((sym) => {
                    symbols.add(sym);
                });
            });
            setStartState(initialNFA.startState);
            setStatesSet(new Set(stateLabels));
            setInputSymbols(Array.from(symbols));
            setAcceptStates(initialNFA.acceptStates);
            setTable(initialNFA.table);
            const tableText: Record<string, Record<string, string>> = {};
            for (const state in initialNFA.table) {
                const stateTransitions = initialNFA.table[state] ?? {};
                const transitions: Record<string, string> = {};
                for (const symbol in stateTransitions) {
                    transitions[symbol] = (stateTransitions[symbol] ?? []).join(",");
                }
                tableText[state] = transitions;
            }
            setTableText(tableText);
        } else {
            // Initialize with default DFA
            setStates(["0"]);
            setStartState("0");
            setStatesSet(new Set(["0"]));
            setInputSymbols(["a", "b"]);
            setAcceptStates(["0"]);
            setTable({ "0": { a: ["0"], b: ["0"] } });
        }
    }, [initialNFA]);

    useEffect(() => {
        onNFAChange(JSON.stringify({ startState, acceptStates, table }, null, 2));
    }, [startState, acceptStates, table, onNFAChange]);

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
        setNewSymbol(""); // Clear the input after adding
    };

    // Allow adding symbol by pressing Enter key
    const handleNewSymbolKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddSymbol();
        }
    }

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLoadJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.json')) {
                alert('Please select a valid .json file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = e.target?.result as string;
                    const nfa = JSON.parse(json) as NFAJson;

                    const stateLabels = Object.keys(nfa.table);
                    setStates(stateLabels);
                    const symbols = new Set<string>();
                    stateLabels.forEach((state) => {
                        if (!nfa.table[state]) return;
                        Object.keys(nfa.table[state]).forEach((sym) => {
                            symbols.add(sym);
                        });
                    });
                    setStartState(nfa.startState);
                    setStatesSet(new Set(stateLabels));
                    setInputSymbols(Array.from(symbols));
                    setAcceptStates(nfa.acceptStates);
                    setTable(nfa.table);
                    const tableText: Record<string, Record<string, string>> = {};
                    for (const state in nfa.table) {
                        const stateTransitions = nfa.table[state] ?? {};
                        const transitions: Record<string, string> = {};
                        for (const symbol in stateTransitions) {
                            transitions[symbol] = (stateTransitions[symbol] ?? []).join(",");
                        }
                        tableText[state] = transitions;
                    }
                    setTableText(tableText);
                    alert('NFA JSON loaded successfully.');
                } catch (error) {
                    alert('Invalid JSON. Please check the file content and try again.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleSaveJSON = () => {
        const json = JSON.stringify({ startState, acceptStates, table }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nfa.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 bg-gray-800 text-white rounded-md w-full overflow-x-auto text-sm">
            {/* Section to add a new input symbol and manually load/save json */}
            <div className="flex justify-between items-center mb-4 gap-2">
                <div className="flex items-center">
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
                        Add to Alphabet
                    </button>
                    <input
                        type="text"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        onKeyDown={handleNewSymbolKeyPress}
                        maxLength={1}
                        className="w-14 bg-gray-700 text-white px-2 py-1 rounded-md ml-2"
                        placeholder="eg. a"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Hidden file input for loading JSON */}
                    <input
                        type="file"
                        accept=".json,application/json"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleLoadJSON}
                    />

                    {/* Button to trigger file input */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                        title="Load NFA JSON"
                    >
                        Load JSON
                    </button>

                    {/* Button to save JSON */}
                    <button
                        onClick={handleSaveJSON}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                        title="Save NFA JSON"
                    >
                        Save JSON
                    </button>
                </div>
            </div>
            {/* DFA Transition Table */}
            <table className="min-w-full border border-gray-700">
                <thead>
                    <tr>
                        {/* New Header for Start State */}
                        <th className="border border-gray-700 px-2 py-1">Start</th>
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
                            {/* New Cell with Radio Button */}
                            <td className="border border-gray-700 px-2 py-1 text-center">
                                <input
                                    type="radio"
                                    name="startState"
                                    checked={startState === state}
                                    onChange={() => setStartState(state)}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600"
                                    aria-label={`Set ${state} as start state`}
                                    title="Set as Start State"
                                />
                            </td>
                            <td className="border border-gray-700 px-2 py-1">{state}</td>
                            {inputSymbols.map((sym) => (
                                <td key={sym} className="border border-gray-700 px-2 py-1 text-center">
                                    <input
                                        type="text"
                                        value={tableText[state]?.[sym] ?? ""}
                                        className="w-full bg-gray-700 text-white px-1 py-0.5 rounded"
                                        placeholder="∅"
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
                                            } catch (error: unknown) {
                                                if (error instanceof Error) {
                                                    setInputError(error.message);
                                                } else {
                                                    setInputError("An unknown error occurred.");
                                                }
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
                            <td className="bg-red-800 border border-gray-700 px-2 py-1 text-center">
                                <button
                                    onClick={() => {
                                        const newTableText = { ...tableText };
                                        delete newTableText[state];
                                        setTableText(newTableText);

                                        const newStates = states.filter((s) => s !== state);
                                        const newStatesSet = new Set(newStates);
                                        if (startState === state) {
                                            setStartState(newStates[0] ?? "");
                                        }
                                        setStates(newStates);
                                        setStatesSet(newStatesSet);
                                        setAcceptStates(acceptStates.filter((s) => s !== state));

                                        try {
                                            const newTable = validateTableText(newTableText, newStatesSet);
                                            setTable(newTable);
                                            setInputError("");
                                        } catch (error: unknown) {
                                            if (error instanceof Error) {
                                                setInputError(error.message);
                                            } else {
                                                setInputError("An unknown error occurred.");
                                            }
                                        }
                                    }}
                                    className="text-white px-0.5 font-bold w-full"
                                    title="Delete State"
                                >
                                    ✘
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        {/* Empty Cell for Start State Column */}
                        <td className="border border-gray-700 px-2 py-1"></td>
                        <td className="bg-blue-500 border border-gray-700">
                            <button
                                onClick={() => {
                                    // default name for now should be the maximum of all numeric states + 1
                                    const newState = (Math.max(0,
                                        ...states.map((s) => isNaN(parseInt(s)) ? 0 : parseInt(s))
                                    ) + 1).toString();
                                    const newStates = [...states, newState];
                                    setStates(newStates);
                                    setStatesSet(new Set(newStates));
                                    setTable({ ...table, [newState]: {} });
                                    // Also add a new entry to tableText
                                    const newTableText = { ...tableText };
                                    newTableText[newState] = {};
                                    setTableText(newTableText);
                                    // If it's the first state being added, set it as start state
                                    if (newStates.length === 1) {
                                        setStartState(newState);
                                    }
                                }}
                                className="text-white px-0.5 font-bold text-xl w-full"
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
                    {/* delete symbol row  */}
                    <tr>
                        {/* Empty Cell for Start State Column */}
                        <td className="border border-gray-700 px-2 py-1"></td>
                        <td className="border border-gray-700 px-2 py-1"></td>
                        {inputSymbols.map((sym) => (
                            <td key={sym} className="bg-red-800 border border-black">
                                <button
                                    onClick={() => {
                                        const newInputSymbols = inputSymbols.filter((s) => s !== sym);
                                        setInputSymbols(newInputSymbols);
                                        const newTable = { ...table };
                                        for (const state in newTable) {
                                            if (newTable[state]) {
                                                delete newTable[state][sym];
                                            }
                                        }
                                        setTable(newTable);
                                        const newTableText = { ...tableText };
                                        for (const state in newTableText) {
                                            if (newTableText[state]) {
                                                delete newTableText[state][sym];
                                            }
                                        }
                                        setTableText(newTableText);
                                    }}
                                    className=" text-white px-0.5 font-bold w-full"
                                    title="Delete Symbol"
                                >
                                    ✘
                                </button>
                            </td>
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

function validateTableText(tableText: Record<string, Record<string, string>>, statesSet: Set<string>): NFATransitionTable {
    const table: NFATransitionTable = {};
    for (const state in tableText) {
        const stateTransitions = tableText[state];
        const transitions: Record<string, string[]> = {};
        for (const symbol in stateTransitions) {
            let transition = stateTransitions[symbol];
            if (!transition) continue;
            // if last character is comma, remove it
            if (transition.endsWith(",")) {
                transition = transition.slice(0, -1);
            }
            const states = transition.split(",").map((s) => s.trim());
            if (states.some((s) => !statesSet.has(s))) {
                throw new Error(`Target state for state ${state} and symbol "${symbol}" is not in the list of states.`);
            }
            transitions[symbol] = states;
        }
        table[state] = transitions;
    }
    return table;
}

export default InputTable;
