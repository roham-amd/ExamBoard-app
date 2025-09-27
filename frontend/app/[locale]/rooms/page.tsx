'use client'

import { useTranslations } from 'next-intl'

import { DataTable, type DataTableColumn } from '@/src/components/data/data-table'
import { useRoomsQuery } from '@/src/lib/queries'
import type { Room } from '@/src/types/api'

export default function RoomsPage() {
  const t = useTranslations('rooms')
  const { data, isPending, error, refetch } = useRoomsQuery()

  const columns: DataTableColumn<Room>[] = [
    { header: t('columns.name'), accessor: item => item.name },
    { header: t('columns.code'), accessor: item => item.code },
    { header: t('columns.capacity'), accessor: item => item.capacity },
    {
      header: t('columns.campus'),
      accessor: item => item.campus ?? t('unknown')
    },
    {
      header: t('columns.description'),
      accessor: item => item.description ?? '—'
    }
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
