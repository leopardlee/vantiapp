import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Calendar, MapPin, Coffee, Info, ChevronRight, X, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { CostDonutChart } from './CostDonutChart';

interface ItineraryStop {
  name: string;
  time: string;
  reason: string;
}

interface ItineraryDay {
  day: number;
  theme: string;
  stops: ItineraryStop[];
  culturalTip: string;
  estimatedBudget: number;
}

interface ItineraryResponse {
  title: string;
  days: ItineraryDay[];
  overallSummary: string;
}

interface SmartPlannerProps {
  bookmarks: any[];
  travelHistory: any[];
  onClose: () => void;
}

export const SmartPlanner = ({ bookmarks, travelHistory, onClose }: SmartPlannerProps) => {
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateItinerary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/smart-planner/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookmarks,
          travelHistory,
          preferences: { travelMood: 'exploration' }
        })
      });

      if (!response.ok) throw new Error('Failed to generate plan');
      const data = await response.json();
      setItinerary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const budgetBreakdown = useMemo(() => {
    if (!itinerary) return [];
    const total = itinerary.days.reduce((acc, day) => acc + day.estimatedBudget, 0);
    // Categorize: Food (35%), Lodging (45%), Transit (20%)
    return [
      { label: 'Lodging', value: total * 0.45, color: '#6366f1' },
      { label: 'Food', value: total * 0.35, color: '#f59e0b' },
      { label: 'Transit', value: total * 0.20, color: '#10b981' }
    ];
  }, [itinerary]);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ 
        type: 'spring', 
        damping: 30, 
        stiffness: 120,
        mass: 1,
        restDelta: 0.001
      }}
      className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0f1117] border-l border-white/10 z-[100] flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-transparent">
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="p-2 rounded-xl bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Smart Planner</h2>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Powered by Gemini 3.5</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {!itinerary && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-indigo-400 opacity-50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white leading-tight">Ready for your next adventure?</h3>
              <p className="text-sm text-slate-400 max-w-[280px] mx-auto">
                VANTi will analyze your bookmarked locations and travel history to curate a personalized 3-day experience.
              </p>
            </div>
            <button
              onClick={generateItinerary}
              className="px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95"
            >
              Analyze & Generate
            </button>
          </motion.div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-10 h-10 text-indigo-500" />
            </motion.div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">Synthesizing Travel Data...</p>
              <p className="text-xs text-slate-500 font-medium">Clustering bookmarks and optimizing routes</p>
            </div>
          </div>
        )}

        {itinerary && (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="space-y-8 pb-12"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-2">
              <h1 className="text-3xl font-black text-white leading-tight tracking-tighter">{itinerary.title}</h1>
              <p className="text-sm text-slate-400 font-medium italic">"{itinerary.overallSummary}"</p>
            </motion.div>

            {/* Aesthetic Budget Dashboard */}
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-6">
                 <TrendingUp className="w-4 h-4 text-indigo-400" />
                 <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Financial Breakdown</span>
              </div>
              <CostDonutChart data={budgetBreakdown} />
            </motion.div>

            <div className="space-y-6">
              {itinerary.days.map((day) => (
                <motion.div
                  key={day.day}
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-black text-indigo-500/20">0{day.day}</span>
                      <h4 className="text-lg font-bold text-white">{day.theme}</h4>
                    </div>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">${day.estimatedBudget} Est.</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {day.stops.map((stop, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center pt-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          {idx !== day.stops.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-white uppercase tracking-wider">{stop.name}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{stop.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">{stop.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex gap-3">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Cultural Tip</span>
                      <p className="text-[10px] text-slate-300 font-medium leading-normal">{day.culturalTip}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              onClick={() => setItinerary(null)}
              className="w-full py-4 border border-white/5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white/5 transition-colors"
            >
              Start New Generation
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
