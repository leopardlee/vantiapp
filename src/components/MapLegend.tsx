import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Navigation, Bookmark, Users, ShieldAlert, 
  Map as MapIcon, Layers, Heart, Sparkles, MapPin, Tag, ChevronUp, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';

interface MapLegendProps {
  activeWeather: string | null;
  showTraffic: boolean;
  showPins: boolean;
}

export default function MapLegend({ 
  activeWeather, 
  showTraffic,
  showPins
}: MapLegendProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedCategory = useVantiStore(state => state.selectedCategory);
  const activeMode = useVantiStore(state => state.activeMode);
  const itinerary = useVantiStore(state => state.itinerary);
  const showWeatherLayer = useVantiStore(state => state.showWeatherLayer);
  const mapAesthetic = useVantiStore(state => state.mapAesthetic);

  // Define what to show based on active state
  const activeIndicators = [
    { 
      type: 'marker',
      show: showPins && selectedCategory !== 'All',
      icon: <MapPin className="w-3 h-3 text-rose-400" />,
      label: `${selectedCategory} Nodes`,
      color: 'bg-rose-400'
    },
    { 
      type: 'marker',
      show: true, // Always show default if pins are on
      icon: <Sparkles className="w-3 h-3 text-amber-400" />,
      label: 'AI Insights',
      color: 'bg-amber-400'
    },
    { 
      type: 'marker',
      show: true,
      icon: <Users className="w-3 h-3 text-indigo-400" />,
      label: 'Network Nodes',
      color: 'bg-indigo-400'
    },
    { 
      type: 'line',
      show: itinerary.length > 0,
      icon: <div className="w-4 h-0.5 bg-rose-500 rounded-full" />,
      label: 'Active Trajectory',
      color: 'bg-rose-500'
    },
    { 
      type: 'line',
      show: showTraffic,
      icon: <div className="flex gap-0.5 items-center"><div className="w-2 h-0.5 bg-emerald-500 rounded-full" /><div className="w-1.5 h-0.5 bg-amber-500 rounded-full" /><div className="w-1 h-0.5 bg-rose-500 rounded-full" /></div>,
      label: 'Traffic Flow',
      color: 'bg-slate-400'
    },
    { 
      type: 'status',
      show: showWeatherLayer || activeWeather !== null,
      icon: <Cloud className="w-3 h-3 text-sky-400" />,
      label: activeWeather || 'Atmosphere',
      color: 'bg-sky-400'
    },
    {
      type: 'status',
      show: mapAesthetic !== 'none',
      icon: <Layers className="w-3 h-3 text-purple-400" />,
      label: `${mapAesthetic.charAt(0).toUpperCase() + mapAesthetic.slice(1)} Mode`,
      color: 'bg-purple-400'
    }
  ].filter(item => item.show);

  if (activeIndicators.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[90] flex flex-col items-end gap-2">
      <motion.div 
        layout
        className="bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
              Legend
            </span>
          </div>
          {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronUp className="w-3 h-3 text-slate-500" />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/5 p-3 space-y-2.5"
            >
              {activeIndicators.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              ))}
              
              <div className="pt-2 mt-2 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-1.5 rounded-full bg-slate-800 border border-white/5 shrink-0" />
                  <span className="text-[8px] font-medium text-slate-500 tracking-wider">Passive Objects</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Quick Status Pill (Only if collapsed) */}
      {!isExpanded && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-1.5"
        >
          {activeIndicators.slice(0, 3).map((item, idx) => (
            <div key={idx} className="w-1.5 h-1.5 rounded-full border border-black/50 shadow-sm" style={{ backgroundColor: item.color.replace('bg-', '') }} />
          ))}
          {activeIndicators.length > 3 && (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 border border-black/50" />
          )}
        </motion.div>
      )}
    </div>
  );
}

