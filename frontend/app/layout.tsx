import './globals.css'
import type { ReactNode } from 'react'

export const metadata = { title: 'Exam UI', description: 'University Exam Scheduling' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa">
      <body>{children}</body>
    </html>
  )
}
