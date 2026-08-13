"use client";

import type { CSSProperties } from "react";
import type { MapCase } from "@/lib/data/types";
import {
  formatDisplayDate,
  formatLabel,
  formatStatus,
} from "@/lib/data/normalize";
import { pinAccent } from "@/lib/data/status";
import { StatusIcon } from "@/components/status/StatusIcon";

interface CaseDetailPanelProps {
  mapCase: MapCase | null;
  onClose: () => void;
}

export function CaseDetailPanel({ mapCase, onClose }: CaseDetailPanelProps) {
  const open = Boolean(mapCase);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-[rgba(15,23,22,0.28)] transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[420px] flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-[-12px_0_40px_rgba(15,23,22,0.08)] transition-transform duration-300 ease-out md:absolute md:top-0 md:bottom-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
        aria-label="Case details"
      >
        {mapCase ? <PanelContent mapCase={mapCase} onClose={onClose} /> : null}
      </aside>
    </>
  );
}

function PanelContent({
  mapCase,
  onClose,
}: {
  mapCase: MapCase;
  onClose: () => void;
}) {
  const { case: enforcementCase, establishment } = mapCase;
  const accent = pinAccent(enforcementCase.status);
  const history = [...enforcementCase.status_history].sort((a, b) =>
    a.effective_date.localeCompare(b.effective_date),
  );
  const showTimeline = history.length >= 2;

  return (
    <div
      className="flex h-full flex-col"
      style={
        {
          "--case-accent": accent.pin,
          "--case-accent-ink": accent.ink,
        } as CSSProperties
      }
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Enforcement case
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--ink)]">
            {establishment.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {[establishment.locality, establishment.city]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="text-sm text-[var(--muted)]">{establishment.district}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[var(--border)] px-2.5 py-1 text-sm text-[var(--ink)] transition hover:bg-[var(--surface)]"
          aria-label="Close panel"
        >
          Esc
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <div
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide text-white"
          style={{ backgroundColor: accent.pin }}
        >
          <StatusIcon status={enforcementCase.status} size={13} color="#fff" />
          {formatStatus(enforcementCase.status)}
        </div>

        <section>
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Action
          </h3>
          <p className="mt-2 text-sm text-[var(--ink)]">
            {formatLabel(enforcementCase.case_type)}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Inspection</dt>
              <dd className="text-[var(--ink)]">
                {formatDisplayDate(enforcementCase.inspection_date)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Action date</dt>
              <dd className="text-[var(--ink)]">
                {formatDisplayDate(enforcementCase.action_date)}
              </dd>
            </div>
          </dl>
        </section>

        {enforcementCase.summary ? (
          <section>
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Summary
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">
              {enforcementCase.summary}
            </p>
          </section>
        ) : null}

        {enforcementCase.violations.length > 0 ? (
          <section>
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Why?
            </h3>
            <ul className="mt-2 space-y-2">
              {enforcementCase.violations.map((violation) => (
                <li
                  key={violation.id}
                  className="border-l-2 border-[var(--case-accent)] pl-3 text-sm leading-relaxed text-[var(--ink)]"
                >
                  {violation.description}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {showTimeline ? (
          <section>
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Timeline
            </h3>
            <ol className="mt-3 space-y-3 border-l border-[var(--border)] pl-5">
              {history.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[28px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--panel)]">
                    <StatusIcon
                      status={event.status}
                      size={13}
                      color={pinAccent(event.status).pin}
                    />
                  </span>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDisplayDate(event.effective_date)}
                  </p>
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {formatLabel(event.status)}
                  </p>
                  {event.notes ? (
                    <p className="text-xs text-[var(--muted)]">{event.notes}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {enforcementCase.sources.length > 0 ? (
          <section>
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Sources
            </h3>
            <ul className="mt-3 space-y-3">
              {enforcementCase.sources.map((source) => (
                <li key={source.id} className="text-sm">
                  <p className="font-medium text-[var(--ink)]">
                    {source.source_name}
                  </p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-[var(--case-accent-ink)] underline-offset-2 hover:underline"
                  >
                    {source.title}
                  </a>
                  {source.published_at ? (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      Published {formatDisplayDate(source.published_at)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
          <p>
            Verification: {formatLabel(enforcementCase.verification_status)}
          </p>
          <p className="mt-1">
            Last updated {formatDisplayDate(enforcementCase.updated_at)}
          </p>
          {establishment.location_accuracy !== "exact" ? (
            <p className="mt-1">
              Location accuracy: {formatLabel(establishment.location_accuracy)}
              . Pin is placed at neighbourhood / city level, not the exact
              doorway.
            </p>
          ) : null}
          {establishment.maps_url ? (
            <p className="mt-2">
              <a
                href={establishment.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--case-accent-ink)] underline-offset-2 hover:underline"
              >
                Open map search
              </a>
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
