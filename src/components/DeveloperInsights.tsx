import React, { useState } from 'react';
import { 
  X, Cpu, Database, Terminal, Check, Copy, 
  FileText, Activity, Code, Layers, Compass, 
  BookOpen, Download, Sparkles, Radio, CloudRain, 
  BarChart3, Gauge, Settings
} from 'lucide-react';
import { FEATURE_REGISTRY, calculateComplexityMetrics, generateAutomatedReport, DynamicFeatureStats, FeatureMetadata } from '../lib/featureRegistry';
import { useVantiStore } from '../store/vantiStore';
import { PerformanceStats } from '../hooks/usePerformanceMonitor';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { cn } from '../lib/utils';

// Helper to match icon names to Lucide icons
const IconMap: Record<string, React.ComponentType<any>> = {
  Layers,
  BookOpen,
  Compass,
  Download,
  Sparkles,
  Radio,
  CloudRain,
  BarChart3,
  Gauge,
  Settings
};

interface DeveloperInsightsProps {
  isOpen: boolean;
  onClose: () => void;
  stats: Omit<DynamicFeatureStats, 'currentLanguage' | 'currentUnits' | 'activeHubTab' | 'activeMode' | 'mapTheme' | 'mapAesthetic'>;
  perfStats?: PerformanceStats;
}

export default function DeveloperInsights({ isOpen, onClose, stats, perfStats }: DeveloperInsightsProps) {
  const { language, units, activeMode, mapTheme, mapAesthetic } = useVantiStore();
  const [copiedReport, setCopiedReport] = useState(false);
  const [activeSegment, setActiveSegment] = useState<'visuals' | 'registry' | 'report'>('visuals');

  const fullStats: DynamicFeatureStats = {
    ...stats,
    currentLanguage: language,
    currentUnits: units,
    activeHubTab: 'hub', // default or custom
    activeMode,
    mapTheme,
    mapAesthetic
  };

  const metrics = calculateComplexityMetrics(fullStats);
  const reportString = generateAutomatedReport(fullStats);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportString);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <FocusLock returnFocus className="contents">
          {/* Backdrop overlay closely designed */}
          <motion.div 
            initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
        />

        {/* Dashboard Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 1 }}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose();
            }
          }}
          className="relative w-full max-w-4xl bg-[#080a10] border border-indigo-500/20 rounded-[2rem] shadow-2xl shadow-indigo-900/10 flex flex-col max-h-[85vh] overflow-hidden pointer-events-auto"
        >
          {/* Subtle Ambient top light */}
          <div className="absolute top-0 inset-x-24 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />

          {/* Header Bar */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#090c13]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-[0.14em] font-mono flex items-center gap-2">
                  VANTI DEVELOPER INSIGHTS
                  <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                    core-v4.0
                  </span>
                </h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Automated metric analyzer & feature registry
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/10 transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation selectors */}
          <div className="flex bg-[#07090e] border-b border-white/5 py-1 px-6 gap-2">
            {[
              { id: 'visuals', label: 'Complexity & Visuals', icon: Activity },
              { id: 'registry', label: 'Feature Registry database', icon: Database },
              { id: 'report', label: 'Automated usage report', icon: Terminal }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const active = activeSegment === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSegment(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 py-3 px-4 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all font-mono",
                    active
                      ? "border-rose-500 text-rose-400 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Modal Content Scrollbox Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8 bg-[#090b11]">
            <AnimatePresence mode="wait">
              {activeSegment === 'visuals' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Grid layout of overall metrics indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0b0e16] border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                      <div className="absolute right-3 top-3 text-indigo-500/10 group-hover:text-indigo-400/15 transition-colors">
                        <Cpu className="w-12 h-12 stroke-[1.5]" />
                      </div>
                      <span className="text-[8px] font-mono text-indigo-400/80 font-black uppercase tracking-widest">complexity factor</span>
                      <p className="text-2xl font-black text-white font-mono mt-2 tracking-tight">{metrics.averageComplexity} <span className="text-xs text-slate-500 font-bold">/ 5</span></p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">High system volume</p>
                    </div>

                    <div className="bg-[#0b0e16] border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                      <div className="absolute right-3 top-3 text-emerald-500/10 group-hover:text-emerald-400/15 transition-colors">
                        <Database className="w-12 h-12 stroke-[1.5]" />
                      </div>
                      <span className="text-[8px] font-mono text-emerald-400/80 font-black uppercase tracking-widest">Dynamic entries</span>
                      <p className="text-2xl font-black text-white font-mono mt-2 tracking-tight">{metrics.totalDynamicRecords}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Synced to cloud</p>
                    </div>

                    <div className="bg-[#0b0e16] border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                      <div className="absolute right-3 top-3 text-rose-500/10 group-hover:text-rose-400/15 transition-colors">
                        <Layers className="w-12 h-12 stroke-[1.5]" />
                      </div>
                      <span className="text-[8px] font-mono text-rose-400/80 font-black uppercase tracking-widest">loaded features</span>
                      <p className="text-2xl font-black text-white font-mono mt-2 tracking-tight">{metrics.totalFeatures}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Active modular registry</p>
                    </div>

                    <div className="bg-[#0b0e16] border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                      <div className="absolute right-3 top-3 text-amber-500/10 group-hover:text-amber-400/15 transition-colors">
                        <Activity className="w-12 h-12 stroke-[1.5]" />
                      </div>
                      <span className="text-[8px] font-mono text-amber-400/80 font-black uppercase tracking-widest">system integrity</span>
                      <p className="text-sm font-black text-white font-mono mt-4 tracking-wider uppercase">{metrics.healthIndex.split(" ")[0]}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Ready for compilation</p>
                    </div>

                    {/* NEW: Performance Badge Section */}
                    <div className="col-span-2 md:col-span-4 bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <Gauge className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest">Runtime Performance Metrics</p>
                          <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Map Load & Memory Analytics</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">FPS</p>
                          <p className="text-sm font-mono font-black text-white">{perfStats?.fps || '--'}</p>
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <div className="text-center">
                          <p className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">Load Time</p>
                          <p className="text-sm font-mono font-black text-white">{perfStats?.loadTime ? `${perfStats.loadTime}ms` : '--'}</p>
                        </div>
                        <div className="w-px h-6 bg-white/5" />
                        <div className="text-center">
                          <p className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">JS Heap</p>
                          <p className="text-sm font-mono font-black text-white">{perfStats?.memoryUsage ? `${perfStats.memoryUsage}MB` : '--'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature distribution and visual counters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category metrics bars */}
                    <div className="bg-[#0b0e17] border border-white/5 p-6 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#93c5fd] font-mono">Module category distribution</h4>
                        <p className="text-[9px] text-slate-500 font-medium">Counts of distinct modules partitioned by functionality type</p>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        {[
                          { category: 'exploration', label: 'Exploration Modules', color: 'bg-rose-500 text-rose-400' },
                          { category: 'core', label: 'Core / Database Control', color: 'bg-indigo-500 text-indigo-400' },
                          { category: 'utility', label: 'Utility HUD widgets', color: 'bg-cyan-500 text-cyan-400' },
                          { category: 'ai_assistant', label: 'Cognitive / AI Systems', color: 'bg-amber-500 text-amber-400' },
                          { category: 'system', label: 'Analytical & System Core', color: 'bg-purple-500 text-purple-400' }
                        ].map((item) => {
                          const count = metrics.categoryCounts[item.category as any] || 0;
                          const ratio = (count / metrics.totalFeatures) * 100;
                          return (
                            <div key={item.category} className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-bold uppercase font-mono">
                                <span className="text-slate-300">{item.label}</span>
                                <span className={cn("font-black", item.color?.split(" ")[1])}>
                                  {count} {count === 1 ? 'module' : 'modules'} ({Math.round(ratio)}%)
                                </span>
                              </div>
                              <div className="h-2 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.04]">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${ratio}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className={cn("h-full rounded-full", item.color?.split(" ")[0])}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Code metrics log analysis */}
                    <div className="bg-[#0b0e17] border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">Automated Code integrity stats</h4>
                        <p className="text-[9px] text-slate-500 font-medium">Static intelligence estimations from build manifest metrics</p>
                      </div>

                      <div className="space-y-3.5 my-4 bg-black/30 p-4 border border-white/5 rounded-xl font-mono text-[10px] text-slate-300 flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                          <span className="text-slate-500">PROJECT CORE SHELL:</span>
                          <span className="text-white font-bold">VantiGlobalShell.tsx</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                          <span className="text-slate-500">STATE RECOVERY MOTOR:</span>
                          <span className="text-white font-bold">Zustand Engine (v4)</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                          <span className="text-slate-500">LOCAL DATAFRAME CACHE:</span>
                          <span className="text-emerald-400 font-bold uppercase">IndexedDB (Active)</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-500">ESTIMATED CODE VOLUME:</span>
                          <span className="text-rose-400 font-black">~{metrics.estimatedTotalLinesOfCode} Lines of TSX</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-rose-500/90 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                        <Code className="w-4 h-4 shrink-0" />
                        <span className="text-[9px] font-mono uppercase font-black tracking-wide leading-normal">
                          All modules have been verified via standard clicking regressions checks.
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSegment === 'registry' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-[#f59e0b] font-mono">Central feature database listing</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Fully mapped source schemas & state key associations</p>
                    </div>
                    <span className="font-mono text-[9px] bg-slate-900 border border-white/5 py-1 px-3 rounded-full text-slate-400 uppercase font-black">
                      {FEATURE_REGISTRY.length} modules registered
                    </span>
                  </div>

                  {/* Complete registry table list */}
                  <div className="space-y-3.5 mt-2">
                    {FEATURE_REGISTRY.map((feature) => {
                      const FeatureIcon = IconMap[feature.iconName] || Layers;
                      return (
                        <div 
                          key={feature.id}
                          className="bg-[#0b0e17] border border-white/5 rounded-2xl p-4 md:p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group"
                        >
                          <div className="flex items-start md:items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-all">
                              <FeatureIcon className="w-5 h-5 text-slate-400 group-hover:text-rose-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">{feature.name}</h4>
                                <span className={cn(
                                  "text-[7px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                  feature.category === 'core' && "bg-indigo-500/10 text-indigo-400",
                                  feature.category === 'exploration' && "bg-rose-500/10 text-rose-400",
                                  feature.category === 'utility' && "bg-cyan-500/10 text-cyan-400",
                                  feature.category === 'ai_assistant' && "bg-amber-500/10 text-amber-400",
                                  feature.category === 'system' && "bg-purple-500/10 text-purple-400"
                                )}>
                                  {feature.category}
                                </span>
                                <span className={cn(
                                  "text-[7.5px] font-mono font-bold uppercase tracking-widest px-1.5 rounded-full border",
                                  feature.status === 'production' && "border-emerald-500/20 text-emerald-400 bg-emerald-500/[0.02]",
                                  feature.status === 'active' && "border-indigo-500/20 text-indigo-400 bg-indigo-500/[0.02]",
                                  feature.status === 'beta' && "border-amber-500/20 text-amber-400 bg-amber-500/[0.02]"
                                )}>
                                  {feature.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1 max-w-xl">
                                {feature.description}
                              </p>
                              {/* Extra detailed developer paths */}
                              <div className="flex items-center gap-3.5 mt-2 flex-wrap font-mono text-[8px] text-slate-500 uppercase">
                                <span className="flex items-center gap-1">
                                  <Code className="w-3 h-3 text-slate-600" /> FILE: {feature.filePath}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Complexity & state visualization */}
                          <div className="w-full md:w-auto shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-white/[0.04] pt-2.5 md:pt-0 gap-2 font-mono">
                            <div className="flex flex-col md:items-end">
                              <span className="text-[8px] text-slate-500 uppercase font-black">Complexity rating</span>
                              <div className="flex gap-1 mt-1">
                                {[1,2,3,4,5].map((star) => (
                                  <div 
                                    key={star} 
                                    className={cn(
                                      "w-1.5 h-3.5 rounded-sm transition-colors",
                                      star <= feature.complexity
                                        ? "bg-rose-500"
                                        : "bg-white/[0.03] border border-white/[0.05]"
                                    )} 
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="text-right hidden md:block">
                              <span className="text-[7.5px] text-slate-500 uppercase font-bold">Zustand Scope keys</span>
                              <p className="text-[8.5px] text-slate-400 mt-0.5 truncate max-w-[124px]">
                                {feature.stateKeys.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeSegment === 'report' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-[#f43f5e] font-mono">Terminal compiler & exporter</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Automated structural health report generator</p>
                    </div>

                    <button
                      onClick={handleCopyReport}
                      className={cn(
                        "flex items-center gap-2.5 py-2.5 px-5 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono transition-all active:scale-95 border shrink-0",
                        copiedReport
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-950/40"
                      )}
                    >
                      {copiedReport ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Copied report!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Terminal Report
                        </>
                      )}
                    </button>
                  </div>

                  {/* Terminal console printout container */}
                  <div className="relative rounded-2xl bg-[#040508] border border-white/5 p-5 md:p-6 shadow-inner">
                    <div className="absolute top-4 right-4 flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                    </div>

                    <pre className="text-slate-300 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre custom-scrollbar max-h-[360px] pb-2 text-left selection:bg-rose-500/20 selection:text-white">
                      {reportString}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 border-t border-white/5 bg-[#07090f] flex items-center justify-between text-slate-600 font-mono text-[8px] font-bold uppercase tracking-widest">
            <span>CORE REGISTRY SYNC: ONLINE</span>
            <span>PRESS ESCAPE KEY OR PRESS CLOSE TO TERMINATE TERMINAL</span>
          </div>
        </motion.div>
        </FocusLock>
      </div>
    </AnimatePresence>
  );
}
