"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DataTable,
  type DataTableColumn,
} from "@/src/components/data/data-table";
import { Button } from "@/src/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useToast } from "@/src/components/ui/use-toast";
import { useHolidaysQuery, useRoomsQuery } from "@/src/lib/queries";
import {
  useCreateHolidayMutation,
  useDeleteHolidayMutation,
  useUpdateHolidayMutation,
} from "@/src/lib/mutations";
import { applyServerErrors } from "@/src/lib/forms";
import { holidayFormSchema, type HolidayFormValues } from "@/src/lib/schemas";
import {
  formatDateTimeInput,
  formatJalaliDateTime,
  parseDateTimeInput,
} from "@/src/lib/utils";
import type { Holiday } from "@/src/types/api";

type DialogMode = "create" | "edit";

const createDefaultValues = (): HolidayFormValues => {
  const now = new Date();
  const starts = new Date(now);
  const ends = new Date(now);
  ends.setHours(ends.getHours() + 2);

  return {
    title: "",

    all_day: true,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    room: null,

    description: "",
  };
};

const mapHolidayToValues = (holiday: Holiday): HolidayFormValues => ({
  title: holiday.title,
  all_day: holiday.all_day,
  starts_at: holiday.starts_at,
  ends_at: holiday.ends_at,
  room: holiday.room,

  description: holiday.description ?? "",
});

const normaliseHolidayPayload = (values: HolidayFormValues) => ({
  ...values,
  description: values.description
    ? values.description.trim() || undefined
    : undefined,
  room: values.room ?? null,
});

export default function HolidaysPage() {
  const t = useTranslations("holidays");
  const commonT = useTranslations("common");
  const { toast } = useToast();

  const holidaysQuery = useHolidaysQuery();
  const roomsQuery = useRoomsQuery({ page_size: 200 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: useMemo(() => createDefaultValues(), []),
  });

  const createMutation = useCreateHolidayMutation();
  const updateMutation = useUpdateHolidayMutation();
  const deleteMutation = useDeleteHolidayMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!dialogOpen) {
      form.reset(createDefaultValues());
      setSelectedHoliday(null);
      return;
    }

    if (dialogMode === "edit" && selectedHoliday) {
      form.reset(mapHolidayToValues(selectedHoliday));
    } else {
      form.reset(createDefaultValues());
    }
  }, [dialogOpen, dialogMode, selectedHoliday, form]);

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedHoliday(null);
    setDialogOpen(true);
  };

  const handleEdit = (holiday: Holiday) => {
    setDialogMode("edit");
    setSelectedHoliday(holiday);
    setDialogOpen(true);
  };

  const handleDelete = async (holiday: Holiday) => {
    const confirmed = window.confirm(commonT("actions.confirmDelete"));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(holiday.id);
      toast({ title: t("feedback.deleted") });
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = normaliseHolidayPayload(values);
    try {
      if (dialogMode === "edit" && selectedHoliday) {
        await updateMutation.mutateAsync({
          id: selectedHoliday.id,
          data: payload,
        });
        toast({ title: t("feedback.updated") });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: t("feedback.created") });
      }
      setDialogOpen(false);
    } catch (err) {
      const handled = applyServerErrors(form, err);
      if (!handled) {
        console.error(err);
      }
    }
  });

  const columns: DataTableColumn<Holiday>[] = [
    { header: t("columns.title"), accessor: (item) => item.title },
    {
      header: t("columns.range"),
      accessor: (item) =>
        `${formatJalaliDateTime(item.starts_at)} — ${formatJalaliDateTime(item.ends_at)}`,
    },
    {
      header: t("columns.room"),
      accessor: (item) => item.room_name ?? t("allRooms"),
    },
    {
      header: t("columns.description"),
      accessor: (item) => item.description ?? "—",
    },
    {
      header: "",
      accessor: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
            <Pencil className="ms-1 h-3.5 w-3.5" aria-hidden="true" />
            {t("actions.edit")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(item)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="ms-1 h-3.5 w-3.5" aria-hidden="true" />

            {t("actions.delete")}
          </Button>
        </div>
      ),
      className: "w-52 text-end",
    },
  ];

  const isGlobal = form.watch("room") === null;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={handleCreate} className="self-start">
          <Plus className="ms-1 h-4 w-4" aria-hidden="true" />
          {t("actions.create")}
        </Button>
      </header>
      <DataTable
        data={holidaysQuery.data?.results}
        total={holidaysQuery.data?.count}
        columns={columns}
        isLoading={holidaysQuery.isPending}
        error={holidaysQuery.error}
        onRetry={() => holidaysQuery.refetch()}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? t("actions.edit") : t("actions.create")}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.title")}
                </label>
                <input
                  type="text"
                  {...form.register("title")}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.title ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="holiday-global"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={isGlobal}
                  onChange={(event) => {
                    if (event.target.checked) {
                      form.setValue("room", null);
                    } else if (roomsQuery.data?.results?.[0]) {
                      form.setValue("room", roomsQuery.data.results[0].id);
                    }
                  }}
                  disabled={isSubmitting}
                />

                <label
                  className="text-sm text-foreground"
                  htmlFor="holiday-global"
                >
                  {t("allRooms")}
                </label>
              </div>
              <Controller
                name="room"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      {t("form.room")}
                    </label>
                    <select
                      value={field.value === null ? "" : String(field.value)}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                      disabled={
                        isSubmitting || isGlobal || roomsQuery.isPending
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t("allRooms")}</option>
                      {roomsQuery.data?.results?.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.room ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.room.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
              <div className="flex items-center gap-2">
                <input
                  id="holiday-all-day"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  disabled={isSubmitting}
                  {...form.register("all_day")}
                />
                <label
                  className="text-sm text-foreground"
                  htmlFor="holiday-all-day"
                >
                  {t("form.allDay")}
                </label>
              </div>
              <Controller
                name="starts_at"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      {t("form.startsAt")}
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateTimeInput(field.value)}
                      onChange={(event) =>
                        field.onChange(parseDateTimeInput(event.target.value))
                      }
                      disabled={isSubmitting}
                      dir="ltr"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {field.value ? (
                      <p className="text-xs text-muted-foreground">
                        {commonT("dateHelper", {
                          value: formatJalaliDateTime(field.value),
                        })}
                      </p>
                    ) : null}
                    {form.formState.errors.starts_at ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.starts_at.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
              <Controller
                name="ends_at"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      {t("form.endsAt")}
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateTimeInput(field.value)}
                      onChange={(event) =>
                        field.onChange(parseDateTimeInput(event.target.value))
                      }
                      disabled={isSubmitting}
                      dir="ltr"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {field.value ? (
                      <p className="text-xs text-muted-foreground">
                        {commonT("dateHelper", {
                          value: formatJalaliDateTime(field.value),
                        })}
                      </p>
                    ) : null}
                    {form.formState.errors.ends_at ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.ends_at.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.description")}
                </label>
                <textarea
                  rows={3}
                  {...form.register("description")}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.description ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>
            </div>
            {form.formState.errors.root?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-start">
              <Button type="submit" disabled={isSubmitting}>
                {dialogMode === "edit"
                  ? commonT("actions.save")
                  : commonT("actions.create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                {commonT("actions.cancel")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
