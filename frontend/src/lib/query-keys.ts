import type {
  AllocationQueryParams,
  BlackoutQueryParams,
  ExamQueryParams,
  HolidayQueryParams,
  PublicExamQueryParams,
  RoomQueryParams,

  TermQueryParams,
} from "@/src/types/api";

const withParams = <T>(resource: string, params?: T) =>
  [resource, "list", (params ?? null) as T | null] as const;

export const queryKeys = {
  terms: {
    all: ["terms"] as const,
    list: (params?: TermQueryParams) => withParams("terms", params),
    detail: (id: number) => ["terms", "detail", id] as const,
  },
  rooms: {
    all: ["rooms"] as const,
    list: (params?: RoomQueryParams) => withParams("rooms", params),
    detail: (id: number) => ["rooms", "detail", id] as const,
  },
  exams: {
    all: ["exams"] as const,
    list: (params?: ExamQueryParams) => withParams("exams", params),
    detail: (id: number) => ["exams", "detail", id] as const,
    owners: () => ["exams", "owners"] as const,
  },
  allocations: {
    all: ["allocations"] as const,
    list: (params?: AllocationQueryParams) => withParams("allocations", params),
    detail: (id: number) => ["allocations", "detail", id] as const,
  },
  blackouts: {
    all: ["blackouts"] as const,
    list: (params?: BlackoutQueryParams) => withParams("blackouts", params),
    detail: (id: number) => ["blackouts", "detail", id] as const,
  },
  holidays: {
    all: ["holidays"] as const,
    list: (params?: HolidayQueryParams) => withParams("holidays", params),
    detail: (id: number) => ["holidays", "detail", id] as const,
  },
  publicExams: {
    all: ["publicExams"] as const,
    list: (params?: PublicExamQueryParams) => withParams("publicExams", params),
  },
} as const;

