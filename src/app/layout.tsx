import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';

import Link from "next/link";

export const metadata: Metadata = {
  title: "Automata Simulator",
  description: "A simple DFA simulator",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

function TopNav() {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white text-xl font-bold">
      <Link
        className="text-white"
        href="/"
      >
        Automata Simulator
      </Link>
      <div className="flex gap-4">
        <Link href="/login">
          Log In
        </Link>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="flex flex-col gap-4">
        <TopNav />{children}
        <Analytics />
        </body>
    </html>
  );
}
