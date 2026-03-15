import type { SystemSnapshot } from "@/lib/types";
import { ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface BeforeAfterProps {
  before: SystemSnapshot;
  after: SystemSnapshot;
}

function DiffCell({
  label,
  before,
  after,
  unit,
  lowerIsBetter,
}: {
  label: string;
  before: number;
  after: number;
  unit: string;
  lowerIsBetter: boolean;
}) {
  const diff = after - before;
  const improved = lowerIsBetter ? diff < 0 : diff > 0;
  const worsened = lowerIsBetter ? diff > 0 : diff < 0;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-800 last:border-0">
      <span className="text-xs text-surface-400">{label}</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-surface-500 font-mono">
          {before}
          {unit}
        </span>
        <ArrowRight size={12} className="text-surface-600" />
        <span
          className={`font-mono font-medium ${improved ? "text-success" : worsened ? "text-danger" : "text-surface-300"}`}
        >
          {after}
          {unit}
        </span>
        {diff !== 0 && (
          <span
            className={`flex items-center gap-0.5 text-xs ${improved ? "text-success" : "text-danger"}`}
          >
            {improved ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {Math.abs(diff)}
            {unit}
          </span>
        )}
        {diff === 0 && <Minus size={12} className="text-surface-600" />}
      </div>
    </div>
  );
}

export default function BeforeAfter({ before, after }: BeforeAfterProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-3">
        Before / After Comparison
      </h3>
      <div className="flex items-center gap-2 mb-4 text-xs text-surface-500">
        <span className="badge bg-surface-700 text-surface-400">
          {before.label}
        </span>
        <ArrowRight size={12} />
        <span className="badge bg-accent/15 text-accent">{after.label}</span>
      </div>
      <div>
        <DiffCell
          label="Startup Apps"
          before={before.startup_app_count}
          after={after.startup_app_count}
          unit=""
          lowerIsBetter={true}
        />
        <DiffCell
          label="Processes"
          before={before.process_count}
          after={after.process_count}
          unit=""
          lowerIsBetter={true}
        />
        <DiffCell
          label="RAM Used"
          before={before.ram_used_mb}
          after={after.ram_used_mb}
          unit=" MB"
          lowerIsBetter={true}
        />
        <DiffCell
          label="CPU Usage"
          before={Math.round(before.cpu_usage_percent)}
          after={Math.round(after.cpu_usage_percent)}
          unit="%"
          lowerIsBetter={true}
        />
      </div>
    </div>
  );
}
