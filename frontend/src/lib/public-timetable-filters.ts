export interface TimetableFilters {
  search: string;
  from: string | null;
  to: string | null;
  rooms: number[];
}

export const DEFAULT_TIMETABLE_FILTERS: TimetableFilters = {
  search: "",
  from: null,
  to: null,
  rooms: [],
};

type ReadableSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

const isUrlSearchParams = (value: unknown): value is URLSearchParams =>
  value instanceof URLSearchParams;

const getAllValues = (params: ReadableSearchParams, key: string): string[] => {
  if (isUrlSearchParams(params)) {
    return params.getAll(key);
  }

  const value = params[key];
  if (typeof value === "undefined") return [];
  if (Array.isArray(value)) return value.flatMap((entry) => entry.split(","));
  return value.split(",");
};

const getFirstValue = (
  params: ReadableSearchParams,
  key: string,
): string | null => {
  if (isUrlSearchParams(params)) {
    const value = params.get(key);
    return value && value.trim().length > 0 ? value : null;
  }

  const value = params[key];
  if (Array.isArray(value)) {
    const first = value.find((item) => item.trim().length > 0);
    return first ?? null;
  }
  if (typeof value === "string") {
    return value.trim().length > 0 ? value : null;
  }
  return null;
};

export const parseTimetableFilters = (
  params: ReadableSearchParams,
): TimetableFilters => {
  const search = getFirstValue(params, "search") ?? "";
  const from = getFirstValue(params, "from");
  const to = getFirstValue(params, "to");
  const rooms = getAllValues(params, "room")
    .map((entry) => Number.parseInt(entry, 10))
    .filter((id) => Number.isFinite(id));

  return { search, from, to, rooms };
};

export const createTimetableQuery = (
  filters: TimetableFilters,
): URLSearchParams => {
  const query = new URLSearchParams();

  if (filters.search.trim()) {
    query.set("search", filters.search.trim());
  }
  if (filters.from) {
    query.set("from", filters.from);
  }
  if (filters.to) {
    query.set("to", filters.to);
  }
  filters.rooms.forEach((roomId) => {
    query.append("room", String(roomId));
  });

  return query;
};
