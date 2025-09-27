'use client'

import { useTranslations } from 'next-intl'

import { DataTable, type DataTableColumn } from '@/src/components/data/data-table'
import { dayjs } from '@/src/lib/dayjs'
import { useHolidaysQuery } from '@/src/lib/queries'
import type { Holiday } from '@/src/types/api'

export default function HolidaysPage() {
  const t = useTranslations('holidays')
  const { data, isPending, error, refetch } = useHolidaysQuery()

  const columns: DataTableColumn<Holiday>[] = [
    {
      header: t('columns.date'),
      accessor: item => dayjs(item.date).calendar('jalali').format('YYYY/MM/DD')
    },
    { header: t('columns.title'), accessor: item => item.title },
    { header: t('columns.description'), accessor: item => item.description ?? '—' }
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
