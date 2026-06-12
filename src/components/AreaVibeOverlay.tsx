import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { Sparkles, MapPin, Activity, Zap, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function AreaVibeOverlay() {
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const currentAreaVibe = useVantiStore((state) => state.currentAreaVibe);
  const isVibeLoading = useVantiStore((state) => state.isVibeLoading);
  const setCurrentAreaVibe = useVantiStore((state) => state.setCurrentAreaVibe);
  const setIsVibeLoading = useVantiStore((state) => state.setIsVibeLoading);
  const viewportLandmarks = useVantiStore((state) => state.viewportLandmarks);
  
  const [lastCenter, setLastCenter] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (!mapViewport?.center) return;
    
    const { lat, lng } = mapViewport.center;
    
    // Threshold to prevent over-calling (0.005 degrees ~ 500m)
    if (lastCenter && Math.abs(lastCenter.lat - lat) < 0.005 && Math.abs(lastCenter.lng - lng) < 0.005) {
      return;
    }

    const fetchVibe = async () => {
      setIsVibeLoading(true);
      setLastCenter({ lat, lng });
      
      try {
        const response = await fetch('/api/area-vibe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lng,
            pois: viewportLandmarks.slice(0, 10).map(p => p.name),
            context: `Analysis of current map view at zoom ${mapViewport.zoom}`
          })
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setCurrentAreaVibe(data);
          } else {
            const text = await response.text();
            console.warn('Area vibe returned non-json:', text);
            // Fallback to offline data if rate limited
            if (text.includes('Rate exceeded')) {
              setCurrentAreaVibe({
                vibeTag: "Busy Digital Hub",
                description: "A high-intensity data corridor pulsing with encrypted energy.",
                activity: "Digital exploration",
                intensity: 0.8
              });
            }
          }
        } else if (response.status === 429) {
           // Explicit rate limit handling
           setCurrentAreaVibe({
             vibeTag: "Rate Balanced Zone",
             description: "The area's soul is currently resting after a high-frequency analysis.",
             activity: "Slow wandering",
             intensity: 0.4
           });
        }
      } catch (err) {
        console.error('Failed to fetch area vibe:', err);
      } finally {
        setIsVibeLoading(false);
      }
    };

    const timer = setTimeout(fetchVibe, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [mapViewport?.center, viewportLandmarks, lastCenter, setCurrentAreaVibe, setIsVibeLoading]);

  if (!currentAreaVibe && !isVibeLoading) return null;

  return (
    <div className="select-none">
      <AnimatePresence mode="wait">
        {isVibeLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="vanti-glass px-4 py-2.5 rounded-2xl border-white/5 flex items-center gap-3 backdrop-blur-3xl"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/40 tracking-widest uppercase font-mono">CALIBRATING</span>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-wider">AREA SOUL...</span>
            </div>
          </motion.div>
        ) : currentAreaVibe && (
          <motion.div
            key="vibe"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="vanti-glass p-1 rounded-[24px] border-white/5 backdrop-blur-3xl flex items-stretch gap-0.5 max-w-[280px]"
          >
             {/* Left Aesthetic Bar */}
             <div className="w-1.5 rounded-l-[20px] bg-rose-500/20 relative overflow-hidden shrink-0">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${currentAreaVibe.intensity * 100}%` }}
                  className="absolute bottom-0 left-0 right-0 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                />
             </div>

             <div className="px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[12px] font-black text-rose-500 tracking-tight uppercase font-display">
                    {currentAreaVibe.vibeTag}
                  </span>
                </div>
                <p className="text-[10px] text-white/70 font-medium leading-relaxed mt-0.5 line-clamp-2">
                  {currentAreaVibe.description}
                </p>

                <div className="flex items-center gap-2 pt-2 mt-1 border-t border-white/[0.05]">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-widest font-mono">
                    {currentAreaVibe.activity}
                  </span>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
