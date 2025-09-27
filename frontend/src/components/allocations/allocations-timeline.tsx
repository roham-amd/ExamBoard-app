'use client'

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { restrictToFirstScrollableAncestor, restrictToParentElement } from '@dnd-kit/modifiers'
import type { CSSProperties, FormEvent } from 'react'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useAllocationsQuery, useRoomsQuery } from '@/src/lib/queries'
import { useUpdateAllocationMutation } from '@/src/lib/mutations'
import { useToast } from '@/src/components/ui/use-toast'
import { resolveErrorContent } from '@/src/lib/api-error'
import {
  addMinutes,
  applyTimelineNudge,
  clampDate,
  ensureMinimumDuration,
  getDefaultRange,
  MIN_DURATION_MINUTES,
  rangeContains,
  snapDate,
  TimelineNudgeKind,
  TimelineRange,
  toIso
} from './timeline-utils'
import {
  formatDateTimeInput,
  formatJalaliDateTime,
  parseDateTimeInput
} from '@/src/lib/utils'
import type { Allocation, AllocationRoomSummary, Room } from '@/src/types/api'

type DragType = 'move' | 'resize-start' | 'resize-end'

interface DragMetadata {
  type: DragType
  allocationId: number
  sourceRoomId: number
  originalStartsAt: string
  originalEndsAt: string
}

interface CapacityPoint {
  time: Date
  value: number
}

const useElementWidth = (ref: React.RefObject<HTMLElement>) => {
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!ref.current) return
    const element = ref.current
    const updateWidth = () => {
      const rect = element.getBoundingClientRect()
      setWidth(rect.width)
    }
    updateWidth()
    const observer = new ResizeObserver(() => updateWidth())
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return width
}

interface TimelineNudgeLabels {
  moveEarlier: string
  moveLater: string
  startEarlier: string
  startLater: string
  endEarlier: string
  endLater: string
  keyboardHint: string
}

type TimelineItemNudgeHandler = (kind: TimelineNudgeKind, deltaMinutes: number) => void

interface TimelineItemProps {
  allocation: Allocation
  room: AllocationRoomSummary
  rangeStart: Date
  rangeEnd: Date
  containerWidth: number
  isSelected: boolean
  onSelect: () => void
  onNudge: TimelineItemNudgeHandler
  nudgeLabels: TimelineNudgeLabels
}

const TimelineItem = memo(({
  allocation,
  room,
  rangeStart,
  rangeEnd,
  containerWidth,
  isSelected,
  onSelect,
  onNudge,
  nudgeLabels
}: TimelineItemProps) => {
  const totalMs = rangeEnd.getTime() - rangeStart.getTime()
  const allocationStart = new Date(allocation.starts_at)
  const allocationEnd = new Date(allocation.ends_at)
  const widthPercent = totalMs > 0 ? ((allocationEnd.getTime() - allocationStart.getTime()) / totalMs) * 100 : 0
  const leftPercent = totalMs > 0 ? ((allocationStart.getTime() - rangeStart.getTime()) / totalMs) * 100 : 0

  const moveId = `move-${allocation.id}-${room.id}`
  const startId = `start-${allocation.id}-${room.id}`
  const endId = `end-${allocation.id}-${room.id}`

  const move = useDraggable({
    id: moveId,
    data: {
      type: 'move',
      allocationId: allocation.id,
      sourceRoomId: room.id,
      originalStartsAt: allocation.starts_at,
      originalEndsAt: allocation.ends_at
    } satisfies DragMetadata
  })

  const startHandle = useDraggable({
    id: startId,
    data: {
      type: 'resize-start',
      allocationId: allocation.id,
      sourceRoomId: room.id,
      originalStartsAt: allocation.starts_at,
      originalEndsAt: allocation.ends_at
    } satisfies DragMetadata
  })

  const endHandle = useDraggable({
    id: endId,
    data: {
      type: 'resize-end',
      allocationId: allocation.id,
      sourceRoomId: room.id,
      originalStartsAt: allocation.starts_at,
      originalEndsAt: allocation.ends_at
    } satisfies DragMetadata
  })

  const transform = move.transform
  const style: CSSProperties = {
    width: `${Math.max(2, widthPercent)}%`,
    insetInlineStart: `${leftPercent}%`,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    minWidth: containerWidth
      ? `${Math.max(48, (MIN_DURATION_MINUTES / ((rangeEnd.getTime() - rangeStart.getTime()) / 60000)) * containerWidth)}px`
      : undefined
  }

  return (
    <div
      ref={move.setNodeRef}
      {...move.listeners}
      {...move.attributes}
      className={`timeline-item absolute top-2 flex h-16 flex-col justify-center rounded-md border border-primary/40 bg-primary/10 px-3 text-start text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isSelected ? 'border-primary bg-primary/20 shadow-lg' : 'hover:border-primary/70 hover:bg-primary/20'
      }`}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <span className="truncate text-sm font-medium text-primary-foreground/80">{allocation.exam_title}</span>
      <span className="text-muted-foreground">
        {formatJalaliDateTime(allocation.starts_at)}
      </span>
      <span className="text-muted-foreground">
        {formatJalaliDateTime(allocation.ends_at)}
      </span>
      {isSelected ? (
        <div className="mt-2 flex flex-wrap gap-1" aria-label={nudgeLabels.keyboardHint}>
          <p className="sr-only">{nudgeLabels.keyboardHint}</p>
          <button
            type="button"
            className="rounded-md border border-border bg-background/80 px-2 py-1 text-[0.7rem] text-foreground shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={event => {
              event.stopPropagation()
              void onNudge('move', -5)
            }}
            onPointerDown={event => event.stopPropagation()}
          >
            {nudgeLabels.moveEarlier}
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-background/80 px-2 py-1 text-[0.7rem] text-foreground shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={event => {
              event.stopPropagation()
              void onNudge('move', 5)
            }}
            onPointerDown={event => event.stopPropagation()}
          >
            {nudgeLabels.moveLater}
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-background/80 px-2 py-1 text-[0.7rem] text-foreground shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={event => {
              event.stopPropagation()
              void onNudge('start', -15)
            }}
            onPointerDown={event => event.stopPropagation()}
          >
            {nudgeLabels.startEarlier}
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-background/80 px-2 py-1 text-[0.7rem] text-foreground shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={event => {
              event.stopPropagation()
              void onNudge('start', 15)
            }}
            onPointerDown={event => event.stopPropagation()}
          >
            {nudgeLabels.startLater}
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-background/80 px-2 py-1 text-[0.7rem] text-foreground shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={event => {
              event.stopPropagation()
              void onNudge('end', -15)
            }}
            onPointerDown={event => event.stopPropagation()}
          >
            {nudgeLabels.endEarlier}
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-background/80 px-2 py-1 text-[0.7rem] text-foreground shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={event => {
              event.stopPropagation()
              void onNudge('end', 15)
            }}
            onPointerDown={event => event.stopPropagation()}
          >
            {nudgeLabels.endLater}
          </button>
        </div>
      ) : null}
      <div
        ref={startHandle.setNodeRef}
        {...startHandle.listeners}
        {...startHandle.attributes}
        className="absolute inset-y-2 inline-start-1 flex w-2 cursor-ew-resize items-center justify-center rounded-sm bg-primary/60"
        onClick={event => event.stopPropagation()}
      >
        <span className="sr-only">resize</span>
      </div>
      <div
        ref={endHandle.setNodeRef}
        {...endHandle.listeners}
        {...endHandle.attributes}
        className="absolute inset-y-2 inline-end-1 flex w-2 cursor-ew-resize items-center justify-center rounded-sm bg-primary/60"
        onClick={event => event.stopPropagation()}
      >
        <span className="sr-only">resize</span>
      </div>
    </div>
  )
})

TimelineItem.displayName = 'TimelineItem'

interface RoomLaneProps {
  room: Room
  segments: Array<{ allocation: Allocation; room: AllocationRoomSummary }>
  rangeStart: Date
  rangeEnd: Date
  containerWidth: number
  selected: { allocationId: number; roomId: number } | null
  onSelect: (selection: { allocationId: number; roomId: number }) => void
  capacityLabel: string
  emptyText: string
  onNudge: (
    allocation: Allocation,
    roomId: number,
    kind: TimelineNudgeKind,
    deltaMinutes: number
  ) => void | Promise<void>
  nudgeLabels: TimelineNudgeLabels
}

const RoomLane = memo(({
  room,
  segments,
  rangeStart,
  rangeEnd,
  containerWidth,
  selected,
  onSelect,
  capacityLabel,
  emptyText,
  onNudge,
  nudgeLabels
}: RoomLaneProps) => {
  const { setNodeRef } = useDroppable({ id: `room-${room.id}` })
  return (
    <div className="contents">
      <div className="rounded-md border border-border bg-muted/40 px-3 py-4 text-sm font-medium text-foreground">
        <div>{room.name}</div>
        <div className="text-xs text-muted-foreground">{capacityLabel}</div>
      </div>
      <div ref={setNodeRef} className="relative min-h-[120px] rounded-md border border-dashed border-border bg-background">
        {segments.length === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">{emptyText}</p>
        ) : null}
        {segments.map(segment => (
          <TimelineItem
            key={`${segment.allocation.id}-${segment.room.id}`}
            allocation={segment.allocation}
            room={segment.room}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            containerWidth={containerWidth}
            isSelected={
              selected?.allocationId === segment.allocation.id && selected?.roomId === segment.room.id
            }
            onSelect={() => onSelect({ allocationId: segment.allocation.id, roomId: segment.room.id })}
            onNudge={(kind, delta) => void onNudge(segment.allocation, segment.room.id, kind, delta)}
            nudgeLabels={nudgeLabels}
          />
        ))}
      </div>
    </div>
  )
})

RoomLane.displayName = 'RoomLane'

export function AllocationsTimeline() {
  const t = useTranslations('allocations.timeline')
  const { toast } = useToast()

  const [range, setRange] = useState<TimelineRange>(() => getDefaultRange())
  const [rangeDraft, setRangeDraft] = useState<TimelineRange>(() => getDefaultRange())
  const [selected, setSelected] = useState<{ allocationId: number; roomId: number } | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const rangeStart = useMemo(() => new Date(range.from), [range.from])
  const rangeEnd = useMemo(() => new Date(range.to), [range.to])

  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineWidth = useElementWidth(timelineRef)

  const roomsQuery = useRoomsQuery({ page_size: 200 })

  const allocationParams = useMemo(
    () => ({
      page_size: 200,
      from: range.from,
      to: range.to
    }),
    [range.from, range.to]
  )
  const allocationsQuery = useAllocationsQuery(allocationParams)
  const updateAllocation = useUpdateAllocationMutation()

  const rooms = useMemo(() => roomsQuery.data?.results ?? [], [roomsQuery.data])
  const roomMap = useMemo(() => new Map(rooms.map(room => [room.id, room])), [rooms])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const segments = useMemo(() => {
    const items: Array<{ allocation: Allocation; room: AllocationRoomSummary }> = []
    allocationsQuery.data?.results.forEach(allocation => {
      allocation.rooms.forEach(room => {
        items.push({ allocation, room })
      })
    })
    return items
  }, [allocationsQuery.data])

  const segmentsByRoom = useMemo(() => {
    const map = new Map<number, Array<{ allocation: Allocation; room: AllocationRoomSummary }>>()
    segments.forEach(segment => {
      const existing = map.get(segment.room.id)
      if (existing) {
        existing.push(segment)
        return
      }
      map.set(segment.room.id, [segment])
    })
    return map
  }, [segments])

  const activeSelection = useMemo(() => {
    if (!selected) return null
    return segments.find(
      segment => segment.allocation.id === selected.allocationId && segment.room.id === selected.roomId
    )
  }, [segments, selected])

  const capacityQuery = useAllocationsQuery(
    activeSelection
      ? {
          page_size: 200,
          room: activeSelection.room.id,
          date_from: range.from,
          date_to: range.to
        }
      : undefined,
    {
      enabled: Boolean(activeSelection)
    }
  )

  const computeDragMs = useCallback(
    (deltaX: number) => {
      if (!timelineWidth) return 0
      const totalMs = rangeEnd.getTime() - rangeStart.getTime()
      if (totalMs <= 0) return 0
      return (deltaX / timelineWidth) * totalMs
    },
    [timelineWidth, rangeEnd, rangeStart]
  )

  const calculateCapacityEstimate = useCallback(
    (allocation: Allocation, roomId: number, startsAt: Date, endsAt: Date) => {
      const targetRoom = roomMap.get(roomId)
      if (!targetRoom) return null
      const overlapping = segments.filter(segment => {
        if (segment.room.id !== roomId) return false
        if (segment.allocation.id === allocation.id) return false
        const start = new Date(segment.allocation.starts_at)
        const end = new Date(segment.allocation.ends_at)
        return rangeContains(start, end, startsAt, endsAt)
      })
      const existingSeats = overlapping.reduce((total, segment) => total + segment.allocation.allocated_seats, 0)
      const proposedSeats = existingSeats + allocation.allocated_seats
      return {
        capacity: targetRoom.capacity,
        proposedSeats,
        overflow: proposedSeats > targetRoom.capacity
      }
    },
    [roomMap, segments]
  )

  const submitUpdate = useCallback(
    async (
      allocation: Allocation,
      sourceRoomId: number,
      targetRoomId: number,
      startsAt: Date,
      endsAt: Date
    ) => {
      const estimate = calculateCapacityEstimate(allocation, targetRoomId, startsAt, endsAt)
      if (estimate?.overflow) {
        setWarning(
          t('capacityWarning', {
            used: estimate.proposedSeats,
            capacity: estimate.capacity
          })
        )
        const confirmed = window.confirm(t('capacityConfirm'))
        if (!confirmed) {
          return
        }
      } else {
        setWarning(null)
      }

      const existingIds = allocation.rooms.map(room => room.id)
      const updatedRooms = existingIds.includes(sourceRoomId)
        ? existingIds.map(id => (id === sourceRoomId ? targetRoomId : id))
        : [...existingIds, targetRoomId]
      const uniqueRooms = Array.from(new Set(updatedRooms))

      const payload = {
        exam: allocation.exam,
        rooms: uniqueRooms,
        starts_at: toIso(startsAt),
        ends_at: toIso(endsAt),
        allocated_seats: allocation.allocated_seats,
        notes: allocation.notes ?? ''
      }

      try {
        await updateAllocation.mutateAsync({ id: allocation.id, data: payload })
        toast({ title: t('feedback.saved') })
      } catch (error) {
        const resolved = resolveErrorContent(error)
        toast({
          title: resolved.title,
          description: resolved.description,
          variant: 'destructive'
        })
      }
    },
    [calculateCapacityEstimate, t, toast, updateAllocation]
  )

  const onDragEnd = useCallback(
    async ({ active, delta, over }: DragEndEvent) => {
      const metadata = active.data.current as DragMetadata | undefined
      if (!metadata) return
      const allocation = allocationsQuery.data?.results.find(item => item.id === metadata.allocationId)
      if (!allocation) return
      const originalStart = new Date(metadata.originalStartsAt)
      const originalEnd = new Date(metadata.originalEndsAt)
      const targetRoomId = over && typeof over.id === 'string' && over.id.startsWith('room-')
        ? Number(over.id.replace('room-', ''))
        : metadata.sourceRoomId
      const deltaMs = computeDragMs(delta.x)

      if (metadata.type === 'move') {
        let nextStart = new Date(originalStart.getTime() + deltaMs)
        let nextEnd = new Date(originalEnd.getTime() + deltaMs)
        nextStart = snapDate(nextStart, 5)
        nextEnd = snapDate(nextEnd, 5)
        nextStart = clampDate(nextStart, rangeStart, rangeEnd)
        nextEnd = clampDate(nextEnd, rangeStart, rangeEnd)
        if (nextEnd <= nextStart) {
          nextEnd = addMinutes(nextStart, MIN_DURATION_MINUTES)
        }
        await submitUpdate(allocation, metadata.sourceRoomId, targetRoomId, nextStart, nextEnd)
        return
      }

      if (metadata.type === 'resize-start') {
        let nextStart = new Date(originalStart.getTime() + deltaMs)
        nextStart = snapDate(nextStart, 15)
        nextStart = clampDate(nextStart, rangeStart, rangeEnd)
        if (nextStart >= originalEnd) {
          nextStart = addMinutes(originalEnd, -MIN_DURATION_MINUTES)
        }
        const { start, end } = ensureMinimumDuration(nextStart, originalEnd)
        await submitUpdate(allocation, metadata.sourceRoomId, targetRoomId, start, end)
        return
      }

      if (metadata.type === 'resize-end') {
        let nextEnd = new Date(originalEnd.getTime() + deltaMs)
        nextEnd = snapDate(nextEnd, 15)
        nextEnd = clampDate(nextEnd, rangeStart, rangeEnd)
        if (nextEnd <= originalStart) {
          nextEnd = addMinutes(originalStart, MIN_DURATION_MINUTES)
        }
        const { start, end } = ensureMinimumDuration(originalStart, nextEnd)
        await submitUpdate(allocation, metadata.sourceRoomId, targetRoomId, start, end)
      }
    },
    [allocationsQuery.data, computeDragMs, rangeEnd, rangeStart, submitUpdate]
  )

  useEffect(() => {
    if (!activeSelection) {
      setWarning(null)
    }
  }, [activeSelection])

  const timelineHours = useMemo(() => {
    const result: string[] = []
    const cursor = new Date(rangeStart)
    while (cursor < rangeEnd) {
      result.push(formatJalaliDateTime(cursor.toISOString()))
      cursor.setHours(cursor.getHours() + 1)
    }
    return result
  }, [rangeEnd, rangeStart])

  const handleRangeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rangeDraft.from || !rangeDraft.to) {
      toast({
        title: t('rangeInvalid.title'),
        description: t('rangeInvalid.description'),
        variant: 'destructive'
      })
      return
    }
    const draftStart = new Date(rangeDraft.from)
    const draftEnd = new Date(rangeDraft.to)
    if (!Number.isFinite(draftStart.getTime()) || !Number.isFinite(draftEnd.getTime()) || draftStart >= draftEnd) {
      toast({
        title: t('rangeInvalid.title'),
        description: t('rangeInvalid.description'),
        variant: 'destructive'
      })
      return
    }
    setRange({ ...rangeDraft })
  }

  const capacityPoints: CapacityPoint[] = useMemo(() => {
    if (!capacityQuery.data?.results || !activeSelection) return []
    const start = rangeStart
    const end = rangeEnd
    const points: CapacityPoint[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const usage = capacityQuery.data.results.reduce((total, item) => {
        const itemStart = new Date(item.starts_at)
        const itemEnd = new Date(item.ends_at)
        return rangeContains(itemStart, itemEnd, cursor, addMinutes(cursor, 15))
          ? total + item.allocated_seats
          : total
      }, 0)
      points.push({ time: new Date(cursor), value: usage })
      cursor.setMinutes(cursor.getMinutes() + 15)
    }
    return points
  }, [capacityQuery.data, activeSelection, rangeEnd, rangeStart])

  const maxCapacityValue = useMemo(() => {
    if (!capacityPoints.length) return 0
    return Math.max(...capacityPoints.map(point => point.value))
  }, [capacityPoints])

  const selectedRoomCapacity = activeSelection ? roomMap.get(activeSelection.room.id)?.capacity ?? 0 : 0
  const meterPercent = selectedRoomCapacity > 0 ? Math.min(100, (maxCapacityValue / selectedRoomCapacity) * 100) : 0

  const handleRangeDraftChange = (key: keyof TimelineRange, value: string) => {
    setRangeDraft(prev => ({ ...prev, [key]: parseDateTimeInput(value) }))
  }

  const nudgeLabels = useMemo(
    () => ({
      moveEarlier: t('nudge.moveEarlier'),
      moveLater: t('nudge.moveLater'),
      startEarlier: t('nudge.startEarlier'),
      startLater: t('nudge.startLater'),
      endEarlier: t('nudge.endEarlier'),
      endLater: t('nudge.endLater'),
      keyboardHint: t('nudge.keyboardHint')
    }),
    [t]
  )

  const handleSelect = useCallback((selection: { allocationId: number; roomId: number }) => {
    setSelected(selection)
  }, [])

  const handleNudge = useCallback(
    async (
      allocation: Allocation,
      roomId: number,
      kind: TimelineNudgeKind,
      deltaMinutes: number
    ) => {
      const { start, end } = applyTimelineNudge({
        start: new Date(allocation.starts_at),
        end: new Date(allocation.ends_at),
        kind,
        deltaMinutes,
        rangeStart,
        rangeEnd
      })
      await submitUpdate(allocation, roomId, roomId, start, end)
    },
    [rangeEnd, rangeStart, submitUpdate]
  )

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <form className="flex flex-wrap items-center gap-2" onSubmit={handleRangeSubmit}>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t('fromLabel')}
            <input
              type="datetime-local"
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={formatDateTimeInput(rangeDraft.from)}
              onChange={event => handleRangeDraftChange('from', event.target.value)}
              dir="ltr"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t('toLabel')}
            <input
              type="datetime-local"
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={formatDateTimeInput(rangeDraft.to)}
              onChange={event => handleRangeDraftChange('to', event.target.value)}
              dir="ltr"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            {t('applyRange')}
          </button>
        </form>
      </header>

      {warning ? (
        <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          {warning}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="grid grid-cols-[120px_1fr] gap-2 text-xs font-medium text-muted-foreground">
          <span>{t('roomColumn')}</span>
          <div ref={timelineRef} className="relative overflow-hidden rounded-md border border-dashed border-border bg-muted/40">
            <div className="flex justify-between px-3 py-1">
              {timelineHours.map(label => (
                <span key={label} className="min-w-16 text-center">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          modifiers={[restrictToFirstScrollableAncestor, restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <div className="grid grid-cols-[120px_1fr] gap-2">
            {rooms.map(room => {
              const roomSegments = segmentsByRoom.get(room.id) ?? []
              return (
                <RoomLane
                  key={room.id}
                  room={room}
                  segments={roomSegments}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  containerWidth={timelineWidth}
                  selected={selected}
                  onSelect={handleSelect}
                  capacityLabel={t('capacityLabel', { capacity: room.capacity })}
                  emptyText={t('emptyRow')}
                  onNudge={handleNudge}
                  nudgeLabels={nudgeLabels}
                />
              )
            })}
          </div>
        </DndContext>
      </div>

      <footer className="rounded-md border border-border bg-muted/40 p-3">
        {activeSelection ? (
          <div className="space-y-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t('meter.title')}</h3>
              <p className="text-xs text-muted-foreground">{t('meter.subtitle')}</p>
            </div>
            {capacityQuery.isPending ? (
              <p className="text-xs text-muted-foreground">{t('meter.loading')}</p>
            ) : capacityPoints.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('meter.empty')}</p>
            ) : (
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${meterPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('meter.usage', {
                    used: maxCapacityValue,
                    capacity: selectedRoomCapacity
                  })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('meter.placeholder')}</p>
        )}
      </footer>
    </section>
  )
}

