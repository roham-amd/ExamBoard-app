import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicTimetable } from "@/src/components/public/timetable/public-timetable";
import {
  createTimetableQuery,
  parseTimetableFilters,
} from "@/src/lib/public-timetable-filters";
import type { PublicTimetableResponse } from "@/src/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
const REVALIDATE_SECONDS = 300;

const normalizeBase = (base: string) => base.replace(/\/$/, "");

const fetchPublicTimetable = cache(async (termId: string, search: string) => {
  const normalizedBase = normalizeBase(API_BASE);
  const encodedTerm = encodeURIComponent(termId);
  const url = `${normalizedBase}/public/terms/${encodedTerm}/timetable/${search ? `?${search}` : ""}`;
  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`Failed to load timetable for term ${termId}`);
  }

  const data = (await response.json()) as PublicTimetableResponse;
  return data;
});

type PageProps = {
  params: Promise<{ termId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { termId } = await params;
  try {
    const data = await fetchPublicTimetable(termId, "");
    const description = `برنامهٔ امتحانات منتشرشده برای ترم ${data.term.name}.`;

    return {
      title: `برنامهٔ امتحانات ترم ${data.term.name}`,
      description,
      alternates: {
        canonical: `/public/terms/${termId}/timetable`,
      },
      openGraph: {
        title: `برنامهٔ امتحانات ترم ${data.term.name}`,
        description,
      },
    };
  } catch (error) {
    return {
      title: "برنامهٔ امتحانات",
      description: "جدول زمان‌بندی برگزاری امتحانات منتشرشده.",
    };
  }
}

export default async function PublicTimetablePage({
  params,
  searchParams,
}: PageProps) {
  const { termId } = await params;
  const resolvedSearch = await searchParams;
  const filters = parseTimetableFilters(resolvedSearch);
  const queryString = createTimetableQuery(filters).toString();
  const data = await fetchPublicTimetable(termId, queryString);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PublicTimetable
        term={data.term}
        rooms={data.rooms}
        allocations={data.allocations}
        generatedAt={data.generated_at ?? undefined}
        initialFilters={filters}
      />
    </div>
  );
}
