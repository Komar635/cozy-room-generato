'use client';

import { useEffect, useRef, useCallback } from 'react';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

class Analytics {
  private static instance: Analytics;
  private enabled: boolean = false;
  private queue: AnalyticsEvent[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = process.env.NODE_ENV === 'production';
    }
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  track(event: AnalyticsEvent): void {
    if (!this.enabled) {
      console.log('[Analytics]', event);
      return;
    }

    this.queue.push(event);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
      });
    }
  }

  pageView(path: string): void {
    this.track({
      category: 'navigation',
      action: 'page_view',
      label: path,
    });
  }

  furnitureAdded(itemName: string, price: number): void {
    this.track({
      category: 'furniture',
      action: 'item_added',
      label: itemName,
      value: price,
    });
  }

  roomCreated(dimensions: { width: number; height: number; depth: number }): void {
    this.track({
      category: 'room',
      action: 'created',
      label: `${dimensions.width}x${dimensions.height}x${dimensions.depth}`,
    });
  }

  exportUsed(format: string): void {
    this.track({
      category: 'export',
      action: 'used',
      label: format,
    });
  }

  flush(): void {
    if (this.queue.length > 0) {
      console.log('[Analytics] Flushing events:', this.queue.length);
      this.queue = [];
    }
  }
}

export const analytics = Analytics.getInstance();

export function useAnalytics() {
  const track = useCallback((event: AnalyticsEvent) => {
    analytics.track(event);
  }, []);

  const pageView = useCallback((path: string) => {
    analytics.pageView(path);
  }, []);

  return { track, pageView };
}

interface PerformanceMetrics {
  fps: number;
  memory?: number;
  renderTime?: number;
}

export function usePerformanceMonitor(onMetrics?: (metrics: PerformanceMetrics) => void) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const rafId = useRef<number>();

  useEffect(() => {
    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / delta);
        
        const metrics: PerformanceMetrics = {
          fps,
        };

        if ((performance as any).memory) {
          metrics.memory = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }

        onMetrics?.(metrics);
        
        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId.current = requestAnimationFrame(measureFPS);
    };

    rafId.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [onMetrics]);
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    analytics.track({
      category: 'app',
      action: 'loaded',
    });

    const handleBeforeUnload = () => {
      analytics.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return children;
}