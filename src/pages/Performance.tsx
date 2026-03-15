import { useEffect } from "react";
import { Cpu, HardDrive, Zap } from "lucide-react";
import { useTweakStore } from "../stores/tweakStore";
import TweakCategory from "../components/tweaks/TweakCategory";
import type { TweakCategory as TweakCategoryType } from "@/lib/types";

export default function Performance() {
  const { tweaks, statuses, fetchTweaks, fetchStatuses } = useTweakStore();

  useEffect(() => {
    fetchTweaks();
    fetchStatuses();
  }, []);

  const perfCategories = ["Performance", "Visual", "Power", "Network"];
  const perfTweaks = tweaks.filter((t) => perfCategories.includes(t.category));
  const grouped = perfCategories.reduce((acc, cat) => {
    const items = perfTweaks.filter((t) => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, typeof tweaks>);
  const statusMap = Object.fromEntries(statuses.map((s) => [s.tweak_id, s.applied]));

  return (
    <div className="space-y-6 stagger-children">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Optimization</h1>
        <p className="text-surface-400 text-sm mt-1">Tune Windows for maximum speed and responsiveness</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card card-animated p-4 flex items-center gap-3">
          <Cpu size={20} className="text-accent" />
          <div>
            <div className="text-sm font-medium text-white">CPU Tweaks</div>
            <div className="text-xs text-surface-400">{perfTweaks.filter(t => t.tags?.includes("cpu")).length} available</div>
          </div>
        </div>
        <div className="card card-animated p-4 flex items-center gap-3">
          <HardDrive size={20} className="text-green-400" />
          <div>
            <div className="text-sm font-medium text-white">Disk Tweaks</div>
            <div className="text-xs text-surface-400">{perfTweaks.filter(t => t.tags?.includes("disk")).length} available</div>
          </div>
        </div>
        <div className="card card-animated p-4 flex items-center gap-3">
          <Zap size={20} className="text-yellow-400" />
          <div>
            <div className="text-sm font-medium text-white">Power Tweaks</div>
            <div className="text-xs text-surface-400">{perfTweaks.filter(t => t.category === "Power").length} available</div>
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <TweakCategory
          key={category}
          category={category as TweakCategoryType}
          tweaks={items}
          statusMap={statusMap}
          onStatusChange={() => fetchStatuses()}
        />
      ))}
    </div>
  );
}
