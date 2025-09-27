import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/src/components/auth/login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-sm">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>
      <LoginForm />
    </div>
  );
}
