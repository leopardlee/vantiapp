import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon, Globe } from 'lucide-react';
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
  icon: Icon = Globe,
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
      <motion.button
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border bg-slate-900/60 cursor-pointer transition-all duration-300 pointer-events-auto",
          isOpen ? cn("border-opacity-100 bg-[#0c0e12]", colors.border) : "border-white/10 hover:border-slate-600"
        )}
      >
        {/* Pulsing Aura */}
        {pulse && (
          <div className={cn(
            "absolute inset-0 rounded-xl blur-sm animate-pulse scale-105 pointer-events-none",
            colors.aura
          )} />
        )}
        
        {/* The Icon */}
        <Icon className={cn("w-4 h-4 shrink-0 relative z-10 transition-transform duration-300", isOpen && "scale-110", colors.text)} />
        
        {/* Small indicator status dot inside the button */}
        <div className={cn(
          "w-1.5 h-1.5 rounded-full relative z-10 border border-white/10 shrink-0",
          colors.bg,
          colors.shadow
        )} />

        {/* Short scannable helper name */}
        <span className="text-[9px] font-mono font-black text-slate-300 uppercase tracking-wider hidden md:inline">
          {label.split(' ')[0]}
        </span>
      </motion.button>

      {/* Floating Info Dropdown appearing directly BELOW the button */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "absolute top-full mt-3 p-4 bg-[#090b15]/95 backdrop-blur-3xl border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] min-w-[250px] z-[300]",
              colors.border
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Icon className={cn("w-3.5 h-3.5", colors.text)} />
                <h4 className={cn("text-[10px] font-black uppercase tracking-widest", colors.text)}>
                  {tooltipTitle}
                </h4>
              </div>
              <span className={cn("text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/5", colors.text)}>
                {label}
              </span>
            </div>
            
            <p className="text-white/80 text-[10.5px] font-medium leading-relaxed mb-3">
              {tooltipDescription}
            </p>

            {metrics && metrics.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                {metrics.map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-400 uppercase tracking-tighter">{m.label}</span>
                    <span className={cn("font-bold tracking-tight", colors.text)}>{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => setIsOpen(false)}
              className="mt-3.5 w-full text-center text-[8.5px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors py-1 bg-white/5 rounded-lg border border-white/5"
            >
              Minimize View
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

