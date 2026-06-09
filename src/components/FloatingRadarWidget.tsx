import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radar, Activity, Info, Zap, Battery, Navigation } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';

interface Hotspot {
  id: string;
  name: string;
  intensity: number;
  category: 'food' | 'landmark' | 'experience';
}

const CATEGORIES_INFO = {
  food: {
    label: 'Food & Dining',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    barClass: 'from-amber-500 to-orange-400',
    bullet: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
  },
  landmark: {
    label: 'Landmark Sites',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    barClass: 'from-emerald-500 to-teal-400',
    bullet: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
  },
  experience: {
    label: 'Interactive Exp',
    color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    barClass: 'from-fuchsia-400 to-indigo-400',
    bullet: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]'
  }
};

export function FloatingRadarWidget() {
  const userLocation = useVantiStore(state => state.userLocation);
  const bookmarkedPlaces = useVantiStore(state => state.bookmarkedPlaces);
  const isBatterySaverEnabled = useVantiStore(state => state.isBatterySaverEnabled);

  const isActive = useVantiStore(state => state.isRadarActive);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const isExpanded = true;
  const [showLegend, setShowLegend] = useState(false);

  // Movement tracking state variables
  const [isMoving, setIsMoving] = useState(false);
  const [lastMovementTime, setLastMovementTime] = useState<number>(Date.now());
  const [simulatedMovement, setSimulatedMovement] = useState(false);
  const prevLocRef = useRef<google.maps.LatLngLiteral | null>(null);

  // Monitor location changes to determine motion state automatically
  useEffect(() => {
    if (!userLocation) return;
    if (prevLocRef.current) {
      const latDiff = Math.abs(prevLocRef.current.lat - userLocation.lat);
      const lngDiff = Math.abs(prevLocRef.current.lng - userLocation.lng);
      // Delta to detect standard location updates
      if (latDiff > 0.00005 || lngDiff > 0.00005) {
        setIsMoving(true);
        setLastMovementTime(Date.now());
      }
    }
    prevLocRef.current = userLocation;
  }, [userLocation]);

  // Handle stationary timeout check
  useEffect(() => {
    if (simulatedMovement) {
      setIsMoving(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (Date.now() - lastMovementTime > 15000) {
        setIsMoving(false);
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [lastMovementTime, simulatedMovement]);

  // Adjust scanning frequency and detail level depending on user movement & battery settings
  let scanInterval = 8000;
  let detailLimit = 3;

  if (isBatterySaverEnabled) {
    scanInterval = 15000; // Ultra high efficiency: 15s interval
    detailLimit = 1;      // Minimal category scan result
  } else if (isMoving) {
    scanInterval = 4000;  // Active scanning: 4s interval
    detailLimit = 5;      // Extended detail representation
  } else {
    scanInterval = 8000;  // Standard eco: 8s interval
    detailLimit = 3;      // Standard detail representation
  }

  useEffect(() => {
      const processData = () => {
        const placesArr = Object.values(bookmarkedPlaces || {});
        const mockTrending = [
          { name: 'Downtown Cafe Hub', intensity: 85, category: 'food' as const },
          { name: 'Historic Grand Cathedral', intensity: 78, category: 'landmark' as const },
          { name: 'Metro Plaza Square', intensity: 72, category: 'landmark' as const },
          { name: 'Night Drone Show Arena', intensity: 94, category: 'experience' as const },
          { name: 'Neon Street Food Market', intensity: 88, category: 'food' as const },
          { name: 'Vanti Rooftop Lounge', intensity: 91, category: 'experience' as const },
        ];

        let combined: Hotspot[] = [];

        if (placesArr.length > 0) {
          combined = placesArr.map((p: any, i) => {
            const name = p.name || p.displayName?.text || 'Discovered Location';
            let category: 'food' | 'landmark' | 'experience' = 'experience';
            
            const foodRegex = new RegExp("cafe|food|restaurant|coffee|market|bistro", "i");
            const landmarkRegex = new RegExp("cathedral|plaza|museum|park|monument|landmark|view", "i");
            
            if (foodRegex.test(name)) {
              category = 'food';
            } else if (landmarkRegex.test(name)) {
              category = 'landmark';
            }
            return {
              id: p.id || `bookmark-${i}`,
              name,
              intensity: Math.floor(Math.random() * 35) + 65,
              category
            };
          });
        }

      const defaultPool = mockTrending.map((m, i) => ({
        id: `mock-${i}`,
        ...m,
        intensity: Math.floor(Math.random() * 35) + 65
      }));

      const finalPool = [...combined, ...defaultPool];
      // Shuffle & Slice to detail limit
      const selected = finalPool
        .sort(() => Math.random() - 0.5)
        .slice(0, detailLimit);

      setHotspots(selected);
    };

    const interval = setInterval(processData, scanInterval);
    processData();

    return () => clearInterval(interval);
  }, [userLocation, bookmarkedPlaces, scanInterval, detailLimit]);

  return (
    <div className="absolute left-[70px] top-[calc(50%+16rem)] -translate-y-1/2 z-[60] flex items-center justify-start pointer-events-auto">
      <AnimatePresence>
        {isActive && (
          <motion.div 
            key="radar-widget"
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="bg-[#0f1117]/95 backdrop-blur-3xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl w-64 overflow-hidden z-20"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-50 pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 relative z-10 font-mono">
              <Radar className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-white text-[10px] font-black tracking-widest uppercase">TRENDING RADAR</span>
            </div>

            {/* List of hotspots */}
            <div className="space-y-2 relative z-10 font-mono">
              <AnimatePresence mode="popLayout">
                {hotspots.map((hotspot) => (
                  <motion.div 
                    key={hotspot.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-between items-center text-[10px] bg-white/[0.02] border border-white/5 rounded-xl p-2 relative overflow-hidden"
                  >
                    {/* Accent border strip on left based on category */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      hotspot.category === 'food' ? 'bg-amber-400' :
                      hotspot.category === 'landmark' ? 'bg-emerald-400' :
                      'bg-fuchsia-400'
                    )} />

                    <div className="flex flex-col flex-1 min-w-0 pl-1.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 truncate font-semibold">{hotspot.name}</span>
                        <span className={cn(
                          "text-[7px] px-1 py-0.2 rounded border uppercase font-bold shrink-0",
                          CATEGORIES_INFO[hotspot.category].color
                        )}>
                          {hotspot.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Activity className={cn(
                          "w-2.5 h-2.5",
                          hotspot.category === 'food' ? 'text-amber-400' :
                          hotspot.category === 'landmark' ? 'text-emerald-400' :
                          'text-fuchsia-400'
                        )} />
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">VOL: {hotspot.intensity}%</span>
                      </div>
                    </div>
                    {/* Intensity Bar */}
                    <div className="w-6 h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
                      <motion.div 
                        className={cn("h-full bg-gradient-to-r", CATEGORIES_INFO[hotspot.category].barClass)}
                        initial={{ width: 0 }}
                        animate={{ width: `${hotspot.intensity}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Dynamic scanning frequency & mobility telemetry dashboard HUD */}
            <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-1.5 text-[9px] font-mono select-none relative z-10">
              <div className="flex justify-between items-center text-slate-400">
                <span>FREQ INTERVAL</span>
                <span className="text-emerald-400 font-bold">
                  {Math.floor(scanInterval / 1000)}s ({isMoving ? 'ACTIVE' : isBatterySaverEnabled ? 'SAVER' : 'ECO'})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>GPS HARDWARE</span>
                <span className={cn("font-bold flex items-center gap-1", isBatterySaverEnabled ? "text-yellow-400" : "text-emerald-400")}>
                  {isBatterySaverEnabled ? <Battery className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                  {isBatterySaverEnabled ? 'LOW POWER' : 'ACTIVE 3D'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-slate-400 pt-1">
                <span>MOTION ENGINE</span>
                <button 
                  onClick={() => setSimulatedMovement(!simulatedMovement)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer flex items-center gap-0.5",
                    simulatedMovement 
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400" 
                      : "bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <Navigation className={cn("w-2 h-2 shrink-0 mr-0.5", simulatedMovement && "animate-pulse")} />
                  {simulatedMovement ? 'SIM MOVE' : 'STATIONARY'}
                </button>
              </div>
            </div>

            {/* Toggleable Legend Trigger */}
            <button 
              onClick={() => setShowLegend(!showLegend)}
              className="w-full mt-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg py-2 text-[9px] font-bold transition-all flex items-center justify-center gap-1 border border-white/5 relative z-10"
            >
              <Info className="w-3 h-3 text-emerald-400" />
              <span>{showLegend ? 'Close Color Legend' : 'Open Location Legend'}</span>
            </button>

            {/* Legend categories list block */}
            <AnimatePresence>
              {showLegend && (
                <motion.div 
                  key="radar-legend"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2 pt-2 border-t border-white/5 text-[9px] font-mono flex flex-col gap-1.5 relative z-10"
                >
                  <div className="text-[8px] font-bold text-slate-500 mb-1 uppercase tracking-wider">CATEGORY CODE LEGEND</div>
                  {Object.entries(CATEGORIES_INFO).map(([key, info]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", info.bullet)} />
                      <span className="text-slate-300 capitalize">{key}</span>
                      <span className="text-slate-500 ml-auto">{info.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
