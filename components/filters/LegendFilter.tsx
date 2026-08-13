"use client";

import type { ReactNode } from "react";
import { MARKER_STYLES, type MarkerKind } from "@/lib/data/status";
import { StatusIcon } from "@/components/status/StatusIcon";

interface LegendFilterProps {
  selectedKind: string | null;
  onSelect: (kind: string | null) => void;
}

const ROW_ONE: MarkerKind[] = ["suspended", "cancelled"];
const ROW_TWO: MarkerKind[] = ["sealed", "notice", "seizure", "other"];

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const chipBase =
    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition";

  if (active && color) {
    return (
      <button
        type="button"
        className={chipBase}
        style={{
          borderColor: color,
          backgroundColor: hexToRgba(color, 0.14),
          color: "var(--ink)",
        }}
        aria-pressed
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  if (active) {
    return (
      <button
        type="button"
        className={`${chipBase} border-[var(--accent)] text-[var(--ink)]`}
        style={{ backgroundColor: "rgba(15, 110, 86, 0.12)" }}
        aria-pressed
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`${chipBase} border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]`}
      aria-pressed={false}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function KindChip({
  kind,
  selectedKind,
  onSelect,
}: {
  kind: MarkerKind;
  selectedKind: string | null;
  onSelect: (kind: string | null) => void;
}) {
  const style = MARKER_STYLES[kind];
  const active = selectedKind === kind;

  return (
    <Chip
      active={active}
      color={style.color}
      onClick={() => onSelect(active ? null : kind)}
    >
      <StatusIcon kind={kind} size={12} color={style.color} />
      {style.label}
    </Chip>
  );
}

export function LegendFilter({ selectedKind, onSelect }: LegendFilterProps) {
  return (
    <div
      className="pointer-events-auto absolute bottom-4 left-4 right-4 z-10 max-w-full rounded-md border border-[var(--border)] bg-[var(--panel)]/95 px-2.5 py-2 shadow-sm backdrop-blur-sm sm:right-auto sm:max-w-md"
      role="group"
      aria-label="Filter map by action type"
    >
      <p className="mb-1.5 text-xs text-[var(--muted)]">Filter</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip
            active={selectedKind === null}
            onClick={() => onSelect(null)}
          >
            All
          </Chip>
          {ROW_ONE.map((kind) => (
            <KindChip
              key={kind}
              kind={kind}
              selectedKind={selectedKind}
              onSelect={onSelect}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {ROW_TWO.map((kind) => (
            <KindChip
              key={kind}
              kind={kind}
              selectedKind={selectedKind}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
