'use client'

import { useTranslations } from 'next-intl'

import { DataTable, type DataTableColumn } from '@/src/components/data/data-table'
import { useAllocationsQuery } from '@/src/lib/queries'
import type { Allocation } from '@/src/types/api'

export default function AllocationsPage() {
  const t = useTranslations('allocations')
  const { data, isPending, error, refetch } = useAllocationsQuery()

  const columns: DataTableColumn<Allocation>[] = [
    { header: t('columns.exam'), accessor: item => item.exam },
    { header: t('columns.room'), accessor: item => item.room },
    { header: t('columns.seats'), accessor: item => item.seats_reserved },
    {
      header: t('columns.supervisor'),
      accessor: item => item.supervisor ?? t('unassigned')
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
