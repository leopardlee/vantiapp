import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Coffee, TentTree, Users, X } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';

export const MoodFilterWidget: React.FC = () => {
  const moodFilter = useVantiStore((state) => state.moodFilter);
  const setMoodFilter = useVantiStore((state) => state.setMoodFilter);

  const MOODS = [
    { id: 'Energizing', icon: Zap, label: 'Energizing', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'Peaceful', icon: TentTree, label: 'Peaceful', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'Social', icon: Users, label: 'Social', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  ];

  return (
    <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-[200] flex gap-2 pointer-events-auto">
      <AnimatePresence>
        {MOODS.map((mood) => {
          const isActive = moodFilter === mood.id;
          const Icon = mood.icon;
          return (
            <motion.button
              key={mood.id}
              onClick={() => {
                if (isActive) setMoodFilter(null);
                else setMoodFilter(mood.id);
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] uppercase font-black tracking-wider transition-all",
                isActive 
                  ? `${mood.bg} ${mood.color} border-${mood.color.split('-')[1]}-500/50 shadow-lg shadow-${mood.color.split('-')[1]}-500/20`
                  : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/80 backdrop-blur-md"
              )}
            >
              {isActive ? <Sparkles className="w-3 h-3 animate-pulse" /> : <Icon className="w-3 h-3" />}
              {mood.label}
              {isActive && (
                <X className="w-3 h-3 ml-1 opacity-70" />
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
