import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatusIndicatorProps {
  id: string;
  label: string;
  dotColor: 'emerald' | 'rose' | 'cyan' | 'amber' | 'indigo';
  pulse?: boolean;
  tooltipTitle: string;
  tooltipDescription: string;
  metrics?: { label: string; value: string }[];
  icon?: LucideIcon;
  className?: string;
}

export function StatusIndicator({
  id,
  label,
  dotColor,
  pulse = true,
  tooltipTitle,
  tooltipDescription,
  metrics,
  icon: Icon,
  className
}: StatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const colorMap = {
    emerald: {
      bg: 'bg-emerald-400',
      shadow: 'shadow-[0_0_12px_rgba(52,211,153,0.8)]',
      aura: 'bg-emerald-400/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30'
    },
    rose: {
      bg: 'bg-rose-500',
      shadow: 'shadow-[0_0_12px_rgba(244,63,94,0.8)]',
      aura: 'bg-rose-500/20',
      text: 'text-rose-400',
      border: 'border-rose-500/30'
    },
    cyan: {
      bg: 'bg-cyan-400',
      shadow: 'shadow-[0_0_12px_rgba(34,211,238,0.8)]',
      aura: 'bg-cyan-400/20',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30'
    },
    amber: {
      bg: 'bg-amber-400',
      shadow: 'shadow-[0_0_12px_rgba(251,191,36,0.8)]',
      aura: 'bg-amber-400/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30'
    },
    indigo: {
      bg: 'bg-indigo-400',
      shadow: 'shadow-[0_0_12px_rgba(129,140,248,0.8)]',
      aura: 'bg-indigo-400/20',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30'
    }
  };

  const colors = colorMap[dotColor];

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "absolute bottom-full mb-3 p-4 bg-[#0c0e12]/95 backdrop-blur-xl border rounded-2xl shadow-2xl min-w-[240px] z-[300]",
              colors.border
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {Icon && <Icon className={cn("w-3.5 h-3.5", colors.text)} />}
              <h4 className={cn("text-[10px] font-black uppercase tracking-widest", colors.text)}>
                {tooltipTitle}
              </h4>
            </div>
            
            <p className="text-white/80 text-[11px] font-medium leading-relaxed mb-3">
              {tooltipDescription}
            </p>

            {metrics && metrics.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                {metrics.map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-white/40 uppercase tracking-tighter">{m.label}</span>
                    <span className={cn("font-bold tracking-tight", colors.text)}>{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full text-center text-[8px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors py-1"
            >
              Close Metric View
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 0.85 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center group outline-none"
      >
        {/* Pulsing Aura */}
        {pulse && (
          <div className={cn(
            "absolute inset-0 rounded-full blur-md animate-pulse scale-150 transition-colors",
            colors.aura
          )} />
        )}
        
        {/* The Dot */}
        <div className={cn(
          "w-2.5 h-2.5 rounded-full border border-white/20 transition-all duration-300",
          colors.bg,
          colors.shadow
        )} />
        
        {/* Label on Hover */}
        <div className="absolute left-full ml-3 pointer-events-none">
          <div className="overflow-hidden">
            <motion.span 
              initial={{ x: -10, opacity: 0 }}
              whileHover={{ x: 0, opacity: 1 }}
              className={cn(
                "block whitespace-nowrap text-[8px] font-black uppercase tracking-[0.25em] opacity-0 group-hover:opacity-100 transition-all duration-300",
                colors.text
              )}
            >
              {label}
            </motion.span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
