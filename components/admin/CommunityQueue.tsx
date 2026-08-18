"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  approveCommunityRequestAction,
  bulkUpdateCommunityRequestsAction,
  markCommunityRequestDuplicateAction,
  rejectCommunityRequestAction,
  restoreCommunityRequestAction,
  unpublishCommunityRequestAction,
  updateCommunityRequestAction,
} from "@/lib/admin/actions";
import type {
  CommunityRequest,
  DuplicatePlaceOption,
  RejectionReason,
} from "@/lib/admin/types";
import { COMMUNITY_REJECTION_REASONS } from "@/lib/admin/types";
import {
  bulkSkipNote,
  isCommunityBulkEligible,
  type BulkStatusKind,
} from "@/lib/admin/bulk";
import { formatDisplayDate, normalizeName } from "@/lib/data/normalize";
import { COMMUNITY_REQUEST_FIELDS, isImageEvidenceUrl } from "@/lib/community/schema";
import { communityPinLooksApproximate } from "@/lib/community/coords";
import { AdminQueueTable, QueueRowActions } from "@/components/admin/AdminQueueTable";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { CommunityEditForm, type CommunityRequestPatch } from "@/components/admin/CommunityEditForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DuplicatePicker } from "@/components/admin/DuplicatePicker";
import { QueueToolbar } from "@/components/admin/QueueToolbar";
import { StatusChip } from "@/components/admin/StatusChip";
import { useQueueNav } from "@/components/admin/useQueueNav";
import { PanelHeaderControls } from "@/components/map/PanelHeaderControls";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicate", label: "Duplicate" },
];

type ConfirmKind = "approve" | "reject" | "duplicate" | "unpublish" | "restore";

function placeKey(name: string, city: string | null): string {
  return `${normalizeName(name)}|${normalizeName(city ?? "")}`;
}

function reportCount(
  request: CommunityRequest,
  all: CommunityRequest[],
): number {
  if (request.duplicate_of_place) {
    const target = all.find(
      (item) =>
        item.published_place_id === request.duplicate_of_place ||
        item.id === request.duplicate_of_place,
    );
    if (target) return target.similar_report_count;
  }
  const published = all.find(
    (item) =>
      item.status === "approved" &&
      placeKey(item.place_name, item.city) ===
        placeKey(request.place_name, request.city),
  );
  return published?.similar_report_count ?? request.similar_report_count;
}

function formatPlaceLocation(
  locality: string | null,
  city: string | null,
): string {
  return [...new Set([locality, city].filter(Boolean))].join(", ");
}

interface CommunityQueueProps {
  requests: CommunityRequest[];
  communityPlaceOptions: DuplicatePlaceOption[];
}

export function CommunityQueue({
  requests,
  communityPlaceOptions,
}: CommunityQueueProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [confirmTargets, setConfirmTargets] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [reason, setReason] = useState<RejectionReason>("insufficient_evidence");
  const [notes, setNotes] = useState("");
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
  const selectEntry = useCallback((id: string) => {
    setSelectedId(id);
    setEditing(false);
  }, []);
  const listNav = useQueueNav(
    visible,
    selectedId,
    selectEntry,
    Boolean(selectedId) && !editing && !confirm,
  );
  const targetId = confirmTargets[0] ?? null;
  const targetRequest = requests.find((item) => item.id === targetId) ?? null;
  const bulkKind: BulkStatusKind | null =
    confirm && confirm !== "duplicate" ? confirm : null;
  const bulkEligibleCount = bulkKind
    ? confirmTargets.filter((id) => {
        const request = requests.find((item) => item.id === id);
        return request
          ? isCommunityBulkEligible(request.status, bulkKind)
          : false;
      }).length
    : 0;

  const bulkCounts = useMemo(() => {
    const selectedRequests = requests.filter((request) =>
      selectedIds.has(request.id),
    );
    return {
      approve: selectedRequests.filter((request) =>
        isCommunityBulkEligible(request.status, "approve"),
      ).length,
      reject: selectedRequests.filter((request) =>
        isCommunityBulkEligible(request.status, "reject"),
      ).length,
      unpublish: selectedRequests.filter((request) =>
        isCommunityBulkEligible(request.status, "unpublish"),
      ).length,
      restore: selectedRequests.filter((request) =>
        isCommunityBulkEligible(request.status, "restore"),
      ).length,
    };
  }, [requests, selectedIds]);

  function resetConfirmFields() {
    setReason("insufficient_evidence");
    setNotes("");
    setDuplicateOf(null);
  }

  function openConfirm(kind: ConfirmKind, id: string) {
    setBulkMode(false);
    setConfirmTargets([id]);
    setConfirm(kind);
    resetConfirmFields();
  }

  function openBulkConfirm(kind: BulkStatusKind) {
    setBulkMode(true);
    setConfirmTargets([...selectedIds]);
    setConfirm(kind);
    resetConfirmFields();
  }

  function toggleRow(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const allSelected =
        visible.length > 0 && visible.every((row) => current.has(row.id));
      if (allSelected) return new Set();
      return new Set(visible.map((row) => row.id));
    });
  }

  async function runConfirm() {
    if (!confirm || confirmTargets.length === 0) return;
    if (confirm === "duplicate" && (!targetId || !duplicateOf)) return;
    const usingBulk = bulkMode;
    setPending(true);
    setActionError(null);
    try {
      let result: { error: string | null } = { error: null };
      if (usingBulk && confirm !== "duplicate") {
        result = await bulkUpdateCommunityRequestsAction(
          confirmTargets,
          confirm,
          { reason, notes: notes || null },
        );
      } else if (confirm === "approve" && targetId) {
        result = await approveCommunityRequestAction(targetId);
      } else if (confirm === "reject" && targetId) {
        result = await rejectCommunityRequestAction(
          targetId,
          reason,
          notes || null,
        );
      } else if (confirm === "unpublish" && targetId) {
        result = await unpublishCommunityRequestAction(targetId);
      } else if (confirm === "restore" && targetId) {
        result = await restoreCommunityRequestAction(targetId);
      } else if (confirm === "duplicate" && targetId) {
        result = await markCommunityRequestDuplicateAction(
          targetId,
          duplicateOf,
        );
      }
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setConfirm(null);
      setConfirmTargets([]);
      setBulkMode(false);
      if (usingBulk) setSelectedIds(new Set());
      if (!selectedId || confirmTargets.includes(selectedId)) {
        setSelectedId(null);
        setEditing(false);
      }
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
          Places people have asked FDA to inspect. Approving a request publishes
          it on the public community map. These are not enforcement cases and
          must never be labelled as violations.
        </p>
        <p className="mt-2 text-sm text-[var(--ink)]">
          <span className="font-medium tabular-nums">{pendingCount}</span>{" "}
          pending
        </p>
        {actionError ? (
          <p className="mt-2 text-sm text-[var(--danger,#b42318)]">{actionError}</p>
        ) : null}
      </header>

      <QueueToolbar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setSelectedIds(new Set());
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setSelectedIds(new Set());
        }}
        statuses={STATUSES}
        placeholder="Search place, city, concern…"
      />

      <BulkActionBar
        selectedCount={selectedIds.size}
        approveCount={bulkCounts.approve}
        rejectCount={bulkCounts.reject}
        unpublishCount={bulkCounts.unpublish}
        restoreCount={bulkCounts.restore}
        onApprove={() => openBulkConfirm("approve")}
        onReject={() => openBulkConfirm("reject")}
        onUnpublish={() => openBulkConfirm("unpublish")}
        onRestore={() => openBulkConfirm("restore")}
        onClear={() => setSelectedIds(new Set())}
        approveClassName="bg-[var(--community-accent)] text-white"
      />

      {visible.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--panel)] px-6 py-12 text-center text-sm text-[var(--muted)]">
          {status === "pending" && requests.some((item) => item.status === "approved")
            ? "Nothing pending. Approved places are on the community map — open the Approved filter to manage them."
            : "No community requests in this view."}
        </div>
      ) : (
        <AdminQueueTable
          rows={visible}
          selectedIds={selectedIds}
          onToggle={toggleRow}
          onToggleAll={toggleAllVisible}
          rowLabel={(request) => request.place_name}
          columns={[
            {
              key: "place",
              header: "Place",
              className: "min-w-[160px]",
              render: (request) => (
                <div>
                  <p className="font-medium text-[var(--ink)]">
                    {request.place_name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatPlaceLocation(request.locality, request.city) || "—"}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (request) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusChip status={request.status} />
                  {request.status === "approved" ? (
                    <span className="rounded-md bg-[var(--community-accent-tint)] px-2 py-0.5 text-xs font-medium text-[var(--community-accent)]">
                      On map
                    </span>
                  ) : null}
                </div>
              ),
            },
            {
              key: "concern",
              header: "Concern",
              className: "max-w-[280px]",
              render: (request) => (
                <p
                  className="max-w-[280px] truncate text-[var(--ink)]"
                  title={request.concern || undefined}
                >
                  {request.concern ? `“${request.concern}”` : "—"}
                </p>
              ),
            },
            {
              key: "reports",
              header: "Reports",
              className: "whitespace-nowrap",
              render: (request) => {
                const reports = reportCount(request, requests);
                return reports > 1 ? `${reports} reports` : "1";
              },
            },
            {
              key: "submitted",
              header: "Submitted",
              className: "whitespace-nowrap",
              render: (request) => formatDisplayDate(request.submitted_at),
            },
          ]}
          renderActions={(request) => (
            <QueueRowActions
              status={request.status}
              approveTone="community"
              onReview={() => {
                setSelectedId(request.id);
                setEditing(false);
              }}
              onApprove={() => openConfirm("approve", request.id)}
              onReject={() => openConfirm("reject", request.id)}
              onDuplicate={() => openConfirm("duplicate", request.id)}
              onUnpublish={() => openConfirm("unpublish", request.id)}
              onRestore={() => openConfirm("restore", request.id)}
            />
          )}
        />
      )}

      <CommunityDrawer
        request={selected}
        similarCount={selected ? reportCount(selected, requests) : 0}
        editing={editing}
        {...listNav}
        onClose={() => {
          setSelectedId(null);
          setEditing(false);
        }}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onApprove={() => selected && openConfirm("approve", selected.id)}
        onReject={() => selected && openConfirm("reject", selected.id)}
        onDuplicate={() => selected && openConfirm("duplicate", selected.id)}
        onUnpublish={() => selected && openConfirm("unpublish", selected.id)}
        onRestore={() => selected && openConfirm("restore", selected.id)}
        onSave={async (patch) => {
          if (!selected) return;
          const result = await updateCommunityRequestAction(selected.id, patch);
          if (result.error) {
            setActionError(result.error);
            return;
          }
          setEditing(false);
        }}
      />

      {confirm === "approve" ? (
        <ConfirmDialog
          title={
            bulkMode
              ? `Approve ${bulkEligibleCount} request${bulkEligibleCount === 1 ? "" : "s"}`
              : targetRequest?.status === "pending"
                ? "Approve request"
                : "Move back to queue and approve"
          }
          body={
            bulkMode
              ? `These places will appear on the public community map as requests for inspection. They are not verified FDA violations or enforcement actions.${bulkSkipNote(bulkEligibleCount, confirmTargets.length)}`
              : "This place will appear on the public community map as a request for inspection. It is not a verified FDA violation or enforcement action."
          }
          confirmLabel="Approve and publish"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
          confirmDisabled={bulkMode && bulkEligibleCount === 0}
        />
      ) : null}
      {confirm === "reject" ? (
        <ConfirmDialog
          title={
            bulkMode
              ? `Reject ${bulkEligibleCount} request${bulkEligibleCount === 1 ? "" : "s"}`
              : targetRequest?.status === "pending"
                ? "Reject request"
                : "Move back to queue and reject"
          }
          body={
            bulkMode
              ? `These requests will leave the pending queue and stay in review history. They will not appear on the community map.${bulkSkipNote(bulkEligibleCount, confirmTargets.length)}`
              : targetRequest?.status === "approved"
                ? "This place will be removed from the community map and marked as rejected."
                : "The request will leave the pending queue and stay in review history. It will not appear on the community map."
          }
          confirmLabel="Reject"
          tone="danger"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
          confirmDisabled={bulkMode && bulkEligibleCount === 0}
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
      {confirm === "unpublish" ? (
        <ConfirmDialog
          title="Remove from map"
          body={
            bulkMode
              ? `These places will be taken off the public community map and returned to the pending queue.${bulkSkipNote(bulkEligibleCount, confirmTargets.length)}`
              : "This place will be taken off the public community map and returned to the pending queue."
          }
          confirmLabel="Remove from map"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
          confirmDisabled={bulkMode && bulkEligibleCount === 0}
        />
      ) : null}
      {confirm === "restore" ? (
        <ConfirmDialog
          title="Move back to queue"
          body={
            bulkMode
              ? `These requests will return to the pending queue. They will not appear on the public map until they are approved again.${bulkSkipNote(bulkEligibleCount, confirmTargets.length)}`
              : "This request will return to the pending queue. It will not appear on the public map until it is approved again."
          }
          confirmLabel="Move back to queue"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
          confirmDisabled={bulkMode && bulkEligibleCount === 0}
        />
      ) : null}
      {confirm === "duplicate" ? (
        <ConfirmDialog
          title="Mark as duplicate"
          body="This submission will count toward an existing community place and will not get its own pin."
          confirmLabel="Mark duplicate"
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
          pending={pending}
          confirmDisabled={!duplicateOf}
        >
          <DuplicatePicker
            places={communityPlaceOptions}
            selectedId={duplicateOf}
            onSelect={setDuplicateOf}
            placeholder="Search community places"
          />
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function CommunityDrawer({
  request,
  similarCount,
  editing,
  onClose,
  onPrev,
  onNext,
  canPrev,
  canNext,
  onEdit,
  onCancelEdit,
  onApprove,
  onReject,
  onDuplicate,
  onUnpublish,
  onRestore,
  onSave,
}: {
  request: CommunityRequest | null;
  similarCount: number;
  editing: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDuplicate: () => void;
  onUnpublish: () => void;
  onRestore: () => void;
  onSave: (patch: CommunityRequestPatch) => Promise<void>;
}) {
  const open = Boolean(request);
  const placeLabel = request
    ? formatPlaceLocation(request.locality, request.city)
    : "";
  const onMap = request?.status === "approved";
  const approximatePin = request
    ? communityPinLooksApproximate({
        maps_url: request.maps_url,
        latitude: request.latitude,
        longitude: request.longitude,
      })
    : false;

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
                {placeLabel ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">{placeLabel}</p>
                ) : null}
              </div>
              <PanelHeaderControls
                onClose={onClose}
                onPrev={onPrev}
                onNext={onNext}
                canPrev={canPrev}
                canNext={canNext}
                prevLabel="Previous entry"
                nextLabel="Next entry"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {editing ? (
                <CommunityEditForm
                  key={request.id}
                  request={request}
                  liveOnMap={onMap}
                  onCancel={onCancelEdit}
                  onSave={onSave}
                />
              ) : (
                <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={request.status} />
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    onMap
                      ? "bg-[var(--community-accent-tint)] text-[var(--community-accent)]"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                >
                  {onMap ? "On community map" : "Not on map"}
                </span>
                {approximatePin ? (
                  <span className="rounded-md bg-[#fff4e5] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#9a6700]">
                    Approximate pin
                  </span>
                ) : null}
              </div>

              {approximatePin ? (
                <p className="text-sm leading-relaxed text-[#9a6700]">
                  This pin could not be read from the Maps link. Edit the request
                  and paste a Share link, Plus Code, or latitude/longitude before
                  approving.
                </p>
              ) : null}

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
                <div>
                  <dt className="text-[var(--muted)]"># of Reports</dt>
                  <dd className="text-[var(--ink)]">{similarCount}</dd>
                </div>
                {request.plus_code ? (
                  <div className="col-span-2">
                    <dt className="text-[var(--muted)]">Plus Code</dt>
                    <dd className="text-[var(--ink)]">{request.plus_code}</dd>
                  </div>
                ) : null}
                {request.latitude != null && request.longitude != null ? (
                  <div className="col-span-2">
                    <dt className="text-[var(--muted)]">Coordinates</dt>
                    <dd className="text-[var(--ink)] tabular-nums">
                      {request.latitude.toFixed(5)}, {request.longitude.toFixed(5)}
                    </dd>
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
                            className="text-sm font-medium text-[var(--community-accent)] underline-offset-2 hover:underline"
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
                    className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--community-accent)] underline-offset-2 hover:underline"
                  >
                    Open Map
                    <ArrowUpRight size={14} strokeWidth={2.25} aria-hidden />
                  </a>
                ) : null}
              </section>
                </div>
              )}
            </div>

            {!editing ? (
            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-5 py-4">
              {onMap ? (
                <button
                  type="button"
                  onClick={onUnpublish}
                  className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
                >
                  Remove from map
                </button>
              ) : null}
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
              >
                Edit
              </button>
              {request.status !== "approved" ? (
                <button
                  type="button"
                  onClick={onApprove}
                  className="rounded-lg bg-[var(--community-accent)] px-3 py-2 text-sm font-medium text-white"
                >
                  {request.status === "pending"
                    ? "Approve"
                    : "Move back to queue and approve"}
                </button>
              ) : null}
              {request.status !== "rejected" ? (
                <button
                  type="button"
                  onClick={onReject}
                  className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
                >
                  {request.status === "pending"
                    ? "Reject"
                    : "Move back to queue and reject"}
                </button>
              ) : null}
              {request.status === "pending" ? (
                <button
                  type="button"
                  onClick={onDuplicate}
                  className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
                >
                  Mark as duplicate
                </button>
              ) : null}
              {request.status === "rejected" || request.status === "duplicate" ? (
                <button
                  type="button"
                  onClick={onRestore}
                  className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
                >
                  Move back to queue
                </button>
              ) : null}
            </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </>
  );
}
