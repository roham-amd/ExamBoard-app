'use client'

import { useTranslations } from 'next-intl'

import { DataTable, type DataTableColumn } from '@/src/components/data/data-table'
import { dayjs } from '@/src/lib/dayjs'
import { useBlackoutsQuery } from '@/src/lib/queries'
import type { Blackout } from '@/src/types/api'

export default function BlackoutsPage() {
  const t = useTranslations('blackouts')
  const { data, isPending, error, refetch } = useBlackoutsQuery()

  const columns: DataTableColumn<Blackout>[] = [
    { header: t('columns.room'), accessor: item => item.room ?? t('allRooms') },
    {
      header: t('columns.range'),
      accessor: item =>
        `${dayjs(item.starts_at).calendar('jalali').format('YYYY/MM/DD HH:mm')} – ${dayjs(item.ends_at)
          .calendar('jalali')
          .format('YYYY/MM/DD HH:mm')}`
    },
    { header: t('columns.reason'), accessor: item => item.reason }
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
