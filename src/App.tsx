import { useState } from "react";
import { TimerPage } from "./features/timer/TimerPage";

function App() {
  const [activeSection, setActiveSection] = useState<"timer" | "training">("timer");
  const showTraining = activeSection === "training";

  if (activeSection === "timer") {
    return <TimerPage activeSection={activeSection} onSectionChange={setActiveSection} />;
  }

  if (showTraining) {
    return (
      <div className="min-h-svh bg-[#0a0a0b] text-zinc-100">
        <div className="grid h-svh grid-rows-[56px_1fr] overflow-hidden">
          <header className="col-span-full flex items-center gap-4 border-b border-white/[0.07] px-4">
            <div className="flex min-w-0 shrink-0 items-center gap-2 overflow-hidden font-mono text-sm font-semibold">
              <span className="grid h-4.5 w-4.5 grid-cols-2 gap-px rounded bg-zinc-100 p-px">
                <span className="rounded-[1px] bg-indigo-400" />
                <span className="rounded-[1px] bg-black" />
                <span className="rounded-[1px] bg-black" />
                <span className="rounded-[1px] bg-black" />
              </span>
              <span>
                cube<span className="text-zinc-600">timer</span>
              </span>
            </div>
            <nav className="flex h-full items-stretch">
              <button
                type="button"
                onClick={() => setActiveSection("timer")}
                className="relative px-4 text-sm font-medium text-zinc-500 hover:text-zinc-200"
              >
                <span>Timer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("training")}
                className="relative px-4 text-sm font-medium text-indigo-200"
              >
                <span>Training</span>
                <span className="absolute inset-x-3 bottom-0 h-0.5 bg-indigo-300" />
              </button>
            </nav>
          </header>
          <main className="flex min-h-0 items-center justify-center text-zinc-500">Training</main>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
