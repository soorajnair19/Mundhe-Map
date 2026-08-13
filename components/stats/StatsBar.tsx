import type { CaseStats } from "@/lib/data/types";
import { formatDisplayDateTime } from "@/lib/data/normalize";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/branding";

interface StatsBarProps {
  stats: CaseStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Cases", value: stats.totalCases },
    { label: "Licence actions", value: stats.licenceActions },
    { label: "Sealed", value: stats.sealed },
    { label: "Districts", value: stats.districtsAffected },
  ];

  return (
    <header className="border-b border-[var(--border)] bg-[var(--panel)]/95 px-4 py-4 backdrop-blur-sm md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
            Independent tracker
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl leading-none text-[var(--ink)] md:text-4xl">
            {PRODUCT_NAME}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            {PRODUCT_TAGLINE}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="min-w-[108px] rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
            >
              <p className="font-[family-name:var(--font-display)] text-2xl leading-none text-[var(--ink)]">
                {item.value}
              </p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Last updated{" "}
        {stats.lastUpdated ? formatDisplayDateTime(stats.lastUpdated) : "—"}
        <span className="mx-2 text-[var(--border-strong)]">·</span>
        Counts follow active filters
      </p>
    </header>
  );
}
