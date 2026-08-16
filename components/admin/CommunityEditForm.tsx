"use client";

import { useState, type FormEvent } from "react";
import type { CommunityRequest } from "@/lib/admin/types";
import { COMMUNITY_REQUEST_FIELDS } from "@/lib/community/schema";

const fieldClass =
  "mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--accent)]";
const labelClass = "block text-xs text-[var(--muted)]";

export type CommunityRequestPatch = Pick<
  CommunityRequest,
  | "place_name"
  | "maps_url"
  | "plus_code"
  | "address"
  | "locality"
  | "city"
  | "district"
  | "latitude"
  | "longitude"
  | "concern"
>;

interface CommunityEditFormProps {
  request: CommunityRequest;
  liveOnMap?: boolean;
  onCancel: () => void;
  onSave: (patch: CommunityRequestPatch) => Promise<void>;
}

function readNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CommunityEditForm({
  request,
  liveOnMap = false,
  onCancel,
  onSave,
}: CommunityEditFormProps) {
  const [placeName, setPlaceName] = useState(request.place_name);
  const [locality, setLocality] = useState(request.locality ?? "");
  const [city, setCity] = useState(request.city ?? "");
  const [district, setDistrict] = useState(request.district ?? "");
  const [address, setAddress] = useState(request.address ?? "");
  const [plusCode, setPlusCode] = useState(request.plus_code ?? "");
  const [mapsUrl, setMapsUrl] = useState(request.maps_url);
  const [latitude, setLatitude] = useState(
    request.latitude != null ? String(request.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    request.longitude != null ? String(request.longitude) : "",
  );
  const [concern, setConcern] = useState(request.concern);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (placeName.trim().length < 2) {
      setError("Enter the restaurant name.");
      return;
    }
    if (!plusCode.trim() && !mapsUrl.trim() && latitude.trim() === "" && longitude.trim() === "") {
      setError("Add a Plus Code, Google Maps link, or latitude/longitude.");
      return;
    }

    setPending(true);
    try {
      await onSave({
        place_name: placeName.trim(),
        locality: locality.trim() || null,
        city: city.trim() || null,
        district: district.trim() || city.trim() || null,
        address: address.trim() || null,
        plus_code: plusCode.trim() || null,
        maps_url: mapsUrl.trim(),
        latitude: readNumber(latitude),
        longitude: readNumber(longitude),
        concern: concern.trim(),
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save changes.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {liveOnMap ? (
        <p className="rounded-md bg-[#e4f1ec] px-3 py-2 text-xs text-[#0f6e56]">
          This place is on the public community map. Saving updates the live pin.
        </p>
      ) : null}

      <label className={labelClass}>
        {COMMUNITY_REQUEST_FIELDS.place_name.label}
        <input
          className={fieldClass}
          value={placeName}
          onChange={(event) => setPlaceName(event.target.value)}
          maxLength={120}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          {COMMUNITY_REQUEST_FIELDS.locality.label}
          <input
            className={fieldClass}
            value={locality}
            onChange={(event) => setLocality(event.target.value)}
            maxLength={80}
          />
        </label>
        <label className={labelClass}>
          {COMMUNITY_REQUEST_FIELDS.city.label}
          <input
            className={fieldClass}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            maxLength={80}
          />
        </label>
      </div>

      <label className={labelClass}>
        District
        <input
          className={fieldClass}
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          maxLength={80}
        />
      </label>

      <label className={labelClass}>
        Address
        <input
          className={fieldClass}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          maxLength={200}
        />
      </label>

      <label className={labelClass}>
        {COMMUNITY_REQUEST_FIELDS.plus_code.label}
        <input
          className={fieldClass}
          value={plusCode}
          onChange={(event) => setPlusCode(event.target.value)}
          placeholder="e.g. 7JFJ+2Q Pune"
          maxLength={120}
        />
        <span className="mt-1 block text-[11px] leading-relaxed text-[var(--muted)]">
          {COMMUNITY_REQUEST_FIELDS.plus_code.hint}
        </span>
      </label>

      <label className={labelClass}>
        {COMMUNITY_REQUEST_FIELDS.maps_url.label}
        <input
          className={fieldClass}
          value={mapsUrl}
          onChange={(event) => setMapsUrl(event.target.value)}
          type="url"
          maxLength={500}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Latitude
          <input
            className={fieldClass}
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            inputMode="decimal"
            placeholder="18.5204"
          />
        </label>
        <label className={labelClass}>
          Longitude
          <input
            className={fieldClass}
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            inputMode="decimal"
            placeholder="73.8567"
          />
        </label>
      </div>

      <label className={labelClass}>
        {COMMUNITY_REQUEST_FIELDS.concern.label}
        <textarea
          className={`${fieldClass} min-h-24 resize-y`}
          value={concern}
          onChange={(event) => setConcern(event.target.value)}
          maxLength={1000}
        />
      </label>

      {error ? <p className="text-sm text-[var(--danger,#b42318)]">{error}</p> : null}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-lg px-3 py-2 text-sm ring-1 ring-[var(--border)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
