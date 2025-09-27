import { NextResponse, type NextRequest } from 'next/server'

import { clearAuthCookies, parseTokenPayload, setAuthCookies } from '@/src/lib/auth-cookies'

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api').replace(/\/$/, '')

const buildUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`

const readJson = async (response: Response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (error) {
    console.error('Failed to parse JSON from auth response', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}))

  let upstream: Response
  try {
    upstream = await fetch(buildUrl('/auth/login/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    })
  } catch (error) {
    console.error('Failed to reach login endpoint', error)
    return NextResponse.json({ detail: 'upstream_unreachable' }, { status: 503 })
  }

  const data = await readJson(upstream)

  if (!upstream.ok) {
    clearAuthCookies()
    return NextResponse.json(data ?? { detail: 'login_failed' }, { status: upstream.status })
  }

  const tokens = parseTokenPayload(data)
  setAuthCookies(tokens)

  const { access, refresh, ...rest } = (data ?? {}) as Record<string, unknown>

  return NextResponse.json(rest, { status: upstream.status })
}
