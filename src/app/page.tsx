import '~/styles/globals.css';
import MainPage from './MainPage';
import { db } from "~/server/db";

export default async function HomePage() {
  return (
    <MainPage />
  );
}