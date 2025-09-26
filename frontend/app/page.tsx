'use client'
import { dayjs } from '@/src/lib/dayjs'

export default function Home() {
  const nowFa = dayjs().calendar('jalali').locale('fa').format('YYYY/MM/DD HH:mm')
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">سلام! فرانت‌اند آمادهٔ توسعه است.</h1>
      <p className="text-sm text-gray-600">اکنون: {nowFa}</p>
      <p className="text-sm">لطفاً به README برای راه‌اندازی مراجعه کنید.</p>
    </main>
  )
}
