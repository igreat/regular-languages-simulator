# Regular Languages Simulator

A web app for simulating regular languages, including deterministic finite automata (DFA), non-deterministic finite automata (NFA), and regular expressions. It can step by step convert between these representations and check equivalence between NFAs (NFA equivalence still doesn't have a UI 😜).

## TODO

- [x] Deploy (Vercel)
- [x] Implement the core DFA logic
- [x] Saving and loading DFA to/from JSON
- [x] Drawing DFA into page
- [x] Simulating DFA from UI
- [x] Creating DFA from UI textual (direct json)
- [x] Basic UI (React)
- [x] Creating DFA from UI textual (table ui)
- [x] Turn DFA into NFA
- [x] Simulating NFA from UI
- [x] Creating NFA from UI textual (table ui)
- [x] Make it so that if there are multiple transitions from one state to another, the link label is shown as a list of symbols
- [x] Add ability to convert NFA into DFA
- [x] Add ability to minimize DFA
- [x] Add ability to minimally and consistently relabel DFA (equivalent DFAs get the same relabeling)
- [x] Add ability to check equivalence of two NFAs
- [x] Add ability to convert regex into NFA
- [x] Add ability to convert NFA into regex
- [x] Loading preset/saved NFAs from database (Vercel Postgres)
- [x] Saving NFAs to database (Vercel Postgres)
- [x] Authentication
- [x] Make each user have their own saved NFAs
- [x] Add ability for users to delete their saved NFAs
- [ ] Add ability to stop forces and fix DFA/NFA
- [ ] Add a small manual on specific rules allowed in regex
- [x] Links unnaturally keep flipping around, fix that
- [x] Add ability to pan and zoom window (will need to slightly modify the force layout)

## Unlikely TODO

- [ ] Add ability to compare two NFAs side by side

Likely will abandon in favour of table based UI (simpler and might be more practical anyway)

~~- [ ] Creating DFA/NFA from UI drag and drop~~
~~- [ ] Editing DFA/NFA from UI~~
