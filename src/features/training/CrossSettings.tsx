import { Toggle } from "../../shared/components/Toggle";
import type { CrossColor, CrossSettings as CrossSettingsValue } from "./types";

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
  function toggleColor(color: CrossColor, checked: boolean) {
    const colors = checked
      ? [...settings.colors, color]
      : settings.colors.filter((selected) => selected !== color);

    if (colors.length === 0) {
      return;
    }

    onChange({ colors });
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
            {COLORS.map((color) => {
              const checked = settings.colors.includes(color.id);
              const locked = checked && settings.colors.length === 1;

              return (
                <label
                  key={color.id}
                  className={`flex h-10 items-center justify-center rounded-md border text-xs font-medium text-zinc-200 transition ${
                    checked
                      ? "border-indigo-300 bg-indigo-400/10"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={locked}
                    onChange={(event) => toggleColor(color.id, event.currentTarget.checked)}
                    className="sr-only"
                  />
                  <span
                    className={`mr-2 h-4 w-4 rounded-full border border-black/30 ${color.className}`}
                  />
                  {settingLabel(color.id)}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="block">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-zinc-200">Move target</span>
            <span className="font-mono text-sm text-zinc-400">{settings.moveTarget}</span>
          </div>
          <input
            type="range"
            min="3"
            max="8"
            step="1"
            value={settings.moveTarget}
            onChange={(event) => onChange({ moveTarget: Number(event.currentTarget.value) })}
            className="w-full accent-indigo-400"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-700">
            <span>3</span>
            <span>8</span>
          </div>
        </label>

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
        </div>
      </div>
    </section>
  );
}
