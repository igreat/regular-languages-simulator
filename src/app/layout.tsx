import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';

import Link from "next/link";
import { FaGithub } from 'react-icons/fa';

export const metadata: Metadata = {
  title: "Automata Simulator",
  description: "A simple DFA simulator",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

function TopNav() {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white text-xl font-bold">
      <div className="flex gap-4">
        <Link
          className="text-white"
          href="/"
        >
          Automata Simulator
        </Link>
        <a
          href="https://github.com/igreat/regular-languages-simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white flex gap-2 text-base items-center"
        >
          <FaGithub className="h-6 w-6" />
          Check out the code
        </a>
      </div>
      <Link href="/login">
        Log In
      </Link>
    </nav>
  );
}

function Footer() {
  // just a simple link to what DFAs, NFAs and Regexes and Regular Languages are
  return (
    // set font family to JetBrains Mono
    <footer className="p-4 bg-gray-800 text-white text-sm" style={{ fontFamily: "JetBrains Mono, monospace" }}>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <h2 className="text-base">Learn More...</h2>
        <ul>
          <li>
            <a href="https://en.wikipedia.org/wiki/Deterministic_finite_automaton" className="underline">
              What is a DFA?
            </a>
          </li>
          <li>
            <a href="https://en.wikipedia.org/wiki/Nondeterministic_finite_automaton" className="underline">
              What is an NFA?
            </a>
          </li>
          <li>
            <a href="https://en.wikipedia.org/wiki/Regular_expression" className="underline">
              What is a Regex (Regular Expression)?
            </a>
          </li>
        </ul>
        <p>
          What they all have in common is that they all describe <span> </span>
          <a href="https://en.wikipedia.org/wiki/Regular_language" className="underline">Regular Languages</a>,
          which is why we can convert them to and from each other
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="flex flex-col gap-4">
        <TopNav />{children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
