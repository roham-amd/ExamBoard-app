# Public Timetable (Phase 4)

## Rendering Strategy
- Server-rendered at `/public/terms/[termId]/timetable` to provide SEO-friendly markup for anonymous visitors.
- Route bypasses the locale middleware so that links can be shared without language prefixes.
- Initial fetch happens in the server component (`page.tsx`) using `fetchPublicTimetable` with 5-minute revalidation for cache-friendly freshness.
- Filters in the query string are parsed on the server and passed as `initialFilters` to the client component for a fully hydrated initial view.

## Client Behaviour
- `PublicTimetable` is a client component that manages filter form state, updates the URL on submit, and re-renders when new server data streams in.
- Rows are virtualised with `@tanstack/react-virtual` (disabled automatically during printing) to keep large timetables responsive.
- Jalali calendar formatting uses the shared `dayjs` instance with `jalaliday`; users can toggle day/week/month headers without refetching.
- Print mode expands the grid (via CSS + JS) to ensure every row appears in PDFs/hard copies.

## Filters & Query Params
- Supported params: `search`, `from`, `to`, and repeated `room` ids. Blank values are removed from the URL for clean shareable links.
- Submitted filters are serialised with `createTimetableQuery`; reset clears the URL back to the canonical timetable.

## Sharing & Print
- The shareable URL is the canonical page (`/public/terms/<id>/timetable`) plus any query params; metadata includes term-specific titles for unfurled links.
- Print styles live in `src/styles/globals.css`; the “Print” button calls `window.print()` and the page avoids page breaks in the middle of a room row.
