'use client'

import * as React from 'react'

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 6000

export type Toast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const listeners = new Set<(toasts: Toast[]) => void>()
let toasts: Toast[] = []

function notify() {
  for (const listener of listeners) {
    listener([...toasts])
  }
}

function addToast(toast: Toast) {
  if (toasts.length >= TOAST_LIMIT) {
    const [oldest] = toasts
    dismissToast(oldest.id)
  }
  toasts = [...toasts, toast]
  notify()
  if (TOAST_REMOVE_DELAY > 0) {
    const timeout = setTimeout(() => dismissToast(toast.id), TOAST_REMOVE_DELAY)
    toastTimeouts.set(toast.id, timeout)
  }
}

function dismissToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id)
  notify()
  const timeout = toastTimeouts.get(id)
  if (timeout) {
    clearTimeout(timeout)
  }
  toastTimeouts.delete(id)
}

export function useToast() {
  const [state, setState] = React.useState<Toast[]>([])

  React.useEffect(() => {
    listeners.add(setState)
    return () => listeners.delete(setState)
  }, [])

  return {
    toasts: state,
    toast: ({ title, description, action }: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      addToast({ id, title, description, action })
      return id
    },
    dismiss: dismissToast
  }
}
