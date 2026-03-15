interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function Toggle({
  enabled,
  onChange,
  disabled = false,
  loading = false,
}: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      disabled={disabled || loading}
      onClick={() => onChange(!enabled)}
      className={`toggle-animated relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface ${
        enabled ? "bg-accent shadow-[0_0_8px_-1px_rgba(99,102,241,0.4)]" : "bg-surface-700"
      } ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
    >
      <span
        className={`toggle-dot inline-block h-4 w-4 rounded-full bg-white shadow-sm ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </span>
      )}
    </button>
  );
}
