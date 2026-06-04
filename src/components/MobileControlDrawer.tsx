import React from 'react';
import { Download, Layers, Eye, EyeOff, Settings, Box, Mountain, X, Sparkles, Map as MapIcon, Plane, Battery, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { cn } from '../lib/utils';

export default function MobileControlDrawer({
  isOpen,
  onClose,
  onDownload,
  isDownloading,
  onToggleMapType,
  setMapTheme,
  onTogglePois,
  onToggle3D,
  onToggleTerrain,
  showPois,
  is3DActive,
  isTerrainActive,
  isFlightMode,
  onToggleFlightMode,
  currentMapType,
  currentTheme,
  isPowerEfficiencyEnabled,
  onTogglePowerEfficiency,
  themeOverride,
  onThemeOverrideChange,
  onOpenSettings,
  recentSearches
}: {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  onToggleMapType: () => void;
  setMapTheme: (theme: string) => void;
  onTogglePois: () => void;
  onToggle3D: () => void;
  onToggleTerrain: () => void;
  onToggleFlightMode: () => void;
  showPois: boolean;
  is3DActive: boolean;
  isTerrainActive: boolean;
  isFlightMode: boolean;
  currentMapType: string;
  currentTheme: string;
  isPowerEfficiencyEnabled: boolean;
  onTogglePowerEfficiency: () => void;
  themeOverride: 'Auto' | 'Light' | 'Dark';
  onThemeOverrideChange: (mode: 'Auto' | 'Light' | 'Dark') => void;
  onOpenSettings: () => void;
  recentSearches: { id: string; query: string; timestamp: number }[];
}) {
  const themes = ['Default', 'Night', 'Silver', 'Retro', 'Simulation', 'Genie', 'Cosmic', 'Neo-Tokyo', 'Midnight', 'Sketch'];

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock returnFocus>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 1 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1117] rounded-t-[2.5rem] shadow-2xl border-t border-white/5 pb-safe"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-4" />

            <div className="px-8 pb-[env(safe-area-inset-bottom,3rem)]">
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">System Config</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Operational Parameters</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onOpenSettings();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all font-mono text-[9px] font-black uppercase tracking-wider"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Preferences</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onClose();
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90"
                  >
                    <X className="w-5 h-5 pointer-events-none"/>
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {/* Mode Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggle3D();
                    }} 
                    className={cn(
                      "flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer min-h-[48px]", 
                      is3DActive ? "bg-rose-500/10 border-rose-500/20 text-white" : "bg-white/5 border-transparent text-slate-400 hover:text-white"
                    )}
                  >
                    <Box className={cn("w-5 h-5", is3DActive ? "text-rose-500" : "text-slate-500")} />
                    <span className="text-xs font-bold uppercase tracking-tight">3D Buildings</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggleTerrain();
                    }} 
                    className={cn(
                      "flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer min-h-[48px]", 
                      isTerrainActive ? "bg-emerald-500/10 border-emerald-500/20 text-white" : "bg-white/5 border-transparent text-slate-400 hover:text-white"
                    )}
                  >
                    <Mountain className={cn("w-5 h-5", isTerrainActive ? "text-emerald-500" : "text-slate-500")} />
                    <span className="text-xs font-bold uppercase tracking-tight">Elevation Layer</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggleFlightMode();
                    }} 
                    className={cn(
                      "flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer min-h-[48px]", 
                      isFlightMode ? "bg-blue-500/10 border-blue-500/20 text-white" : "bg-white/5 border-transparent text-slate-400 hover:text-white"
                    )}
                  >
                    <Plane className={cn("w-5 h-5", isFlightMode ? "text-blue-500" : "text-slate-500")} />
                    <span className="text-xs font-bold uppercase tracking-tight">Flight Assist</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onTogglePowerEfficiency();
                    }} 
                    className={cn(
                      "flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer min-h-[48px]", 
                      isPowerEfficiencyEnabled ? "bg-amber-500/10 border-amber-500/20 text-white" : "bg-white/5 border-transparent text-slate-400 hover:text-white"
                    )}
                  >
                    <Battery className={cn("w-5 h-5", isPowerEfficiencyEnabled ? "text-amber-500" : "text-slate-500")} />
                    <span className="text-xs font-bold uppercase tracking-tight">Power Save</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onTogglePois();
                    }} 
                    className={cn(
                      "flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer min-h-[48px] col-span-2", 
                      showPois ? "bg-purple-500/10 border-purple-500/20 text-white" : "bg-white/5 border-transparent text-slate-400 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {showPois ? <Eye className="w-5 h-5 text-purple-500" /> : <EyeOff className="w-5 h-5 text-slate-500" />}
                      <span className="text-xs font-bold uppercase tracking-tight">Points of Interest (Landmarks)</span>
                    </div>
                  </button>
                </div>

                {/* Theme Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-rose-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Theme Mode</span>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        {(['Auto', 'Light', 'Dark'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onThemeOverrideChange(mode);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all min-h-[36px] flex items-center justify-center cursor-pointer",
                              themeOverride === mode ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <MapIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment Skin</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {themes.map(t => (
                      <button 
                        key={t} 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setMapTheme(t);
                        }} 
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all uppercase tracking-tighter cursor-pointer min-h-[44px] flex items-center justify-center",
                          currentTheme === t ? "bg-white text-black" : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDownload();
                    }} 
                    disabled={isDownloading} 
                    className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl text-white group hover:bg-white/10 transition-all min-h-[44px] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-rose-500" />
                      <span className="text-xs font-bold uppercase tracking-tight">{isDownloading ? 'Syncing...' : 'Cache Offline Area'}</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-rose-500/50" />
                  </button>

                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Activity</span>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.slice(0, 5).map((rs, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-400 p-2 bg-white/5 rounded-lg">
                          <span className="truncate">{rs.query}</span>
                          <span className="text-[9px] text-slate-600">{new Date(rs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                      {recentSearches.length === 0 && (
                        <span className="text-[10px] text-slate-600">No recent activity</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
}
