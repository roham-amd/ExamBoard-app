export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PaginationParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
}

export interface Term {
  id: number
  name: string
  slug: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

export interface TermQueryParams extends PaginationParams {
  is_active?: boolean
}

export interface Room {
  id: number
  code: string
  name: string
  capacity: number
  campus?: string | null
  description?: string | null
}

export interface RoomQueryParams extends PaginationParams {
  campus?: string
}

export interface Exam {
  id: number
  course_code: string
  course_title: string
  term: number
  starts_at: string
  duration_minutes: number
  status: 'draft' | 'confirmed' | 'published'
}

export interface ExamQueryParams extends PaginationParams {
  term?: number
  status?: Exam['status']
}

export interface Allocation {
  id: number
  exam: number
  room: number
  seats_reserved: number
  supervisor?: string | null
}

export interface AllocationQueryParams extends PaginationParams {
  term?: number
  exam?: number
  room?: number
}

export interface Blackout {
  id: number
  room: number | null
  starts_at: string
  ends_at: string
  reason: string
}

export interface BlackoutQueryParams extends PaginationParams {
  room?: number
  from?: string
  to?: string
}

export interface Holiday {
  id: number
  date: string
  title: string
  description?: string | null
}

export interface HolidayQueryParams extends PaginationParams {
  year?: number
}

export interface PublicExam {
  id: number
  course_code: string
  course_title: string
  starts_at: string
  location: string
}

export interface PublicExamQueryParams extends PaginationParams {
  term?: number
  date?: string
}

export type TermListResponse = PaginatedResponse<Term>
export type RoomListResponse = PaginatedResponse<Room>
export type ExamListResponse = PaginatedResponse<Exam>
export type AllocationListResponse = PaginatedResponse<Allocation>
export type BlackoutListResponse = PaginatedResponse<Blackout>
export type HolidayListResponse = PaginatedResponse<Holiday>
export type PublicExamListResponse = PaginatedResponse<PublicExam>

export interface PublicTimetableTerm {
  id: number
  name: string
  slug: string
  starts_at: string
  ends_at: string
  published_at?: string | null
}

export interface PublicTimetableRoom {
  id: number
  name: string
  code: string
  capacity: number
  campus?: string | null
}

export interface PublicTimetableAllocation {
  id: number
  room_id: number
  exam_id: number
  exam_title: string
  course_code: string
  starts_at: string
  ends_at: string
  allocated_seats: number
  notes?: string | null
}

export interface PublicTimetableResponse {
  term: PublicTimetableTerm
  rooms: PublicTimetableRoom[]
  allocations: PublicTimetableAllocation[]
  generated_at?: string
}
