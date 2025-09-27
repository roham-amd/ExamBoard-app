'use client'

import { useTranslations } from 'next-intl'

import { DataTable, type DataTableColumn } from '@/src/components/data/data-table'
import { dayjs } from '@/src/lib/dayjs'
import { useTermsQuery } from '@/src/lib/queries'
import type { Term } from '@/src/types/api'

export default function TermsPage() {
  const t = useTranslations('terms')
  const { data, isPending, error, refetch } = useTermsQuery()

  const columns: DataTableColumn<Term>[] = [
    { header: t('columns.name'), accessor: item => item.name },
    { header: t('columns.slug'), accessor: item => item.slug },
    {
      header: t('columns.range'),
      accessor: item =>
        `${dayjs(item.starts_at).calendar('jalali').format('YYYY/MM/DD')} – ${dayjs(item.ends_at)
          .calendar('jalali')
          .format('YYYY/MM/DD')}`
    },
    {
      header: t('columns.active'),
      accessor: item => (item.is_active ? t('active.true') : t('active.false'))
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
