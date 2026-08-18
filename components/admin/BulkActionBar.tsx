"use client";

interface BulkActionBarProps {
  selectedCount: number;
  approveCount: number;
  rejectCount: number;
  unpublishCount: number;
  restoreCount: number;
  onApprove: () => void;
  onReject: () => void;
  onUnpublish: () => void;
  onRestore: () => void;
  onClear: () => void;
  approveClassName?: string;
}

export function BulkActionBar({
  selectedCount,
  approveCount,
  rejectCount,
  unpublishCount,
  restoreCount,
  onApprove,
  onReject,
  onUnpublish,
  onRestore,
  onClear,
  approveClassName = "bg-[var(--accent)] text-white",
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const buttonClass =
    "rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface)]";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5">
      <p className="text-sm text-[var(--ink)]">
        <span className="font-medium tabular-nums">{selectedCount}</span>{" "}
        selected
      </p>
      {approveCount > 0 ? (
        <button
          type="button"
          onClick={onApprove}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${approveClassName}`}
        >
          Approve ({approveCount})
        </button>
      ) : null}
      {rejectCount > 0 ? (
        <button type="button" onClick={onReject} className={buttonClass}>
          Reject ({rejectCount})
        </button>
      ) : null}
      {unpublishCount > 0 ? (
        <button type="button" onClick={onUnpublish} className={buttonClass}>
          Remove from map ({unpublishCount})
        </button>
      ) : null}
      {restoreCount > 0 ? (
        <button type="button" onClick={onRestore} className={buttonClass}>
          Move to queue ({restoreCount})
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto rounded-md px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
      >
        Clear
      </button>
    </div>
  );
}
