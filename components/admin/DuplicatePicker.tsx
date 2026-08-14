"use client";

import { useMemo, useState } from "react";
import type { PublishedPlaceOption } from "@/lib/admin/types";

interface DuplicatePickerProps {
  places: PublishedPlaceOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  valueKey?: "caseId" | "establishmentId";
}

export function DuplicatePicker({
  places,
  selectedId,
  onSelect,
  valueKey = "caseId",
}: DuplicatePickerProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return places.slice(0, 12);
    return places
      .filter((place) => {
        const hay = [place.name, place.locality, place.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, 12);
  }, [places, query]);

  return (
    <div className="mt-4">
      <label className="text-xs text-[var(--muted)]">
        Match to an existing place
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search published establishments"
          className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>
      <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)]">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-[var(--muted)]">No matches</li>
        ) : (
          filtered.map((place) => {
            const id = place[valueKey];
            const active = selectedId === id;
            return (
              <li key={`${place.establishmentId}-${place.caseId}`}>
                <button
                  type="button"
                  onClick={() => onSelect(active ? null : id)}
                  className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                    active
                      ? "bg-[#e4f1ec]"
                      : "hover:bg-[var(--surface)]"
                  }`}
                >
                  <span className="font-medium text-[var(--ink)]">
                    {place.name}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {[place.locality, place.city].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
