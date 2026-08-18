"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";

interface PanelHeaderControlsProps {
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  prevLabel?: string;
  nextLabel?: string;
}

export function PanelHeaderControls({
  onClose,
  onPrev,
  onNext,
  canPrev = false,
  canNext = false,
  prevLabel = "Previous place",
  nextLabel = "Next place",
}: PanelHeaderControlsProps) {
  const showNav = Boolean(onPrev || onNext);

  return (
    <div className="-mr-1.5 flex shrink-0 items-center">
      {showNav ? (
        <>
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-30"
            aria-label={prevLabel}
          >
            <ChevronUp size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-30"
            aria-label={nextLabel}
          >
            <ChevronDown size={18} strokeWidth={2} />
          </button>
        </>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
        aria-label="Close panel"
      >
        <X size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
