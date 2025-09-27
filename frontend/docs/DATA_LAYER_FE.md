# Data Layer — Phase 3

## Query Clients

Each resource is backed by a dedicated React Query hook found in `src/lib/queries.ts`.

| Resource     | Hook                  | Query Key                         | Endpoint             |
| ------------ | --------------------- | --------------------------------- | -------------------- |
| Terms        | `useTermsQuery`       | `['terms', 'list', params]`       | `GET /terms/`        |
| Rooms        | `useRoomsQuery`       | `['rooms', 'list', params]`       | `GET /rooms/`        |
| Exams        | `useExamsQuery`       | `['exams', 'list', params]`       | `GET /exams/`        |
| Allocations  | `useAllocationsQuery` | `['allocations', 'list', params]` | `GET /allocations/`  |
| Blackouts    | `useBlackoutsQuery`   | `['blackouts', 'list', params]`   | `GET /blackouts/`    |
| Holidays     | `useHolidaysQuery`    | `['holidays', 'list', params]`    | `GET /holidays/`     |
| Public Exams | `usePublicExamsQuery` | `['publicExams', 'list', params]` | `GET /public/exams/` |

Pagination and filter parameters are passed through to DRF unchanged. `params` values are included in the query key so filter changes correctly invalidate cache entries.

Default query behaviour:

- `staleTime = 30s`
- `retry = 1`
- `refetchOnWindowFocus = false` (configured globally)
- `placeholderData = keepPreviousData` to avoid table flashes between pages

## TypeScript Models

Hand-written typings based on the DRF schema are available in `src/types/api.ts`. They include the shared `PaginatedResponse<T>` wrapper plus resource-specific fields and query parameter shapes.

## Validation Schemas

Form schemas live in `src/lib/schemas.ts` and mirror DRF validation rules such as date ordering, positive capacities, and allowed status enums. Use the exported `TermFormValues`, `RoomFormValues`, etc. types when wiring React Hook Form controllers.

## Error Normalisation

`src/components/data/data-table.tsx` consumes `resolveErrorContent` to show toast-friendly, localised errors. For API calls outside the table context reuse the same helper to guarantee consistent Persian messaging.

## UI States

Every list page renders the shared `<DataTable />` component which provides:

- Loading indicator (spinner + message)
- Empty state with dashed border
- Error state with retry button that calls `queryClient.refetch()`
- Result count badge derived from `PaginatedResponse.count`

This keeps UX consistent across resources while we iterate on richer table interactions.
