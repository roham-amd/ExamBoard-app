"use client";

import { useTranslations } from "next-intl";

import {
  DataTable,
  type DataTableColumn,
} from "@/src/components/data/data-table";
import { dayjs } from "@/src/lib/dayjs";
import { usePublicExamsQuery } from "@/src/lib/queries";
import type { PublicExam } from "@/src/types/api";

export default function PublicExamsPage() {
  const t = useTranslations("publicExams");
  const { data, isPending, error, refetch } = usePublicExamsQuery();

  const columns: DataTableColumn<PublicExam>[] = [
    {
      header: t("columns.course"),
      accessor: (item) => `${item.course_code} – ${item.course_title}`,
    },
    {
      header: t("columns.datetime"),
      accessor: (item) =>
        dayjs(item.starts_at).calendar("jalali").format("YYYY/MM/DD HH:mm"),
    },
    { header: t("columns.location"), accessor: (item) => item.location },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>
      <DataTable
        data={data?.results}
        total={data?.count}
        columns={columns}
        isLoading={isPending}
        error={error}
        onRetry={() => refetch()}
      />
    </section>
  );
}
