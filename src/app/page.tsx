import '~/styles/globals.css';
import MainPage from './_components/MainPage';
import exampleNfa from "data/even_0s_or_1s_nfa.json";
import { NFAJson } from '~/simulator/nfa';
import { getMyFirstPresetNfa } from '~/server/queries';

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialNfa: NFAJson = exampleNfa;
  try {
    const firstNfaQuery = await getMyFirstPresetNfa();
    initialNfa = (firstNfaQuery ? {
      startState: firstNfaQuery.startState,
      acceptStates: firstNfaQuery.acceptStates,
      table: firstNfaQuery.table,
    } : exampleNfa) as NFAJson;
  } catch (error) {
    console.log("Error fetching initial NFA:", error);
  }

  return (
    <MainPage initialNfa={initialNfa} />
  );
}