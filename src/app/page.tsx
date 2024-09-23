import '~/styles/globals.css';
import MainPage from './MainPage';
import { NFAJson, NFATransitionTable } from '~/simulator/nfa';
import { db } from '~/server/db';
import exampleNfa from "../../data/even_0s_or_1s_nfa.json";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialNfaData = await db.query.nfa.findFirst();
  const initialNfa: NFAJson  = initialNfaData ? {
    startState: initialNfaData.startState,
    acceptStates: initialNfaData.acceptStates,
    table: initialNfaData.table as NFATransitionTable
  } : exampleNfa;

  return (
    <MainPage initialNfa={initialNfa} />
  );
}