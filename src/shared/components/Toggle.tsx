type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[18px] w-8 rounded-full border transition ${
        checked ? "border-indigo-400 bg-indigo-500/20" : "border-white/10 bg-black"
      }`}
    >
      <span
        className={`absolute top-0.5 h-3 w-3 rounded-full transition ${
          checked ? "left-[17px] bg-indigo-300" : "left-0.5 bg-zinc-500"
        }`}
      />
    </button>
  );
}
