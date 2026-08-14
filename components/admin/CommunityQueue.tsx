"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import {
  approveCommunityRequestAction,
  investigateCommunityRequestAction,
  markCommunityRequestDuplicateAction,
  rejectCommunityRequestAction,
} from "@/lib/admin/actions";
import type {
  CommunityRequest,
  PublishedPlaceOption,
  RejectionReason,
} from "@/lib/admin/types";
import { COMMUNITY_REJECTION_REASONS } from "@/lib/admin/types";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/data/normalize";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DuplicatePicker } from "@/components/admin/DuplicatePicker";
import { QueueToolbar } from "@/components/admin/QueueToolbar";
import { StatusChip } from "@/components/admin/StatusChip";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "investigating", label: "Investigating" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicate", label: "Duplicate" },
  { value: "all", label: "All" },
];

type ConfirmKind = "approve" | "reject" | "duplicate" | "investigate" | null;

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
      if (confirm === "investigate") {
        await investigateCommunityRequestAction(targetId);
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
          {visible.map((request) => (
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
                    {[request.locality, request.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip status={request.status} />
                  <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-xs font-medium">
                    {request.similar_report_count}{" "}
                    {request.similar_report_count === 1 ? "request" : "requests"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
                “{request.concern}”
              </p>
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
          ))}
        </ul>
      )}

      <CommunityDrawer
        request={selected}
        onClose={() => setSelectedId(null)}
        onApprove={() => selected && openConfirm("approve", selected.id)}
        onReject={() => selected && openConfirm("reject", selected.id)}
        onDuplicate={() => selected && openConfirm("duplicate", selected.id)}
        onInvestigate={() => selected && openConfirm("investigate", selected.id)}
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
      {confirm === "investigate" ? (
        <ConfirmDialog
          title="Mark as investigating"
          body="Keep this request out of the pending queue while it is being looked into. It is still not an FDA enforcement record."
          confirmLabel="Investigate"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
        />
      ) : null}
    </div>
  );
}

function CommunityDrawer({
  request,
  onClose,
  onApprove,
  onReject,
  onDuplicate,
  onInvestigate,
}: {
  request: CommunityRequest | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDuplicate: () => void;
  onInvestigate: () => void;
}) {
  const open = Boolean(request);
  const canAct =
    request?.status === "pending" || request?.status === "investigating";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[rgba(15,23,22,0.28)] transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-[var(--border)] bg-[var(--panel)] shadow-[-12px_0_40px_rgba(15,23,22,0.08)] transition-transform duration-300 ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {request ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-xl font-medium">{request.place_name}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {[request.locality, request.city].filter(Boolean).join(", ")}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 text-sm">
              <StatusChip status={request.status} />
              <section>
                <h3 className="text-xs text-[var(--muted)]">Place</h3>
                <dl className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-xs text-[var(--muted)]">Name</dt>
                    <dd>{request.place_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--muted)]">Address</dt>
                    <dd>{request.address || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--muted)]">Locality</dt>
                    <dd>{request.locality || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--muted)]">City</dt>
                    <dd>{request.city || "—"}</dd>
                  </div>
                </dl>
                <a
                  href={request.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-0.5 text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  Open Google Maps
                  <ArrowUpRight size={14} />
                </a>
              </section>
              <section>
                <h3 className="text-xs text-[var(--muted)]">Report</h3>
                <p className="mt-2 leading-relaxed">“{request.concern}”</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Submitted {formatDisplayDateTime(request.submitted_at)}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Submitter: {request.submitter || "Not collected"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Similar reports: {request.similar_report_count}
                </p>
                {request.evidence.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {request.evidence.map((item) => (
                      <li key={item.id}>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent)] hover:underline"
                          >
                            {item.label}
                          </a>
                        ) : (
                          item.label
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    No evidence attached.
                  </p>
                )}
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
                  {request.status === "pending" ? (
                    <button
                      type="button"
                      onClick={onInvestigate}
                      className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
                    >
                      Investigate
                    </button>
                  ) : null}
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
