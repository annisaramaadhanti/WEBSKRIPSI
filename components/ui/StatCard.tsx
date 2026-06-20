export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-[#E8ECF4] rounded-[20px] p-[22px] shadow-[0_4px_12px_rgba(11,30,75,0.09)] transition-all hover:-translate-y-px hover:shadow-md">
      <div className="uppercase font-semibold text-[11px] text-[#8A95A3] tracking-[0.4px] mb-1.5">{label}</div>
      <div className="font-bold text-[30px] text-[#0B1E4B]">{value}</div>
    </div>
  );
}
