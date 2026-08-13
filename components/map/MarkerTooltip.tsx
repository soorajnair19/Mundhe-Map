interface MarkerTooltipProps {
  x: number;
  y: number;
  name: string;
  locality: string;
  district: string;
  statusLabel: string;
  dateLabel: string;
  accent: string;
}

export function MarkerTooltip({
  x,
  y,
  name,
  locality,
  district,
  statusLabel,
  dateLabel,
  accent,
}: MarkerTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 max-w-[240px] -translate-x-1/2 -translate-y-[calc(100%+12px)] animate-[fadeIn_160ms_ease-out] rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-2 shadow-[0_8px_24px_rgba(15,23,22,0.12)]"
      style={{ left: x, top: y }}
      role="tooltip"
    >
      <p className="font-[family-name:var(--font-display)] text-[15px] leading-tight text-[var(--ink)]">
        {name}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {locality}, {district}
      </p>
      <p
        className="mt-2 text-xs font-medium tracking-wide"
        style={{ color: accent }}
      >
        {statusLabel}
      </p>
      <p className="text-xs text-[var(--muted)]">{dateLabel}</p>
    </div>
  );
}
