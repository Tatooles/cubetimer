type SegmentedControlProps<T extends string> = {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={label}
      className="inline-flex rounded-md border border-white/10 bg-black p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded px-2.5 py-1 text-[11px] transition ${
            option.value === value
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
