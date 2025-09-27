import type {
  AllocationQueryParams,
  BlackoutQueryParams,
  ExamQueryParams,
  HolidayQueryParams,
  PublicExamQueryParams,
  RoomQueryParams,
  TermQueryParams
} from '@/src/types/api'

const withParams = <T,>(resource: string, params?: T) =>
  [resource, 'list', (params ?? null) as T | null] as const

export const queryKeys = {
  terms: {
    all: ['terms'] as const,
    list: (params?: TermQueryParams) => withParams('terms', params)
  },
  rooms: {
    all: ['rooms'] as const,
    list: (params?: RoomQueryParams) => withParams('rooms', params)
  },
  exams: {
    all: ['exams'] as const,
    list: (params?: ExamQueryParams) => withParams('exams', params)
  },
  allocations: {
    all: ['allocations'] as const,
    list: (params?: AllocationQueryParams) => withParams('allocations', params)
  },
  blackouts: {
    all: ['blackouts'] as const,
    list: (params?: BlackoutQueryParams) => withParams('blackouts', params)
  },
  holidays: {
    all: ['holidays'] as const,
    list: (params?: HolidayQueryParams) => withParams('holidays', params)
  },
  publicExams: {
    all: ['publicExams'] as const,
    list: (params?: PublicExamQueryParams) => withParams('publicExams', params)
  }
} as const
