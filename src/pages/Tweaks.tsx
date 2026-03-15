import { useMemo } from "react";
import TweakCategoryComponent from "@/components/tweaks/TweakCategory";
import { useTweaks } from "@/hooks/useTweaks";
import type { TweakCategory, TweakDefinition } from "@/lib/types";
import { CATEGORY_ORDER } from "@/lib/types";

export default function Tweaks() {
  const { tweaks, statusMap, loading, refresh } = useTweaks();

  const grouped = useMemo(() => {
    const map = new Map<TweakCategory, TweakDefinition[]>();
    for (const t of tweaks) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [tweaks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  const appliedTotal = Object.values(statusMap).filter(Boolean).length;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">All Tweaks</h1>
            <p className="text-sm text-surface-400 mt-1">
              {tweaks.length} tweaks available — {appliedTotal} currently applied
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {CATEGORY_ORDER.map((cat) => {
          const catTweaks = grouped.get(cat);
          if (!catTweaks || catTweaks.length === 0) return null;
          return (
            <TweakCategoryComponent
              key={cat}
              category={cat}
              tweaks={catTweaks}
              statusMap={statusMap}
              onStatusChange={refresh}
            />
          );
        })}
      </div>
    </div>
  );
}
