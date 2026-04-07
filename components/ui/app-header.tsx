'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'
import { useKeyboardShortcuts, KeyboardShortcutsHelp, SHORTCUTS_HELP_EVENT } from '@/lib/hooks/use-keyboard-shortcuts'
import { useRoomStore } from '@/store/room-store'
import { cn } from '@/lib/utils'
import { 
  Home, 
  LayoutGrid, 
  Settings, 
  Zap,
  Menu,
  X,
  Undo2,
  Redo2,
  Keyboard
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './button'

const navItems = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/room', label: 'Комната', icon: LayoutGrid },
  { href: '/api-demo', label: 'Функции', icon: Zap },
  { href: '/setup', label: 'Настройки', icon: Settings },
]

export function AppHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const { undo, redo, canUndo, canRedo } = useRoomStore()
  
  useKeyboardShortcuts()

  useEffect(() => {
    const handleToggleHelp = () => {
      setShowShortcutsHelp((current) => !current)
    }

    window.addEventListener(SHORTCUTS_HELP_EVENT, handleToggleHelp)
    return () => window.removeEventListener(SHORTCUTS_HELP_EVENT, handleToggleHelp)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.8)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="container mx-auto flex h-16 items-center gap-3 px-3 sm:px-4">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-3 py-2 font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-base">🏠</span>
          <span className="hidden text-sm sm:inline">Создатель Комнат</span>
        </Link>

        {/* Навигация - десктоп */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-all duration-300',
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Кнопки справа */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Undo/Redo кнопки */}
          <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/70 p-1 shadow-sm sm:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo()}
              title="Отменить (Ctrl+Z)"
              className="rounded-full"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo()}
              title="Повторить (Ctrl+Shift+Z)"
              className="rounded-full"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Кнопка справки по клавишам */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full sm:flex"
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            title="Горячие клавиши (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          
          <ThemeToggle />
          
          {/* Мобильное меню */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Мобильное меню */}
      {mobileMenuOpen && (
        <nav className="border-t border-border/70 bg-background/95 px-3 pb-4 pt-3 shadow-lg animate-slide-down md:hidden">
          <div className="container mx-auto space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300',
                    isActive 
                      ? 'border-primary/30 bg-primary/10 text-foreground' 
                      : 'border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
            {/* Мобильная кнопка справки */}
            <button
              onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300',
                showShortcutsHelp 
                  ? 'border-primary/30 bg-primary/10 text-foreground' 
                  : 'border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              <Keyboard className="h-5 w-5" />
              <span>Горячие клавиши</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1 sm:hidden">
              <Button variant="outline" onClick={undo} disabled={!canUndo()} className="justify-start rounded-2xl">
                <Undo2 className="mr-2 h-4 w-4" />
                Undo
              </Button>
              <Button variant="outline" onClick={redo} disabled={!canRedo()} className="justify-start rounded-2xl">
                <Redo2 className="mr-2 h-4 w-4" />
                Redo
              </Button>
            </div>
          </div>
        </nav>
      )}

      {/* Высплывающая подсказка по горячим клавишам */}
      {showShortcutsHelp && (
        <div className="absolute right-3 top-[4.5rem] z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border/80 bg-card/95 p-4 shadow-2xl animate-scale-in sm:right-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Горячие клавиши</h3>
            <button 
              onClick={() => setShowShortcutsHelp(false)}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <KeyboardShortcutsHelp />
        </div>
      )}
    </header>
  )
}
