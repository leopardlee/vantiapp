import { useState, useEffect } from 'react';

/**
 * Hook to detect "narrow" aspect ratio (likely mobile device)
 * Narrower than 9:16 (0.5625)
 */
export function useResponsiveLayout() {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const ratio = window.innerWidth / window.innerHeight;
      // 9/16 is 0.5625. If ratio is less than this, it's very narrow/mobile.
      // We can also check a slightly wider threshold like 0.65 for more mobile devices.
      setIsNarrow(ratio < 0.65);
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return { isNarrow };
}
