import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Users, Utensils, Info, Calendar } from 'lucide-react';

interface CityBriefing {
  name: string;
  brief: string;
  sights: string[];
  population: string;
  tips: string;
  food: string;
}

export function DestinationBriefingModal({ city, onClose }: { city: CityBriefing; onClose: () => void }) {
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0f1117] border border-white/10 rounded-3xl w-full max-w-sm p-6 text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">{city.name}</h2>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-slate-400 mb-6">{city.brief}</p>
          
          <div className="space-y-4 font-mono">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">POPULATION:</span>
              <span className="text-sm">{city.population}</span>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-rose-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">MAJOR SIGHTS:</span>
                <ul className="text-xs list-disc pl-4 mt-1">
                  {city.sights.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Utensils className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">FOOD:</span>
                <span className="text-xs">{city.food}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="mt-8 w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200"
          >
            Explore Now
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
