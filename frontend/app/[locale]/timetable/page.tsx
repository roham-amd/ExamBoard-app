import { getTranslations } from "next-intl/server";

export default async function TimetablePage() {
  const t = await getTranslations("timetable");

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>
      <section className="rounded-lg border border-dashed bg-card/60 p-6 text-sm text-muted-foreground">
        {t("empty")}
      </section>
    </div>
  );
}
