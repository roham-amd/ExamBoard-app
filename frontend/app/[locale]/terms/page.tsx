"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DataTable,
  type DataTableColumn,
} from "@/src/components/data/data-table";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useToast } from "@/src/components/ui/use-toast";
import { useTermsQuery } from "@/src/lib/queries";
import {
  useCreateTermMutation,
  useDeleteTermMutation,
  usePublishTermMutation,
  useUpdateTermMutation,
} from "@/src/lib/mutations";
import { applyServerErrors } from "@/src/lib/forms";
import {
  formatDateTimeInput,
  formatJalaliDateTime,
  parseDateTimeInput,
} from "@/src/lib/utils";
import { termFormSchema, type TermFormValues } from "@/src/lib/schemas";
import type { Term } from "@/src/types/api";

type DialogMode = "create" | "edit";

const createDefaultValues = (): TermFormValues => {
  const now = new Date();
  const starts = new Date(now);
  const ends = new Date(now);
  ends.setMonth(ends.getMonth() + 3);

  return {
    name: "",
    slug: "",
    description: "",
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    is_active: true,
  };
};

const mapTermToFormValues = (term: Term): TermFormValues => ({
  name: term.name,
  slug: term.slug,
  description: term.description ?? "",
  starts_at: term.starts_at,
  ends_at: term.ends_at,
  is_active: term.is_active,
});

const normaliseTermPayload = (values: TermFormValues) => ({
  ...values,
  description: values.description
    ? values.description.trim() || undefined
    : undefined,
});

export default function TermsPage() {
  const t = useTranslations("terms");
  const commonT = useTranslations("common");
  const { toast } = useToast();
  const { data, isPending, error, refetch } = useTermsQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  const form = useForm<TermFormValues>({
    resolver: zodResolver(termFormSchema),
    defaultValues: useMemo(() => createDefaultValues(), []),
  });

  const createMutation = useCreateTermMutation();
  const updateMutation = useUpdateTermMutation();
  const publishMutation = usePublishTermMutation();
  const deleteMutation = useDeleteTermMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!dialogOpen) {
      form.reset(createDefaultValues());
      setSelectedTerm(null);
      return;
    }

    if (dialogMode === "edit" && selectedTerm) {
      form.reset(mapTermToFormValues(selectedTerm));
    } else {
      form.reset(createDefaultValues());
    }
  }, [dialogOpen, dialogMode, selectedTerm, form]);

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedTerm(null);
    setDialogOpen(true);
  };

  const handleEdit = (term: Term) => {
    setDialogMode("edit");
    setSelectedTerm(term);
    setDialogOpen(true);
  };

  const handlePublish = async (term: Term) => {
    try {
      await publishMutation.mutateAsync(term.id);
      toast({ title: t("feedback.published") });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (term: Term) => {
    const confirmed = window.confirm(commonT("actions.confirmDelete"));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(term.id);
      toast({ title: t("feedback.deleted") });
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = normaliseTermPayload(values);
    try {
      if (dialogMode === "edit" && selectedTerm) {
        await updateMutation.mutateAsync({
          id: selectedTerm.id,
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

  const columns: DataTableColumn<Term>[] = [
    { header: t("columns.name"), accessor: (item) => item.name },
    { header: t("columns.slug"), accessor: (item) => item.slug },
    {
      header: t("columns.range"),
      accessor: (item) =>
        `${formatJalaliDateTime(item.starts_at)} — ${formatJalaliDateTime(item.ends_at)}`,
    },
    {
      header: t("columns.status"),
      accessor: (item) =>
        item.published_at ? t("status.published") : t("status.draft"),
    },
    {
      header: t("columns.active"),
      accessor: (item) => t(`active.${item.is_active ? "true" : "false"}`),
    },
    {
      header: "",
      accessor: (item) => (
        <div className="flex items-center justify-end gap-2">
          {!item.published_at ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handlePublish(item)}
              disabled={publishMutation.isPending}
            >
              <Rocket className="ms-1 h-3.5 w-3.5" aria-hidden="true" />
              {t("actions.publish")}
            </Button>
          ) : null}
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
      className: "w-64 text-end",
    },
  ];

  const isPublished = Boolean(selectedTerm?.published_at);

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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? t("actions.edit") : t("actions.create")}
            </DialogTitle>
            <DialogDescription>{t("lockedHint")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.name")}
                </label>
                <input
                  type="text"
                  {...form.register("name")}
                  disabled={isSubmitting || isPublished}
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
                  {t("form.slug")}
                </label>
                <input
                  type="text"
                  {...form.register("slug")}
                  disabled={isSubmitting || isPublished}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.slug ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  {t("form.description")}
                </label>
                <textarea
                  {...form.register("description")}
                  disabled={isSubmitting}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.description ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
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
                      disabled={isSubmitting || isPublished}
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
                      disabled={isSubmitting || isPublished}
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
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="term-is-active"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  disabled={isSubmitting || isPublished}
                  {...form.register("is_active")}
                />
                <label
                  className="text-sm text-foreground"
                  htmlFor="term-is-active"
                >
                  {t("form.isActive")}
                </label>
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
