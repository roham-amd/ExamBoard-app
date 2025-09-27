import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, unstable_setRequestLocale } from 'next-intl/server'

import { AppShell } from '@/src/components/layout/app-shell'
import { QueryProvider } from '@/src/components/providers/query-provider'
import { locales, type Locale } from '@/src/i18n/config'
import { Toaster } from '@/src/components/ui/toaster'

interface LocaleLayoutProps {
  children: ReactNode
  params: { locale: string }
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const locale = params.locale as Locale

  if (!locales.includes(locale)) {
    notFound()
  }

  unstable_setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Tehran">
      <QueryProvider>
        <AppShell>{children}</AppShell>
        <Toaster rtl />
      </QueryProvider>
    </NextIntlClientProvider>
  )
}
