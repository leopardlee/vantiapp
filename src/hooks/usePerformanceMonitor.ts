import { useState, useEffect, useRef, useCallback } from 'react';

export interface PerformanceStats {
  loadTime: number | null;
  memoryUsage: number | null; // in MB
  fps: number;
}

export function usePerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    loadTime: null,
    memoryUsage: null,
    fps: 60,
  });
  
  const startTime = useRef(performance.now());
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const hasFinishedLoading = useRef(false);

  useEffect(() => {
    // Tracking FPS
    const trackFps = () => {
      frameCount.current++;
      const now = performance.now();
      
      // Update every 2 seconds to minimize re-renders of heavy parent components (VantiMap)
      if (now >= lastTime.current + 2000) {
        const currentFps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        
        // Tracking Memory if supported
        let memory: number | null = null;
        if ((performance as any).memory) {
          memory = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
        }

        setStats(prev => ({
          ...prev,
          fps: currentFps,
          memoryUsage: memory
        }));

        frameCount.current = 0;
        lastTime.current = now;
      }
      requestAnimationFrame(trackFps);
    };

    const frameId = requestAnimationFrame(trackFps);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const markLoaded = useCallback(() => {
    if (hasFinishedLoading.current) return;
    hasFinishedLoading.current = true;
    const end = performance.now();
    const loadTime = Math.round(end - startTime.current);
    
    setStats(prev => {
      if (prev.loadTime !== null) return prev;
      return {
        ...prev,
        loadTime
      };
    });
  }, []);

  return { stats, markLoaded };
}
