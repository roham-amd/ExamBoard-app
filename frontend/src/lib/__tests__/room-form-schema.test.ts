import { describe, expect, it } from "vitest";

import { roomFormSchema } from "../schemas";

describe("roomFormSchema", () => {
  it("accepts valid values", () => {
    const result = roomFormSchema.safeParse({
      name: "سالن ۱۰۱",
      capacity: 120,
      code: "A1",
      campus: "مرکزی",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid capacity", () => {
    const result = roomFormSchema.safeParse({
      name: "سالن",
      capacity: -1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("ظرفیت باید مثبت باشد");
    }
  });
});
