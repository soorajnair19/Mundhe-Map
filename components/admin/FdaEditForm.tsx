"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type {
  ActionType,
  BusinessType,
  CaseStatus,
  CaseType,
  EnforcementCase,
  Establishment,
  LocationAccuracy,
  SourceType,
  VerificationStatus,
  ViolationType,
} from "@/lib/data/types";
import { formatLabel } from "@/lib/data/normalize";

const BUSINESS_TYPES: BusinessType[] = [
  "restaurant",
  "bakery",
  "hotel",
  "manufacturer",
  "retailer",
  "dairy",
  "cloud_kitchen",
  "other",
];
const CASE_TYPES: CaseType[] = [
  "inspection",
  "raid",
  "licence_suspension",
  "licence_cancellation",
  "closure",
  "sealing",
  "seizure",
  "notice",
  "other",
];
const CASE_STATUSES: CaseStatus[] = [
  "inspected",
  "notice_issued",
  "licence_suspended",
  "licence_cancelled",
  "sealed",
  "seizure",
  "reinstated",
  "other",
];
const ACTION_TYPES: ActionType[] = [
  "inspection",
  "notice",
  "improvement_notice",
  "licence_suspended",
  "licence_cancelled",
  "business_sealed",
  "seizure",
  "prosecution",
  "warning",
  "other",
];
const VIOLATION_TYPES: ViolationType[] = [
  "poor_hygiene",
  "pest_infestation",
  "expired_food",
  "adulteration",
  "improper_storage",
  "food_safety_violation",
  "unlicensed_operation",
  "missing_records",
  "employee_medical_records",
  "water_quality",
  "labelling",
  "temperature_control",
  "waste_management",
  "other",
];
const SOURCE_TYPES: SourceType[] = [
  "maharashtra_fda",
  "government",
  "indian_express",
  "hindustan_times",
  "times_of_india",
  "mid_day",
  "pti",
  "other_news",
  "social",
  "community",
  "other",
];
const VERIFICATION: VerificationStatus[] = [
  "verified",
  "reported",
  "unverified",
  "disputed",
];

const fieldClass =
  "mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--accent)]";
const labelClass = "block text-xs text-[var(--muted)]";

interface FdaEditFormProps {
  establishment: Establishment;
  enforcementCase: EnforcementCase;
  onCancel: () => void;
  onSave: (patch: {
    establishment: Establishment;
    case: EnforcementCase;
  }) => Promise<void>;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function FdaEditForm({
  establishment,
  enforcementCase,
  onCancel,
  onSave,
}: FdaEditFormProps) {
  const [est, setEst] = useState(establishment);
  const [item, setItem] = useState(enforcementCase);
  const [pending, setPending] = useState(false);

  function updateEst<K extends keyof Establishment>(
    key: K,
    value: Establishment[K],
  ) {
    setEst((current) => ({ ...current, [key]: value }));
  }

  function updateCase<K extends keyof EnforcementCase>(
    key: K,
    value: EnforcementCase[K],
  ) {
    setItem((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await onSave({ establishment: est, case: item });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Establishment
        </h3>
        <label className={labelClass}>
          Name
          <input
            className={fieldClass}
            value={est.name}
            onChange={(e) => updateEst("name", e.target.value)}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Locality
            <input
              className={fieldClass}
              value={est.locality ?? ""}
              onChange={(e) => updateEst("locality", e.target.value || null)}
            />
          </label>
          <label className={labelClass}>
            City
            <input
              className={fieldClass}
              value={est.city ?? ""}
              onChange={(e) => updateEst("city", e.target.value || null)}
            />
          </label>
        </div>
        <label className={labelClass}>
          Address
          <input
            className={fieldClass}
            value={est.address ?? ""}
            onChange={(e) => updateEst("address", e.target.value || null)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            District
            <input
              className={fieldClass}
              value={est.district}
              onChange={(e) => updateEst("district", e.target.value)}
              required
            />
          </label>
          <label className={labelClass}>
            Pincode
            <input
              className={fieldClass}
              value={est.pincode ?? ""}
              onChange={(e) => updateEst("pincode", e.target.value || null)}
            />
          </label>
        </div>
        <label className={labelClass}>
          Maps URL
          <input
            className={fieldClass}
            value={est.maps_url ?? ""}
            onChange={(e) => updateEst("maps_url", e.target.value || null)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Business type
            <select
              className={fieldClass}
              value={est.business_type}
              onChange={(e) =>
                updateEst("business_type", e.target.value as BusinessType)
              }
            >
              {BUSINESS_TYPES.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Location accuracy
            <select
              className={fieldClass}
              value={est.location_accuracy}
              onChange={(e) =>
                updateEst(
                  "location_accuracy",
                  e.target.value as LocationAccuracy,
                )
              }
            >
              {(["exact", "approximate", "district_only", "unknown"] as const).map(
                (value) => (
                  <option key={value} value={value}>
                    {formatLabel(value)}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Enforcement
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Case type
            <select
              className={fieldClass}
              value={item.case_type}
              onChange={(e) =>
                updateCase("case_type", e.target.value as CaseType)
              }
            >
              {CASE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Status
            <select
              className={fieldClass}
              value={item.status}
              onChange={(e) =>
                updateCase("status", e.target.value as CaseStatus)
              }
            >
              {CASE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Inspection date
            <input
              type="date"
              className={fieldClass}
              value={item.inspection_date ?? ""}
              onChange={(e) =>
                updateCase("inspection_date", e.target.value || null)
              }
            />
          </label>
          <label className={labelClass}>
            Action date
            <input
              type="date"
              className={fieldClass}
              value={item.action_date ?? ""}
              onChange={(e) => updateCase("action_date", e.target.value || null)}
            />
          </label>
        </div>
        <label className={labelClass}>
          Verification
          <select
            className={fieldClass}
            value={item.verification_status}
            onChange={(e) =>
              updateCase(
                "verification_status",
                e.target.value as VerificationStatus,
              )
            }
          >
            {VERIFICATION.map((value) => (
              <option key={value} value={value}>
                {formatLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Summary
          <textarea
            className={`${fieldClass} min-h-[88px]`}
            value={item.summary}
            onChange={(e) => updateCase("summary", e.target.value)}
          />
        </label>
      </section>

      <ListEditor
        title="Violations"
        items={item.violations}
        onChange={(violations) => updateCase("violations", violations)}
        onAdd={() =>
          updateCase("violations", [
            ...item.violations,
            {
              id: newId("vio"),
              violation_type: "other",
              description: "",
            },
          ])
        }
        render={(violation, index) => (
          <div className="grid gap-2">
            <select
              className={fieldClass}
              value={violation.violation_type}
              onChange={(e) => {
                const next = [...item.violations];
                next[index] = {
                  ...violation,
                  violation_type: e.target.value as ViolationType,
                };
                updateCase("violations", next);
              }}
            >
              {VIOLATION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
            <input
              className={fieldClass}
              value={violation.description}
              placeholder="Description"
              onChange={(e) => {
                const next = [...item.violations];
                next[index] = { ...violation, description: e.target.value };
                updateCase("violations", next);
              }}
            />
          </div>
        )}
      />

      <ListEditor
        title="Timeline / actions"
        items={item.actions}
        onChange={(actions) => updateCase("actions", actions)}
        onAdd={() =>
          updateCase("actions", [
            ...item.actions,
            {
              id: newId("act"),
              action_type: "other",
              action_date: "",
              description: null,
            },
          ])
        }
        render={(action, index) => (
          <div className="grid gap-2">
            <select
              className={fieldClass}
              value={action.action_type}
              onChange={(e) => {
                const next = [...item.actions];
                next[index] = {
                  ...action,
                  action_type: e.target.value as ActionType,
                };
                updateCase("actions", next);
              }}
            >
              {ACTION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
            <input
              type="date"
              className={fieldClass}
              value={action.action_date}
              onChange={(e) => {
                const next = [...item.actions];
                next[index] = { ...action, action_date: e.target.value };
                updateCase("actions", next);
              }}
            />
            <input
              className={fieldClass}
              value={action.description ?? ""}
              placeholder="Description"
              onChange={(e) => {
                const next = [...item.actions];
                next[index] = {
                  ...action,
                  description: e.target.value || null,
                };
                updateCase("actions", next);
              }}
            />
          </div>
        )}
      />

      <ListEditor
        title="Status history"
        items={item.status_history}
        onChange={(status_history) => updateCase("status_history", status_history)}
        onAdd={() =>
          updateCase("status_history", [
            ...item.status_history,
            {
              id: newId("hist"),
              status: "other",
              effective_date: "",
              notes: null,
            },
          ])
        }
        render={(event, index) => (
          <div className="grid gap-2">
            <select
              className={fieldClass}
              value={event.status}
              onChange={(e) => {
                const next = [...item.status_history];
                next[index] = {
                  ...event,
                  status: e.target.value as CaseStatus,
                };
                updateCase("status_history", next);
              }}
            >
              {CASE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {formatLabel(value)}
                </option>
              ))}
            </select>
            <input
              type="date"
              className={fieldClass}
              value={event.effective_date}
              onChange={(e) => {
                const next = [...item.status_history];
                next[index] = { ...event, effective_date: e.target.value };
                updateCase("status_history", next);
              }}
            />
            <input
              className={fieldClass}
              value={event.notes ?? ""}
              placeholder="Notes"
              onChange={(e) => {
                const next = [...item.status_history];
                next[index] = { ...event, notes: e.target.value || null };
                updateCase("status_history", next);
              }}
            />
          </div>
        )}
      />

      <ListEditor
        title="Sources"
        items={item.sources}
        onChange={(sources) => updateCase("sources", sources)}
        onAdd={() =>
          updateCase("sources", [
            ...item.sources,
            {
              id: newId("src"),
              source_name: "",
              source_type: "other_news",
              title: "",
              url: "",
              published_at: null,
              is_primary: item.sources.length === 0,
            },
          ])
        }
        render={(source, index) => (
          <div className="grid gap-2">
            <input
              className={fieldClass}
              value={source.source_name}
              placeholder="Publication"
              onChange={(e) => {
                const next = [...item.sources];
                next[index] = { ...source, source_name: e.target.value };
                updateCase("sources", next);
              }}
            />
            <input
              className={fieldClass}
              value={source.title}
              placeholder="Title"
              onChange={(e) => {
                const next = [...item.sources];
                next[index] = { ...source, title: e.target.value };
                updateCase("sources", next);
              }}
            />
            <input
              className={fieldClass}
              value={source.url}
              placeholder="URL"
              onChange={(e) => {
                const next = [...item.sources];
                next[index] = { ...source, url: e.target.value };
                updateCase("sources", next);
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className={fieldClass}
                value={source.source_type}
                onChange={(e) => {
                  const next = [...item.sources];
                  next[index] = {
                    ...source,
                    source_type: e.target.value as SourceType,
                  };
                  updateCase("sources", next);
                }}
              >
                {SOURCE_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {formatLabel(value)}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className={fieldClass}
                value={source.published_at ?? ""}
                onChange={(e) => {
                  const next = [...item.sources];
                  next[index] = {
                    ...source,
                    published_at: e.target.value || null,
                  };
                  updateCase("sources", next);
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <input
                type="checkbox"
                checked={source.is_primary}
                onChange={(e) => {
                  const next = item.sources.map((entry, i) => ({
                    ...entry,
                    is_primary: i === index ? e.target.checked : false,
                  }));
                  updateCase("sources", next);
                }}
              />
              Primary source
            </label>
          </div>
        )}
      />

      <div className="flex gap-2 border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function ListEditor<T extends { id: string }>({
  title,
  items,
  onChange,
  onAdd,
  render,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  onAdd: () => void;
  render: (item: T, index: number) => ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {title}
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-medium text-[var(--accent)]"
        >
          Add
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-lg border border-[var(--border)] p-3"
          >
            {render(item, index)}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="mt-2 text-xs text-[#8B1E1E]"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
