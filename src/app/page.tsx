import '~/styles/globals.css';
import MainPage from './_components/MainPage';
import exampleNfa from "data/even_0s_or_1s_nfa.json";
import { defaultNfas } from 'data/default_nfas';
import { NFAJson } from '~/simulator/nfa';
import { getMyFirstPresetNfa, insertNfa } from '~/server/queries';

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialNfa: NFAJson = exampleNfa;
  try {
    const firstNfaQuery = await getMyFirstPresetNfa();
    if (firstNfaQuery) {
      initialNfa = {
        startState: firstNfaQuery.startState,
        acceptStates: firstNfaQuery.acceptStates,
        table: firstNfaQuery.table,
      } as NFAJson;
    } else {
      // Insert the default NFAs into the database
      for (const nfa of defaultNfas) {
        await insertNfa(nfa);
      }
    }
  } catch (error) {
    console.log("Error fetching initial NFA:", error);
    // Insert the default NFAs into the database
    for (const nfa of defaultNfas) {
      await insertNfa(nfa);
    }
  }

  return (
    <MainPage initialNfa={initialNfa} />
  );
}