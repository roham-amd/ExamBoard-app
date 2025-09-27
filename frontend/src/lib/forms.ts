
"use client";

import axios from "axios";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

export function applyServerErrors<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  error: unknown,
) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (status !== 400 || !data || typeof data !== "object") {
    return false;
  }

  let handled = false;
  const entries = Object.entries(data as Record<string, unknown>);
  for (const [field, value] of entries) {
    if (field === "non_field_errors" || field === "detail") {
      const message = Array.isArray(value)
        ? value.map(String).join(" ")
        : typeof value === "string"
          ? value
          : null;
      if (message) {
        form.setError("root", { type: "server", message });
        handled = true;
      }
      continue;
    }

    const message = Array.isArray(value)
      ? value.map(String).join(" ")
      : typeof value === "string"
        ? value
        : null;

    if (!message) {
      continue;
    }

    try {
      form.setError(field as FieldPath<TFieldValues>, {
        type: "server",
        message,
      });
      handled = true;
    } catch (err) {
      console.warn("Unable to map server error for field", field, err);
    }
  }

  return handled;

}
