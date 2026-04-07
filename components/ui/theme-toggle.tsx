'use client'

import { useThemeStore } from '@/lib/theme'
import { Button } from './button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeStore()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const isDark = resolvedTheme === 'dark'

  const label = isDark ? 'Тёмная тема' : 'Светлая тема'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 transition-all duration-300"
      title={`${label}. Переключить тему`}
      aria-label={`${label}. Переключить тему`}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
