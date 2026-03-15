import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TweakDefinition, TweakCategory as TCat } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import TweakCard from "./TweakCard";

interface TweakCategoryProps {
  category: TCat;
  tweaks: TweakDefinition[];
  statusMap: Record<string, boolean>;
  onStatusChange: () => void;
}

export default function TweakCategory({
  category,
  tweaks,
  statusMap,
  onStatusChange,
}: TweakCategoryProps) {
  const [open, setOpen] = useState(true);
  const appliedCount = tweaks.filter((t) => statusMap[t.id]).length;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        {open ? (
          <ChevronDown size={18} className="text-surface-500" />
        ) : (
          <ChevronRight size={18} className="text-surface-500" />
        )}
        <h2 className="text-base font-semibold text-white group-hover:text-accent transition-colors">
          {CATEGORY_LABELS[category]}
        </h2>
        <span className="text-xs text-surface-500">
          {appliedCount}/{tweaks.length} applied
        </span>
      </button>

      {open && (
        <div className="grid gap-3 ml-1">
          {tweaks.map((tweak) => (
            <TweakCard
              key={tweak.id}
              tweak={tweak}
              applied={statusMap[tweak.id] ?? false}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
