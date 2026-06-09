import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, X, MapPin } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import Markdown from 'react-markdown';

export function JourneyRecapWidget() {
  const isOpen = useVantiStore(state => state.isJourneyRecapOpen);
  const setIsOpen = useVantiStore(state => state.setIsJourneyRecapOpen!);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);
  
  const bookmarkedPlaces = useVantiStore(state => state.bookmarkedPlaces);
  const routingOrigin = useVantiStore(state => state.routingOrigin);

  useEffect(() => {
    if (isOpen) {
      handleGenerateRecap();
    } else {
      setRecap(null); // Clear context on close
    }
  }, [isOpen]);

  const handleGenerateRecap = async () => {
    setIsGenerating(true);
    try {
      // Fetch some recent moods
      let moods: any[] = [];
      const q = query(collection(db, 'atmosphereMoods'), orderBy('timestamp', 'desc'), limit(10));
      const snap = await getDocs(q);
      moods = snap.docs.map(doc => doc.data());

      const places = Object.values(bookmarkedPlaces || {});

      const response = await fetch('/api/journey-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places, moods })
      });
      const data = await response.json();
      setRecap(data.recap || 'No recap available.');
    } catch (err) {
      console.error(err);
      setRecap('Failed to generate journey recap. Please ensure Gemini API limits are not exceeded.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
        {isOpen && (
          <motion.div
            key="journey-recap"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-[90%] max-w-md bg-gradient-to-b from-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
               <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-widest text-xs font-mono">
                  <Sparkles className="w-5 h-5 text-fuchsia-400" />
                  JOURNEY RECAP
               </div>
               <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto text-slate-200 text-sm leading-relaxed pr-2">
               {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 text-indigo-300">
                     <Loader2 className="w-8 h-8 animate-spin mb-4" />
                     <p className="animate-pulse">Weaving your memories together...</p>
                  </div>
               ) : (
                  <div className="markdown-body">
                      <Markdown>{recap || ''}</Markdown>
                  </div>
               )}
            </div>

            {!isGenerating && (
              <div className="mt-4 pt-4 border-t border-indigo-500/20 flex flex-col gap-2 shrink-0">
                 <div className="flex gap-2 mb-2 items-center text-xs text-indigo-300 font-mono">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{Object.keys(bookmarkedPlaces).length} Nodes Captured</span>
                 </div>
                 <button 
                   onClick={() => setIsOpen(false)}
                   className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-white font-bold transition-colors"
                 >
                   CLOSE RECAP
                 </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
  );
}
