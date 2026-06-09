import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { 
  X, 
  Sparkles, 
  Check, 
  Calendar, 
  MapPin, 
  Plus, 
  Navigation, 
  Info,
  Coffee,
  Landmark,
  Mountain,
  Palette,
  Tag,
  Loader2,
  ChevronRight,
  TrendingUp,
  Bus
} from 'lucide-react';
import { cn } from '../lib/utils';

import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export function AITravelPlannerSidebar() {
  const { isNarrow } = useResponsiveLayout();
  const showAITripSidebar = useVantiStore((state) => state.showAITripSidebar);
  const setShowAITripSidebar = useVantiStore((state) => state.setShowAITripSidebar);
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const addToItinerary = useVantiStore((state) => state.addToItinerary);
  const setRoutingOrigin = useVantiStore((state) => state.setRoutingOrigin);
  const setSelectedPlace = useVantiStore((state) => state.setSelectedPlace);
  const recenterToUser = useVantiStore((state) => state.recenterToUser);
  const t = useVantiStore((state) => state.t);

  const [days, setDays] = useState<number>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Food & Cafes', 'Historic Sites']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [itineraryResult, setItineraryResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const interestsList = [
    { name: 'Food & Cafes', icon: Coffee, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    { name: 'Historic Sites', icon: Landmark, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { name: 'Nature & Parks', icon: Mountain, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    { name: 'Art & Culture', icon: Palette, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    { name: 'Shopping', icon: Tag, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' }
  ];

  const toggleInterest = (name: string) => {
    if (selectedInterests.includes(name)) {
      setSelectedInterests(selectedInterests.filter(item => item !== name));
    } else {
      setSelectedInterests([...selectedInterests, name]);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setItineraryResult(null);

    // Get current viewport center
    const viewportParam = mapViewport || {
      center: { lat: 37.5665, lng: 126.9780 }, // Seoul default
      zoom: 12,
      bounds: null
    };

    try {
      const response = await fetch('/api/ai-itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewport: viewportParam,
          interests: selectedInterests,
          days: days
        })
      });

      if (!response.ok) {
        throw new Error('Server returned error response');
      }

      const data = await response.json();
      setItineraryResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to fetch optimized travel itinerary. Utilizing smart local fallbacks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocusPlace = (lat: number, lng: number, name: string) => {
    // Recenter map & set selected place context
    recenterToUser(lat, lng);
    setSelectedPlace({
      id: `ai-poi-${Date.now()}`,
      displayName: name,
      name: name,
      lat,
      lng,
      formattedAddress: `AI Suggested Location`
    });
  };

  const handleAddStopToTrip = (act: any) => {
    const newStop = {
      id: `ai-stop-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      displayName: act.placeName,
      name: act.placeName,
      lat: act.lat,
      lng: act.lng,
      types: ['ai_suggested'],
      timeSlot: act.timeSlot,
      formattedAddress: act.description
    };
    addToItinerary(newStop);
    
    // Add tactile vibration if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleGetDirections = (act: any) => {
    // Set as destination
    setSelectedPlace({
      id: `routing-dest-${Date.now()}`,
      displayName: act.placeName,
      name: act.placeName,
      lat: act.lat,
      lng: act.lng,
      location: { lat: act.lat, lng: act.lng }
    });
    // Trigger map routing
    useVantiStore.setState({ activeMode: 'all' });
  };

  return (
    <AnimatePresence>
      {showAITripSidebar && (
        <>
          {/* Backdrop for mobile overlays */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAITripSidebar(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[180] md:hidden pointer-events-auto"
          />

          <motion.div
            initial={isNarrow ? { y: '100%', x: 0 } : { x: '100%', y: 0 }}
            animate={isNarrow ? { y: 0, x: 0 } : { x: 0, y: 0 }}
            exit={isNarrow ? { y: '100%', x: 0 } : { x: '100%', y: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 210 }}
            className={cn(
              "fixed bg-[#0c0e12]/95 backdrop-blur-2xl border-white/10 z-[190] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto font-sans",
              isNarrow 
                ? "bottom-0 left-0 right-0 h-[80vh] w-full rounded-t-[32px] border-t" 
                : "top-0 right-0 h-full w-full md:w-[410px] border-l"
            )}
          >
            {/* Drag Handle for Bottom Sheet on mobile */}
            {isNarrow && (
              <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-white/10 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  AI Smart Planner
                </h2>
                <p className="text-xs text-slate-400 mt-1">Gemini-powered personalized itineraries</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAITripSidebar(false)}
                className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all border border-transparent hover:border-white/5"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content Core Scroll Area */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-6 space-y-6">
              {/* Controls Form if no content loaded */}
              {!itineraryResult && !isLoading && (
                <div className="space-y-6">
                  {/* Viewport Info Callout */}
                  <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-start gap-3">
                    <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-300 leading-relaxed">
                      Your itinerary will be tailored dynamically based on your **current map view** center. Pan or zoom the map to fine-tune your preferred area before generating.
                    </div>
                  </div>

                  {/* Days Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                      Trip Duration
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                       {[1, 2, 3, 5].map((d) => (
                        <motion.button
                          key={d}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setDays(d)}
                          className={cn(
                            "py-2.5 rounded-xl text-xs font-bold transition-all border",
                            days === d 
                              ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20" 
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                          )}
                        >
                          {d} {d === 1 ? 'Day' : 'Days'}
                        </motion.button>
                       ))}
                    </div>
                  </div>

                  {/* Interests Multi-Selector */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                      Match Your Interests
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {interestsList.map((item) => {
                        const Icon = item.icon;
                        const isSelected = selectedInterests.includes(item.name);
                        return (
                          <motion.button
                            key={item.name}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleInterest(item.name)}
                            className={cn(
                              "px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all",
                              isSelected 
                                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                                : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 text-purple-400" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trigger Action */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    disabled={selectedInterests.length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Daily Itinerary
                  </motion.button>
                </div>
              )}

              {/* Shimmer/Skeleton loading screen */}
              {isLoading && (
                <div className="space-y-6">
                  {/* Scanning Header Radar Shimmer */}
                  <div className="flex flex-col items-center justify-center py-6 border border-white/5 rounded-2xl bg-white/[0.01] relative overflow-hidden">
                    <div className="absolute inset-0 vanti-skeleton-shimmer" />
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                    <span className="text-xs uppercase font-mono font-bold text-slate-400 tracking-widest">Querying Gemini Node</span>
                    <span className="text-[10px] text-slate-500 mt-1">Designing personalized landmarks...</span>
                  </div>

                  {/* Day activity skeletons */}
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border border-white/5 rounded-2xl space-y-3 bg-slate-900/40 relative overflow-hidden">
                      <div className="absolute inset-0 vanti-skeleton-shimmer" />
                      <div className="h-4 w-28 bg-slate-800 rounded mb-2" />
                      <div className="h-10 w-full bg-slate-800/60 rounded" />
                      <div className="h-6 w-3/4 bg-slate-850 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error Callout */}
              {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex flex-col gap-2">
                  <span>{errorMsg}</span>
                  <button 
                    onClick={handleGenerate} 
                    className="text-left font-bold text-rose-400 hover:underline mt-1"
                  >
                    Retry Generation
                  </button>
                </div>
              )}

              {/* Results display */}
              {itineraryResult && !isLoading && (
                <div className="space-y-6">
                  {/* Reset controls button */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 font-mono">Suggested Plan ({days} Days)</span>
                    <button
                      onClick={() => setItineraryResult(null)}
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Configure New Plan
                    </button>
                  </div>

                  {/* Daily plans accordion/list */}
                  <div className="space-y-6">
                    {itineraryResult.days?.map((day: any) => (
                      <div key={day.dayNumber} className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-1 border-b border-white/5">
                          <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-xs font-black flex items-center justify-center">
                            {day.dayNumber}
                          </div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{day.title || `Day ${day.dayNumber}`}</h3>
                        </div>

                        <div className="space-y-4 relative border-l-2 border-dashed border-slate-800 ml-3.5 pl-5">
                          {day.activities?.map((act: any, idx: number) => (
                            <div key={idx} className="relative group">
                              {/* Connector dot */}
                              <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-purple-500 group-hover:bg-purple-500 transition-colors" />

                              <div className="p-4 rounded-xl bg-slate-950 border border-white/5 group-hover:border-purple-500/30 transition-all duration-300 flex flex-col gap-2">
                                {/* Time & Map pin */}
                                <div className="flex justify-between items-center text-[10px] font-mono text-purple-400 uppercase font-bold">
                                  <span>{act.timeSlot}</span>
                                  <button
                                    onClick={() => handleFocusPlace(act.lat, act.lng, act.placeName)}
                                    className="flex items-center gap-1 hover:text-white transition-colors"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    <span>Recenter</span>
                                  </button>
                                </div>

                                {/* Place name */}
                                <h4 className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">
                                  {act.placeName}
                                </h4>

                                {/* Activity details */}
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  {act.description}
                                </p>

                                {/* Transit advice */}
                                {act.transitRecommendation && (
                                  <div className="text-[10px] text-amber-400/90 font-mono mt-1 bg-amber-500/5 px-2.5 py-1.5 rounded border border-amber-500/10 flex items-center gap-2">
                                    <Bus className="w-3.5 h-3.5 shrink-0" />
                                    <span>{act.transitRecommendation}</span>
                                  </div>
                                )}

                                {/* Card actions */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 mt-1">
                                  <button
                                    onClick={() => handleAddStopToTrip(act)}
                                    className="py-1.5 rounded-lg bg-slate-900 hover:bg-purple-500/10 text-slate-300 hover:text-purple-300 border border-white/5 hover:border-purple-500/20 text-[10px] font-bold flex items-center justify-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Stop
                                  </button>
                                  <button
                                    onClick={() => handleGetDirections(act)}
                                    className="py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[10px] font-bold flex items-center justify-center gap-1"
                                  >
                                    <Navigation className="w-3 h-3" />
                                    Get Directions
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Box */}
                  {itineraryResult.summary && (
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
                      <h4 className="text-[10px] font-mono uppercase font-bold text-purple-400 tracking-wider mb-1.5">Advisor Insight</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{itineraryResult.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
