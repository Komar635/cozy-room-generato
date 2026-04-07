'use client'

import { useEffect } from 'react'
import { initializeTheme } from '@/lib/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return initializeTheme()
  }, [])

  return <>{children}</>
}
