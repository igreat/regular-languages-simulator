import { NFAJson } from "~/simulator/nfa";
import even_0s_or_1s_nfa from "./even_0s_or_1s_nfa.json";
import postfix_aba_nfa from "./postfix_aba_nfa.json";

export const defaultNfas: (NFAJson & { title: string })[] = [
    { title: "Even 0s or 1s", ...even_0s_or_1s_nfa },
    { title: "Postfix 'aba'", ...postfix_aba_nfa },
];