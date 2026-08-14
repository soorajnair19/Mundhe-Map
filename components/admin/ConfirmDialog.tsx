"use client";

import type { ReactNode } from "react";

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "accent" | "danger";
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  tone = "accent",
  children,
  onCancel,
  onConfirm,
  pending,
}: ConfirmDialogProps) {
  const confirmClass =
    tone === "danger"
      ? "bg-[#8B1E1E] text-white"
      : "bg-[var(--accent)] text-white";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(15,23,22,0.36)] px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-medium text-[var(--ink)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
        {children}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${confirmClass}`}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
