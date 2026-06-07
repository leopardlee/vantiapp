import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Star, Landmark } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandmarkMarkerProps {
  id: string;
  name: string;
  type?: string;
  isSelected?: boolean;
}

export const LandmarkMarker = React.memo(({ id, name, type, isSelected }: LandmarkMarkerProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      className="relative group cursor-pointer"
    >
      {/* 3D Extruded SVG Base */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Shadow/Glow Background */}
        <div className={cn(
          "absolute inset-0 rounded-xl blur-md transition-all duration-500",
          isSelected ? "bg-amber-500/40 opacity-100" : "bg-indigo-500/0 group-hover:bg-indigo-500/20 group-hover:opacity-100"
        )} />

        {/* The 3D "Extrusion" Layer (Bottom) */}
        <svg viewBox="0 0 100 100" className="absolute w-full h-full transform translate-y-1.5 opacity-20">
          <path 
            d="M 20,20 L 80,20 L 90,30 L 90,90 L 30,90 L 20,80 Z" 
            fill="currentColor" 
            className="text-slate-900"
          />
        </svg>

        {/* Main Body (Top Layer) */}
        <div className={cn(
          "relative w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 transform-gpu",
          isSelected 
            ? "bg-gradient-to-br from-amber-400 to-orange-600 border-white/40 shadow-lg -translate-y-1" 
            : "bg-slate-900/90 border-indigo-500/40 group-hover:border-indigo-400 group-hover:-translate-y-0.5"
        )}>
          {type?.includes('landmark') || type?.includes('museum') ? (
            <Landmark className={cn("w-5 h-5", isSelected ? "text-white" : "text-indigo-400")} />
          ) : (
            <Star className={cn("w-5 h-5", isSelected ? "text-white" : "text-amber-400")} />
          )}
        </div>

        {/* Hover Label */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all origin-top pointer-events-none z-50">
          <div className="bg-slate-950/95 border border-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">{name}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
