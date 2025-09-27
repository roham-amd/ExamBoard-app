import { describe, expect, it } from "vitest";

import { dayjs } from "@/src/lib/dayjs";

describe("dayjs jalali configuration", () => {
  it("formats Gregorian dates in the Jalali calendar", () => {
    const formatted = dayjs("2024-03-20T12:00:00Z")
      .calendar("jalali")
      .locale("fa")
      .format("YYYY/MM/DD");
    expect(formatted).toBe("1403/01/01");
  });
});
