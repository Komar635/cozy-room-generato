import { useState, useEffect, useCallback } from 'react'

interface LoadingState {
  isLoading: boolean
  message?: string
}

export function useLoadingState(initialState = false) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: initialState,
    message: undefined,
  })

  const startLoading = useCallback((message?: string) => {
    setLoadingState({ isLoading: true, message })
  }, [])

  const stopLoading = useCallback(() => {
    setLoadingState({ isLoading: false, message: undefined })
  }, [])

  const withLoading = useCallback(async <T,>(
    promise: Promise<T>,
    message?: string
  ): Promise<T | undefined> => {
    setLoadingState({ isLoading: true, message })
    try {
      const result = await promise
      return result
    } catch (error) {
      console.error('Loading operation failed:', error)
      throw error
    } finally {
      setLoadingState({ isLoading: false, message: undefined })
    }
  }, [])

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    withLoading,
  }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 640px)')
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1025px)')
}