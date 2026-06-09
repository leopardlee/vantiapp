import { useEffect, useRef } from 'react';

interface SwipeInput {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  edgeThreshold?: number; // How close to edge to start (for edge swipes)
}

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, edgeThreshold = 50 }: SwipeInput) {
  const touchStart = useRef<{ x: number, y: number, time: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Ignore multi-touch
      if (e.touches.length > 1) return;
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStart.current.x;
      const dy = touchEndY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.time;

      // Ignore slow swipes
      if (dt > 800) {
        touchStart.current = null;
        return;
      }

      const isSwipeX = Math.abs(dx) > Math.abs(dy);
      
      if (isSwipeX) {
        if (Math.abs(dx) > 60) {
           if (dx > 0 && onSwipeRight) {
             // Swipe Right
             // Check if it's an edge swipe if edgeThreshold is given
             if (edgeThreshold > 0 && touchStart.current.x <= edgeThreshold) {
                 onSwipeRight();
             } else if (edgeThreshold <= 0) {
                 onSwipeRight();
             }
           } else if (dx < 0 && onSwipeLeft) {
             // Swipe Left
             if (edgeThreshold > 0 && touchStart.current.x >= window.innerWidth - edgeThreshold) {
                 onSwipeLeft();
             } else if (edgeThreshold <= 0) {
                 onSwipeLeft();
             }
           }
        }
      } else {
        if (Math.abs(dy) > 60) {
           if (dy > 0 && onSwipeDown) {
              // Swipe Down
              if (edgeThreshold > 0 && touchStart.current.y <= edgeThreshold) {
                 onSwipeDown();
              } else if (edgeThreshold <= 0) {
                 onSwipeDown();
              }
           } else if (dy < 0 && onSwipeUp) {
              // Swipe Up
              if (edgeThreshold > 0 && touchStart.current.y >= window.innerHeight - edgeThreshold) {
                 onSwipeUp();
              } else if (edgeThreshold <= 0) {
                 onSwipeUp();
              }
           }
        }
      }

      touchStart.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, edgeThreshold]);
}
