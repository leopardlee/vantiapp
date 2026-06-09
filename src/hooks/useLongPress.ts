import { useCallback, useRef, useState } from 'react';

export function useLongPress(
  callback: (e: any) => void,
  { threshold = 500, onStart, onEnd }: { threshold?: number; onStart?: () => void; onEnd?: () => void } = {}
) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>(null);

  const start = useCallback((e: any) => {
    e.persist?.();
    setIsPressing(true);
    onStart?.();
    timerRef.current = setTimeout(() => {
      callback(e);
      setIsPressing(false);
    }, threshold);
  }, [callback, threshold, onStart]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPressing(false);
    onEnd?.();
  }, [onEnd]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    isPressing
  };
}
