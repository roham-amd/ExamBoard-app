'use client'

import { useTranslations } from 'next-intl'

import { DataTable, type DataTableColumn } from '@/src/components/data/data-table'
import { dayjs } from '@/src/lib/dayjs'
import { useExamsQuery } from '@/src/lib/queries'
import type { Exam } from '@/src/types/api'

export default function ExamsPage() {
  const t = useTranslations('exams')
  const { data, isPending, error, refetch } = useExamsQuery()

  const columns: DataTableColumn<Exam>[] = [
    { header: t('columns.course'), accessor: item => `${item.course_code} – ${item.course_title}` },
    { header: t('columns.term'), accessor: item => item.term },
    {
      header: t('columns.start'),
      accessor: item => dayjs(item.starts_at).calendar('jalali').format('YYYY/MM/DD HH:mm')
    },
    { header: t('columns.duration'), accessor: item => t('durationMinutes', { value: item.duration_minutes }) },
    { header: t('columns.status'), accessor: item => t(`status.${item.status}` as const) }
  ]

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <DataTable
        data={data?.results}
        total={data?.count}
        columns={columns}
        isLoading={isPending}
        error={error}
        onRetry={() => refetch()}
      />
    </section>
  )
}
