# Dashboard CRUD — Phase 5

The authenticated dashboard now exposes full CRUD for all scheduling resources (rooms, terms, exams, allocations, blackouts, holidays).

## Navigation & Permissions

- Sidebar links map to the resource list pages inside `app/[locale]/*` and keep server-driven permissions simple: hide actions server-side if the API forbids them.
- Each page renders inside the shared `AppShell` so RTL layout, top bar and toasts remain consistent.
- Optimistic updates rely on React Query mutations (`src/lib/mutations.ts`). Each mutation updates cached list responses and then invalidates the relevant resource key to re-sync with the API.

## Forms Pattern

- Forms are powered by **React Hook Form** + **Zod** schemas from `src/lib/schemas.ts`. Each dialog resets default values when opened and maps API models to form values (`map*ToValues`).
- Server validation errors are routed through `applyServerErrors` so field-level feedback appears in Persian. Axios route handlers continue to emit toast errors for non-field failures.
- Date/time inputs use local `datetime-local` controls paired with Jalali helpers (`formatDateTimeInput`, `formatJalaliDateTime`) to keep ISO payloads while showing a Farsi-friendly hint.
- Multi-select and checkbox combinations (e.g., allocation rooms, global/all-day toggles) normalise payloads before submission so DRF receives `null`/array representations.

## Resource Notes

- **Terms**: Publish action posts to `/terms/{id}/publish/`. Once published, critical fields (name, slug, dates) become read-only. Feedback toasts highlight publish success.
- **Rooms**: Minimal fields (name, capacity) with optional metadata. Mutations update table rows optimistically for a smooth planner experience.
- **Exams**: Owner select is populated from `/exams/owners/`; terms reuse `/terms/`. Notes stay optional but trimmed before submit.
- **Allocations**: Supports multi-room assignment, Jalali date range entry and seat counts. Dialog seeds defaults with the first available exam/room.
- **Blackouts & Holidays**: Handle room-specific or global ranges with all-day toggles. Payloads collapse to `room=null` for global records.

## Error Handling

All CRUD actions surface success toasts using translations under each resource’s `feedback` key. Server-side issues bubble into translated toasts via the Axios interceptor, while form field errors render inline for clarity.
