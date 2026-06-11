import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { ChevronUp, Landmark, Star, Sparkles, MapPin, X, Activity, History, ArrowRight, Mic, Camera, MessageCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { saveItem } from '../lib/indexedDb';
import { HealthSafetyDashboard } from './HealthSafetyDashboard';

interface QuickViewBottomSheetProps {
  lat?: number;
  lng?: number;
  locationName?: string;
  triggerHaptic: (type: 'tap' | 'switch' | 'success' | 'close' | 'impact') => void;
}

interface SavedJourney {
  id: string;
  name: string;
  origin: string;
  destination: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  lastTaken: number;
}

export function QuickViewBottomSheet({ lat, lng, locationName, triggerHaptic }: QuickViewBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHalfOpen, setIsHalfOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recentJourneys, setRecentJourneys] = useState<SavedJourney[]>([]);
  const communityMoments = useVantiStore(state => state.communityMoments);
  const setCommunityMoments = useVantiStore(state => state.setCommunityMoments);

  useEffect(() => {
    const q = query(collection(db, 'communityMoments'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCommunityMoments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore communityMoments listener error: ", error);
    });
    return () => unsubscribe();
  }, [setCommunityMoments]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    const audioChunks: Blob[] = [];
    recorder.ondataavailable = (e) => audioChunks.push(e.data);
    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await fetch('/api/voice-transcript', {
            method: 'POST',
            body: JSON.stringify({ audioBase64: base64Audio }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log("Transcribed:", data.text);
        // Note: For actual integration, you'd update a state with the transcript
      };
    };
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };
  
  const stopRecording = () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
    }
  }

  const dragControls = useDragControls();
  const latRef = React.useRef(lat);
  const lngRef = React.useRef(lng);

  useEffect(() => {
    latRef.current = lat;
    lngRef.current = lng;
  }, [lat, lng]);

  useEffect(() => {
    // Load recent journeys from local storage or set defaults
    const saved = localStorage.getItem('vanti_recent_journeys');
    if (saved) {
      setRecentJourneys(JSON.parse(saved));
    } else {
      const defaults: SavedJourney[] = [
        { id: '1', name: 'Commute to Office', origin: 'Home', destination: 'Tech Park', timeOfDay: 'Morning', lastTaken: Date.now() - 86400000 },
        { id: '2', name: 'Lunch Run', origin: 'Tech Park', destination: 'Street Food Alley', timeOfDay: 'Afternoon', lastTaken: Date.now() - 86400000 * 2 },
        { id: '3', name: 'Evening Stroll', origin: 'Home', destination: 'River Walkway', timeOfDay: 'Evening', lastTaken: Date.now() - 86400000 * 3 },
      ];
      localStorage.setItem('vanti_recent_journeys', JSON.stringify(defaults));
      setRecentJourneys(defaults);
    }
  }, []); // Run only once on mount

  useEffect(() => {
    if (recentJourneys.length === 0) return;
    
    // Save to cache
    saveItem('itineraryData', {
      id: `${latRef.current}-${lngRef.current}`,
      timestamp: Date.now(),
      recentJourneys
    });
  }, [recentJourneys]);

  const suggestedJourneys = useMemo(() => {
    const currentHour = new Date().getHours();
    let currentPhase = 'Night';
    if (currentHour >= 5 && currentHour < 12) currentPhase = 'Morning';
    else if (currentHour >= 12 && currentHour < 17) currentPhase = 'Afternoon';
    else if (currentHour >= 17 && currentHour < 21) currentPhase = 'Evening';

    return recentJourneys
      .filter(j => j.timeOfDay === currentPhase)
      .sort((a, b) => b.lastTaken - a.lastTaken)
      .slice(0, 2);
  }, [recentJourneys]);

  // Mocking AI cultural highlights based on coordinates or simply returning a generic set
  const highlights = [
    { title: "Local Architecture", description: "This area is known for blending neo-futuristic designs with brutalist aesthetics.", icon: Landmark, color: "text-amber-400", bg: "bg-amber-400/10" },
    { title: "Culinary Highlights", description: "Don't miss the street food alleyways active mostly after 8 PM.", icon: Star, color: "text-rose-400", bg: "bg-rose-400/10" },
    { title: "Hidden Gem", description: "A multi-level underground kinetic art museum is 200m away.", icon: Sparkles, color: "text-indigo-400", bg: "bg-indigo-400/10" }
  ];

  const travelTips = [
    "Navigate primarily via the green-line transit system during rush hours.",
    "Most street vendors prefer local digital wallets over cash.",
    "Keep umbrella handy; micro-climates here shift quickly."
  ];

  const elevationData = [
    { distance: '0km', elevation: 120, calories: 0 },
    { distance: '1km', elevation: 145, calories: 85 },
    { distance: '2km', elevation: 180, calories: 190 },
    { distance: '3km', elevation: 150, calories: 280 },
    { distance: '4km', elevation: 130, calories: 350 },
    { distance: '5km', elevation: 165, calories: 430 }
  ];

  const handleDragEnd = (event: any, info: any) => {
    const yOffset = info.offset.y;
    const velocity = info.velocity.y;

    if (velocity > 500 || yOffset > 100) {
      if (isHalfOpen) {
        setIsOpen(false);
        setIsHalfOpen(false);
        triggerHaptic('impact');
      } else {
        setIsHalfOpen(true);
        triggerHaptic('impact');
      }
    } else if (velocity < -500 || yOffset < -100) {
      if (!isHalfOpen) {
        setIsHalfOpen(false);
        setIsOpen(true);
        triggerHaptic('impact');
      }
    }
  };

  const openSheet = () => {
    setIsOpen(true);
    setIsHalfOpen(false);
    triggerHaptic('switch');
  };
  
  const closeSheet = () => {
    setIsOpen(false);
    setIsHalfOpen(false);
    triggerHaptic('close');
  };

  if (!lat || !lng) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && !isHalfOpen && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={openSheet}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-32 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#121620]/80 backdrop-blur-3xl border border-white/20 text-white shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center gap-3 active:scale-95 transition-transform pointer-events-auto group"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 group-hover:animate-spin-slow" />
            <span className="text-sm font-bold tracking-tight">Quick Insights</span>
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isOpen || isHalfOpen) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] pointer-events-auto"
            />
            
            <motion.div
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: isHalfOpen ? '45%' : '0%' }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[260] bg-[#0b0d17]/95 backdrop-blur-3xl border-t border-white/20 rounded-t-[40px] pointer-events-auto flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.7)] pt-2 h-[85vh] md:h-[60vh] max-w-2xl mx-auto md:bottom-4 md:rounded-[40px] md:border md:left-1/2 md:-translate-x-1/2"
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing mb-2 touch-none">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] scrollbar-hide">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <MapPin className="w-4 h-4 text-indigo-400" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-[#a5b4fc]">AI Location Scan</h3>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">{locationName || 'Current Sector'}</h2>
                  </div>
                  <button onClick={closeSheet} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={isRecording ? stopRecording : startRecording} 
                    className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", isRecording ? "bg-rose-500 text-white animate-pulse" : "bg-white/10 text-slate-300 hover:text-white")}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Recent Journeys */}
                  {suggestedJourneys.length > 0 && (
                    <section>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" /> Suggested Journeys
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {suggestedJourneys.map(journey => (
                          <button key={journey.id} onClick={() => triggerHaptic('success')} className="bg-[#1a1f2e]/80 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors rounded-3xl p-4 flex items-center justify-between group active:scale-[0.98]">
                            <div className="text-left flex-1">
                              <h5 className="text-base font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{journey.name}</h5>
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                <span>{journey.origin}</span>
                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                <span>{journey.destination}</span>
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <ArrowRight className="w-5 h-5 text-indigo-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Cultural Highlights */}
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Landmark className="w-4 h-4" /> Cultural Highlights
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {highlights.map((item, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex gap-4 items-start">
                          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", item.bg, item.color)}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-base font-bold text-white mb-1.5">{item.title}</h5>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Route Fitness Summary */}
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Activity className="w-4 h-4" /> Route Terrain & Fitness Profile
                    </h4>
                    <div className="bg-[#0f121d]/80 border border-white/5 rounded-3xl p-5 shadow-inner">
                      <div className="flex justify-between items-end mb-6">
                        <div>
                           <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Impact</p>
                           <p className="text-2xl font-black text-rose-400">430 <span className="text-sm text-slate-500 font-medium tracking-normal">kcal</span></p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Max Elevation</p>
                           <p className="text-2xl font-black text-indigo-400">180<span className="text-sm text-slate-500 font-medium tracking-normal">m</span></p>
                        </div>
                      </div>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={elevationData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                            <XAxis 
                              dataKey="distance" 
                              tickLine={false} 
                              axisLine={false} 
                              tick={{fill: '#94a3b8', fontSize: 10}} 
                              dy={10}
                            />
                            <YAxis 
                              tickLine={false} 
                              axisLine={false} 
                              tick={{fill: '#94a3b8', fontSize: 10}} 
                            />
                            <Tooltip 
                              contentStyle={{backgroundColor: '#0f121d', borderColor: '#ffffff20', borderRadius: '12px'}}
                              itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                              labelStyle={{color: '#94a3b8', fontSize: '10px'}}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="elevation" 
                              stroke="#818cf8" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorElevation)" 
                              animationDuration={1500}
                              animationEasing="ease-out"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </section>

                  {/* Community Moments */}
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <MessageCircle className="w-4 h-4" /> Community Moments
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                       {communityMoments.map(moment => (
                         <div key={moment.id} className="aspect-square bg-indigo-500/10 rounded-2xl overflow-hidden relative">
                            {moment.photoUrl ? (
                              <img src={moment.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full text-indigo-400/50"><Camera className="w-8 h-8" /></div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white">
                                {moment.text}
                            </div>
                         </div>
                       ))}
                    </div>
                  </section>
                  
                  {/* Travel Health & Safety */}
                  <HealthSafetyDashboard lat={lat!} lng={lng!} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
