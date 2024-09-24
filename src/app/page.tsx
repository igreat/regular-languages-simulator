import '~/styles/globals.css';
import MainPage from './MainPage';
import { db } from '~/server/db';

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const presetNfas = await db.query.nfa.findMany();

  return (
    <>
      <MainPage presetNfas={presetNfas} />
    </>
  );
}