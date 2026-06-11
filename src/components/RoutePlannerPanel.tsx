import React, { useState, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { X, Navigation, MapPin, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import RouteDisplay from './RouteDisplay';

import { motion, AnimatePresence } from 'motion/react';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function RoutePlannerPanel({ onClose }: { onClose: () => void }) {
  const { isNarrow } = useResponsiveLayout();
  const map = useMap();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState<{ origin: string, destination: string, isScenic: boolean } | null>(null);
  const [isScenic, setIsScenic] = useState(false);
  const [scenicData, setScenicData] = useState<any>(null);
  const [isRouting, setIsRouting] = useState(false);

  const handlePlanRoute = async () => {
    if (!origin || !destination) return;
    setIsRouting(true);
    setRoute({ origin, destination, isScenic });

    if (isScenic) {
      try {
        const res = await fetch('/api/smart-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            origin: { name: origin }, 
            destination: { name: destination },
            weatherData: { condition: 'Clear' }, // Mocked for now or fetched from store
            atmosphereTrends: ['vivid', 'serene']
          })
        });
        const data = await res.json();
        setScenicData(data);
      } catch (err) {
        console.error("Scenic routing failed:", err);
      }
    }
    setIsRouting(false);
  };

  return (
    <motion.div 
      initial={isNarrow ? { y: '100%', opacity: 0 } : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={isNarrow ? { y: '100%', opacity: 0 } : { y: -20, opacity: 0 }}
      className={cn(
        "fixed bg-[#0f1117]/95 backdrop-blur-3xl border border-white/10 p-5 shadow-2xl z-[60] pointer-events-auto",
        isNarrow 
          ? "bottom-0 left-0 right-0 rounded-t-[32px] h-[60vh]" 
          : "top-24 left-6 w-[350px] rounded-3xl"
      )}
    >
      {/* Drag Handle for Bottom Sheet on mobile */}
      {isNarrow && (
        <div className="w-full flex justify-center pt-1 pb-4">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Route Planner</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Vector Telemetry Guided</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 transition-all"
        >
           <X className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Origin"
            className="w-full pl-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-blue-500/50 transition-all outline-none"
          />
        </div>
        <div className="relative">
          <Navigation className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination"
            className="w-full pl-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-blue-500/50 transition-all outline-none"
          />
        </div>

        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2">
            <Sparkles className={cn("w-3.5 h-3.5 transition-colors", isScenic ? "text-amber-400" : "text-slate-500")} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Scenic Mode</span>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsScenic(!isScenic)}
            className={cn(
              "w-10 h-5 rounded-full transition-all relative",
              isScenic ? "bg-amber-500" : "bg-slate-700"
            )}
          >
            <motion.div 
              animate={{ x: isScenic ? 20 : 0 }}
              className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
            />
          </motion.button>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePlanRoute}
          disabled={isRouting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40"
        >
          {isRouting ? 'Calibrating Path...' : 'Establish Connection'}
        </motion.button>
      </div>
      
      {route && (
        <div className="mt-4 animate-in slide-in-from-top-4 duration-500">
          <RouteDisplay origin={route.origin} destination={route.destination} />
          
          {isScenic && scenicData && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-amber-400 uppercase">Scenic Insight</span>
                <span className="text-[9px] font-bold text-amber-500/80">Score: {scenicData.scenicScore}/100</span>
              </div>
              <p className="text-[10px] text-amber-100/70 leading-relaxed italic line-clamp-2">
                "{scenicData.routeAnalysis}"
              </p>
              {scenicData.waypoints?.map((wp: any, i: number) => (
                <div key={`scenic-wp-${i}`} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-500" />
                  <span className="text-[9px] text-amber-200/90 font-medium">{wp.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
