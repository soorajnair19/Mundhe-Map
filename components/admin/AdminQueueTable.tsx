"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  Check,
  Copy,
  Eye,
  MapPinOff,
  Undo2,
  X,
} from "lucide-react";

export interface AdminQueueColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface AdminQueueTableProps<T extends { id: string }> {
  rows: T[];
  columns: AdminQueueColumn<T>[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  renderActions: (row: T) => ReactNode;
  rowLabel: (row: T) => string;
}

function SelectAllCheckbox({
  all,
  some,
  onChange,
}: {
  all: boolean;
  some: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = some && !all;
  }, [all, some]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={all}
      onChange={onChange}
      aria-label="Select all visible rows"
      className="h-4 w-4 accent-[var(--accent)]"
    />
  );
}

export function AdminQueueTable<T extends { id: string }>({
  rows,
  columns,
  selectedIds,
  onToggle,
  onToggleAll,
  renderActions,
  rowLabel,
}: AdminQueueTableProps<T>) {
  const allSelected =
    rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const someSelected = rows.some((row) => selectedIds.has(row.id));

  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--panel)]">
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--muted)]">
            <th className="w-10 px-3 py-2.5">
              <SelectAllCheckbox
                all={allSelected}
                some={someSelected}
                onChange={onToggleAll}
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-2.5 ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
            <th className="sticky right-0 w-[1%] whitespace-nowrap bg-[var(--surface)] px-3 py-2.5 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const checked = selectedIds.has(row.id);
            return (
              <tr
                key={row.id}
                className={`border-b border-[var(--border)] last:border-b-0 ${
                  checked ? "bg-[var(--surface)]" : "bg-[var(--panel)]"
                }`}
              >
                <td className="px-3 py-3 align-middle">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(row.id)}
                    aria-label={`Select ${rowLabel(row)}`}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-3 align-middle ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
                <td
                  className={`sticky right-0 w-[1%] px-3 py-3 align-middle ${
                    checked ? "bg-[var(--surface)]" : "bg-[var(--panel)]"
                  }`}
                >
                  <div className="flex flex-nowrap items-center justify-end gap-0.5">
                    {renderActions(row)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QueueIconButton({
  label,
  onClick,
  tone = "muted",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "muted" | "review" | "approve" | "reject" | "community";
  children: ReactNode;
}) {
  const tones = {
    muted: "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
    review: "text-[var(--ink)] hover:bg-[var(--surface)]",
    approve: "text-[var(--accent)] hover:bg-[var(--surface)]",
    community:
      "text-[var(--community-accent)] hover:bg-[var(--community-accent-tint)]",
    reject: "text-[#8B1E1E] hover:bg-[#f6e6e6]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function QueueRowActions({
  status,
  onReview,
  onApprove,
  onReject,
  onDuplicate,
  onUnpublish,
  onRestore,
  approveTone = "approve",
}: {
  status: string;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDuplicate: () => void;
  onUnpublish: () => void;
  onRestore: () => void;
  approveTone?: "approve" | "community";
}) {
  return (
    <>
      <QueueIconButton label="Review" onClick={onReview} tone="review">
        <Eye size={16} strokeWidth={2} />
      </QueueIconButton>
      {status === "pending" ? (
        <>
          <QueueIconButton
            label="Approve"
            onClick={onApprove}
            tone={approveTone}
          >
            <Check size={16} strokeWidth={2.25} />
          </QueueIconButton>
          <QueueIconButton label="Reject" onClick={onReject} tone="reject">
            <X size={16} strokeWidth={2.25} />
          </QueueIconButton>
          <QueueIconButton label="Duplicate" onClick={onDuplicate}>
            <Copy size={16} strokeWidth={2} />
          </QueueIconButton>
        </>
      ) : null}
      {status === "approved" ? (
        <QueueIconButton label="Remove from map" onClick={onUnpublish}>
          <MapPinOff size={16} strokeWidth={2} />
        </QueueIconButton>
      ) : null}
      {status === "rejected" || status === "duplicate" ? (
        <QueueIconButton label="Move back to queue" onClick={onRestore}>
          <Undo2 size={16} strokeWidth={2} />
        </QueueIconButton>
      ) : null}
    </>
  );
}
