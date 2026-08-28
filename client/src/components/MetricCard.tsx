import { ArrowUpRight, LucideIcon } from "lucide-react";

export default function MetricCard({ label, value, detail, icon: Icon, tone = "green" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: "green" | "teal" | "amber" | "blue" }) {
  const tones = {
    green: "text-[#c8ff4f] bg-[#19372f]",
    teal: "text-[#7be0c4] bg-[#14383a]",
    amber: "text-[#f0cb75] bg-[#392f1c]",
    blue: "text-[#85cbef] bg-[#183242]",
  };
  return (
    <div className="soft-card lift rounded-2xl border hairline p-5">
      <div className="flex items-start justify-between gap-3"><span className="micro-label text-[#739589]">{label}</span><div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" /></div></div>
      <div className="mt-6 flex items-end justify-between gap-3"><div><div className="text-3xl font-semibold tracking-[-0.07em] text-[#f0f4eb]">{value}</div><div className="mt-2 text-xs text-[#7da395]">{detail}</div></div><ArrowUpRight className="mb-1 h-4 w-4 text-[#6c9c88]" /></div>
    </div>
  );
}
