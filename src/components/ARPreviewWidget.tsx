import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';

export const ARPreviewWidget: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const selectedPlace = useVantiStore(state => state.selectedPlace);

  useEffect(() => {
    if (selectedPlace) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedPlace]);

  if (!selectedPlace) return null;

  return (
    <div className="absolute top-[140px] left-4 z-[250] pointer-events-auto">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-64 bg-[#090b15]/90 backdrop-blur-3xl border border-indigo-500/30 rounded-[1.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]"
        >
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Live AR Engine</span>
            </div>
            <Wand2 className="w-3.5 h-3.5 text-indigo-500/50" />
          </div>

          <div className="relative h-36 bg-slate-900 overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/20">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                <span className="text-[9px] font-mono uppercase text-indigo-300">Synthesizing AR Grid...</span>
              </div>
            ) : (
              <>
                {/* Simulated Street View / AR Image logic */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{ 
                    backgroundImage: `url(${selectedPlace.photos?.[0]?.uri || 'https://images.unsplash.com/photo-1517621735165-22e389bf4494?auto=format&fit=crop&w=400&q=80'})`,
                    filter: 'contrast(1.1) brightness(0.9) saturate(1.2)'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090b15] via-transparent to-transparent" />
                
                {/* AR Grid Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50" />

                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-white truncate max-w-[120px]">{selectedPlace.displayName}</p>
                    <p className="text-[8px] text-indigo-300 uppercase tracking-widest font-mono">Gemini Enhanced</p>
                  </div>
                  <div className="bg-indigo-500/20 border border-indigo-500/50 px-1.5 py-0.5 rounded text-[8px] font-mono text-indigo-200">
                    LIVE
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
