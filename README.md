# Mundhe Map

Independent, public-interest map of food-safety enforcement actions across Maharashtra.

> **This V1 build uses mock seed data** for UI development. Do not treat establishments, violations, dates, or outcomes in `data/seed/cases.json` as real enforcement records.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- MapLibre GL JS (clustered markers)
- Local JSON seed file (no admin UI, no Supabase in this phase)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What V1 includes

- Maharashtra map with clustered enforcement points
- Hover tooltip and click → right detail panel
- Optional timeline when a case has 2+ status history events
- Source links on every case
- Filters (date preset, district, action) via URL query params
- Live stats driven by the filtered dataset
- Independent-project disclaimer in the footer

## Replacing mock data with real cases

1. Keep the same shape as [`data/seed/cases.json`](data/seed/cases.json):
   - `establishments[]`
   - `cases[]` with nested `actions`, `violations`, `sources`, and optional `status_history`
2. Prefer source-attributed wording in `summary` and violation `description` fields.
3. Use `null` for unknown fields — do not invent coordinates, dates, or outcomes.
4. Set `location_accuracy` to `exact`, `approximate`, `district_only`, or `unknown`.
5. Only include `status_history` when you have multiple dated events for that place.
6. Restart or refresh the app after updating the JSON file.

Types live in [`lib/data/types.ts`](lib/data/types.ts). Branding strings (including the product name) live in [`lib/branding.ts`](lib/branding.ts).

## Data access layer

UI components read through [`lib/data/load.ts`](lib/data/load.ts). When you later move to Supabase, replace the seed import inside that module without rewriting map/panel components.

## Out of scope (for now)

- Admin / review UI
- Automated ingestion / LLM extraction
- User accounts and public edits
- SEO case pages and analytics views
