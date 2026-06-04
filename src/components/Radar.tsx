import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Radar({ heading, center, markers = [], isVisible = true }: { 
  heading: number; 
  center: { lat: number; lng: number };
  markers?: { lat: number; lng: number; type?: string }[];
  isVisible?: boolean;
}) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 3.6) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn(
      "absolute bottom-24 right-6 w-32 h-32 rounded-full border border-white/5 bg-slate-900/20 backdrop-blur-sm overflow-hidden z-20 pointer-events-none shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-opacity duration-300",
      !isVisible && "opacity-0 md:opacity-100"
    )}>
      {/* Grid Lines */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[0.5px] bg-white/5" />
        <div className="h-full w-[0.5px] bg-white/5" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border border-white/5" />
        <div className="w-12 h-12 rounded-full border border-white/5" />
      </div>

      {/* Sweep */}
      <div 
        className="absolute inset-0 origin-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-white/5" />
      </div>

      {/* North Indicator */}
      <div 
        className="absolute inset-0 origin-center transition-transform duration-300"
        style={{ transform: `rotate(${-heading}deg)` }}
      >
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/20 uppercase tracking-tighter">12</div>
      </div>

      {/* Blips */}
      <div 
        className="absolute inset-0 origin-center"
        style={{ transform: `rotate(${-heading}deg)` }}
      >
        {markers.slice(0, 8).map((m, i) => {
          const dLat = (m.lat - center.lat) * 1000;
          const dLng = (m.lng - center.lng) * 1000;
          const x = 50 + dLng * 5;
          const y = 50 - dLat * 5;
          
          if (x < 0 || x > 100 || y < 0 || y > 100) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)]"
            />
          );
        })}
      </div>

      {/* Center blip */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
      
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-mono font-black text-white/30 uppercase tracking-[0.2em] whitespace-nowrap">RA-DAR_LITE</div>
    </div>
  );
}
