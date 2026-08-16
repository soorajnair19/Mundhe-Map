"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import {
  approveCommunityRequestAction,
  markCommunityRequestDuplicateAction,
  rejectCommunityRequestAction,
} from "@/lib/admin/actions";
import type {
  CommunityRequest,
  PublishedPlaceOption,
  RejectionReason,
} from "@/lib/admin/types";
import { COMMUNITY_REJECTION_REASONS } from "@/lib/admin/types";
import { formatDisplayDate, normalizeName } from "@/lib/data/normalize";
import { COMMUNITY_REQUEST_FIELDS, isImageEvidenceUrl } from "@/lib/community/schema";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DuplicatePicker } from "@/components/admin/DuplicatePicker";
import { QueueToolbar } from "@/components/admin/QueueToolbar";
import { StatusChip } from "@/components/admin/StatusChip";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicate", label: "Duplicate" },
  { value: "all", label: "All" },
];

type ConfirmKind = "approve" | "reject" | "duplicate" | null;

function placeKey(request: CommunityRequest): string {
  return `${normalizeName(request.place_name)}|${normalizeName(request.city ?? "")}`;
}

function similarReportCount(
  request: CommunityRequest,
  all: CommunityRequest[],
): number {
  const key = placeKey(request);
  return all.filter((item) => item.id !== request.id && placeKey(item) === key)
    .length;
}

function formatPlaceLocation(
  locality: string | null,
  city: string | null,
): string {
  return [...new Set([locality, city].filter(Boolean))].join(", ");
}

interface CommunityQueueProps {
  requests: CommunityRequest[];
  publishedPlaces: PublishedPlaceOption[];
}

export function CommunityQueue({
  requests,
  publishedPlaces,
}: CommunityQueueProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [reason, setReason] = useState<RejectionReason>("insufficient_evidence");
  const [notes, setNotes] = useState("");
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pendingCount = requests.filter((item) => item.status === "pending").length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (status !== "all" && request.status !== status) return false;
      if (!needle) return true;
      const hay = [
        request.place_name,
        request.locality,
        request.city,
        request.address,
        request.concern,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [query, requests, status]);

  const selected = requests.find((item) => item.id === selectedId) ?? null;
  const targetId = confirmId ?? selectedId;

  function openConfirm(kind: ConfirmKind, id: string) {
    setConfirmId(id);
    setConfirm(kind);
    setReason("insufficient_evidence");
    setNotes("");
    setDuplicateOf(null);
  }

  async function runConfirm() {
    if (!targetId || !confirm) return;
    setPending(true);
    try {
      if (confirm === "approve") await approveCommunityRequestAction(targetId);
      if (confirm === "reject") {
        await rejectCommunityRequestAction(targetId, reason, notes || null);
      }
      if (confirm === "duplicate") {
        await markCommunityRequestDuplicateAction(targetId, duplicateOf);
      }
      setConfirm(null);
      setSelectedId(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-medium text-[var(--ink)]">
          Community Requests
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Places people have asked FDA to inspect. These are not enforcement
          cases and must never be labelled as violations.
        </p>
        <p className="mt-2 text-sm text-[var(--ink)]">
          <span className="font-medium tabular-nums">{pendingCount}</span>{" "}
          pending
        </p>
      </header>

      <QueueToolbar
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        statuses={STATUSES}
        placeholder="Search place, city, concern…"
      />

      {visible.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--panel)] px-6 py-12 text-center text-sm text-[var(--muted)]">
          No community requests in this view.
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((request) => {
            const similar = similarReportCount(request, requests);
            return (
            <li
              key={request.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium text-[var(--ink)]">
                    {request.place_name}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {formatPlaceLocation(request.locality, request.city)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={request.status} />
                  {similar > 0 ? (
                    <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-xs font-medium">
                      {similar} similar
                    </span>
                  ) : null}
                </div>
              </div>
              {request.concern ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
                  “{request.concern}”
                </p>
              ) : null}
              <p className="mt-2 text-xs text-[var(--muted)]">
                Submitted {formatDisplayDate(request.submitted_at)}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedId(request.id)}
                  className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-sm font-medium text-white"
                >
                  Review
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      <CommunityDrawer
        request={selected}
        similarCount={
          selected ? similarReportCount(selected, requests) : 0
        }
        onClose={() => setSelectedId(null)}
        onApprove={() => selected && openConfirm("approve", selected.id)}
        onReject={() => selected && openConfirm("reject", selected.id)}
        onDuplicate={() => selected && openConfirm("duplicate", selected.id)}
      />

      {confirm === "approve" ? (
        <ConfirmDialog
          title="Approve request"
          body="This request has passed moderation and can later be shown publicly as a request for inspection. It is not a verified FDA violation or enforcement action."
          confirmLabel="Approve"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
        />
      ) : null}
      {confirm === "reject" ? (
        <ConfirmDialog
          title="Reject request"
          body="The request will leave the pending queue and stay in local review history."
          confirmLabel="Reject"
          tone="danger"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
        >
          <label className="mt-4 block text-xs text-[var(--muted)]">
            Reason
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value as RejectionReason)}
            >
              {COMMUNITY_REJECTION_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs text-[var(--muted)]">
            Notes (optional)
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </ConfirmDialog>
      ) : null}
      {confirm === "duplicate" ? (
        <ConfirmDialog
          title="Mark as duplicate"
          body="This submission will be stored as a duplicate of an existing place and removed from the pending queue."
          confirmLabel="Mark duplicate"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
        >
          <DuplicatePicker
            places={publishedPlaces}
            selectedId={duplicateOf}
            onSelect={setDuplicateOf}
            valueKey="establishmentId"
          />
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function CommunityDrawer({
  request,
  similarCount,
  onClose,
  onApprove,
  onReject,
  onDuplicate,
}: {
  request: CommunityRequest | null;
  similarCount: number;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDuplicate: () => void;
}) {
  const open = Boolean(request);
  const canAct = request?.status === "pending";
  const location = request
    ? formatPlaceLocation(request.locality, request.city)
    : "";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[rgba(15,23,22,0.28)] transition-opacity duration-200 ${
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
        aria-label="Community request details"
      >
        {request ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-xl font-medium leading-tight text-[var(--ink)]">
                  {request.place_name}
                </h2>
                {location ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">{location}</p>
                ) : null}
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
              <StatusChip status={request.status} />

              {request.concern ? (
                <section>
                  <h3 className="text-xs text-[var(--muted)]">Concern</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">
                    {request.concern}
                  </p>
                </section>
              ) : null}

              {request.address ? (
                <section>
                  <h3 className="text-xs text-[var(--muted)]">Address</h3>
                  <p className="mt-2 text-sm text-[var(--ink)]">
                    {request.address}
                  </p>
                </section>
              ) : null}

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[var(--muted)]">Reported</dt>
                  <dd className="text-[var(--ink)]">
                    {formatDisplayDate(request.submitted_at)}
                  </dd>
                </div>
                {similarCount > 0 ? (
                  <div>
                    <dt className="text-[var(--muted)]">Similar reports</dt>
                    <dd className="text-[var(--ink)]">{similarCount}</dd>
                  </div>
                ) : null}
              </dl>

              {request.evidence.length > 0 ? (
                <section>
                  <h3 className="text-xs text-[var(--muted)]">
                    {COMMUNITY_REQUEST_FIELDS.evidence.label}
                  </h3>
                  <ul className="mt-3 grid grid-cols-2 gap-2">
                    {request.evidence.map((item) => (
                      <li key={item.id}>
                        {item.url && isImageEvidenceUrl(item.url) ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-md border border-[var(--border)]"
                          >
                            {/* Uploaded photos may be data URLs in the mock store. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.url}
                              alt={item.label}
                              className="h-28 w-full object-cover"
                            />
                            <span className="block truncate px-2 py-1 text-xs text-[var(--muted)]">
                              {item.label}
                            </span>
                          </a>
                        ) : item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <span className="text-sm text-[var(--ink)]">
                            {item.label}
                          </span>
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
                {request.maps_url ? (
                  <a
                    href={request.maps_url}
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

            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-5 py-4">
              {canAct ? (
                <>
                  <button
                    type="button"
                    onClick={onApprove}
                    className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={onReject}
                    className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={onDuplicate}
                    className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
                  >
                    Mark as duplicate
                  </button>
                </>
              ) : (
                <StatusChip status={request.status} />
              )}
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
