'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CalendarDays, LayoutDashboard, X } from 'lucide-react'

import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent
} from '@/src/components/ui/dialog'
import { useToast } from '@/src/components/ui/use-toast'
import { dayjs } from '@/src/lib/dayjs'
import { cn } from '@/src/lib/utils'

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, href: 'dashboard' },
  { key: 'timetable', icon: CalendarDays, href: 'timetable' }
] as const

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [openDialog, setOpenDialog] = useState(false)
  const layoutT = useTranslations('layout')
  const demoT = useTranslations('demo')
  const params = useParams<{ locale?: string }>()
  const pathname = usePathname()
  const locale = params?.locale ?? 'fa'
  const { toast } = useToast()

  const today = useMemo(() => dayjs().calendar('jalali').format('YYYY/MM/DD'), [])
  const welcomeName = layoutT('topbar.sampleName')

  const handleToast = () => {
    toast({
      title: demoT('toastTitle'),
      description: demoT('toastDescription')
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-s bg-card/60 p-6 shadow-sm sm:flex">
        <div className="mb-8 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{layoutT('sidebar.title')}</p>
          <h1 className="text-lg font-bold text-foreground">{layoutT('appName')}</h1>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV_ITEMS.map(item => {
            const href = `/${locale}/${item.href}`
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={item.key}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-4 py-2 transition-colors rtl:space-x-reverse',
                  active
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{layoutT(`sidebar.links.${item.key}`)}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex flex-col gap-4 border-b bg-background/80 px-6 py-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">{layoutT('topbar.welcome', { name: welcomeName })}</p>
            <p className="text-sm text-muted-foreground">{layoutT('topbar.subtitle', { date: today })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary">{layoutT('topbar.actions.openDialog')}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogClose
                  className="absolute start-4 top-4 rounded-full border border-transparent p-1 text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label={demoT('dialogCancel')}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </DialogClose>
                <DialogHeader>
                  <DialogTitle>{demoT('dialogTitle')}</DialogTitle>
                  <DialogDescription>{demoT('dialogDescription')}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    {demoT('dialogCancel')}
                  </Button>
                  <Button onClick={() => setOpenDialog(false)}>{demoT('dialogConfirm')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleToast}>
              {layoutT('topbar.actions.showToast')}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  )
}
