import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { CSPostHogProvider } from './_analytics/provider';

import TopNav from "./_components/TopNav";
import Footer from "./_components/Footer";

import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: "Automata Simulator",
  description: "A feature rich Regular Languages simulator",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <CSPostHogProvider>
        <html lang="en" className={`${GeistSans.variable}`}>
          <body>
            <TopNav />
            {children}
            <Footer />
          </body>
        </html>
      </CSPostHogProvider>
    </ClerkProvider>
  );
}
