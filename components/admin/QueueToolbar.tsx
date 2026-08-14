"use client";

interface QueueToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  statuses: { value: string; label: string }[];
  placeholder: string;
}

export function QueueToolbar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  statuses,
  placeholder,
}: QueueToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-[220px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />
      <div className="flex flex-wrap gap-1">
        {statuses.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusChange(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === option.value
                ? "bg-[var(--ink)] text-white"
                : "bg-[var(--panel)] text-[var(--muted)] ring-1 ring-[var(--border)] hover:text-[var(--ink)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
