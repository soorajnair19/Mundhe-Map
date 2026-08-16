# Mundhe Map

An independent public map of food-safety enforcement in Maharashtra.

Licence suspensions, notices, seizures, and closures show up in news reports and then disappear into the archive. Mundhe Map puts those publicly reported actions on one map so anyone can see where enforcement is happening, what was found, and what happened next.

It is not affiliated with the Maharashtra FDA or Tukaram Mundhe.

## What you can do

- **See the picture at a glance.** Clustered pins on a Maharashtra map, with live counts for cases, licence actions, notices, and seizures.
- **Filter by outcome.** Use the legend to show licence suspended, cancelled, sealed, notice, seizure, or other actions.
- **Open a case.** Click a pin for the establishment, location, current status, summary, and (when reported) a short timeline of events.
- **Go back to the source.** Every case cites the news or public report it came from. Details can change as official proceedings continue.

Pins are **approximate** — neighbourhood or city, not a doorstep. Exact coordinates are used only when a Plus Code or lat/lng is known.

## How to read it

Cases are compiled from publicly reported sources (Indian Express, Hindustan Times, Times of India, Mid-Day, and others). They are marked as reported, not as an official FDA database.

Leave unknowns blank in the data. Do not invent coordinates, dates, or outcomes. If a later report updates a case, the map should follow the source — not guess.

## What this is not (yet)

Mundhe Map is a reader, not a reporting platform. There is no public submission form, no official FDA feed, and no claim of completeness. Coverage is only as good as what has been published and entered.

Not in this version: user accounts, a public requests form, or per-case SEO pages.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Admin

Copy [`.env.example`](.env.example) to `.env.local` and set `ADMIN_PIN` (4 digits) and `ADMIN_SESSION_SECRET`. Open [http://localhost:3000/admin](http://localhost:3000/admin).

FDA reports live in [`data/admin/pending-fda-reports.json`](data/admin/pending-fda-reports.json). That file is a living ledger: ingest **appends** new pending rows, and approve/reject change a row in place. Earlier approved cases stay. Approved FDA reports are shown on the public map on top of the curated [`data/seed/cases.json`](data/seed/cases.json) set.

Community requests live in [`data/admin/community-requests.json`](data/admin/community-requests.json) the same way: public submissions append pending rows, and approve/reject/unpublish update that ledger. Approved requests appear on the Community map layer.

Locally, review actions write those JSON files on disk. On Vercel, set `CRON_SECRET`, `FDA_GITHUB_TOKEN` (repo contents write), and `FDA_GITHUB_REPO` (`owner/name`) so FDA and community approve/reject/submit actions commit the same files back to GitHub. Without the token, live admin actions are refused rather than saved only in memory.

## Daily FDA ingest

Around 8:00 PM IST the app looks for Maharashtra FDA enforcement stories from public RSS (Google News plus outlet city feeds), queues candidates in **Admin → FDA Reports**, and skips URLs/places already on the map or in the ledger.

```bash
npm run ingest-fda -- --lookback-days=14
```

Then refresh `/admin/fda-reports`. Use **Fetch latest reports** in admin for a 2-day window. A GitHub Action and Vercel Cron (`30 14 * * *` UTC) run the same job daily.

Leave unknowns blank. Heuristic extraction is conservative — open the source link, edit if needed, then approve.

## Add or update cases

1. Edit [`data/seed/cases.csv`](data/seed/cases.csv).
2. For a tighter pin, fill `plus_code` or `latitude` / `longitude`.
3. Run `npm run import-csv` to regenerate [`data/seed/cases.json`](data/seed/cases.json).
4. Refresh the app.

Product copy lives in [`lib/branding.ts`](lib/branding.ts).

## Built by

[Sooraj Nair](https://www.linkedin.com/in/soorajnair19) · [Contact](mailto:soorajuiux@gmail.com)
