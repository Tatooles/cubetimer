import { useState } from "react";
import { TimerPage } from "./features/timer/TimerPage";

function App() {
  const [activeSection, setActiveSection] = useState<"timer" | "training">("timer");

  return <TimerPage activeSection={activeSection} onSectionChange={setActiveSection} />;
}

export default App;
