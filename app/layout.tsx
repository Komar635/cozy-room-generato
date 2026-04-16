import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppHeader } from '@/components/ui/app-header'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { StoreFeedbackProvider } from '@/components/providers/store-feedback-provider'
import { ToastProvider } from '@/components/ui/toast'

const themeInitScript = `
(() => {
  try {
    const storageValue = window.localStorage.getItem('theme-storage')
    const parsedValue = storageValue ? JSON.parse(storageValue) : null
    const savedTheme = parsedValue?.state?.theme ?? 'system'
    const resolvedTheme = savedTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : savedTheme

    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.dataset.theme = resolvedTheme
    root.style.colorScheme = resolvedTheme
  } catch (error) {
    document.documentElement.style.colorScheme = 'light'
  }
})()
`

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Room Designer',
  description: '3D комнатный дизайнер для планирования интерьера',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            <StoreFeedbackProvider />
            <div className="min-h-screen flex flex-col">
              <AppHeader />
              <main className="flex-1">{children}</main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
