"use client";

import type { CommunityPlace } from "@/lib/data/types";
import { formatDisplayDate } from "@/lib/data/normalize";
import { ArrowLeft, ArrowUpRight, Flag } from "lucide-react";
import { PanelHeaderControls } from "@/components/map/PanelHeaderControls";

export function CommunityDetailContent({
  place,
  onClose,
  onBack,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  place: CommunityPlace;
  onClose: () => void;
  onBack?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
}) {
  const location = [place.locality, place.city].filter(Boolean).join(", ");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 inline-flex items-center gap-1 text-xs text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <ArrowLeft size={14} strokeWidth={2} aria-hidden />
              Back to list
            </button>
          ) : null}
          <h2 className="text-xl font-medium leading-tight text-[var(--ink)]">
            {place.place_name}
          </h2>
          {location ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{location}</p>
          ) : null}
          <p className="text-sm text-[var(--muted)]">{place.district}</p>
        </div>
        <PanelHeaderControls
          onClose={onClose}
          onPrev={onPrev}
          onNext={onNext}
          canPrev={canPrev}
          canNext={canNext}
        />
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
          <div>
            <dt className="text-[var(--muted)]"># of Reports</dt>
            <dd className="text-[var(--ink)]">{place.similar_report_count}</dd>
          </div>
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
