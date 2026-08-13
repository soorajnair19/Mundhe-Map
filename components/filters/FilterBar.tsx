"use client";

import type { CaseFilters } from "@/lib/data/types";
import {
  ACTION_FILTER_OPTIONS,
  DATE_PRESET_OPTIONS,
} from "@/lib/data/load";

interface FilterBarProps {
  filters: CaseFilters;
  districts: string[];
  onChange: (next: CaseFilters) => void;
}

const SELECT_CLASS =
  "filter-select rounded-md border border-[var(--border)] py-2 text-sm normal-case tracking-normal text-[var(--ink)]";

export function FilterBar({ filters, districts, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:px-6">
      <label className="flex min-w-[140px] flex-col gap-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
        Date
        <select
          className={SELECT_CLASS}
          value={filters.datePreset}
          onChange={(event) =>
            onChange({
              ...filters,
              datePreset: event.target.value as CaseFilters["datePreset"],
              from: null,
              to: null,
            })
          }
        >
          {DATE_PRESET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-[160px] flex-col gap-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
        District
        <select
          className={SELECT_CLASS}
          value={filters.district ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              district: event.target.value || null,
            })
          }
        >
          <option value="">All districts</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-[180px] flex-col gap-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
        Action
        <select
          className={SELECT_CLASS}
          value={filters.action ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              action: (event.target.value ||
                null) as CaseFilters["action"],
            })
          }
        >
          <option value="">All actions</option>
          {ACTION_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {(filters.district ||
        filters.action ||
        filters.datePreset !== "all") && (
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm text-[var(--accent)] underline-offset-2 hover:underline"
          onClick={() =>
            onChange({
              datePreset: "all",
              from: null,
              to: null,
              district: null,
              action: null,
              verification: null,
            })
          }
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
