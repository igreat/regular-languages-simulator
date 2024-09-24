import Link from "next/link";
import { FaGithub } from 'react-icons/fa';

export default function TopNav() {
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