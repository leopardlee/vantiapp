import React, { useState, useEffect, useRef } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { Users, Info, Zap, Flame, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

interface Hotspot {
  lat: number;
  lng: number;
  name: string;
  congestionRatio: number;
  intensity: number; // 1 to 5
  reason: string;
  pulsePeriod: number;
}

export const CrowdPulseLayer = () => {
  const map = useMap();
  const isActive = useVantiStore((state) => state.isCrowdPulseActive);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const lastFetchedCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map || !isActive) return;

    const fetchCrowdPulse = async () => {
      const center = map.getCenter();
      if (!center) return;

      const lat = center.lat();
      const lng = center.lng();

      // Avoid redundant fetches if the map hasn't moved significant distance (e.g. within 500 meters)
      if (lastFetchedCenterRef.current) {
        const dLat = Math.abs(lastFetchedCenterRef.current.lat - lat);
        const dLng = Math.abs(lastFetchedCenterRef.current.lng - lng);
        if (dLat < 0.008 && dLng < 0.008) {
          return;
        }
      }

      setLoading(true);
      try {
        const response = await fetch('/api/crowd-pulse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        });
        if (!response.ok) throw new Error('Crowd pulse fetch failed');
        const data = await response.json();
        if (data.hotspots) {
          setHotspots(data.hotspots);
          lastFetchedCenterRef.current = { lat, lng };
        }
      } catch (err) {
        console.warn('[CrowdPulseLayer] Failed to get real-time pulses, using backup layout', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch on activation or when map updates
    fetchCrowdPulse();

    // Debounced listener on dragend or bounds_changed
    const listener = map.addListener('dragend', fetchCrowdPulse);
    const zoomListener = map.addListener('zoom_changed', fetchCrowdPulse);

    return () => {
      listener.remove();
      zoomListener.remove();
    };
  }, [map, isActive]);

  if (!isActive) return null;

  return (
    <>
      {hotspots.map((spot, index) => {
        const hotspotId = `pulse-${index}-${spot.lat}-${spot.lng}`;
        const isHovered = hoveredId === hotspotId;

        // Custom style configurations based on intensity (1 to 5)
        const getPulseStyles = (intensity: number) => {
          if (intensity >= 5) {
            return {
              color: 'text-rose-400',
              bgColor: 'bg-rose-500',
              borderColor: 'border-rose-500/40',
              ringBg: 'bg-rose-500/20',
              accent: 'bg-rose-500/30'
            };
          } else if (intensity >= 4) {
            return {
              color: 'text-orange-400',
              bgColor: 'bg-orange-500',
              borderColor: 'border-orange-500/40',
              ringBg: 'bg-orange-500/20',
              accent: 'bg-orange-500/30'
            };
          } else if (intensity >= 3) {
            return {
              color: 'text-amber-400',
              bgColor: 'bg-amber-500',
              borderColor: 'border-amber-500/40',
              ringBg: 'bg-amber-500/15',
              accent: 'bg-amber-500/25'
            };
          } else {
            return {
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500',
              borderColor: 'border-emerald-500/40',
              ringBg: 'bg-emerald-500/10',
              accent: 'bg-emerald-500/20'
            };
          }
        };

        const styles = getPulseStyles(spot.intensity);

        return (
          <AdvancedMarker
            key={hotspotId}
            position={{ lat: spot.lat, lng: spot.lng }}
          >
            <div
              className="relative cursor-pointer flex items-center justify-center select-none"
              onMouseEnter={() => setHoveredId(hotspotId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(isHovered ? null : hotspotId)}
            >
              {/* Concentric Pulsating Rings */}
              <motion.div
                animate={{
                  scale: [0.8, 2.5, 4.0],
                  opacity: [0.6, 0.3, 0],
                }}
                transition={{
                  duration: spot.pulsePeriod,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className={cn("absolute w-6 h-6 rounded-full pointer-events-none border blur-[2px]", styles.borderColor, styles.ringBg)}
              />
              <motion.div
                animate={{
                  scale: [0.6, 1.8, 2.8],
                  opacity: [0.8, 0.4, 0],
                }}
                transition={{
                  duration: spot.pulsePeriod,
                  delay: spot.pulsePeriod * 0.4,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className={cn("absolute w-6 h-6 rounded-full pointer-events-none border blur-[1px]", styles.borderColor, styles.ringBg)}
              />

              {/* Glowing Center core */}
              <div className={cn("relative w-4 h-4 rounded-full border-2 border-white/40 shadow-lg flex items-center justify-center transition-transform duration-300", styles.bgColor, isHovered && "scale-125")}>
                <div className="absolute inset-0 rounded-full animate-ping opacity-60 bg-white" />
                <Users className="w-1.5 h-1.5 text-white" />
              </div>

              {/* Immersive HUD Tooltip Box */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    className="absolute bottom-6 z-[100] w-60 bg-slate-950/95 border border-slate-700/60 p-3 rounded-xl shadow-2xl backdrop-blur-md text-white pointer-events-none"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Flame className={cn("w-3.5 h-3.5 animate-pulse", styles.color)} />
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-100 truncate max-w-[120px]">{spot.name}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md font-mono text-[8px] font-bold text-slate-300">
                        Density: {Math.round(spot.congestionRatio * 100)}%
                      </div>
                    </div>

                    {/* Meta stats */}
                    <p className="text-[9.5px] text-slate-300 leading-normal mb-1.5 bg-slate-900/50 p-1.5 rounded-lg border border-white/5">
                      {spot.reason}
                    </p>

                    <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-0.5">
                        <Compass className="w-2.5 h-2.5 shrink-0" /> Local pulse
                      </span>
                      <span>Intensity: {spot.intensity}/5</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Mini loading feedback for map movement update updates */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-purple-500/20 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md pointer-events-none z-[80] flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full"
          />
          <span className="text-[10px] font-mono font-black tracking-[0.1em] text-purple-300 uppercase">Updating Real-time Pulse...</span>
        </div>
      )}
    </>
  );
};
