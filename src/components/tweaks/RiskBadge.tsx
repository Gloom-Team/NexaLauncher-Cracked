import type { RiskLevel, Recommendation } from "@/lib/types";

interface RiskBadgeProps {
  level: RiskLevel;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const className =
    level === "Safe"
      ? "badge-safe"
      : level === "Moderate"
        ? "badge-moderate"
        : "badge-advanced";

  return <span className={className}>{level}</span>;
}

interface RecommendationBadgeProps {
  rec: Recommendation;
}

export function RecommendationBadge({ rec }: RecommendationBadgeProps) {
  if (rec === "Recommended") {
    return (
      <span className="badge bg-accent/15 text-accent-400">Recommended</span>
    );
  }
  if (rec === "Optional") {
    return (
      <span className="badge bg-surface-700 text-surface-400">Optional</span>
    );
  }
  return (
    <span className="badge bg-danger/10 text-danger/80">Advanced</span>
  );
}
