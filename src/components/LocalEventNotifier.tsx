import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { Calendar, Music, Sparkles, MapPin, X, PartyPopper } from 'lucide-react';
import { cn } from '../lib/utils';

export function LocalEventNotifier() {
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const isVisible = useVantiStore((state) => state.isLocalEventVisible);
  const [activeEvent, setActiveEvent] = useState<any | null>(null);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [lastCenterLine, setLastCenterLine] = useState('');

  useEffect(() => {
    if (!mapViewport || hasDismissed || !isVisible) return;

    // Throttle checks based on significant movement (approx 2km grid line)
    const latLine = mapViewport.center.lat.toFixed(2);
    const lngLine = mapViewport.center.lng.toFixed(2);
    const gridKey = `${latLine},${lngLine}`;

    if (gridKey !== lastCenterLine) {
       setLastCenterLine(gridKey);
       // Reset dismiss state for new areas
       setHasDismissed(false);

       // Deterministic pseudo-event generation based on coordinates digits
       const lngDecimals = parseInt(lngLine.split('.')[1] || '0');
       
       if (lngDecimals % 3 === 0) {
         // Create mock event based on pseudo-random grid sector
         const events = [
           { title: 'Neon Night Market', type: 'Cultural', icon: Calendar, time: 'Starts at 8:00 PM', desc: 'Street food and local crafts detected within 2 miles.' },
           { title: 'Electronic Underpass', type: 'Concerts', icon: Music, time: 'Tonight - 11:00 PM', desc: 'Live underground DJ set detected near your viewport.' },
           { title: 'Sakura Lantern Festival', type: 'Festivals', icon: PartyPopper, time: 'Ongoing - Last Day', desc: 'Seasonal lights and immersive walkthroughs active.' },
           { title: 'Indie Art Walk', type: 'Cultural', icon: Sparkles, time: 'Until 10 PM', desc: 'Galleries are hosting open houses with free wine tasting.' }
         ];
         const eqId = lngDecimals % events.length;
         
         const timer = setTimeout(() => {
            setActiveEvent(events[eqId]);
         }, 3500); // 3.5s delay for cinematic discovery feel after pan
         
         return () => clearTimeout(timer);
         } else {
         setActiveEvent(null);
       }
    }
  }, [mapViewport, lastCenterLine, hasDismissed, isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {activeEvent && !hasDismissed && (
        <motion.div
           key="local-event-notifier"
           initial={{ opacity: 0, y: -20, scale: 0.95 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(4px)' }}
           className="fixed top-[138px] left-1/2 -translate-x-1/2 z-[200] max-w-sm w-[90%] bg-[#0c0e12]/95 border border-indigo-500/30 shadow-[0_15px_30px_rgba(99,102,241,0.15)] rounded-2xl p-4 cursor-pointer backdrop-blur-xl"
           onClick={() => setHasDismissed(true)}
        >
          {/* Subtle glow edge */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl opacity-80" />
          
          <div className="flex gap-4">
             <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
                <activeEvent.icon className="w-6 h-6" />
             </div>
             
             <div className="flex-1">
                <div className="flex justify-between items-start">
                   <span className="text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent mb-1 block">
                     Proximity Alert: {activeEvent.type}
                   </span>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setHasDismissed(true); }}
                     className="text-slate-500 hover:text-white transition-colors p-1 -mr-2 -mt-2 rounded-full hover:bg-white/10"
                   >
                     <X className="w-4 h-4" />
                   </button>
                </div>
                <h3 className="text-sm font-bold text-white leading-tight mt-0.5">{activeEvent.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                   {activeEvent.desc}
                </p>
                <div className="flex items-center gap-1.5 mt-2.5 text-[9px] font-mono text-indigo-300 font-bold bg-indigo-500/10 w-fit px-2 py-0.5 rounded border border-indigo-500/20">
                   <MapPin className="w-3 h-3" />
                   <span>{activeEvent.time}</span>
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
