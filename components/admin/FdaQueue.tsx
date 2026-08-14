"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import {
  approveFDAReportAction,
  markFDAReportDuplicateAction,
  rejectFDAReportAction,
  updateFDAReportAction,
} from "@/lib/admin/actions";
import type {
  FDAReport,
  PublishedPlaceOption,
  RejectionReason,
} from "@/lib/admin/types";
import { FDA_REJECTION_REASONS } from "@/lib/admin/types";
import { formatDisplayDate, formatLabel } from "@/lib/data/normalize";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DuplicatePicker } from "@/components/admin/DuplicatePicker";
import { FdaEditForm } from "@/components/admin/FdaEditForm";
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

interface FdaQueueProps {
  reports: FDAReport[];
  publishedPlaces: PublishedPlaceOption[];
}

export function FdaQueue({ reports, publishedPlaces }: FdaQueueProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [reason, setReason] = useState<RejectionReason>("insufficient_evidence");
  const [notes, setNotes] = useState("");
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pendingCount = reports.filter((r) => r.review_status === "pending").length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reports.filter((report) => {
      if (status !== "all" && report.review_status !== status) return false;
      if (!needle) return true;
      const hay = [
        report.establishment.name,
        report.establishment.locality,
        report.establishment.city,
        report.establishment.district,
        report.case.case_type,
        report.case.status,
        report.case.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [query, reports, status]);

  const selected = reports.find((report) => report.id === selectedId) ?? null;
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
      if (confirm === "approve") await approveFDAReportAction(targetId);
      if (confirm === "reject") {
        await rejectFDAReportAction(targetId, reason, notes || null);
      }
      if (confirm === "duplicate") {
        await markFDAReportDuplicateAction(targetId, duplicateOf);
      }
      setConfirm(null);
      setSelectedId(null);
      setEditing(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-medium text-[var(--ink)]">FDA Reports</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Cases that appear to have actually happened. Review before they can
          appear on the public FDA Actions map.
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
        placeholder="Search name, city, summary…"
      />

      {visible.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--panel)] px-6 py-12 text-center text-sm text-[var(--muted)]">
          No FDA reports in this view.
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((report) => (
            <li
              key={report.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium text-[var(--ink)]">
                    {report.establishment.name}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {[report.establishment.locality, report.establishment.city]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={report.review_status} />
                  <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 text-xs font-medium text-[var(--ink)]">
                    {formatLabel(report.case.case_type)}
                  </span>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-[var(--muted)]">Inspection</dt>
                  <dd>{formatDisplayDate(report.case.inspection_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Action</dt>
                  <dd>{formatDisplayDate(report.case.action_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Queued</dt>
                  <dd>{formatDisplayDate(report.queued_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Confidence</dt>
                  <dd>
                    {report.case.confidence_score == null
                      ? "—"
                      : `${Math.round(report.case.confidence_score * 100)}%`}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">
                {report.case.summary}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Sources:{" "}
                {report.case.sources.map((source) => source.source_name).join(", ") ||
                  "—"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(report.id);
                    setEditing(false);
                  }}
                  className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-sm font-medium text-white"
                >
                  Review
                </button>
                {report.review_status === "pending" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openConfirm("approve", report.id)}
                      className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => openConfirm("reject", report.id)}
                      className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => openConfirm("duplicate", report.id)}
                      className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]"
                    >
                      Duplicate
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <FdaDrawer
        report={selected}
        editing={editing}
        onClose={() => {
          setSelectedId(null);
          setEditing(false);
        }}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onApprove={() => selected && openConfirm("approve", selected.id)}
        onReject={() => selected && openConfirm("reject", selected.id)}
        onDuplicate={() => selected && openConfirm("duplicate", selected.id)}
        onSave={async (patch) => {
          if (!selected) return;
          await updateFDAReportAction(selected.id, patch);
          setEditing(false);
        }}
      />

      {confirm === "approve" ? (
        <ConfirmDialog
          title="Approve FDA report"
          body="Approval will make this case publicly visible in the FDA Actions map once the production data layer is connected. For now it will be marked approved and removed from the pending queue."
          confirmLabel="Approve"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
        />
      ) : null}
      {confirm === "reject" ? (
        <ConfirmDialog
          title="Reject FDA report"
          body="The report will leave the pending queue. It is kept in local review history, not permanently deleted."
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
              {FDA_REJECTION_REASONS.map((option) => (
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
          body="This candidate will be stored as a duplicate of an existing case or place and removed from the pending queue."
          confirmLabel="Mark duplicate"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
        >
          <DuplicatePicker
            places={publishedPlaces}
            selectedId={duplicateOf}
            onSelect={setDuplicateOf}
            valueKey="caseId"
          />
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function FdaDrawer({
  report,
  editing,
  onClose,
  onEdit,
  onCancelEdit,
  onApprove,
  onReject,
  onDuplicate,
  onSave,
}: {
  report: FDAReport | null;
  editing: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDuplicate: () => void;
  onSave: (patch: {
    establishment: FDAReport["establishment"];
    case: FDAReport["case"];
  }) => Promise<void>;
}) {
  const open = Boolean(report);

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
        {report ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-xl font-medium leading-tight">
                  {report.establishment.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {[report.establishment.locality, report.establishment.city]
                    .filter(Boolean)
                    .join(", ")}
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
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {editing ? (
                <FdaEditForm
                  establishment={report.establishment}
                  enforcementCase={report.case}
                  onCancel={onCancelEdit}
                  onSave={onSave}
                />
              ) : (
                <FdaDetail report={report} />
              )}
            </div>
            {!editing ? (
              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-5 py-4">
                {report.review_status === "pending" ? (
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
                      onClick={onEdit}
                      className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
                    >
                      Edit
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
                  <StatusChip status={report.review_status} />
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </>
  );
}

function FdaDetail({ report }: { report: FDAReport }) {
  const { establishment, case: item } = report;
  return (
    <div className="space-y-6 text-sm">
      <StatusChip status={report.review_status} />
      <section>
        <h3 className="text-xs text-[var(--muted)]">Establishment</h3>
        <dl className="mt-2 grid grid-cols-2 gap-2">
          <Field label="Name" value={establishment.name} />
          <Field label="Locality" value={establishment.locality} />
          <Field label="Address" value={establishment.address} />
          <Field label="City" value={establishment.city} />
          <Field label="District" value={establishment.district} />
          <Field label="Pincode" value={establishment.pincode} />
          <Field
            label="Business type"
            value={formatLabel(establishment.business_type)}
          />
        </dl>
        {establishment.maps_url ? (
          <a
            href={establishment.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-0.5 text-xs font-medium text-[var(--accent)] hover:underline"
          >
            Open map
            <ArrowUpRight size={14} />
          </a>
        ) : null}
      </section>
      <section>
        <h3 className="text-xs text-[var(--muted)]">Enforcement</h3>
        <dl className="mt-2 grid grid-cols-2 gap-2">
          <Field label="Case type" value={formatLabel(item.case_type)} />
          <Field label="Status" value={formatLabel(item.status)} />
          <Field
            label="Inspection"
            value={formatDisplayDate(item.inspection_date)}
          />
          <Field label="Action" value={formatDisplayDate(item.action_date)} />
          <Field
            label="Verification"
            value={formatLabel(item.verification_status)}
          />
          <Field
            label="Confidence"
            value={
              item.confidence_score == null
                ? "—"
                : `${Math.round(item.confidence_score * 100)}%`
            }
          />
        </dl>
        <p className="mt-3 leading-relaxed">{item.summary}</p>
        {item.violations.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {item.violations.map((violation) => (
              <li key={violation.id} className="border-l-2 border-[var(--accent)] pl-3">
                {violation.description}
              </li>
            ))}
          </ul>
        ) : null}
        {item.status_history.length > 0 ? (
          <ol className="mt-4 space-y-2 border-l border-[var(--border)] pl-4">
            {item.status_history.map((event) => (
              <li key={event.id}>
                <p className="text-xs text-[var(--muted)]">
                  {formatDisplayDate(event.effective_date)}
                </p>
                <p className="font-medium">{formatLabel(event.status)}</p>
                {event.notes ? (
                  <p className="text-xs text-[var(--muted)]">{event.notes}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </section>
      <section>
        <h3 className="text-xs text-[var(--muted)]">Sources</h3>
        <ul className="mt-3 space-y-3">
          {item.sources.map((source) => (
            <li key={source.id}>
              <p className="font-medium">
                {source.source_name}
                {source.is_primary ? (
                  <span className="ml-2 text-[11px] font-semibold uppercase text-[var(--accent)]">
                    Primary
                  </span>
                ) : (
                  <span className="ml-2 text-[11px] uppercase text-[var(--muted)]">
                    Secondary
                  </span>
                )}
              </p>
              <p>{source.title}</p>
              <p className="text-xs text-[var(--muted)]">
                Published {formatDisplayDate(source.published_at)}
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Open source
                <ArrowUpRight size={14} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
