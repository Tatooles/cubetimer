import { SegmentedControl } from "../../shared/components/SegmentedControl";
import { Toggle } from "../../shared/components/Toggle";
import type { TimerSettings } from "../sessions/types";

type SettingsPanelProps = {
  settings: TimerSettings;
  onChange: (settings: TimerSettings) => void;
  floating?: boolean;
  onClose?: () => void;
};

export function SettingsPanel({
  settings,
  onChange,
  floating = false,
  onClose,
}: SettingsPanelProps) {
  function update<Key extends keyof TimerSettings>(key: Key, value: TimerSettings[Key]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <section
      className={`border border-white/10 bg-zinc-950 p-4 shadow-2xl shadow-black/50 ${
        floating ? "fixed bottom-6 right-6 z-40 w-72 rounded-xl" : "rounded-xl"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
          Settings
        </h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-100"
          >
            x
          </button>
        ) : null}
      </div>
      <div className="space-y-4 text-sm text-zinc-300">
        <div className="flex items-center justify-between gap-3">
          <span>Density</span>
          <SegmentedControl
            label="Density"
            value={settings.density}
            options={[
              { value: "comfortable", label: "Comfy" },
              { value: "compact", label: "Compact" },
            ]}
            onChange={(value) => update("density", value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <span>Graph</span>
          <Toggle
            checked={settings.showGraph}
            onChange={(value) => update("showGraph", value)}
            label="Toggle graph"
          />
        </div>
        <div className="flex items-center justify-between">
          <span>Histogram</span>
          <Toggle
            checked={settings.showHistogram}
            onChange={(value) => update("showHistogram", value)}
            label="Toggle histogram"
          />
        </div>
        <div className="flex items-center justify-between">
          <span>Scramble draw</span>
          <Toggle
            checked={settings.showDraw}
            onChange={(value) => update("showDraw", value)}
            label="Toggle scramble draw"
          />
        </div>
        <div className="flex items-center justify-between">
          <span>Inspection</span>
          <Toggle
            checked={settings.inspection}
            onChange={(value) => update("inspection", value)}
            label="Toggle inspection"
          />
        </div>
      </div>
    </section>
  );
}
