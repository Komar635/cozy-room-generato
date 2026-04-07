'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

let mediaQueryCleanup: (() => void) | null = null

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const normalizeTheme = (theme: Theme): Theme => {
  return theme === 'system' ? 'system' : theme
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

const applyThemeToDocument = (resolvedTheme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.dataset.theme = resolvedTheme
  root.style.colorScheme = resolvedTheme
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: getResolvedTheme('system'),
      setTheme: (theme) => {
        const normalizedTheme = normalizeTheme(theme)
        const resolvedTheme = getResolvedTheme(normalizedTheme)
        set({ theme, resolvedTheme })

        applyThemeToDocument(resolvedTheme)
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

export function initializeTheme() {
  const { theme, setTheme } = useThemeStore.getState()
  const resolvedTheme = getResolvedTheme(theme)
  applyThemeToDocument(resolvedTheme)

  mediaQueryCleanup?.()
  mediaQueryCleanup = null

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (useThemeStore.getState().theme === 'system') {
        setTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    mediaQueryCleanup = () => mediaQuery.removeEventListener('change', handleChange)
  }

  return () => {
    mediaQueryCleanup?.()
    mediaQueryCleanup = null
  }
}
