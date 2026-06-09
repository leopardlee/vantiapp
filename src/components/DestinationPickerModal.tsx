import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, X } from 'lucide-react';
import { RECOMMENDED_CITIES } from '../data/cities';

export function DestinationPickerModal({ onSelect, onClose }: { onSelect: (city: any) => void; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-[#0f1117] border border-white/10 rounded-3xl w-full max-w-sm p-6 text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plane className="w-5 h-5 text-cyan-400" />
              Select Destination
            </h2>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {RECOMMENDED_CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => onSelect(city)}
                className="w-full text-left p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <div className="font-bold text-white">{city.name}</div>
                <div className="text-xs text-slate-400 mt-1">{city.brief.substring(0, 50)}...</div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
