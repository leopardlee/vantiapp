import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, MapPin, Zap, User } from 'lucide-react';
import { CloseButton } from './CloseButton';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';

const EMOJIS = ['✨', '🔥', '☕', '🎵', '🌧️', '😎', '🌙', '🍔'];

export function AtmosphereFeed() {
  const [moods, setMoods] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('✨');
  const userLocation = useVantiStore(state => state.userLocation);

  useEffect(() => {
    let unsubSnapshot: any;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, 'atmosphereMoods'), orderBy('timestamp', 'desc'), limit(15));
        unsubSnapshot = onSnapshot(q, (snap) => {
            const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMoods(fetched);
        }, (error) => {
            console.warn("Atmosphere Feed snapshot error", error);
        });
      } else {
        setMoods([]);
        if (unsubSnapshot) unsubSnapshot();
      }
    });
    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const handleDropMood = async () => {
      if (!auth.currentUser || !text.trim() || !userLocation) return;
      try {
          await addDoc(collection(db, 'atmosphereMoods'), {
              userId: auth.currentUser.uid,
              emoji: selectedEmoji,
              text: text.trim(),
              lat: userLocation.lat,
              lng: userLocation.lng,
              timestamp: Date.now()
          });
          setText('');
          setIsExpanded(false);
      } catch (err) {
          console.error("Failed to drop mood", err);
      }
  };

  const isAtmosphereOpen = useVantiStore(state => state.isAtmosphereOpen);
  const setIsAtmosphereOpen = useVantiStore(state => state.setIsAtmosphereOpen!);
  const [timeOffsetHours, setTimeOffsetHours] = useState(0);

  return (
    <AnimatePresence>
      {isAtmosphereOpen && (
        <div className="absolute left-[70px] top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-3 items-start justify-start pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="bg-[#0f1117]/95 backdrop-blur-3xl border border-cyan-500/30 rounded-2xl p-3 shadow-2xl w-64 overflow-hidden relative z-20"
          >
            {/* Real-time Ticker */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500" />
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono text-cyan-50 font-bold tracking-widest">LOCAL VIBE</span>
                </div>
                <CloseButton onClick={() => setIsAtmosphereOpen(false)} isAbsolute={false} />
            </div>
            
            <div className="h-24 overflow-hidden relative">
                <div className="flex flex-col gap-2 absolute w-full animate-marquee-up hover:pause">
                    {moods.concat(moods).map((mood, idx) => (
                        <div key={`mood-feed-${idx}`} className="flex gap-2 items-start bg-white/5 rounded-xl p-2 border border-white/5">
                            <div className="text-lg leading-none">{mood.emoji}</div>
                            <div>
                                <div className="text-xs text-slate-200 line-clamp-2">{mood.text}</div>
                                <div className="text-[9px] text-slate-400 font-mono mt-1">
                                    {new Date(mood.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Drop Mood Toggle */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white rounded-xl py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
               <span>Drop a Mood</span>
               <MessageCircle className="w-3 h-3" />
            </motion.button>

            {/* Time Scrubber Control */}
            <div className="mt-3 pt-3 border-t border-white/10">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">Time Scrubber</span>
                 <span className="text-[10px] font-mono text-slate-300">+{timeOffsetHours}h</span>
               </div>
               <p className="text-[9px] text-slate-500 leading-tight mb-2">Slide through the next 48 hours to preview local weather & daylight conditions along your route.</p>
               <input 
                 type="range"
                 min="0"
                 max="48"
                 value={timeOffsetHours}
                 onChange={(e) => setTimeOffsetHours(Number(e.target.value))}
                 className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
               />
            </div>

            {/* Drop Mood Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-2xl origin-bottom"
                    >
                        <div className="flex flex-wrap gap-1 mb-2">
                            {EMOJIS.map(e => (
                                <button 
                                  key={e} 
                                  onClick={() => setSelectedEmoji(e)}
                                  className={`w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all ${selectedEmoji === e ? 'bg-cyan-500/30 border border-cyan-400' : 'hover:bg-slate-800'}`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                        <input 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="What's the vibe?"
                            className="w-full bg-slate-800 border fill-white text-sm border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 mb-2"
                            maxLength={100}
                        />
                        <button 
                          onClick={handleDropMood}
                          disabled={!text.trim() || !userLocation}
                          className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl py-2 text-sm font-bold disabled:opacity-50"
                        >
                            Post to Zone
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
