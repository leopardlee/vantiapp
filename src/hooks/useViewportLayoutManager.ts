import { useEffect } from 'react';

/**
 * Standardizes viewport height across mobile browsers by calculating 
 * a dynamic --vh CSS custom property.
 */
export function useViewportLayoutManager() {
  useEffect(() => {
    const updateVh = () => {
      // Calculate 1% of the viewport height
      const vh = window.innerHeight * 0.01;
      // Set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVh();
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);

    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
    };
  }, []);
}
