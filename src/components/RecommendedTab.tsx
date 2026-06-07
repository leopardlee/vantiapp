import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Loader2, Compass } from 'lucide-react';
import { MockPlace } from '../data/mockPlaces';

export default function RecommendedTab({ 
  savedPlaces, 
  onFocusPlace 
}: { 
  savedPlaces: any[]; 
  onFocusPlace: (place: any) => void;
}) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, [savedPlaces]);

  const generateRecommendations = async () => {
    if (savedPlaces.length === 0) return;
    
    setIsLoading(true);
    try {
      // Create a simplified footprint of user's saved places
      const footprint = savedPlaces.map(p => ({
        name: p.displayName || p.name,
        types: p.types || []
      })).slice(0, 5); // Take top 5 recent

      const response = await fetch('/api/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedPlaces: footprint })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error("Error generating recommendations:", err);
      // Fallback fallback if API fails
      setRecommendations([
        { name: "Local Coffee Masters", reason: "Similar to your cafe bookmarks.", lat: 0, lng: 0 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (savedPlaces.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center animate-fadeIn">
        <Compass className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-50" />
        <h3 className="text-sm font-bold text-slate-300">Save places first</h3>
        <p className="text-xs text-slate-500 mt-1">Start saving locations you love, and AI will surface personalized recommendations here.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-4">
      <div className="bg-gradient-to-br from-indigo-900/20 to-[#121318] border border-indigo-500/20 p-4 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Recommended for You</h3>
          </div>
          <button 
            onClick={generateRecommendations}
            disabled={isLoading}
            className="text-[9px] uppercase tracking-widest font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-500/20 transition-colors"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 opacity-70">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase animate-pulse">Analyzing footprint...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950/60 border border-white/5 rounded-xl p-3 hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => {
                  if (rec.lat !== 0 && rec.lng !== 0) {
                    onFocusPlace({ lat: rec.lat, lng: rec.lng });
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{rec.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{rec.reason}</p>
                  </div>
                  {rec.lat !== 0 && rec.lng !== 0 && <MapPin className="w-3.5 h-3.5 text-slate-700 group-hover:text-indigo-400 mt-0.5" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
