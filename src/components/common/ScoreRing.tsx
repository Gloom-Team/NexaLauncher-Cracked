interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
  color?: string;
}

export default function ScoreRing({
  score,
  label,
  size = 80,
  color,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const resolvedColor =
    color ??
    (clamped >= 75
      ? "var(--color-success)"
      : clamped >= 45
        ? "var(--color-warning)"
        : "var(--color-danger)");

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-surface-800"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={resolvedColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
          style={{ color: resolvedColor }}
        >
          {clamped}
        </span>
      </div>
      <span className="text-[11px] text-surface-400 font-medium">
        {label}
      </span>
    </div>
  );
}
