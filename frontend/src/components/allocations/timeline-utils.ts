
export const MIN_DURATION_MINUTES = 15;

export const snapDate = (value: Date, minutes: number) => {
  const snapMs = minutes * 60 * 1000;
  return new Date(Math.round(value.getTime() / snapMs) * snapMs);
};

export const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60 * 1000);

export const rangeContains = (
  start: Date,
  end: Date,
  targetStart: Date,
  targetEnd: Date,
) => targetStart < end && targetEnd > start;

export const toIso = (date: Date) => date.toISOString();

export const clampDate = (value: Date, min: Date, max: Date) =>
  new Date(Math.min(Math.max(value.getTime(), min.getTime()), max.getTime()));

export interface TimelineRange {
  from: string;
  to: string;
}

export const getDefaultRange = (): TimelineRange => {
  const now = new Date();
  const from = new Date(now);
  from.setHours(8, 0, 0, 0);
  const to = new Date(from);
  to.setHours(20, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
};

export type TimelineNudgeKind = "move" | "start" | "end";

export interface TimelineNudgeInput {
  start: Date;
  end: Date;
  kind: TimelineNudgeKind;
  deltaMinutes: number;
  rangeStart: Date;
  rangeEnd: Date;
}

export const ensureMinimumDuration = (start: Date, end: Date) => {
  const minEnd = addMinutes(start, MIN_DURATION_MINUTES);
  if (end <= minEnd) {
    return { start, end: minEnd };
  }
  return { start, end };
};


export const applyTimelineNudge = ({
  start,
  end,
  kind,
  deltaMinutes,
  rangeStart,

  rangeEnd,
}: TimelineNudgeInput) => {
  let nextStart = new Date(start);
  let nextEnd = new Date(end);

  if (kind === "move") {
    nextStart = snapDate(addMinutes(nextStart, deltaMinutes), 5);
    nextEnd = snapDate(addMinutes(nextEnd, deltaMinutes), 5);
  } else if (kind === "start") {
    nextStart = snapDate(addMinutes(nextStart, deltaMinutes), 15);
  } else {
    nextEnd = snapDate(addMinutes(nextEnd, deltaMinutes), 15);
  }

  nextStart = clampDate(nextStart, rangeStart, rangeEnd);
  nextEnd = clampDate(nextEnd, rangeStart, rangeEnd);

  if (kind === "start" && nextStart >= end) {
    nextStart = addMinutes(end, -MIN_DURATION_MINUTES);
  }

  if (kind === "end" && nextEnd <= start) {
    nextEnd = addMinutes(start, MIN_DURATION_MINUTES);
  }

  if (kind === "move") {
    if (nextEnd <= nextStart) {
      nextEnd = addMinutes(nextStart, MIN_DURATION_MINUTES);
    }
    return ensureMinimumDuration(nextStart, nextEnd);
  }

  if (kind === "start") {
    const adjusted = ensureMinimumDuration(nextStart, end);
    return { start: adjusted.start, end: adjusted.end };
  }

  const adjusted = ensureMinimumDuration(start, nextEnd);
  return { start: adjusted.start, end: adjusted.end };
};

