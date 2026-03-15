import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  accent?: boolean;
}

export default function StatCard({
  label,
  value,
  subtext,
  icon,
  accent = false,
}: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`p-2 rounded-lg ${accent ? "bg-accent/15 text-accent" : "bg-surface-800 text-surface-400"}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-surface-500 mt-0.5">{label}</p>
      {subtext && (
        <p className="text-[11px] text-surface-600 mt-1">{subtext}</p>
      )}
    </div>
  );
}
