import { NextResponse } from 'next/server'

import { clearAuthCookies, getRefreshToken, parseTokenPayload, setAuthCookies } from '@/src/lib/auth-cookies'

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api').replace(/\/$/, '')

const buildUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`

const readJson = async (response: Response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (error) {
    console.error('Failed to parse JSON from refresh response', error)
    return null
  }
}

export async function POST() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    clearAuthCookies()
    return NextResponse.json({ code: 'TOKEN_NOT_VALID', detail: 'missing_refresh_token' }, { status: 401 })
  }

  let upstream: Response
  try {
    upstream = await fetch(buildUrl('/auth/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: 'no-store'
    })
  } catch (error) {
    console.error('Failed to reach refresh endpoint', error)
    clearAuthCookies()
    return NextResponse.json({ code: 'TOKEN_NOT_VALID', detail: 'upstream_unreachable' }, { status: 503 })
  }

  const data = await readJson(upstream)

  if (!upstream.ok) {
    clearAuthCookies()
    return NextResponse.json(data ?? { code: 'TOKEN_NOT_VALID' }, { status: upstream.status })
  }

  const tokens = parseTokenPayload(data)
  setAuthCookies(tokens)

  const { access, refresh, ...rest } = (data ?? {}) as Record<string, unknown>

  return NextResponse.json(rest, { status: upstream.status })
}
