
"use client";

import type { ReactNode } from "react";
import { Fragment, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/src/components/ui/button";
import { resolveErrorContent } from "@/src/lib/api-error";
import { cn } from "@/src/lib/utils";

export interface DataTableColumn<T> {
  header: string;
  accessor: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data?: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  total?: number;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  error,
  onRetry,
  total,
}: DataTableProps<T>) {
  const t = useTranslations("dataTable");
  const errorContent = useMemo(
    () => (error ? resolveErrorContent(error) : null),
    [error],
  );


  if (isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-lg border bg-card/30">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />

          <span>{t("loading")}</span>
        </div>
      </div>
    );

  }

  if (errorContent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center">
        <div>

          <p className="text-lg font-semibold text-destructive">
            {errorContent.title}
          </p>
          <p className="text-sm text-destructive/80">
            {errorContent.description}
          </p>
        </div>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry} size="sm">
            {t("retry")}
          </Button>
        ) : null}
      </div>
    );

  }

  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-dashed text-muted-foreground">

        <p>{t("empty")}</p>
      </div>
    );

  }

  return (
    <div className="space-y-3">

      {typeof total === "number" ? (
        <p className="text-sm text-muted-foreground">
          {t("total", { count: total })}
        </p>

      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border rounded-lg border">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>

              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-start text-xs font-medium uppercase tracking-wide",
                    column.className,
                  )}

                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card/60">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex} className="transition hover:bg-accent/40">
                {columns.map((column, columnIndex) => (
                  <td
                    key={columnIndex}

                    className={cn(
                      "px-4 py-3 text-sm text-foreground",
                      column.className,
                    )}

                  >
                    <Fragment>{column.accessor(item)}</Fragment>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  );

}
