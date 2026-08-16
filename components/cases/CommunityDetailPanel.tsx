"use client";

import type { CommunityPlace } from "@/lib/data/types";
import { formatDisplayDate } from "@/lib/data/normalize";
import { ArrowUpRight, Flag, X } from "lucide-react";

interface CommunityDetailPanelProps {
  place: CommunityPlace | null;
  onClose: () => void;
}

export function CommunityDetailPanel({
  place,
  onClose,
}: CommunityDetailPanelProps) {
  const open = Boolean(place);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[rgba(15,23,22,0.28)] transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-[-12px_0_40px_rgba(15,23,22,0.08)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label="Reported place details"
      >
        {place ? <PanelContent place={place} onClose={onClose} /> : null}
      </aside>
    </>
  );
}

function PanelContent({
  place,
  onClose,
}: {
  place: CommunityPlace;
  onClose: () => void;
}) {
  const location = [place.locality, place.city].filter(Boolean).join(", ");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="text-xl font-medium leading-tight text-[var(--ink)]">
            {place.place_name}
          </h2>
          {location ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{location}</p>
          ) : null}
          <p className="text-sm text-[var(--muted)]">{place.district}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1.5 rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          aria-label="Close panel"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <div className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
          <Flag size={13} strokeWidth={2.25} aria-hidden />
          Community report
        </div>

        {place.concern ? (
          <section>
            <h3 className="text-xs text-[var(--muted)]">Concern</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">
              {place.concern}
            </p>
          </section>
        ) : null}

        {place.address ? (
          <section>
            <h3 className="text-xs text-[var(--muted)]">Address</h3>
            <p className="mt-2 text-sm text-[var(--ink)]">{place.address}</p>
          </section>
        ) : null}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Reported</dt>
            <dd className="text-[var(--ink)]">
              {formatDisplayDate(place.submitted_at)}
            </dd>
          </div>
          {place.similar_report_count > 1 ? (
            <div>
              <dt className="text-[var(--muted)]">Similar reports</dt>
              <dd className="text-[var(--ink)]">{place.similar_report_count}</dd>
            </div>
          ) : null}
        </dl>

        {place.evidence.length > 0 ? (
          <section>
            <h3 className="text-xs text-[var(--muted)]">Evidence</h3>
            <ul className="mt-3 space-y-2">
              {place.evidence.map((item) => (
                <li key={item.id} className="text-sm">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span className="text-[var(--ink)]">{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
          <p className="text-xs text-[var(--muted)]">
            Reported by the public. Not an official enforcement action.
          </p>
          {place.maps_url ? (
            <a
              href={place.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              Open Map
              <ArrowUpRight size={14} strokeWidth={2.25} aria-hidden />
            </a>
          ) : null}
        </section>
      </div>
    </div>
  );
}
