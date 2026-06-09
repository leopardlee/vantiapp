import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMap } from '@vis.gl/react-google-maps';
import { Film, Play, X, Music, Pause } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useVantiStore } from '../store/vantiStore';

export function MemoryReplayViewer() {
  const map = useMap();
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayState, setReplayState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [trail, setTrail] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const startReplay = async () => {
      if (!auth.currentUser || !map) return;
      setIsReplaying(true);
      setReplayState('playing');
      try {
          const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
          const q = query(
              collection(db, 'users', auth.currentUser.uid, 'memoryTrail'),
              where('timestamp', '>=', twentyFourHoursAgo),
              orderBy('timestamp', 'asc')
          );
          const snap = await getDocs(q);
          const pts = snap.docs.map(d => d.data());
          if (pts.length > 0) {
              setTrail(pts);
              setCurrentIdx(0);
              playAudioNarration("Welcome back to your memories. Let's trace your steps.");
          } else {
              setTrail([{ lat: 37.5665, lng: 126.9780, text: 'No recent memory trail available.' }]);
          }
      } catch (err) {
          console.error(err);
      }
  };

  const playAudioNarration = (text: string) => {
      if ('speechSynthesis' in window) {
         window.speechSynthesis.cancel();
         const ut = new SpeechSynthesisUtterance(text);
         ut.rate = 0.9;
         ut.pitch = 1.1;
         window.speechSynthesis.speak(ut);
      }
  };

  useEffect(() => {
     let interval: any;
     if (replayState === 'playing' && trail.length > 0 && map) {
         interval = setInterval(() => {
             setCurrentIdx(prev => {
                 if (prev >= trail.length - 1) {
                     setReplayState('idle');
                     setIsReplaying(false);
                     playAudioNarration("That's the end of your recent journey.");
                     return 0;
                 }
                 const pt = trail[prev + 1];
                 map.panTo({ lat: pt.lat, lng: pt.lng });
                 if (map.getTilt() !== 45) map.setTilt(45);
                 map.setZoom(18);
                 map.setHeading((map.getHeading() || 0) + 30);
                 
                 if (prev % 5 === 0) playAudioNarration("Continuing along your trail.");
                 return prev + 1;
             });
         }, 4000);
     }
     return () => clearInterval(interval);
  }, [replayState, trail, map]);

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startReplay}
        className="absolute top-36 right-4 z-[60] bg-indigo-600 rounded-full p-3 shadow-lg border border-indigo-400"
        title="Cinematic Replay"
      >
          <Film className="w-5 h-5 text-white" />
      </motion.button>

      <AnimatePresence>
          {isReplaying && (
              <motion.div 
                 initial={{ opacity: 0, y: 50 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 50 }}
                 className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-black/80 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 flex items-center gap-6 shadow-[0_0_40px_rgba(79,70,229,0.5)]"
              >
                  <button onClick={() => setReplayState(prev => prev === 'playing' ? 'paused' : 'playing')} className="text-white hover:text-indigo-300">
                      {replayState === 'playing' ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                  </button>
                  
                  <div className="flex flex-col text-white font-mono">
                      <div className="text-xs text-indigo-400">MEMORY REPLAY</div>
                      <div className="text-sm font-bold flex items-center gap-2">
                           <Music className="w-3 h-3 text-rose-400 animate-pulse" />
                           Playing Cinematic View...
                      </div>
                  </div>

                  <button 
                     onClick={() => {
                        setReplayState('idle');
                        setIsReplaying(false);
                        window.speechSynthesis?.cancel();
                     }} 
                     className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
                  >
                      <X className="w-4 h-4" />
                  </button>
              </motion.div>
          )}
      </AnimatePresence>
    </>
  );
}
