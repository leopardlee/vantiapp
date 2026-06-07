import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface ViewportState {
  width: number;
  height: number;
  scaleFactor: number; // 1.0 for desktop, scales up for small containers
  paddingFactor: number; // For spacing adjustments
  isCompact: boolean;
}

const ViewportContext = createContext<ViewportState>({
  width: 0,
  height: 0,
  scaleFactor: 1,
  paddingFactor: 1,
  isCompact: false,
});

export const ViewportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ViewportState>({
    width: window.innerWidth,
    height: window.innerHeight,
    scaleFactor: 1,
    paddingFactor: 1,
    isCompact: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Logic for scaling factors based on width
        // Thresholds for "compact" mode (mobile-like)
        const isCompact = width < 640;
        
        // Scale factor: If the width is very small, we might want to scale UP icons
        // to ensure they remain tappable, but scale DOWN padding to save space.
        let scaleFactor = 1;
        let paddingFactor = 1;

        if (width < 320) {
          scaleFactor = 1.2;
          paddingFactor = 0.6;
        } else if (width < 480) {
          scaleFactor = 1.1;
          paddingFactor = 0.8;
        } else if (width > 1200) {
          scaleFactor = 0.9; // Slightly smaller on ultra-wide?
          paddingFactor = 1.2;
        }

        setState({
          width,
          height,
          scaleFactor,
          paddingFactor,
          isCompact,
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <ViewportContext.Provider value={state}>
      <div 
        ref={containerRef} 
        id="vanti-viewport-container"
        className="w-full h-full relative overflow-hidden"
      >
        {children}
      </div>
    </ViewportContext.Provider>
  );
};

export const useViewport = () => useContext(ViewportContext);
