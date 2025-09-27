
"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { AllocationsTimeline } from "@/src/components/allocations/allocations-timeline";
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
import {
  useAllocationsQuery,
  useExamsQuery,
  useRoomsQuery,
} from "@/src/lib/queries";
import {
  useCreateAllocationMutation,
  useDeleteAllocationMutation,
  useUpdateAllocationMutation,
} from "@/src/lib/mutations";
import { applyServerErrors } from "@/src/lib/forms";
import {
  allocationFormSchema,
  type AllocationFormValues,
} from "@/src/lib/schemas";
import {
  formatDateTimeInput,
  formatJalaliDateTime,
  parseDateTimeInput,
} from "@/src/lib/utils";
import type { Allocation } from "@/src/types/api";

type DialogMode = "create" | "edit";

const createDefaultValues = (): AllocationFormValues => {
  const now = new Date();
  const starts = new Date(now);
  const ends = new Date(now);
  ends.setHours(ends.getHours() + 2);


  return {
    exam: 0,
    rooms: [],
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    allocated_seats: 10,

    notes: "",
  };
};

const mapAllocationToValues = (
  allocation: Allocation,
): AllocationFormValues => ({
  exam: allocation.exam,
  rooms: allocation.rooms.map((room) => room.id),
  starts_at: allocation.starts_at,
  ends_at: allocation.ends_at,
  allocated_seats: allocation.allocated_seats,
  notes: allocation.notes ?? "",
});

const normaliseAllocationPayload = (values: AllocationFormValues) => ({
  ...values,
  notes: values.notes ? values.notes.trim() || undefined : undefined,
});

export default function AllocationsPage() {
  const t = useTranslations("allocations");
  const commonT = useTranslations("common");
  const { toast } = useToast();

  const allocationsQuery = useAllocationsQuery();
  const examsQuery = useExamsQuery({ page_size: 100 });
  const roomsQuery = useRoomsQuery({ page_size: 200 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedAllocation, setSelectedAllocation] =
    useState<Allocation | null>(null);

  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: useMemo(() => createDefaultValues(), []),
  });

  const createMutation = useCreateAllocationMutation();
  const updateMutation = useUpdateAllocationMutation();
  const deleteMutation = useDeleteAllocationMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!dialogOpen) {
      form.reset(createDefaultValues());
      setSelectedAllocation(null);
      return;
    }

    if (dialogMode === "edit" && selectedAllocation) {
      form.reset(mapAllocationToValues(selectedAllocation));
    } else {
      form.reset(createDefaultValues());
    }
  }, [dialogOpen, dialogMode, selectedAllocation, form]);

  useEffect(() => {
    if (!dialogOpen || dialogMode !== "create") return;
    const exam = examsQuery.data?.results?.[0]?.id;
    const firstRoom = roomsQuery.data?.results?.[0]?.id;
    if (exam) {
      form.setValue("exam", exam, { shouldDirty: false });
    }
    if (firstRoom) {
      form.setValue("rooms", [firstRoom], { shouldDirty: false });
    }
  }, [dialogOpen, dialogMode, examsQuery.data, roomsQuery.data, form]);

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedAllocation(null);
    setDialogOpen(true);
  };

  const handleEdit = (allocation: Allocation) => {
    setDialogMode("edit");
    setSelectedAllocation(allocation);
    setDialogOpen(true);
  };

  const handleDelete = async (allocation: Allocation) => {
    const confirmed = window.confirm(commonT("actions.confirmDelete"));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(allocation.id);
      toast({ title: t("feedback.deleted") });
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = normaliseAllocationPayload(values);
    try {
      if (dialogMode === "edit" && selectedAllocation) {
        await updateMutation.mutateAsync({
          id: selectedAllocation.id,
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

  const columns: DataTableColumn<Allocation>[] = [
    { header: t("columns.exam"), accessor: (item) => item.exam_title },
    {
      header: t("columns.rooms"),
      accessor: (item) =>
        item.rooms.length > 0
          ? item.rooms.map((room) => room.name).join("، ")
          : t("unassigned"),
    },
    {
      header: t("columns.range"),
      accessor: (item) =>
        `${formatJalaliDateTime(item.starts_at)} — ${formatJalaliDateTime(item.ends_at)}`,
    },
    { header: t("columns.seats"), accessor: (item) => item.allocated_seats },
    { header: t("columns.notes"), accessor: (item) => item.notes ?? "—" },
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
      className: "w-60 text-end",
    },
  ];


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

      <AllocationsTimeline />
      <DataTable
        data={allocationsQuery.data?.results}
        total={allocationsQuery.data?.count}
        columns={columns}
        isLoading={allocationsQuery.isPending}
        error={allocationsQuery.error}
        onRetry={() => allocationsQuery.refetch()}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>

            <DialogTitle>
              {dialogMode === "edit" ? t("actions.edit") : t("actions.create")}
            </DialogTitle>

          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="exam"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-1 sm:col-span-2">

                    <label className="text-sm font-medium text-foreground">
                      {t("form.exam")}
                    </label>
                    <select
                      value={field.value ? String(field.value) : ""}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }

                      disabled={isSubmitting || examsQuery.isPending}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="" disabled>
                        —
                      </option>

                      {examsQuery.data?.results?.map((exam) => (

                        <option key={exam.id} value={exam.id}>
                          {exam.title}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.exam ? (

                      <p className="text-xs text-destructive">
                        {form.formState.errors.exam.message}
                      </p>

                    ) : null}
                  </div>
                )}
              />
              <Controller
                name="rooms"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-1 sm:col-span-2">

                    <label className="text-sm font-medium text-foreground">
                      {t("form.rooms")}
                    </label>
                    <select
                      multiple
                      value={field.value.map((value) => String(value))}
                      onChange={(event) => {
                        const selected = Array.from(
                          event.target.selectedOptions,
                          (option) => Number(option.value),
                        );
                        field.onChange(selected);

                      }}
                      disabled={isSubmitting || roomsQuery.isPending}
                      className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >

                      {roomsQuery.data?.results?.map((room) => (

                        <option key={room.id} value={room.id}>
                          {room.name} ({room.capacity})
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.rooms ? (

                      <p className="text-xs text-destructive">
                        {form.formState.errors.rooms.message}
                      </p>

                    ) : null}
                  </div>
                )}
              />
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
                  {t("form.allocatedSeats")}
                </label>
                <input
                  type="number"
                  min={1}
                  {...form.register("allocated_seats", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.allocated_seats ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.allocated_seats.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  {t("form.notes")}
                </label>
                <textarea
                  rows={3}
                  {...form.register("notes")}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.notes ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.notes.message}
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
