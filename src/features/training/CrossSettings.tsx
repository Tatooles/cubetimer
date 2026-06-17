import { Toggle } from "../../shared/components/Toggle";
import type { CrossColor, CrossSettings as CrossSettingsValue, RevealMode } from "./types";

const COLORS: Array<{ id: CrossColor; className: string }> = [
  { id: "white", className: "bg-zinc-100" },
  { id: "yellow", className: "bg-yellow-300" },
  { id: "green", className: "bg-green-500" },
  { id: "blue", className: "bg-blue-500" },
  { id: "red", className: "bg-red-500" },
  { id: "orange", className: "bg-orange-500" },
];

type CrossSettingsProps = {
  settings: CrossSettingsValue;
  onChange: (patch: Partial<CrossSettingsValue>) => void;
};

function settingLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
      <div>
        <div className="text-sm font-medium text-zinc-200">{label}</div>
        <div className="mt-0.5 text-xs text-zinc-600">{description}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function CrossSettings({ settings, onChange }: CrossSettingsProps) {
  function setRevealMode(revealMode: RevealMode) {
    onChange({ revealMode });
  }

  return (
    <section className="h-full overflow-y-auto border-white/[0.07] px-5 py-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
        Settings
      </div>

      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-200">Cross color</legend>
          <div className="grid grid-cols-3 gap-2">
            {COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                aria-label={`${settingLabel(color.id)} cross`}
                aria-pressed={settings.color === color.id}
                onClick={() => onChange({ color: color.id })}
                className={`flex h-10 items-center justify-center rounded-md border text-xs font-medium text-zinc-200 transition ${
                  settings.color === color.id
                    ? "border-indigo-300 bg-indigo-400/10"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                }`}
              >
                <span
                  className={`mr-2 h-4 w-4 rounded-full border border-black/30 ${color.className}`}
                />
                {settingLabel(color.id)}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-zinc-200">Move target</span>
            <span className="font-mono text-sm text-zinc-400">{settings.moveTarget}</span>
          </div>
          <input
            type="range"
            min="4"
            max="12"
            step="1"
            value={settings.moveTarget}
            onChange={(event) => onChange({ moveTarget: Number(event.currentTarget.value) })}
            className="w-full accent-indigo-400"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-700">
            <span>4</span>
            <span>12</span>
          </div>
        </label>

        <div>
          <div className="mb-2 text-sm font-medium text-zinc-200">Reveal mode</div>
          <div className="grid grid-cols-2 rounded-md border border-white/[0.07] bg-black p-1">
            {[
              ["one", "One at a time"],
              ["all", "All at once"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={settings.revealMode === value}
                onClick={() => setRevealMode(value as RevealMode)}
                className={`rounded px-2 py-2 text-xs font-medium transition ${
                  settings.revealMode === value
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <ToggleRow
            label="XCross practice"
            description="Include first-pair continuation."
            checked={settings.xcross}
            onChange={(xcross) => onChange({ xcross })}
          />
          <ToggleRow
            label="Short scramble"
            description="Use a shorter setup scramble."
            checked={settings.shortScramble}
            onChange={(shortScramble) => onChange({ shortScramble })}
          />
          <ToggleRow
            label="15s inspection"
            description="Show an inspection prompt."
            checked={settings.inspection}
            onChange={(inspection) => onChange({ inspection })}
          />
        </div>
      </div>
    </section>
  );
}
