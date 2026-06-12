import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
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
  Bus,
  Footprints,
  Compass,
  Archive,
  Eye,
  Clock
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
  const viewportLandmarks = useVantiStore((state) => state.viewportLandmarks || []);
  const setActiveSmartItinerary = useVantiStore((state) => state.setActiveSmartItinerary);
  const t = useVantiStore((state) => state.t);

  // Navigational tab state
  const [aiTab, setAITab] = useState<'itinerary' | 'radar' | 'archive'>('itinerary');

  // Archive state
  const [archivedItineraries, setArchivedItineraries] = useState<any[]>([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  const fetchArchive = async () => {
    if (!auth.currentUser) return;
    setIsArchiveLoading(true);
    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'smart_itineraries'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const items: any[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setArchivedItineraries(items);
    } catch (e) {
      console.error("Error fetching arcvhive:", e);
    } finally {
      setIsArchiveLoading(false);
    }
  };

  useEffect(() => {
    if (aiTab === 'archive') {
      fetchArchive();
    }
  }, [aiTab]);

  // Daily Itinerary variables
  const [days, setDays] = useState<number>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Food & Cafes', 'Historic Sites']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [itineraryResult, setItineraryResult] = useState<any | null>(null);

  useEffect(() => {
    if (showAITripSidebar) {
      const fetchInterests = async () => {
        if (auth.currentUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.interests && data.interests.length > 0) {
                // Map frontend interest IDs back to full labels if desired, or just use as is
                setSelectedInterests(data.interests);
              }
            }
          } catch (e) {
            console.error("Error fetching interests:", e);
          }
        }
      };
      fetchInterests();
    }
  }, [showAITripSidebar]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Viewport radar variables
  const [isAnalyzingViewport, setIsAnalyzingViewport] = useState<boolean>(false);
  const [viewportAnalysis, setViewportAnalysis] = useState<any | null>(null);

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
      setActiveSmartItinerary(data);
      
      // Save to archive if authenticated
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'users', auth.currentUser.uid, 'smart_itineraries'), {
            ...data,
            daysCount: days,
            interests: selectedInterests,
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to archive itinerary:", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to fetch optimized travel itinerary. Utilizing smart local fallbacks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeViewport = async () => {
    setIsAnalyzingViewport(true);
    setViewportAnalysis(null);
    
    const viewportParam = mapViewport || {
      center: { lat: 37.5665, lng: 126.9780 },
      zoom: 13
    };

    try {
      const response = await fetch('/api/analyze-viewport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center: viewportParam.center,
          zoom: viewportParam.zoom,
          viewportPois: viewportLandmarks.map((l: any) => ({
            name: l.name,
            lat: l.position?.lat,
            lng: l.position?.lng
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        setViewportAnalysis(data);
      } else {
        throw new Error();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingViewport(false);
    }
  };

  const handleFocusPlace = (lat: number, lng: number, name: string) => {
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
      timeSlot: act.timeSlot || "Flexible",
      formattedAddress: act.description
    };
    addToItinerary(newStop);
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleGetDirections = (act: any) => {
    setSelectedPlace({
      id: `routing-dest-${Date.now()}`,
      displayName: act.placeName,
      name: act.placeName,
      lat: act.lat,
      lng: act.lng,
      location: { lat: act.lat, lng: act.lng }
    });
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
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    VANTi Intelligent AI
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Gemini-powered viewport exploration</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAITripSidebar(false)}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all border border-white/5"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Sub tabs selector */}
              <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setAITab('itinerary')}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    aiTab === 'itinerary' ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/10" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Planner</span>
                </button>
                <button
                  onClick={() => setAITab('radar')}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    aiTab === 'radar' ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/10" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Radar</span>
                </button>
                <button
                  onClick={() => setAITab('archive')}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    aiTab === 'archive' ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/10" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Archive</span>
                </button>
              </div>
            </div>

            {/* Content Core Scroll Area */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-6 space-y-6">
              
              {/* TAB 3: ARCHIVE */}
              {aiTab === 'archive' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Archive className="w-4 h-4 text-purple-400" />
                    <h3 className="text-white text-sm font-bold tracking-tight">Smart Itinerary Archive</h3>
                  </div>
                  {isArchiveLoading ? (
                    <div className="flex-col items-center justify-center py-6 flex">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-3" />
                      <span className="text-xs text-slate-500">Loading history...</span>
                    </div>
                  ) : archivedItineraries.length === 0 ? (
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
                      <p className="text-slate-400 text-xs">No saved itineraries found. Generate one in the Planner tab.</p>
                    </div>
                  ) : (
                    archivedItineraries.map((itinerary, i) => (
                      <div key={itinerary.id} className="bg-white/5 rounded-xl border border-white/10 p-4 transition-all hover:bg-white/10 flex flex-col gap-2">
                         <div className="flex justify-between items-start">
                           <span className="text-xs font-bold text-white">Smart Plan - {itinerary.daysCount} Days</span>
                           <span className="text-[10px] text-slate-500 border border-slate-700 px-1.5 rounded">{itinerary.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}</span>
                         </div>
                         <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase font-mono text-slate-400">
                           {itinerary.interests?.map((int: any) => (
                             <span key={int} className="bg-slate-900 px-1.5 rounded text-purple-400">{int}</span>
                           ))}
                         </div>
                         {/* Toggle visibility */}
                         <button 
                           onClick={() => {
                             setActiveSmartItinerary(itinerary);
                             setItineraryResult(itinerary);
                             setAITab('itinerary');
                           }}
                           className="mt-2 w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold border border-purple-500/30 flex justify-center items-center gap-2 transition-colors"
                         >
                           <Eye className="w-3.5 h-3.5" /> View on Map
                         </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 1: SMART PLANNER */}
              {aiTab === 'itinerary' && (
                <>
                  {!itineraryResult && !isLoading && (
                    <div className="space-y-6">
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
                                  ? "bg-purple-600 border-purple-400 text-white shadow-lg" 
                                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white"
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
                                    : "bg-slate-950/40 border-slate-800/80 text-slate-400"
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
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Daily Itinerary
                      </motion.button>
                    </div>
                  )}

                  {isLoading && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center justify-center py-6 border border-white/5 rounded-2xl bg-white/[0.01]">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                        <span className="text-xs uppercase font-mono font-bold text-slate-400 tracking-widest">Querying Gemini Node</span>
                        <span className="text-[10px] text-slate-500 mt-1">Designing personalized landmarks...</span>
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex flex-col gap-2">
                      <span>{errorMsg}</span>
                      <button onClick={handleGenerate} className="text-left font-bold text-rose-400 hover:underline">
                        Retry Generation
                      </button>
                    </div>
                  )}

                  {itineraryResult && !isLoading && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">Suggested Plan ({days} Days)</span>
                        <button
                          onClick={() => {
                            setItineraryResult(null);
                            setActiveSmartItinerary(null);
                          }}
                          className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Configure New Plan
                        </button>
                      </div>

                      <div className="space-y-6">
                        {itineraryResult.days?.map((day: any) => (
                          <div key={day.dayNumber} className="space-y-4">
                            <div className="flex items-center gap-2.5 pb-1 border-b border-white/5">
                              <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-xs font-black flex items-center justify-center">
                                {day.dayNumber}
                              </div>
                              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{day.title || `Day ${day.dayNumber}`}</h3>
                            </div>

                            <div className="space-y-4 relative border-l-2 border-dashed border-slate-800 ml-3ml pl-5">
                              {day.activities?.map((act: any, idx: number) => (
                                <div key={idx} className="relative group">
                                  <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-purple-500 group-hover:bg-purple-500 transition-colors" />

                                  <div className="p-4 rounded-xl bg-slate-950 border border-white/5 hover:border-purple-500/30 transition-all flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-[10px] font-mono text-purple-400 uppercase font-bold">
                                      <span>{act.timeSlot}</span>
                                      <button onClick={() => handleFocusPlace(act.lat, act.lng, act.placeName)} className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>Recenter</span>
                                      </button>
                                    </div>
                                    <h4 className="text-xs font-black text-white">{act.placeName}</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">{act.description}</p>

                                    {act.transitRecommendation && (
                                      <div className="text-[10px] text-amber-400/90 font-mono mt-1 bg-amber-500/5 px-2.5 py-1.5 rounded border border-amber-500/10 flex items-center gap-2">
                                        <Bus className="w-3.5 h-3.5 shrink-0" />
                                        <span>{act.transitRecommendation}</span>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 mt-1">
                                      <button onClick={() => handleAddStopToTrip(act)} className="py-1.5 rounded-lg bg-slate-900 text-slate-300 text-[10px] font-bold flex items-center justify-center gap-1">
                                        <Plus className="w-3 h-3" />
                                        Add Stop
                                      </button>
                                      <button onClick={() => handleGetDirections(act)} className="py-1.5 rounded-lg bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center justify-center gap-1">
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

                      {itineraryResult.summary && (
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
                          <h4 className="text-[10px] font-mono uppercase font-bold text-purple-400 tracking-wider mb-1.5">Advisor Insight</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{itineraryResult.summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: LIVE POI RADAR */}
              {aiTab === 'radar' && (
                <div className="space-y-6">
                  {/* Viewport Info */}
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                    <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] font-bold tracking-wider uppercase mb-1">
                      <Compass className="w-4 h-4 animate-spin [animation-duration:12s]" />
                      <span>Live Viewport Telemetry</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Visible Map POIs discovered near screen center: <strong className="text-white font-black">{viewportLandmarks.length} landmarks</strong>.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Gemini will analyze coordinates, sequence optimized walking vectors, and calculate scenic walking segments.
                    </p>
                  </div>

                  {/* Trigger Radar */}
                  {!viewportAnalysis && !isAnalyzingViewport && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyzeViewport}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Deconstruct Viewport & Suggest Walking Route
                    </motion.button>
                  )}

                  {isAnalyzingViewport && (
                    <div className="flex flex-col items-center justify-center py-8 border border-white/5 rounded-2xl bg-[#0c1015] gap-3">
                      <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 animate-pulse">Running Viewport Path Solver...</span>
                    </div>
                  )}

                  {viewportAnalysis && !isAnalyzingViewport && (
                    <div className="space-y-6">
                      {/* Vibe Recap summary */}
                      <div className="p-4 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/20">
                        <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest font-black block mb-1">Sector Atmosphere</span>
                        <p className="text-xs text-slate-200 leading-relaxed italic">
                          "{viewportAnalysis.localVibeSummary}"
                        </p>
                      </div>

                      {/* walking stats route banner */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-white/5 rounded-xl text-center">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Est. Duration</span>
                          <span className="text-base font-black font-mono text-indigo-400">{viewportAnalysis.walkingPath?.totalDurationMinutes} mins</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Total Distance</span>
                          <span className="text-base font-black font-mono text-indigo-400">{viewportAnalysis.walkingPath?.totalDistanceMeters} meters</span>
                        </div>
                      </div>

                      {/* Suggested walk details */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[10px] uppercase font-bold pb-2 border-b border-white/5">
                          <Footprints className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Walking Leg Directives</span>
                        </div>

                        <div className="space-y-3 relative border-l-2 border-indigo-950 ml-2.5 pl-4">
                          {viewportAnalysis.walkingPath?.steps?.map((step: any, idx: number) => (
                            <div key={idx} className="relative group">
                              <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-900 border-2 border-indigo-500" />
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-100">{step.instruction}</span>
                                <div className="text-[9px] text-[10px] text-slate-400 font-mono flex items-center justify-between pb-1">
                                  <span className="text-indigo-400 font-black">{step.durationMinutes} mins</span>
                                  {step.scenicNote && <span className="text-amber-400 italic">★ {step.scenicNote}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations POIs */}
                      <div className="space-y-4">
                        <div className="text-slate-300 font-mono text-[10px] uppercase font-bold pb-1 border-b border-white/5">
                          Geomorphic POI Matches
                        </div>

                        <div className="space-y-3">
                          {viewportAnalysis.recommendations?.map((item: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl hover:border-indigo-500/20 transition-all flex flex-col gap-1.5">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-bold text-white leading-tight">{item.placeName}</h4>
                                <button
                                  onClick={() => handleFocusPlace(item.lat, item.lng, item.placeName)}
                                  className="text-[9px] uppercase font-mono font-black text-indigo-400 tracking-wider hover:text-white flex items-center gap-0.5 shrink-0"
                                >
                                  <Navigation className="w-2.5 h-2.5" />
                                  Recenter
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setViewportAnalysis(null)}
                        className="w-full text-center py-2.5 text-xs text-slate-400 hover:text-white border border-white/5 rounded-xl font-bold transition-all hover:bg-white/5"
                      >
                        Reset Views & Re-Scan Grid
                      </button>
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
