import React from 'react';
import { Gauge, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function SpeedometerWidget({ speed, status }: { speed: number, status: 'clear' | 'moderate' | 'congested' }) {
  const { units, setUnits } = useVantiStore();

  const statusColors = {
    clear: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    congested: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  const statusTags = {
    clear: 'Smooth Traffic',
    moderate: 'Moderate Slowdown',
    congested: 'Heavy Gridlock'
  };

  const isKmh = units === 'metric';
  const speedDisplay = isKmh ? speed : Math.round(speed * 0.621371);

  const toggleUnit = async () => {
    const nextUnits = isKmh ? 'imperial' : 'metric';
    setUnits(nextUnits);

    // Save to Firestore if authenticated on click
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { units: nextUnits }, { merge: true });
      } catch (err) {
        console.warn("Failed to auto-sync speedometer click unit toggle to Firestore:", err);
      }
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(8); } catch {}
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleUnit();
      }}
      className="absolute top-24 right-4 z-20 bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl flex items-center gap-3 select-none cursor-pointer shadow-[0_20px_40px_rgba(0,0,0,0.5)] group hover:border-white/20 transition-all duration-300"
      title="Click to toggle Km/h and Mph"
    >
      <div className={cn("p-2 rounded-xl transition-colors shrink-0", 
        status === 'clear' ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' :
        status === 'moderate' ? 'bg-amber-500/5 group-hover:bg-amber-500/10' : 'bg-rose-500/5 group-hover:bg-rose-500/10'
      )}>
        <Gauge className={cn("w-6 h-6", 
          status === 'clear' ? 'text-emerald-400' :
          status === 'moderate' ? 'text-amber-400' : 'text-rose-400'
        )} />
      </div>
      <div className="flex flex-col pr-1">
        <span className="text-xl font-black font-mono text-white leading-none flex items-baseline">
          {speedDisplay}
          <span className="text-[10px] text-slate-500 ml-0.5 group-hover:text-rose-400 transition-colors uppercase font-bold tracking-wider">
            {isKmh ? 'km/h' : 'mph'}
          </span>
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <Zap className={cn("w-2.5 h-2.5 shrink-0", 
            status === 'clear' ? 'text-emerald-400' :
            status === 'moderate' ? 'text-amber-400' : 'text-rose-400'
          )} />
          <span className={cn("text-[9px] font-black uppercase tracking-wider leading-none", 
            status === 'clear' ? 'text-emerald-400' :
            status === 'moderate' ? 'text-amber-400' : 'text-rose-400'
          )}>
            {statusTags[status]}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
