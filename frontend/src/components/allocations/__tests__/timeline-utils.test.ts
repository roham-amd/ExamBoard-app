
import { describe, expect, it } from "vitest";

import { applyTimelineNudge, MIN_DURATION_MINUTES } from "../timeline-utils";

describe("applyTimelineNudge", () => {
  const rangeStart = new Date("2024-01-01T08:00:00Z");
  const rangeEnd = new Date("2024-01-01T20:00:00Z");

  it("moves an allocation forward with snapping", () => {
    const start = new Date("2024-01-01T10:10:00Z");
    const end = new Date("2024-01-01T11:40:00Z");


    const result = applyTimelineNudge({
      start,
      end,

      kind: "move",
      deltaMinutes: 7,
      rangeStart,
      rangeEnd,
    });

    expect(result.start.toISOString()).toBe("2024-01-01T10:15:00.000Z");
    expect(result.end.toISOString()).toBe("2024-01-01T11:45:00.000Z");
  });

  it("prevents start moving past end", () => {
    const start = new Date("2024-01-01T10:00:00Z");
    const end = new Date("2024-01-01T10:20:00Z");


    const result = applyTimelineNudge({
      start,
      end,

      kind: "start",
      deltaMinutes: 30,
      rangeStart,
      rangeEnd,
    });

    expect(result.end.getTime() - result.start.getTime()).toBe(
      MIN_DURATION_MINUTES * 60 * 1000,
    );
  });

  it("clamps to the timeline range when nudged outside", () => {
    const start = new Date("2024-01-01T08:10:00Z");
    const end = new Date("2024-01-01T08:40:00Z");


    const result = applyTimelineNudge({
      start,
      end,

      kind: "start",
      deltaMinutes: -60,
      rangeStart,
      rangeEnd,
    });

    expect(result.start.getTime()).toBe(rangeStart.getTime());
  });
});

