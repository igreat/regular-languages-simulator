import '~/styles/globals.css';
import MainPage from './MainPage';
import { NFAJson, NFATransitionTable } from '~/simulator/nfa';
import { db } from '~/server/db';
import exampleNfa from "../../data/even_0s_or_1s_nfa.json";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const presetNfas = await db.query.nfa.findMany();
  
  return (
    <>
      <MainPage presetNfas={presetNfas} />
    </>
  );
}