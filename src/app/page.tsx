import '~/styles/globals.css';
import MainPage from './_components/MainPage';
import { db } from '~/server/db';
import exampleNfa from "data/even_0s_or_1s_nfa.json";
import { NFAJson } from '~/simulator/nfa';

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const firstNfaQuery = await db.query.nfaTable.findFirst();
  const initialNfa = (firstNfaQuery ? {
    startState: firstNfaQuery.startState,
    acceptStates: firstNfaQuery.acceptStates,
    table: firstNfaQuery.table,
  } : exampleNfa) as NFAJson;
  
  return (
    <MainPage initialNfa={initialNfa} />
  );
}