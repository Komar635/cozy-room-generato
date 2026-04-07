import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppHeader } from '@/components/ui/app-header'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { StoreFeedbackProvider } from '@/components/providers/store-feedback-provider'
import { ToastProvider } from '@/components/ui/toast'

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
