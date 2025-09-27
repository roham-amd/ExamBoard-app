
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { useRoomsQuery } from "@/src/lib/queries";
import {
  useCreateRoomMutation,
  useDeleteRoomMutation,
  useUpdateRoomMutation,
} from "@/src/lib/mutations";
import { applyServerErrors } from "@/src/lib/forms";
import { roomFormSchema, type RoomFormValues } from "@/src/lib/schemas";
import type { Room } from "@/src/types/api";

type DialogMode = "create" | "edit";

const createDefaultValues = (): RoomFormValues => ({
  name: "",
  capacity: 30,
  code: "",
  campus: "",
  description: "",
});


const mapRoomToValues = (room: Room): RoomFormValues => ({
  name: room.name,
  capacity: room.capacity,

  code: room.code ?? "",
  campus: room.campus ?? "",
  description: room.description ?? "",
});


const normaliseRoomPayload = (values: RoomFormValues) => ({
  ...values,
  code: values.code ? values.code.trim() || undefined : undefined,
  campus: values.campus ? values.campus.trim() || undefined : undefined,

  description: values.description
    ? values.description.trim() || undefined
    : undefined,
});

export default function RoomsPage() {
  const t = useTranslations("rooms");
  const commonT = useTranslations("common");
  const { toast } = useToast();

  const { data, isPending, error, refetch } = useRoomsQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: useMemo(() => createDefaultValues(), []),
  });

  const createMutation = useCreateRoomMutation();
  const updateMutation = useUpdateRoomMutation();
  const deleteMutation = useDeleteRoomMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!dialogOpen) {
      form.reset(createDefaultValues());
      setSelectedRoom(null);
      return;
    }

    if (dialogMode === "edit" && selectedRoom) {
      form.reset(mapRoomToValues(selectedRoom));
    } else {
      form.reset(createDefaultValues());
    }
  }, [dialogOpen, dialogMode, selectedRoom, form]);

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedRoom(null);
    setDialogOpen(true);
  };

  const handleEdit = (room: Room) => {
    setDialogMode("edit");
    setSelectedRoom(room);
    setDialogOpen(true);
  };

  const handleDelete = async (room: Room) => {
    const confirmed = window.confirm(commonT("actions.confirmDelete"));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(room.id);
      toast({ title: t("feedback.deleted") });
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = normaliseRoomPayload(values);
    try {
      if (dialogMode === "edit" && selectedRoom) {
        await updateMutation.mutateAsync({
          id: selectedRoom.id,
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

  const columns: DataTableColumn<Room>[] = [
    { header: t("columns.name"), accessor: (item) => item.name },
    { header: t("columns.capacity"), accessor: (item) => item.capacity },
    { header: t("columns.code"), accessor: (item) => item.code ?? "—" },
    {
      header: t("columns.campus"),
      accessor: (item) => item.campus ?? t("unknown"),
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
      className: "w-56 text-end",
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
      <DataTable
        data={data?.results}
        total={data?.count}
        columns={columns}
        isLoading={isPending}
        error={error}
        onRetry={() => refetch()}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>

            <DialogTitle>
              {dialogMode === "edit" ? t("actions.edit") : t("actions.create")}
            </DialogTitle>

          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">

                <label className="text-sm font-medium text-foreground">
                  {t("form.name")}
                </label>
                <input
                  type="text"
                  {...form.register("name")}

                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.name ? (

                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.capacity")}
                </label>
                <input
                  type="number"
                  {...form.register("capacity", { valueAsNumber: true })}

                  disabled={isSubmitting}
                  min={1}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.capacity ? (

                  <p className="text-xs text-destructive">
                    {form.formState.errors.capacity.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.code")}
                </label>
                <input
                  type="text"
                  {...form.register("code")}

                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.code ? (

                  <p className="text-xs text-destructive">
                    {form.formState.errors.code.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.campus")}
                </label>
                <input
                  type="text"
                  {...form.register("campus")}

                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.campus ? (

                  <p className="text-xs text-destructive">
                    {form.formState.errors.campus.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1 sm:col-span-2">
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
