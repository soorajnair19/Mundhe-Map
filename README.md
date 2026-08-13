# Mundhe Map

Independent, public-interest map of food-safety enforcement actions across Maharashtra.

Cases currently shown are compiled from publicly reported news sources in [`data/seed/cases.csv`](data/seed/cases.csv). Pins are **approximate** (neighbourhood / city), not exact doorstep locations.

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

## Updating cases from CSV

1. Edit [`data/seed/cases.csv`](data/seed/cases.csv) using the standard column set.
2. For exact pins, fill `plus_code` (Google Maps Plus Code) or `latitude`/`longitude`.
3. Run `npm run import-csv` to regenerate [`data/seed/cases.json`](data/seed/cases.json).
4. Refresh the app.

Leave cells blank when unknown. Do not invent coordinates, dates, or outcomes.

Types live in [`lib/data/types.ts`](lib/data/types.ts). Branding strings live in [`lib/branding.ts`](lib/branding.ts).

## Data access layer

UI components read through [`lib/data/load.ts`](lib/data/load.ts). When you later move to Supabase, replace the seed import inside that module without rewriting map/panel components.

## Out of scope (for now)

- Admin / review UI
- Automated ingestion / LLM extraction
- User accounts and public edits
- SEO case pages and analytics views
