type StatCardProps = {
  label: string;
  value: string;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="min-h-16 rounded-lg border border-[#1d2633] bg-[#0f151e] px-3 py-2.5 max-[680px]:min-h-[50px] max-[680px]:p-[7px]">
      <span className="text-[0.72rem] font-bold text-[#8d99aa] uppercase max-[680px]:text-[0.62rem]">{label}</span>
      <strong className="mt-[5px] block text-[1.14rem] text-slate-50 tabular-nums max-[680px]:text-[0.95rem]">{value}</strong>
    </div>
  );
}
