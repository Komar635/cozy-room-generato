'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface LazyLoadOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useLazyLoad(options: LazyLoadOptions = {}) {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (triggerOnce) {
            observer.unobserve(ref.current!)
          }
        } else if (!triggerOnce) {
          setIsInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce])

  useEffect(() => {
    if (isInView && !isLoaded) {
      setIsLoaded(true)
    }
  }, [isInView, isLoaded])

  return { ref, isLoaded, isInView }
}

export function useModelPreloader(modelUrls: string[]) {
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const preload = useCallback(async () => {
    if (modelUrls.length === 0) return
    
    setIsLoading(true)
    
    const { modelLoader } = await import('@/lib/three-utils')
    
    await Promise.allSettled(
      modelUrls.map(url => 
        modelLoader.loadModel(url).then(() => {
          setLoadedUrls(prev => new Set(prev).add(url))
        }).catch(() => {})
      )
    )
    
    setIsLoading(false)
  }, [modelUrls])

  useEffect(() => {
    preload()
  }, [preload])

  const isLoaded = useCallback((url: string) => {
    return loadedUrls.has(url) || false
  }, [loadedUrls])

  return { preload, isLoaded, isLoading }
}

export function useTextureOptimization(performanceLevel: 'low' | 'medium' | 'high') {
  return useCallback((texture: any) => {
    if (!texture) return

    switch (performanceLevel) {
      case 'low':
        texture.minFilter = THREE.NearestFilter
        texture.magFilter = THREE.NearestFilter
        texture.anisotropy = 1
        break
      case 'medium':
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = 4
        break
      case 'high':
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = 16
        break
    }
  }, [performanceLevel])
}

import * as THREE from 'three'

export function usePerformanceMonitor() {
  const [fps, setFps] = useState(0)
  const [memory, setMemory] = useState(0)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useEffect(() => {
    let animationId: number

    const measure = () => {
      frameCount.current++
      const now = performance.now()
      const delta = now - lastTime.current

      if (delta >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / delta))
        frameCount.current = 0
        lastTime.current = now

        if ('memory' in performance) {
          const memoryInfo = (performance as any).memory
          setMemory(Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024))
        }
      }

      animationId = requestAnimationFrame(measure)
    }

    animationId = requestAnimationFrame(measure)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return { fps, memory }
}