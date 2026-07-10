# Event scraper integration

The NH Ecosystem database is the source of truth for scraper partners. There is
no partner list in the scraper and this integration does not use Monday.com.

## Authentication

Set the same random bearer token as `SCRAPER_API_TOKEN` on both Workers. Keep it
in Worker secrets rather than `wrangler.jsonc`.

```sh
npx wrangler secret put SCRAPER_API_TOKEN
```

## Daily flow

1. The scraper requests `GET /api/scraper/organizations` from this Worker.
2. It scrapes every returned partner using its returned `parser`.
3. It sends its normalized records to `POST /api/scraper/events` as either a
   JSON array or `{ "records": [...] }`.
4. This Worker matches each record's `partner` to the active organization name
   and idempotently creates or updates its member-only event.

Both requests use `Authorization: Bearer <SCRAPER_API_TOKEN>`.

An organization appears in the feed only when it is active, has an **Event Page
URL** and supported parser, and has **Import events from this organization**
enabled on its profile.

The event endpoint accepts the scraper's existing normalized fields:
`partner`, `title`, `start_date`, `end_date`, `start_time`, `end_time`,
`location`, `description`, `url`, `source_url`, `kind`, and `scraped_at`.
Only records with `kind: "event"` (or no kind), a known enabled partner, a
title, and an ISO `YYYY-MM-DD` start date are imported. A request is limited to
500 records.
