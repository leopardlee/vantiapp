import { useEffect } from 'react';

export function useAdaptiveScaling() {
  useEffect(() => {
    const handleResize = () => {
      // Calculate a dynamic multiplier based on screen width, height, and display density
      const vh = window.innerHeight * 0.01;
      const vw = window.innerWidth * 0.01;
      const dpr = window.devicePixelRatio || 1;
      
      // Base reference width (e.g. standard phone width)
      const baseWidth = 390; 
      
      // Scale factor (clamped between 0.85 and 1.2 to avoid extremes)
      // On narrow screens (foldables) it scales down, on tablets it scales up
      let scaleFactor = Math.max(0.85, Math.min(1.2, window.innerWidth / baseWidth));
      
      // Boost touch targets slightly on higher density displays if screen is small
      if (dpr > 2 && window.innerWidth < 400) {
        scaleFactor *= 1.05;
      }
      
      // Set CSS variables for UI scaling
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--vw', `${vw}px`);
      document.documentElement.style.setProperty('--ui-scale', `${scaleFactor}`);
      
      // Also inject a font-size baseline on the :root element if we want to use 'rem' sizing
      document.documentElement.style.fontSize = `${16 * scaleFactor}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.documentElement.style.removeProperty('--vh');
      document.documentElement.style.removeProperty('--vw');
      document.documentElement.style.removeProperty('--ui-scale');
      document.documentElement.style.fontSize = '16px';
    };
  }, []);
}
