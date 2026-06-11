import { useEffect, useRef } from 'react';

interface MultiFingerSwipeInput {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  numFingersRequired?: number; // Default: 2
}

export function useMultiFingerSwipe({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  numFingersRequired = 2
}: MultiFingerSwipeInput) {
  const touchesStartRef = useRef<{ id: number; x: number; y: number }[] | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Check if we have the required number of fingers
      if (e.touches.length === numFingersRequired) {
        touchesStartRef.current = Array.from(e.touches).map(t => ({
          id: t.identifier,
          x: t.clientX,
          y: t.clientY
        }));
        startTimeRef.current = Date.now();
      } else {
        // Clear start reference if finger count changes mid-touch
        touchesStartRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchesStartRef.current || touchesStartRef.current.length !== numFingersRequired) {
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      // Reject extremely slow interactions (beyond swipe timing window)
      if (elapsed > 1000) {
        touchesStartRef.current = null;
        return;
      }

      // Calculate mean starting point of active fingers
      const avgStartX = touchesStartRef.current.reduce((sum, t) => sum + t.x, 0) / numFingersRequired;
      const avgStartY = touchesStartRef.current.reduce((sum, t) => sum + t.y, 0) / numFingersRequired;

      // Find the corresponding ended touches from changedTouches or active touches
      const endedTouches = Array.from(e.changedTouches);
      if (endedTouches.length === 0) {
        touchesStartRef.current = null;
        return;
      }

      // Mean ending point
      const avgEndX = endedTouches.reduce((sum, t) => sum + t.clientX, 0) / endedTouches.length;
      const avgEndY = endedTouches.reduce((sum, t) => sum + t.clientY, 0) / endedTouches.length;

      const deltaX = avgEndX - avgStartX;
      const deltaY = avgEndY - avgStartY;

      // Ensure minimal threshold is met (e.g. 50px displacement)
      const threshold = 50;
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontal) {
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      } else {
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      }

      touchesStartRef.current = null;
    };

    const mapElement = document.getElementById('vanti-gesture-container') || window;
    
    mapElement.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    mapElement.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });

    return () => {
      mapElement.removeEventListener('touchstart', handleTouchStart as EventListener);
      mapElement.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, numFingersRequired]);
}
