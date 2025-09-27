import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { toast } from '@/src/components/ui/use-toast'
import { errorMessages, resolveErrorContent } from '@/src/lib/api-error'

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!baseURL) {
  console.warn('NEXT_PUBLIC_API_BASE_URL is not defined. Falling back to /api.')
}

const api = axios.create({
  baseURL: baseURL || '/api',
  withCredentials: true
})

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<void> | null = null

const REFRESH_UNAUTHORIZED = 'REFRESH_UNAUTHORIZED'

const triggerRefresh = async () => {
  try {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(REFRESH_UNAUTHORIZED)
    }
  } catch (error) {
    if (typeof window !== 'undefined') {
      if (error instanceof Error && error.message === REFRESH_UNAUTHORIZED) {
        toast(errorMessages.codes.TOKEN_NOT_VALID ?? errorMessages.unknown)
      } else {
        toast(errorMessages.network)
      }
    }
    throw error
  }
}

const enqueueRefresh = () => {
  if (!refreshPromise) {
    refreshPromise = triggerRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.response.use(
  response => response,
  async error => {
    const { response, config } = error as AxiosError & { config?: RetryableConfig }

    if (response?.status === 401 && config && !config._retry) {
      try {
        config._retry = true
        await enqueueRefresh()
        return api(config)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    if (typeof window !== 'undefined') {
      const content = resolveErrorContent(error)
      toast(content)
    }

    return Promise.reject(error)
  }
)

export default api
