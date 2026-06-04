import React from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { 
  Trash2, 
  GripVertical, 
  MapPin, 
  Calendar, 
  Navigation, 
  Clock, 
  X, 
  Sparkles,
  ChevronRight,
  Route
} from 'lucide-react';
import { cn } from '../lib/utils';

export function MyTripSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const itinerary = useVantiStore((state) => state.itinerary);
  const removeFromItinerary = useVantiStore((state) => state.removeFromItinerary);
  const reorderItinerary = useVantiStore((state) => state.reorderItinerary);
  const setItinerary = useVantiStore((state) => state.setItinerary);
  const t = useVantiStore((state) => state.t);

  const handleReorder = (newOrder: any[]) => {
    const currentIds = itinerary.map(p => p.id).join(',');
    const newIds = newOrder.map(p => p.id).join(',');
    if (currentIds !== newIds) {
      setItinerary(newOrder);
    }
  };

  const calculateTotalDistance = () => {
    // Simulated calculation for demo
    return (itinerary.length * 2.4).toFixed(1);
  };

  const calculateTotalDuration = () => {
    // Simulated duration (min)
    return itinerary.length * 15;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[180] md:hidden pointer-events-auto"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:w-[380px] bg-[#0c0e12]/95 backdrop-blur-2xl border-l border-white/10 z-[190] flex flex-col shadow-2xl pointer-events-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  {t('planner.title')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{t('planner.subtitle')}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-slate-800">
              {itinerary.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">
                    {t('planner.empty')}
                  </p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={itinerary}
                  onReorder={handleReorder}
                  className="space-y-3"
                >
                  {itinerary.map((place, index) => (
                    <Reorder.Item
                      key={place.id}
                      value={place}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300, delay: index * 0.05 }}
                      className="group relative bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-colors cursor-grab active:cursor-grabbing"
                    >
                      {/* Chronological Indicator */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0c0e12] border border-white/10 flex items-center justify-center text-[10px] font-black font-mono text-rose-500 z-10">
                        {index + 1}
                      </div>

                      {/* Rank/Drag Handle */}
                      <div className="shrink-0 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-slate-500" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 ml-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {place.displayName || place.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold truncate">
                            {place.types?.[0]?.replace(/_/g, ' ') || 'Point of Interest'}
                          </span>
                          {index > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                              <Navigation className="w-2.5 h-2.5 rotate-45" />
                              ~1.2km
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromItinerary(place.id);
                        }}
                        className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>

            {/* Summary / Footer */}
            {itinerary.length > 0 && (
              <div className="p-6 bg-white/[0.02] border-t border-white/5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Distance</div>
                    <div className="text-lg font-black font-mono text-white">
                      {calculateTotalDistance()}
                      <span className="text-[10px] ml-1 text-slate-500 uppercase">km</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Travel Time</div>
                    <div className="text-lg font-black font-mono text-white">
                      {calculateTotalDuration()}
                      <span className="text-[10px] ml-1 text-slate-500 uppercase">min</span>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-rose-500 hover:bg-rose-400 text-white h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(244,63,94,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3 group">
                  <Route className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Generate Optimized Path
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
