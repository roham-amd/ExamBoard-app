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
import {
  useExamOwnersQuery,
  useExamsQuery,
  useTermsQuery,
} from "@/src/lib/queries";
import {
  useCreateExamMutation,
  useDeleteExamMutation,
  useUpdateExamMutation,
} from "@/src/lib/mutations";
import { applyServerErrors } from "@/src/lib/forms";
import { examFormSchema, type ExamFormValues } from "@/src/lib/schemas";
import type { Exam } from "@/src/types/api";

type DialogMode = "create" | "edit";

const createDefaultValues = (): ExamFormValues => ({
  title: "",
  course_code: "",

  owner: 0,
  expected_students: 10,
  duration_minutes: 90,
  term: 0,

  notes: "",
});

const mapExamToValues = (exam: Exam): ExamFormValues => ({
  title: exam.title,
  course_code: exam.course_code,
  owner: exam.owner,
  expected_students: exam.expected_students,
  duration_minutes: exam.duration_minutes,
  term: exam.term,

  notes: exam.notes ?? "",
});

const normaliseExamPayload = (values: ExamFormValues) => ({
  ...values,
  notes: values.notes ? values.notes.trim() || undefined : undefined,
});

export default function ExamsPage() {
  const t = useTranslations("exams");
  const commonT = useTranslations("common");
  const { toast } = useToast();

  const examsQuery = useExamsQuery();
  const termsQuery = useTermsQuery({ page_size: 100 });
  const ownersQuery = useExamOwnersQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: useMemo(() => createDefaultValues(), []),
  });

  const createMutation = useCreateExamMutation();
  const updateMutation = useUpdateExamMutation();
  const deleteMutation = useDeleteExamMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!dialogOpen) {
      form.reset(createDefaultValues());
      setSelectedExam(null);
      return;
    }

    if (dialogMode === "edit" && selectedExam) {
      form.reset(mapExamToValues(selectedExam));
    } else {
      form.reset(createDefaultValues());
    }
  }, [dialogOpen, dialogMode, selectedExam, form]);

  useEffect(() => {
    if (!dialogOpen || dialogMode !== "create") return;
    const owner = ownersQuery.data?.[0]?.id;
    const term = termsQuery.data?.results?.[0]?.id;
    if (owner) {
      form.setValue("owner", owner, { shouldDirty: false });
    }
    if (term) {
      form.setValue("term", term, { shouldDirty: false });
    }
  }, [dialogOpen, dialogMode, ownersQuery.data, termsQuery.data, form]);

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedExam(null);
    setDialogOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setDialogMode("edit");
    setSelectedExam(exam);
    setDialogOpen(true);
  };

  const handleDelete = async (exam: Exam) => {
    const confirmed = window.confirm(commonT("actions.confirmDelete"));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(exam.id);
      toast({ title: t("feedback.deleted") });
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = normaliseExamPayload(values);
    try {
      if (dialogMode === "edit" && selectedExam) {
        await updateMutation.mutateAsync({
          id: selectedExam.id,
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

  const columns: DataTableColumn<Exam>[] = [
    { header: t("columns.title"), accessor: (item) => item.title },
    { header: t("columns.courseCode"), accessor: (item) => item.course_code },
    { header: t("columns.owner"), accessor: (item) => item.owner_name },
    {
      header: t("columns.expected"),
      accessor: (item) => item.expected_students,
    },
    { header: t("columns.term"), accessor: (item) => item.term_name },
    {
      header: t("columns.duration"),
      accessor: (item) =>
        t("durationMinutes", { value: item.duration_minutes }),
    },
    {
      header: t("columns.status"),
      accessor: (item) => t(`status.${item.status}` as Parameters<typeof t>[0]),
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
        data={examsQuery.data?.results}
        total={examsQuery.data?.count}
        columns={columns}
        isLoading={examsQuery.isPending}
        error={examsQuery.error}
        onRetry={() => examsQuery.refetch()}
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
              <div className="space-y-1 sm:col-span-2">
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
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.courseCode")}
                </label>
                <input
                  type="text"
                  {...form.register("course_code")}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.course_code ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.course_code.message}
                  </p>
                ) : null}
              </div>
              <Controller
                name="owner"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      {t("form.owner")}
                    </label>
                    <select
                      value={field.value ? String(field.value) : ""}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      disabled={isSubmitting || ownersQuery.isPending}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="" disabled>
                        —
                      </option>

                      {ownersQuery.data?.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.full_name}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.owner ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.owner.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.expectedStudents")}
                </label>
                <input
                  type="number"
                  min={1}
                  {...form.register("expected_students", {
                    valueAsNumber: true,
                  })}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.expected_students ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.expected_students.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  {t("form.durationMinutes")}
                </label>

                <input
                  type="number"
                  min={10}
                  step={5}
                  {...form.register("duration_minutes", {
                    valueAsNumber: true,
                  })}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {form.formState.errors.duration_minutes ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.duration_minutes.message}
                  </p>
                ) : null}
              </div>
              <Controller
                name="term"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      {t("form.term")}
                    </label>
                    <select
                      value={field.value ? String(field.value) : ""}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      disabled={isSubmitting || termsQuery.isPending}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="" disabled>
                        —
                      </option>

                      {termsQuery.data?.results?.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.term ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.term.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
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
