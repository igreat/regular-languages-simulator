import '~/styles/globals.css';
import MainPage from './_components/MainPage';
import { db } from '~/server/db';

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const presetNfas = await db.query.nfaTable.findMany({
    orderBy: (model, { desc }) => desc(model.lastAccessedAt),
  });

  return (
    <MainPage presetNfas={presetNfas} />
  );
}