'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    let isMounted = true

    const setup = async () => {
      const axe = await import('@axe-core/react')
      const ReactModule = await import('react')
      const ReactDOMModule = await import('react-dom')

      const React = (ReactModule as unknown as { default?: unknown }).default ?? ReactModule
      const ReactDOM = (ReactDOMModule as unknown as { default?: unknown }).default ?? ReactDOMModule

      if (!isMounted) return

      axe.default(React, ReactDOM, 1000, {
        rules: [
          { id: 'color-contrast', enabled: false }
        ]
      })
    }

    setup().catch(error => {
      console.warn('Failed to load axe-core', error)
    })

    return () => {
      isMounted = false
    }
  }, [])

  return <>{children}</>
}
