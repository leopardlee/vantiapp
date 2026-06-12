import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin, Clock, ArrowRight, BookOpen, Share2, X } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';

export default function AILogPanel({ onClose }: { onClose?: () => void }) {
  const customMarkers = useVantiStore(state => state.customMarkers);
  const bookmarkedPlaces = useVantiStore(state => state.bookmarkedPlaces);
  
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Combine customized markers and bookmarked places
  const combinedFavorites = [
    ...customMarkers.map(m => ({ name: m.nickname, type: m.category || 'Custom Node', note: m.note })),
    ...Object.values(bookmarkedPlaces).map(m => ({ name: m.displayName || 'Unknown', type: m.primaryType || 'Place', note: m.shortFormattedAddress }))
  ];

  const handleGenerateSummary = async () => {
    if (combinedFavorites.length === 0) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/summarize-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: combinedFavorites })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummary("Failed to generate AI summary. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="w-full h-full flex flex-col items-center bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
    >
      <div className="w-full bg-[#0a0d14]/80 p-6 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-10 flex justify-between items-center">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <Sparkles className="w-4 h-4 text-purple-400" />
             <h3 className="text-sm font-black tracking-widest uppercase text-white">Daily AI Travel Log</h3>
           </div>
           <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Chronological Highlights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
             <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto p-6 flex flex-col">
        {combinedFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
            <MapPin className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
            <p className="text-sm font-medium text-slate-400">No favorites saved today.</p>
            <p className="text-xs text-slate-500 mt-2">Bookmark spots or add custom markers to generate your AI travel log.</p>
          </div>
        ) : !summary && !isGenerating ? (
          <div className="flex flex-col items-center justify-center py-10 h-full">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] relative">
               <div className="absolute inset-0 bg-purple-400/20 animate-ping rounded-full" />
               <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2 text-center">Ready to summarize your day?</h4>
            <p className="text-sm text-slate-400 mb-8 max-w-[250px] text-center">
              Our AI will analyze your {combinedFavorites.length} saved locations and weave them into a personalized chronological travel story.
            </p>
            <button 
              onClick={handleGenerateSummary}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-full font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 group"
            >
              Generate AI Log <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin mb-6" />
            <p className="text-sm font-bold text-purple-400 animate-pulse uppercase tracking-widest">Weaving your story...</p>
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative">
            <div className="absolute top-4 right-4 text-xs font-bold text-slate-600 tracking-wider">TODAY</div>
            <div className="prose prose-invert prose-purple max-w-none prose-sm font-sans text-slate-300">
               <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
            <button 
              onClick={() => {}}
              className="mt-8 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" /> Share Daily Log
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
