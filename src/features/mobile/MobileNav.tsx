export type MobileSheetId = "session" | "graph" | "draw" | "histogram" | "settings" | null;

type MobileNavProps = {
  active: MobileSheetId;
  disabled: {
    graph: boolean;
    draw: boolean;
    histogram: boolean;
  };
  onSelect: (sheet: MobileSheetId) => void;
};

const ITEMS: Array<{ id: Exclude<MobileSheetId, null>; label: string; icon: string }> = [
  { id: "session", label: "Session", icon: "#" },
  { id: "graph", label: "Graph", icon: "~" },
  { id: "draw", label: "Draw", icon: "[]" },
  { id: "histogram", label: "Hist", icon: "|" },
  { id: "settings", label: "Settings", icon: "*" },
];

export function MobileNav({ active, disabled, onSelect }: MobileNavProps) {
  return (
    <nav className="z-50 grid h-16 grid-cols-5 border-t border-white/[0.07] bg-[#0a0a0b] pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      {ITEMS.map((item) => {
        const itemDisabled =
          (item.id === "graph" && disabled.graph) ||
          (item.id === "draw" && disabled.draw) ||
          (item.id === "histogram" && disabled.histogram);
        return (
          <button
            key={item.id}
            type="button"
            disabled={itemDisabled}
            onClick={() => onSelect(active === item.id ? null : item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition ${
              active === item.id ? "text-indigo-300" : "text-zinc-600"
            } ${itemDisabled ? "opacity-35" : "hover:text-zinc-100"}`}
          >
            <span className="font-mono text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
