'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Button } from '@/src/components/ui/button'
import { dayjs } from '@/src/lib/dayjs'
import {
  DEFAULT_TIMETABLE_FILTERS,
  createTimetableQuery,
  type TimetableFilters
} from '@/src/lib/public-timetable-filters'
import { cn } from '@/src/lib/utils'
import type {
  PublicTimetableAllocation,
  PublicTimetableRoom,
  PublicTimetableTerm
} from '@/src/types/api'

const VIEW_OPTIONS = ['day', 'week', 'month'] as const

type ViewOption = (typeof VIEW_OPTIONS)[number]

interface AllocationSegment extends PublicTimetableAllocation {
  offsetMinutes: number
  durationMinutes: number
  widthPercent: number
  offsetPercent: number
}

interface TimelineSegment {
  id: string
  label: string
  positionPercent: number
}

interface PublicTimetableProps {
  term: PublicTimetableTerm
  rooms: PublicTimetableRoom[]
  allocations: PublicTimetableAllocation[]
  initialFilters: TimetableFilters
  generatedAt?: string
}

const ensureMinDuration = (minutes: number) => (minutes <= 0 ? 30 : minutes)

const jalaliFormat = (value: string, format = 'dddd D MMMM YYYY') =>
  dayjs(value).calendar('jalali').locale('fa').format(format)

const getTimelineBounds = (
  view: ViewOption,
  filters: TimetableFilters,
  term: PublicTimetableTerm,
  allocations: PublicTimetableAllocation[]
) => {
  const baseCandidate = filters.from ? dayjs(filters.from) : dayjs(term.starts_at)
  const base = baseCandidate.isValid() ? baseCandidate : dayjs()

  let start = base.startOf('day')
  switch (view) {
    case 'day':
      start = base.startOf('day')
      break
    case 'week':
      start = base.startOf('day')
      break
    case 'month':
      start = base.startOf('day')
      break
    default:
      start = base.startOf('day')
  }

  let end =
    view === 'day'
      ? start.add(1, 'day')
      : view === 'week'
        ? start.add(1, 'week')
        : start.add(1, 'month')

  if (filters.to) {
    const toCandidate = dayjs(filters.to)
    if (toCandidate.isValid() && toCandidate.isAfter(start)) {
      end = toCandidate
    }
  }

  if (!allocations.length) {
    if (!end.isAfter(start)) {
      end = start.add(1, 'hour')
    }
    return { start, end }
  }

  let earliest = allocations[0]
  let latest = allocations[0]
  for (const allocation of allocations) {
    if (dayjs(allocation.starts_at).isBefore(dayjs(earliest.starts_at))) {
      earliest = allocation
    }
    if (dayjs(allocation.ends_at).isAfter(dayjs(latest.ends_at))) {
      latest = allocation
    }
  }

  const allocationStart = dayjs(earliest.starts_at)
  const allocationEnd = dayjs(latest.ends_at)

  if (allocationStart.isBefore(start)) {
    start = allocationStart.startOf('minute')
  }

  if (allocationEnd.isAfter(end)) {
    end = allocationEnd.endOf('minute')
  }

  if (!end.isAfter(start)) {
    end = start.add(1, 'hour')
  }

  return { start, end }
}

const buildTimelineSegments = (
  view: ViewOption,
  start: number,
  end: number
): TimelineSegment[] => {
  const segments: TimelineSegment[] = []
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  const totalMinutes = Math.max(1, endDate.diff(startDate, 'minute'))

  const pushSegment = (date: ReturnType<typeof dayjs>, labelFormat: string, keySuffix: string) => {
    const diffMinutes = date.diff(startDate, 'minute')
    const positionPercent = (diffMinutes / totalMinutes) * 100
    segments.push({
      id: `${view}-${keySuffix}-${date.valueOf()}`,
      label: date.calendar('jalali').locale('fa').format(labelFormat),
      positionPercent
    })
  }

  if (view === 'day') {
    for (let hour = 0; hour <= 24; hour += 2) {
      const date = startDate.add(hour, 'hour')
      if (date.isAfter(endDate)) break
      pushSegment(date, 'HH:mm', `hour-${hour}`)
    }
    return segments
  }

  if (view === 'week') {
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = startDate.add(dayIndex, 'day')
      if (date.isAfter(endDate)) break
      pushSegment(date, 'dddd D MMM', `day-${dayIndex}`)
    }
    return segments
  }

  const days = Math.max(1, endDate.diff(startDate, 'day'))
  const step = Math.max(1, Math.floor(days / 12))
  for (let dayIndex = 0; dayIndex <= days; dayIndex += step) {
    const date = startDate.add(dayIndex, 'day')
    if (date.isAfter(endDate)) break
    pushSegment(date, 'D MMM', `month-${dayIndex}`)
  }
  return segments
}

const mapAllocationsToSegments = (
  allocations: PublicTimetableAllocation[],
  start: number,
  end: number
): AllocationSegment[] => {
  const totalMinutes = Math.max(1, dayjs(end).diff(dayjs(start), 'minute'))
  return allocations.map(allocation => {
    const startDate = dayjs(allocation.starts_at)
    const endDate = dayjs(allocation.ends_at)
    const offsetMinutes = Math.max(0, startDate.diff(start, 'minute'))
    const durationMinutes = ensureMinDuration(endDate.diff(startDate, 'minute'))
    const offsetPercent = (offsetMinutes / totalMinutes) * 100
    const widthPercent = (durationMinutes / totalMinutes) * 100

    return {
      ...allocation,
      offsetMinutes,
      durationMinutes,
      offsetPercent,
      widthPercent
    }
  })
}

export function PublicTimetable(props: PublicTimetableProps) {
  const { term, rooms, allocations, initialFilters, generatedAt } = props
  const [filters, setFilters] = useState<TimetableFilters>(initialFilters)
  const [view, setView] = useState<ViewOption>('week')
  const [isPrinting, setIsPrinting] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const scrollParentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  useEffect(() => {
    const beforePrint = () => setIsPrinting(true)
    const afterPrint = () => setIsPrinting(false)
    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)
    return () => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
    }
  }, [])

  const activeFilters = useMemo(() => {
    const search = filters.search.trim()
    const from = filters.from && filters.from.length > 0 ? filters.from : null
    const to = filters.to && filters.to.length > 0 ? filters.to : null
    const roomsList = Array.from(new Set(filters.rooms))
    roomsList.sort((a, b) => a - b)
    return { search, from, to, rooms: roomsList }
  }, [filters])

  const filteredAllocations = useMemo(() => {
    const searchTerm = activeFilters.search.toLowerCase()
    const fromDate = activeFilters.from ? dayjs(activeFilters.from) : null
    const toDate = activeFilters.to ? dayjs(activeFilters.to) : null
    const roomSet = activeFilters.rooms.length ? new Set(activeFilters.rooms) : null

    return allocations.filter(item => {
      if (roomSet && !roomSet.has(item.room_id)) {
        return false
      }

      if (searchTerm) {
        const haystack = `${item.exam_title} ${item.course_code}`.toLowerCase()
        if (!haystack.includes(searchTerm)) {
          return false
        }
      }

      const startDate = dayjs(item.starts_at)
      const endDate = dayjs(item.ends_at)
      if (fromDate && endDate.isBefore(fromDate)) {
        return false
      }
      if (toDate && startDate.isAfter(toDate)) {
        return false
      }

      return true
    })
  }, [allocations, activeFilters])

  const visibleRooms = useMemo(() => {
    if (!activeFilters.rooms.length) {
      return rooms
    }
    const roomSet = new Set(activeFilters.rooms)
    return rooms.filter(room => roomSet.has(room.id))
  }, [rooms, activeFilters.rooms])

  const allocationByRoom = useMemo(() => {
    const map = new Map<number, AllocationSegment[]>()
    const { start, end } = getTimelineBounds(view, activeFilters, term, filteredAllocations)
    const segments = mapAllocationsToSegments(filteredAllocations, start.valueOf(), end.valueOf())
    segments.forEach(segment => {
      const roomSegments = map.get(segment.room_id) ?? []
      roomSegments.push(segment)
      map.set(segment.room_id, roomSegments)
    })
    return { map, bounds: { start, end } }
  }, [filteredAllocations, view, activeFilters, term])

  const roomRows = useMemo(() => {
    return visibleRooms.map(room => ({
      room,
      segments: allocationByRoom.map.get(room.id) ?? []
    }))
  }, [visibleRooms, allocationByRoom])

  const renderRowContent = (row: (typeof roomRows)[number]) => (
    <>
      <div className="w-56 shrink-0 border-e px-4 py-3">
        <div className="font-semibold">{row.room.name}</div>
        <div className="text-xs text-muted-foreground">کد: {row.room.code}</div>
        <div className="text-xs text-muted-foreground">ظرفیت: {row.room.capacity}</div>
      </div>
      <div className="relative flex-1" dir="ltr">
        <div className="absolute inset-0">
          <div className="flex h-full">
            <div className="pointer-events-none h-full w-full bg-[repeating-linear-gradient(90deg,transparent,transparent,calc(12.5%_-_1px),rgba(148,163,184,0.25)_,calc(12.5%))]" />
          </div>
        </div>
        <div className="relative flex h-full items-center gap-2 p-3">
          {row.segments.length === 0 ? (
            <span className="text-xs text-muted-foreground">بدون امتحان برنامه‌ریزی‌شده</span>
          ) : (
            row.segments.map(segment => (
              <div
                key={segment.id}
                className="group absolute top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-start text-xs shadow-sm transition hover:bg-primary/20"
                style={{ left: `${segment.offsetPercent}%`, width: `${segment.widthPercent}%` }}
              >
                <span className="font-semibold text-primary-foreground">{segment.exam_title}</span>
                <span className="text-primary-foreground/80">
                  {segment.course_code} • {segment.allocated_seats} نفر
                </span>
                <span className="text-[10px] text-primary-foreground/70">
                  {dayjs(segment.starts_at).calendar('jalali').locale('fa').format('HH:mm')} —{' '}
                  {dayjs(segment.ends_at).calendar('jalali').locale('fa').format('HH:mm')}
                </span>
                {segment.notes ? (
                  <span className="text-[10px] text-primary-foreground/70">{segment.notes}</span>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )

  const boundsStart = allocationByRoom.bounds.start
  const boundsEnd = allocationByRoom.bounds.end
  const boundsStartValue = boundsStart.valueOf()
  const boundsEndValue = boundsEnd.valueOf()
  const timelineSegments = useMemo(
    () => buildTimelineSegments(view, boundsStartValue, boundsEndValue),
    [view, boundsStartValue, boundsEndValue]
  )

  const rowHeight = 96
  const virtualizationEnabled = !isPrinting
  const rowVirtualizer = useVirtualizer({
    count: roomRows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => rowHeight,
    overscan: 6,
    enabled: virtualizationEnabled
  })

  const summary = useMemo(() => {
    return {
      allocations: filteredAllocations.length,
      rooms: visibleRooms.length
    }
  }, [filteredAllocations.length, visibleRooms.length])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(() => {
      const query = createTimetableQuery(activeFilters)
      const search = query.toString()
      const target = search ? `${pathname}?${search}` : pathname
      router.replace(target, { scroll: false })
    })
  }

  const handleReset = () => {
    setFilters(DEFAULT_TIMETABLE_FILTERS)
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const updateFilter = <Key extends keyof TimetableFilters>(key: Key, value: TimetableFilters[Key]) => {
    setFilters(current => ({ ...current, [key]: value }))
  }

  const toggleRoom = (roomId: number) => {
    setFilters(current => {
      const exists = current.rooms.includes(roomId)
      const rooms = exists
        ? current.rooms.filter(id => id !== roomId)
        : [...current.rooms, roomId]
      return { ...current, rooms }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">برنامهٔ امتحانات ترم {term.name}</h1>
          <p className="text-sm text-muted-foreground">
            بازهٔ ترم: {jalaliFormat(term.starts_at, 'D MMMM YYYY')} تا {jalaliFormat(term.ends_at, 'D MMMM YYYY')}
          </p>
          {generatedAt ? (
            <p className="text-xs text-muted-foreground">
              به‌روزرسانی: {jalaliFormat(generatedAt, 'D MMMM YYYY HH:mm')}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <div className="inline-flex items-center gap-1 rounded-md border p-1">
            {VIEW_OPTIONS.map(option => (
              <Button
                key={option}
                type="button"
                variant={option === view ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(option)}
              >
                {option === 'day' ? 'روز' : option === 'week' ? 'هفته' : 'ماه'}
              </Button>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={handlePrint}>
            چاپ
          </Button>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-lg border bg-card p-4 print:hidden md:grid-cols-5"
        onSubmit={handleSubmit}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">جستجو</span>
          <input
            value={filters.search}
            onChange={event => updateFilter('search', event.target.value)}
            placeholder="درس یا کد"
            className="h-10 rounded-md border px-3"
            name="search"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">از تاریخ</span>
          <input
            type="datetime-local"
            value={filters.from ?? ''}
            onChange={event => updateFilter('from', event.target.value || null)}
            className="h-10 rounded-md border px-3"
            name="from"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">تا تاریخ</span>
          <input
            type="datetime-local"
            value={filters.to ?? ''}
            onChange={event => updateFilter('to', event.target.value || null)}
            className="h-10 rounded-md border px-3"
            name="to"
          />
        </label>
        <fieldset className="col-span-full flex flex-col gap-2 text-sm md:col-span-2">
          <legend className="font-medium">انتخاب کلاس‌ها</legend>
          <div className="flex flex-wrap gap-2">
            {rooms.map(room => {
              const checked = filters.rooms.includes(room.id)
              return (
                <label
                  key={room.id}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
                    checked ? 'border-primary bg-primary/10 text-primary' : 'bg-muted'
                  )}
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={checked}
                    onChange={() => toggleRoom(room.id)}
                    name="room"
                    value={room.id}
                  />
                  <span>
                    {room.name}
                    <span className="text-muted-foreground"> ({room.capacity})</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
        <div className="col-span-full flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleReset}>
            بازنشانی
          </Button>
          <Button type="submit">اعمال فیلترها</Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>تعداد آزمون‌ها: {summary.allocations}</span>
        <span>تعداد کلاس‌ها: {summary.rooms}</span>
        <span>
          بازهٔ زمانی نمایش: {jalaliFormat(boundsStart.toISOString(), 'D MMM YYYY HH:mm')} تا{' '}
          {jalaliFormat(boundsEnd.toISOString(), 'D MMM YYYY HH:mm')}
        </span>
        {activeFilters.search ? <span>جستجو: «{activeFilters.search}»</span> : null}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur print:relative print:bg-transparent">
          <div className="flex">
            <div className="w-56 border-e px-4 py-3 text-sm font-medium text-muted-foreground">کلاس</div>
            <div className="flex-1">
              <div dir="ltr" className="relative h-12">
                {timelineSegments.map(segment => (
                  <div
                    key={segment.id}
                    className="absolute top-0 flex h-full -translate-x-1/2 flex-col items-center justify-center text-xs text-muted-foreground"
                    style={{ left: `${segment.positionPercent}%` }}
                  >
                    <span>{segment.label}</span>
                    <span className="mt-1 h-3 w-px bg-border" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          ref={scrollParentRef}
          className={cn('timetable-scroll max-h-[640px] overflow-auto bg-background', isPrinting && 'max-h-none overflow-visible')}
        >
          <div
            className="timetable-virtual-inner relative"
            style={{ height: virtualizationEnabled ? rowVirtualizer.getTotalSize() : undefined }}
          >
            {roomRows.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                برنامه‌ای برای نمایش یافت نشد.
              </div>
            ) : virtualizationEnabled ? (
              rowVirtualizer.getVirtualItems().map(virtualRow => {
                const row = roomRows[virtualRow.index]
                if (!row) return null
                return (
                  <div
                    key={row.room.id}
                    className="timetable-row absolute inset-x-0 flex border-b bg-background"
                    style={{ transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px` }}
                  >
                    {renderRowContent(row)}
                  </div>
                )
              })
            ) : (
              roomRows.map(row => (
                <div key={row.room.id} className="flex border-b bg-background">
                  {renderRowContent(row)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
