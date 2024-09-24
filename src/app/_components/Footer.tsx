export default function Footer() {
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