import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';

interface AtmosphericEngineOverlayProps {
  weather: string | null;
  lat: number;
}

export const AtmosphericEngineOverlay: React.FC<AtmosphericEngineOverlayProps> = ({ weather, lat }) => {
  const [atmosphereData, setAtmosphereData] = useState<{ filter: string; opacity: number; blendMode: string } | null>(null);

  useEffect(() => {
    // Determine local time of day based roughly on longitude or just use device time for demo
    const hour = new Date().getHours();
    let isDay = hour > 6 && hour < 19;
    
    // Simple gemini-inspired logic for atmospheric feeling
    let filter = '';
    let blendMode = 'normal';
    let opacity = 0;

    const weatherMain = weather?.toLowerCase() || '';

    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
      filter = 'bg-slate-900';
      blendMode = 'multiply';
      opacity = 0.3;
    } else if (weatherMain.includes('fog') || weatherMain.includes('haze') || weatherMain.includes('mist')) {
      filter = 'bg-slate-300';
      blendMode = 'screen';
      opacity = isDay ? 0.3 : 0.15;
    } else if (isDay && (hour >= 17 && hour <= 19)) {
      // Golden hour
      filter = 'bg-amber-500';
      blendMode = 'overlay';
      opacity = 0.25;
    } else if (!isDay) {
      // Nighttime subtle cobalt tint
      filter = 'bg-[#0f172a]';
      blendMode = 'multiply';
      opacity = 0.4;
    }

    if (filter) {
      setAtmosphereData({ filter, opacity, blendMode });
    } else {
      setAtmosphereData(null);
    }
  }, [weather, lat]);

  return (
    <AnimatePresence>
      {atmosphereData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: atmosphereData.opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 4 }}
          style={{ mixBlendMode: atmosphereData.blendMode as any }}
          className={`absolute inset-0 pointer-events-none z-[150] ${atmosphereData.filter}`}
        />
      )}
    </AnimatePresence>
  );
};
