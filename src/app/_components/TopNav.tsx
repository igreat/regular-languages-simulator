import Link from "next/link";
import { FaGithub } from 'react-icons/fa';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function TopNav() {
  return (
    <nav className="flex items-center justify-between px-8 py-3 bg-gray-800 text-white text-lg font-bold mb-6">
      <div className="flex gap-10">
        <Link
          className="text-white"
          href="/"
        >
          📖 Regular Languages Simulator
        </Link>
        <a
          href="https://github.com/igreat/regular-languages-simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white flex gap-2 text-base items-center"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          <FaGithub className="h-6 w-6" />
          Source Code
        </a>
      </div>
      <div>
        <SignedOut>
          <SignInButton>
            {/* a well styled sign in button */}
            <div className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-8 rounded-lg cursor-pointer text-center">
              Sign In
            </div>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonBox: {
                  width: '40px', 
                  height: '40px',
                },
                userButtonAvatarBox: {
                  width: '100%', 
                  height: '100%',
                },
                userButtonAvatarImage: {
                  width: '100%', 
                  height: '100%',
                },
              }
            }}
          />
        </SignedIn>
      </div>
    </nav>
  );
}