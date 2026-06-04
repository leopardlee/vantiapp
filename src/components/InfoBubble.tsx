import React from 'react';
import { motion } from 'motion/react';
import { Users, Volume2, ArrowUp, ArrowDown, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface InfoBubbleProps {
  crowdDensity: number;
  noiseLevel: number;
  mode: 'social' | 'genius' | 'perks' | 'canada' | 'default';
  onExpand: () => void;
  crowdTrend: 'up' | 'down' | 'stable';
  noiseTrend: 'up' | 'down' | 'stable';
}

export default function InfoBubble({ 
    crowdDensity, 
    noiseLevel, 
    mode, 
    onExpand,
    crowdTrend,
    noiseTrend
}: InfoBubbleProps) {
  const themeColors = {
    social: 'text-rose-400',
    genius: 'text-amber-400',
    perks: 'text-emerald-400',
    canada: 'text-red-400',
    default: 'text-slate-400'
  };

  const colorClass = themeColors[mode] || themeColors.default;

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <ArrowUp className="w-2.5 h-2.5 text-red-500" />;
    if (trend === 'down') return <ArrowDown className="w-2.5 h-2.5 text-green-500" />;
    return <span className="w-2.5 h-2.5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: -20, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl shadow-2xl w-40 pointer-events-auto"
    >
      <button onClick={onExpand} className="absolute top-1 right-1 p-1 hover:bg-white/10 rounded-full">
        <Maximize2 className="w-3 h-3 text-slate-400" />
      </button>
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Users className={cn("w-3 h-3", colorClass)} />
             <span className="text-[10px] text-slate-300">Crowd: {crowdDensity}%</span>
           </div>
           <TrendIcon trend={crowdTrend} />
        </div>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Volume2 className={cn("w-3 h-3", colorClass)} />
             <span className="text-[10px] text-slate-300">Noise: {noiseLevel}dB</span>
           </div>
           <TrendIcon trend={noiseTrend} />
        </div>
      </div>
    </motion.div>
  );
}
