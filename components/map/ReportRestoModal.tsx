"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { Check, ImagePlus, X } from "lucide-react";
import { submitCommunityRequestAction } from "@/lib/community/actions";
import {
  COMMUNITY_REQUEST_FIELDS,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
} from "@/lib/community/schema";

interface ReportRestoModalProps {
  onClose: () => void;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--community-accent)]";

function RequiredMark({ required }: { required: boolean }) {
  if (!required) return null;
  return (
    <span className="text-[#E11D2E]" aria-hidden>
      {" "}
      *
    </span>
  );
}

export function ReportRestoModal({ onClose }: ReportRestoModalProps) {
  const [state, formAction, pending] = useActionState(
    submitCommunityRequestAction,
    { error: null, ok: false },
  );
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    for (const photo of photos) {
      formData.append("photos", photo);
    }
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(15,23,22,0.36)] px-4 py-6 sm:items-center"
      onClick={state.ok ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-resto-title"
        className="flex max-h-[min(92vh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2
              id="report-resto-title"
              className="text-lg font-medium text-[var(--ink)]"
            >
              Flag a restaurant for inspection
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Community submission only — not an official FDA complaint.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {state.ok ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--community-accent-tint)] text-[var(--community-accent)]"
              aria-hidden
            >
              <Check size={26} strokeWidth={2.5} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]" role="status">
              Thanks for the submission. It is in the review queue and will
              appear on the public community map once approved.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-[var(--community-accent)] px-5 py-2.5 text-sm font-medium text-white"
            >
              OK
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <label className="block text-xs text-[var(--muted)]">
                {COMMUNITY_REQUEST_FIELDS.place_name.label}
                <RequiredMark
                  required={COMMUNITY_REQUEST_FIELDS.place_name.required}
                />
                <input
                  ref={firstFieldRef}
                  name="place_name"
                  required
                  minLength={2}
                  maxLength={120}
                  className={inputClass}
                  autoComplete="organization"
                />
              </label>

              <label className="block text-xs text-[var(--muted)]">
                {COMMUNITY_REQUEST_FIELDS.area_city.label}
                <RequiredMark
                  required={COMMUNITY_REQUEST_FIELDS.area_city.required}
                />
                <input
                  name="area_city"
                  maxLength={120}
                  placeholder="e.g. Koregaon Park, Pune"
                  className={inputClass}
                  autoComplete="address-level2"
                />
              </label>

              <label className="block text-xs text-[var(--muted)]">
                {COMMUNITY_REQUEST_FIELDS.maps_url.label}
                <RequiredMark
                  required={COMMUNITY_REQUEST_FIELDS.maps_url.required}
                />
                <input
                  name="maps_url"
                  type="url"
                  inputMode="url"
                  required
                  maxLength={500}
                  placeholder="https://maps.app.goo.gl/…"
                  className={inputClass}
                />
                <span className="mt-1 block text-[11px] leading-relaxed text-[var(--muted)]">
                  {COMMUNITY_REQUEST_FIELDS.maps_url.hint}
                </span>
              </label>

              <label className="block text-xs text-[var(--muted)]">
                {COMMUNITY_REQUEST_FIELDS.concern.label}
                <RequiredMark
                  required={COMMUNITY_REQUEST_FIELDS.concern.required}
                />
                <textarea
                  name="concern"
                  rows={4}
                  maxLength={1000}
                  className={`${inputClass} resize-y`}
                />
              </label>

              <PhotoUpload
                photos={photos}
                onChange={setPhotos}
                error={photoError}
                onError={setPhotoError}
              />

              {state.error ? (
                <p className="text-sm text-[#8B1E1E]" role="alert">
                  {state.error}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--border)] bg-[var(--panel)] px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-[#E11D2E] px-3 py-2 text-sm font-medium text-white hover:bg-[#c41826] disabled:opacity-50"
              >
                {pending ? "Sending…" : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PhotoUpload({
  photos,
  onChange,
  error,
  onError,
}: {
  photos: File[];
  onChange: (files: File[]) => void;
  error: string | null;
  onError: (message: string | null) => void;
}) {
  const inputId = useId();
  const remaining = MAX_PHOTOS - photos.length;
  const [dragging, setDragging] = useState(false);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const next = [...photos];
    let message: string | null = null;

    for (const file of incoming) {
      if (next.length >= MAX_PHOTOS) {
        message = `You can attach up to ${MAX_PHOTOS} photos.`;
        break;
      }
      if (!file.type.startsWith("image/")) {
        message = "Attach photos only (JPG, PNG, or WebP).";
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        message = "Each photo must be under 2.5 MB.";
        continue;
      }
      if (
        next.some(
          (existing) =>
            existing.name === file.name && existing.size === file.size,
        )
      ) {
        continue;
      }
      next.push(file);
    }

    onError(message);
    onChange(next);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files ?? []);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  return (
    <div>
      <p className="text-xs text-[var(--muted)]">
        {COMMUNITY_REQUEST_FIELDS.evidence.label}
      </p>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={onInputChange}
      />
      <div className="mt-1 flex items-center gap-2">
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-dashed px-2.5 text-xs transition ${
            dragging
              ? "border-[var(--community-accent)] bg-[var(--surface)]"
              : "border-[var(--border-strong)] bg-[var(--surface)]/60 hover:border-[var(--community-accent)]"
          }`}
        >
          <ImagePlus
            size={14}
            strokeWidth={2}
            className="text-[var(--muted)]"
            aria-hidden
          />
          <span className="text-[var(--ink)]">
            {remaining > 0 ? "Add photos" : "Limit reached"}
          </span>
        </label>
        {photos.length > 0 ? (
          <ul className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
            {photos.map((photo, index) => (
              <PhotoThumb
                key={`${photo.name}-${photo.size}-${index}`}
                photo={photo}
                onRemove={() =>
                  onChange(photos.filter((_, itemIndex) => itemIndex !== index))
                }
              />
            ))}
          </ul>
        ) : (
          <span className="text-xs text-[var(--muted)]">
            Optional · up to {MAX_PHOTOS}
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-[#8B1E1E]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PhotoThumb({
  photo,
  onRemove,
}: {
  photo: File;
  onRemove: () => void;
}) {
  const src = useMemo(() => URL.createObjectURL(photo), [photo]);

  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);

  return (
    <li className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[var(--border)]">
      {/* File previews are blob URLs, not remote images. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 rounded-full bg-[rgba(15,23,22,0.72)] p-px text-white"
        aria-label={`Remove ${photo.name}`}
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </li>
  );
}
