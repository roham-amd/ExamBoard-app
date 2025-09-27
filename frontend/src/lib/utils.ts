import type { ClassValue } from 'clsx'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

import { dayjs } from '@/src/lib/dayjs'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTimeInput(value?: string | null) {
  if (!value) return ''
  const instance = dayjs(value)
  return instance.isValid() ? instance.local().format('YYYY-MM-DDTHH:mm') : ''
}

export function parseDateTimeInput(value: string) {
  if (!value) return ''
  const instance = dayjs(value)
  return instance.isValid() ? instance.toDate().toISOString() : ''
}

export function formatJalaliDateTime(value?: string | null) {
  if (!value) return ''
  const instance = dayjs(value)
  return instance.isValid() ? instance.calendar('jalali').locale('fa').format('YYYY/MM/DD HH:mm') : ''
}
