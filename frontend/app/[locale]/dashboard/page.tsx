
import { getTranslations } from "next-intl/server";

import { Button } from "@/src/components/ui/button";
import { dayjs } from "@/src/lib/dayjs";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const demoT = await getTranslations("demo");
  const now = dayjs().calendar("jalali").format("YYYY/MM/DD HH:mm");


  return (
    <div className="space-y-6">
      <header className="space-y-2">

        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(["upcoming", "published", "pending"] as const).map((key) => (
          <article
            key={key}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {t(`cards.${key}.title`)}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {t(`cards.${key}.value`)}
            </p>

          </article>
        ))}
      </section>
      <section className="grid gap-4 rounded-lg border bg-card p-6 shadow-sm">
        <div>

          <h2 className="text-lg font-semibold text-foreground">
            {demoT("gridHeading")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {demoT("gridBody")}
          </p>
        </div>
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="demo-actions"
        >
          <Button>{demoT("dialogConfirm")}</Button>
          <Button variant="secondary">{demoT("dialogCancel")}</Button>
          <Button variant="outline">{demoT("toastTitle")}</Button>
        </div>
        <footer className="text-xs text-muted-foreground">
          {demoT("gridFooter", { date: now })}
        </footer>
      </section>
    </div>
  );

}
