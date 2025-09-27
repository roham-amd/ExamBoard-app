"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/use-toast";

interface LoginResponseError {
  detail?: string;
}

interface LoginSuccessPayload {
  ok?: boolean;
}

export function LoginForm() {
  const t = useTranslations("auth.login");
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    username: z.string().min(1, t("errors.required")),
    password: z.string().min(1, t("errors.required")),
  });

  type LoginValues = z.infer<typeof schema>;

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        let message = t("errors.invalid");
        try {
          const data = (await response.json()) as LoginResponseError;
          if (data?.detail) {
            message = data.detail;
          }
        } catch (error) {
          console.error("Failed to parse login error response", error);
        }
        setServerError(message);
        return;
      }

      const body = (await response
        .json()
        .catch(() => ({}))) as LoginSuccessPayload;
      toast({
        title: t("success.title"),
        description: body?.ok ? t("success.description") : undefined,
      });
      form.reset();
    } catch (error) {
      console.error("Login request failed", error);
      setServerError(t("errors.network"));
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="space-y-1">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="username"
        >
          {t("fields.username")}
        </label>
        <input
          id="username"
          type="text"
          {...form.register("username")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="username"
          aria-invalid={form.formState.errors.username ? "true" : "false"}
        />
        {form.formState.errors.username ? (
          <p className="text-xs text-destructive" role="alert">
            {form.formState.errors.username.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="password"
        >
          {t("fields.password")}
        </label>
        <input
          id="password"
          type="password"
          {...form.register("password")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="current-password"
          aria-invalid={form.formState.errors.password ? "true" : "false"}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive" role="alert">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
