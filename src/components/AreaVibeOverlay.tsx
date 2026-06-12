import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { Sparkles, MapPin, Activity, Zap, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function AreaVibeOverlay() {
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const currentAreaVibe = useVantiStore((state) => state.currentAreaVibe);
  const isVibeLoading = useVantiStore((state) => state.isVibeLoading);
  const isVibeModeActive = useVantiStore((state) => state.isVibeModeActive);
  const setIsVibeModeActive = useVantiStore((state) => state.setIsVibeModeActive);
  const setCurrentAreaVibe = useVantiStore((state) => state.setCurrentAreaVibe);
  const setIsVibeLoading = useVantiStore((state) => state.setIsVibeLoading);
  const viewportLandmarks = useVantiStore((state) => state.viewportLandmarks);
  
  const [lastCenter, setLastCenter] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (!isVibeModeActive || !mapViewport?.center) return;
    
    const { lat, lng } = mapViewport.center;
    
    // De-duplicate fetches for small movements
    if (lastCenter && Math.abs(lastCenter.lat - lat) < 0.002 && Math.abs(lastCenter.lng - lng) < 0.002) {
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
            if (text.includes('Rate exceeded')) {
              setCurrentAreaVibe({
                vibeTag: "Dynastic Stone Whispers",
                description: "Ancient echoes and stone resilience define this space. A place where time bends and history pulses beneath the surface.",
                activity: "Historical Echoing",
                intensity: 0.85
              });
            }
          }
        } else {
          // Fallback Vibe if API fails
          setCurrentAreaVibe({
            vibeTag: "Dynastic Stone Whispers",
            description: "Ancient echoes and stone resilience define this space. A place where time bends and history pulses beneath the surface.",
            activity: "Historical Echoing",
            intensity: 0.85
          });
        }
      } catch (err) {
        console.error('Failed to fetch area vibe:', err);
      } finally {
        setIsVibeLoading(false);
      }
    };

    const timer = setTimeout(fetchVibe, 1000); // 1s trigger debounce
    return () => clearTimeout(timer);
  }, [isVibeModeActive, mapViewport?.center, viewportLandmarks, lastCenter, setCurrentAreaVibe, setIsVibeLoading]);

  // Handle unmounting state: if not active, we don't render anything. 
  // Parent should use AnimatePresence for clean transitions.
  if (!isVibeModeActive) return null;

  return (
    <div className="select-none">
      <AnimatePresence mode="wait">
        {isVibeLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="vanti-glass px-4 py-3 rounded-2xl border-white/10 flex items-center gap-3 backdrop-blur-3xl shadow-2xl"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 relative">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <div className="absolute inset-0 bg-indigo-500/5 blur-sm animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-indigo-400/60 tracking-[0.2em] uppercase font-mono">NEURAL SCAN</span>
              <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider">AREA FREQUENCY</span>
            </div>
          </motion.div>
        ) : currentAreaVibe && (
          <motion.div
            key="vibe"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={cn(
              "vanti-glass p-0.5 rounded-[22px] border-white/10 backdrop-blur-3xl flex items-stretch gap-0 relative group shadow-2xl overflow-hidden min-w-[240px] max-w-[300px]",
              currentAreaVibe.vibeTag.includes('Dynastic') && "border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)]"
            )}
          >
             {/* Left Aesthetic Intensity Bar */}
             <div className="w-1.5 rounded-l-[20px] bg-white/5 relative overflow-hidden shrink-0">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${currentAreaVibe.intensity * 100}%` }}
                  className={cn(
                    "absolute bottom-0 left-0 right-0 shadow-[0_0_15px_rgba(244,63,94,0.4)]",
                    currentAreaVibe.vibeTag.includes('Dynastic') 
                      ? "bg-gradient-to-t from-amber-600 via-rose-500 to-rose-300" 
                      : "bg-gradient-to-t from-rose-600 via-rose-400 to-rose-300"
                  )}
                />
             </div>

             <div className="pl-4 pr-3 py-3.5 flex flex-col gap-1.5 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      currentAreaVibe.vibeTag.includes('Dynastic') 
                        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" 
                        : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                    )} />
                    <span className={cn(
                      "text-[14px] font-black tracking-tight uppercase font-display leading-none",
                      currentAreaVibe.vibeTag.includes('Dynastic') ? "text-amber-100" : "text-white"
                    )}>
                      {currentAreaVibe.vibeTag}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsVibeModeActive(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <p className="text-[11px] text-white/75 font-medium leading-[1.6] line-clamp-3 pr-2 italic">
                  {currentAreaVibe.description}
                </p>

                <div className="flex items-center gap-4 mt-2 pt-2.5 border-t border-white/[0.08]">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-400 opacity-80" />
                    <span className="text-[9px] font-black text-rose-400/90 uppercase tracking-[0.1em] font-mono leading-none">
                      {currentAreaVibe.activity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shadow-sm px-1.5 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">
                      {Math.round(currentAreaVibe.intensity * 100)}%
                    </span>
                  </div>
                </div>
             </div>
             
             {/* Dynamic Vibe Particles for Dynastic Mode */}
             {currentAreaVibe.vibeTag.includes('Dynastic') && (
               <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                  <motion.div 
                    animate={{ 
                      x: [0, 10, -10, 0],
                      y: [0, -20, 20, 0],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute top-0 right-0 w-20 h-20 bg-amber-500/20 blur-2xl"
                  />
               </div>
             )}
             
             {/* Subtile Animated Border Overlay */}
             <div className="absolute inset-0 pointer-events-none rounded-[22px] border border-white/5" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
