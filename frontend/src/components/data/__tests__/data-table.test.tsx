
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "../data-table";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    return (key: string, values?: Record<string, unknown>) => {
      const messages: Record<
        string,
        string | ((values?: Record<string, unknown>) => string)
      > = {
        loading: "در حال دریافت داده‌ها...",
        empty: "داده‌ای برای نمایش وجود ندارد.",
        retry: "تلاش مجدد",
        total: (params) => `مجموع ${(params?.count ?? 0) as number} مورد`,
      };
      const message = messages[key];
      if (typeof message === "function") {
        return message(values);
      }
      return message ?? key;
    };
  },
}));

interface FakeRow {
  id: number;
  name: string;
}

describe("DataTable", () => {
  const columns = [
    {
      header: "شناسه",
      accessor: (row: FakeRow) => row.id,
    },
    {
      header: "نام",
      accessor: (row: FakeRow) => row.name,
    },
  ];

  it("renders loading state", () => {
    render(<DataTable<FakeRow> columns={columns} isLoading />);
    expect(screen.getByText("در حال دریافت داده‌ها...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(<DataTable<FakeRow> columns={columns} error={new Error("boom")} />);
    expect(screen.getByText("خطای ناشناخته")).toBeInTheDocument();
  });

  it("renders rows with total count", () => {

    render(
      <DataTable<FakeRow>
        columns={columns}
        data={[

          { id: 1, name: "الف" },
          { id: 2, name: "ب" },
        ]}
        total={2}
      />,
    );

    expect(screen.getByText("مجموع 2 مورد")).toBeInTheDocument();
    expect(screen.getByText("الف")).toBeInTheDocument();
    expect(screen.getByText("ب")).toBeInTheDocument();
  });
});

