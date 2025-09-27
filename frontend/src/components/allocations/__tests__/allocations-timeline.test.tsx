import { NextIntlClientProvider } from "next-intl";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/src/i18n/messages/fa.json";
import { AllocationsTimeline } from "@/src/components/allocations/allocations-timeline";

const rooms = [
  { id: 1, name: "سالن ۱", capacity: 30 },
  { id: 2, name: "سالن ۲", capacity: 45 },
];

const allocations = [
  {
    id: 1,
    exam: 1,
    exam_title: "ریاضی ۱",
    rooms: [
      { id: 1, name: "سالن ۱" },
      { id: 2, name: "سالن ۲" },
    ],
    starts_at: "2024-01-01T08:00:00Z",
    ends_at: "2024-01-01T10:00:00Z",
    allocated_seats: 25,
    notes: null,
  },
];

const capacityAllocations = [
  {
    id: 2,
    exam: 2,
    exam_title: "فیزیک ۱",
    rooms: [{ id: 1, name: "سالن ۱" }],
    starts_at: "2024-01-01T09:00:00Z",
    ends_at: "2024-01-01T10:00:00Z",
    allocated_seats: 20,
    notes: null,
  },
];

vi.mock("@/src/lib/queries", () => {
  const useRoomsQuery = vi.fn(() => ({ data: { results: rooms } }));
  const useAllocationsQuery = vi.fn((params?: Record<string, unknown>) => {
    if (params && "room" in (params ?? {})) {
      return { data: { results: capacityAllocations }, isPending: false };
    }
    return { data: { results: allocations }, isPending: false };
  });
  return { useRoomsQuery, useAllocationsQuery };
});

vi.mock("@/src/lib/mutations", () => ({
  useUpdateAllocationMutation: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  })),
}));

vi.mock("@/src/components/ui/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("AllocationsTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders rooms and their allocations", () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <AllocationsTimeline />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("سالن ۱")).toBeInTheDocument();
    expect(screen.getByText("سالن ۲")).toBeInTheDocument();
    expect(screen.getAllByText("ریاضی ۱").length).toBeGreaterThan(0);
  });
});
