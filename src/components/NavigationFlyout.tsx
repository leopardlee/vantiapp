import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Navigation2, Cpu, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  statusText: string;
  color: string;
  metrics: { label: string; value: string }[];
}

export const NavigationFlyout: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const isMapDragging = useVantiStore((state) => state.isMapDragging);

  const ITEMS: NavItem[] = [
    {
      id: "gps",
      icon: Navigation2,
      label: "Spatial Link",
      statusText: "GPS Locked ±0.1m",
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
      metrics: [
        { label: 'Satellites', value: '32 Active' },
        { label: 'Latency', value: '2ms' }
      ]
    },
    {
      id: "neural",
      icon: Cpu,
      label: "AI Neural",
      statusText: "Gemini Sync Active",
      color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
      metrics: [
        { label: 'Model', value: 'Gemini-3.5' },
        { label: 'Latency', value: '0.04ms' }
      ]
    },
    {
      id: "network",
      icon: Network,
      label: "Grid Mesh",
      statusText: "VANTI-ASIA-01",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      metrics: [
        { label: 'Bandwidth', value: '1.2GB/s' },
        { label: 'Packets', value: 'Zero Drop' }
      ]
    },
    {
      id: "rendering",
      icon: Zap,
      label: "Vector Engine",
      statusText: isMapDragging ? "Recalculating..." : "Mesh Stable",
      color: isMapDragging ? "text-rose-400 border-rose-500/30 bg-rose-500/10" : "text-amber-400 border-amber-500/30 bg-amber-500/10",
      metrics: [
        { label: 'Frame', value: '120fps' },
        { label: 'Kernels', value: isMapDragging ? 'Rebuilding' : '1.2M Configured' }
      ]
    }
  ];

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[250] pointer-events-auto">
      <div className="flex items-center justify-center p-2 px-3 bg-[#090b15]/90 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-[0_16px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] gap-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => setActiveMenu(isActive ? null : item.id)}
                className={cn(
                  "p-2 rounded-full border transition-all duration-300 relative group overflow-hidden",
                  isActive ? "bg-white/10 border-white/30" : "bg-transparent border-transparent hover:border-white/10 hover:bg-white/5",
                  item.color.split(' ')[0]
                )}
              >
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity", item.color.split(' ')[2])} />
                <Icon className={cn("w-4 h-4 transition-transform", isActive ? "scale-110" : "")} />
              </button>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 min-w-[200px] bg-[#090b15]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-4 origin-top"
                  >
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                      <div className={cn("w-8 h-8 rounded-full border flex items-center justify-center", item.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{item.label}</h4>
                        <p className={cn("text-[9px] font-mono mt-0.5", item.color.split(' ')[0])}>{item.statusText}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {item.metrics.map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-500 uppercase">{m.label}</span>
                          <span className="text-white font-bold">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
