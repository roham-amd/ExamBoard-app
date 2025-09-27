import axios, { AxiosError } from 'axios'

import faMessages from '@/src/i18n/messages/fa.json'

type ErrorDictionary = {
  title: string
  description: string
}

interface ErrorMessages {
  network: ErrorDictionary
  unknown: ErrorDictionary
  codes: Record<string, ErrorDictionary>
}

export const errorMessages = faMessages.errors as ErrorMessages

const extractDetail = (data: unknown): string | undefined => {
  if (!data) return undefined
  if (typeof data === 'string') return data
  if (Array.isArray(data)) {
    return data.map(item => extractDetail(item) ?? '').filter(Boolean).join(' ')
  }
  if (typeof data === 'object') {
    const record = data as Record<string, unknown>
    const directDetail =
      typeof record.detail === 'string'
        ? record.detail
        : Array.isArray(record.detail)
          ? extractDetail(record.detail)
          : undefined
    if (directDetail) return directDetail

    const knownFields = ['message', 'error', 'non_field_errors']
    for (const field of knownFields) {
      const value = record[field]
      const extracted = extractDetail(value)
      if (extracted) return extracted
    }
  }
  return undefined
}

const getCode = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') return undefined
  const record = data as Record<string, unknown>
  if (typeof record.code === 'string') {
    return record.code
  }
  if (Array.isArray(record.errors)) {
    for (const item of record.errors) {
      const code = getCode(item)
      if (code) return code
    }
  }
  return undefined
}

export interface ErrorContent {
  title: string
  description: string
}

export function resolveErrorContent(error: unknown): ErrorContent {
  if (!axios.isAxiosError(error)) {
    return errorMessages.unknown
  }

  const axiosError = error as AxiosError

  if (axiosError.code === AxiosError.ERR_NETWORK || axiosError.message === 'Network Error') {
    return errorMessages.network
  }

  const data = axiosError.response?.data
  const code = getCode(data)
  if (code) {
    const content = errorMessages.codes[code]
    if (content) {
      return content
    }
  }

  const detail = extractDetail(data)
  if (detail) {
    return {
      title: errorMessages.unknown.title,
      description: detail
    }
  }

  return errorMessages.unknown
}
