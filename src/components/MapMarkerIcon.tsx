import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  Utensils, 
  Coffee, 
  Martini, 
  TreePine, 
  Landmark, 
  ShoppingBag, 
  Hotel, 
  Waves, 
  Mountain, 
  Plane, 
  Train, 
  Activity, 
  BookOpen, 
  MapPin, 
  Camera, 
  Heart 
} from 'lucide-react';
import { getEmojiForPlace } from '../lib/placeIcons';

export const getIconForType = (types: string[] = [], name: string = '') => {
  const t = types.join(' ').toLowerCase();
  const n = name.toLowerCase();

  if (t.includes('restaurant') || t.includes('food') || n.includes('restaurant') || n.includes('eats')) return Utensils;
  if (t.includes('cafe') || t.includes('coffee') || n.includes('cafe') || n.includes('coffee')) return Coffee;
  if (t.includes('bar') || t.includes('pub') || t.includes('night') || n.includes('bar') || n.includes('pub')) return Martini;
  if (t.includes('park') || t.includes('nature') || n.includes('park')) return TreePine;
  if (t.includes('museum') || t.includes('art') || n.includes('museum') || n.includes('gallery')) return Landmark;
  if (t.includes('store') || t.includes('shopping') || n.includes('shop') || n.includes('mall')) return ShoppingBag;
  if (t.includes('lodging') || t.includes('hotel') || n.includes('hotel') || n.includes('resort')) return Hotel;
  if (t.includes('beach') || n.includes('beach')) return Waves;
  if (t.includes('mountain') || n.includes('mountain') || n.includes('peak')) return Mountain;
  if (t.includes('airport') || n.includes('airport')) return Plane;
  if (t.includes('train') || t.includes('transit') || n.includes('station')) return Train;
  if (t.includes('hospital') || t.includes('health') || n.includes('hospital')) return Activity;
  if (n.includes('diary') || n.includes('journal') || n.includes('memory')) return BookOpen;
  if (n.includes('photo') || n.includes('snap')) return Camera;
  if (n.includes('favorite') || t.includes('favorite')) return Heart;

  return null;
};

export function MapMarkerIcon({ 
  types, 
  name, 
  theme = 'slate',
  isSelected = false,
  showEmoji = false,
  customEmoji,
  status
}: { 
  types?: string[]; 
  name?: string; 
  theme?: string; 
  isSelected?: boolean;
  showEmoji?: boolean;
  customEmoji?: string;
  status?: {
    type: 'closing' | 'opening' | 'event' | 'active';
    label: string;
    timeLeft?: string;
  }
}) {
  const IconComponent = getIconForType(types, name);
  const emoji = customEmoji || getEmojiForPlace(types, name);

  let bgClass = "bg-slate-900 border-slate-700";
  let textClass = "text-slate-300";
  let glowClass = "";

  if (theme === 'emerald') {
    bgClass = "bg-emerald-950 border-emerald-500/50";
    textClass = "text-emerald-400 group-hover:text-amber-300";
    glowClass = "shadow-[0_0_15px_rgba(16,185,129,0.35)]";
  } else if (theme === 'rose') {
    bgClass = "bg-rose-950 border-rose-500/50";
    textClass = "text-rose-400 group-hover:text-white";
    glowClass = "shadow-[0_0_15px_rgba(244,63,94,0.35)]";
  } else if (theme === 'indigo') {
    bgClass = "bg-indigo-950 border-indigo-500/50";
    textClass = "text-indigo-400 group-hover:text-white";
    glowClass = "shadow-[0_0_15px_rgba(99,102,241,0.35)]";
  } else if (theme === 'amber') {
    bgClass = "bg-amber-950 border-amber-500/50";
    textClass = "text-amber-400 group-hover:text-white";
    glowClass = "shadow-[0_0_15px_rgba(245,158,11,0.35)]";
  }

  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isSelected ? 1.25 : 1, 
        opacity: 1,
        y: isSelected ? -4 : 0
      }}
      whileHover={{ scale: isSelected ? 1.3 : 1.15 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      className={cn(
        "relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 group selection-none",
        bgClass, glowClass,
        isSelected ? "border-white ring-4 ring-white/20 z-50 animate-pulse-slow" : "hover:scale-110",
        showEmoji ? "text-lg" : "text-sm",
        textClass
      )}
    >
      {showEmoji ? (
        <span>{emoji}</span>
      ) : IconComponent ? (
        <IconComponent strokeWidth={2.5} className="w-4 h-4" />
      ) : (
        <MapPin strokeWidth={2.5} className="w-4 h-4" />
      )}
      
      {/* Dynamic Base pointer */}
      <div className={cn(
        "absolute -bottom-1 w-2.5 h-2.5 rotate-45 border-r-2 border-b-2 z-[-1]",
        bgClass,
        theme === 'emerald' ? "bg-emerald-950" : 
        theme === 'rose' ? "bg-rose-950" : 
        theme === 'indigo' ? "bg-indigo-950" : 
        theme === 'amber' ? "bg-amber-950" : "bg-slate-900"
      )} />
      
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-current pointer-events-none" 
          />
        )}
      </AnimatePresence>

      {/* Dynamic Status Badge */}
      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, y: 10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 5, x: '-50%' }}
            className={cn(
              "absolute -top-6 left-1/2 px-1.5 py-0.5 rounded-full border shadow-lg whitespace-nowrap z-30 transition-all",
              status.type === 'closing' ? "bg-rose-500 border-rose-400 text-white animate-pulse" :
              status.type === 'opening' ? "bg-emerald-500 border-emerald-400 text-white" :
              status.type === 'event' ? "bg-indigo-500 border-indigo-400 text-white" :
              "bg-slate-800 border-slate-700 text-slate-300"
            )}
          >
            <div className="flex items-center gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", 
                status.type === 'closing' ? "bg-white" : "bg-current"
              )} />
              <span className="text-[8px] font-black uppercase tracking-tighter leading-none">
                {status.label} {status.timeLeft && <span className="opacity-80 italic">• {status.timeLeft}</span>}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
