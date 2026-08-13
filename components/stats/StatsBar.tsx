import type { CaseStats } from "@/lib/data/types";
import { formatDisplayDateTime } from "@/lib/data/normalize";
import { PRODUCT_NAME } from "@/lib/branding";

interface StatsBarProps {
  stats: CaseStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Cases", value: stats.totalCases },
    { label: "Licence actions", value: stats.licenceActions },
    { label: "Notices", value: stats.notices },
    { label: "Seizures", value: stats.seizures },
  ];

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 shrink-0">
        <h1 className="text-lg font-medium leading-none text-[var(--ink)] md:text-xl">
          {PRODUCT_NAME}
        </h1>
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          Updated{" "}
          {formatDisplayDateTime(process.env.NEXT_PUBLIC_BUILD_TIME ?? null)}
        </p>
      </div>

      <div
        className="grid w-full max-w-lg grid-cols-4 gap-1.5 sm:ml-auto sm:w-[min(100%,28rem)] sm:gap-2"
        role="group"
        aria-label="Case statistics"
      >
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-2 sm:px-2.5 sm:py-2.5"
          >
            <p className="text-base font-medium leading-none tabular-nums text-[var(--ink)] sm:text-lg">
              {item.value}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-[var(--muted)] sm:text-xs">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
