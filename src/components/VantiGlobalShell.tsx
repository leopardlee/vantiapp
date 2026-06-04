import React, { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { Compass, ShieldAlert, Cpu, Database, Wifi, CloudOff, Cloud, Check, Route } from 'lucide-react';
import { subscribeToCloudStatus } from '../lib/firebase';
import { MyTripSidebar } from './MyTripSidebar';
import { cn } from '../lib/utils';

interface VantiGlobalShellProps {
  children: ReactNode;
  bottomNavigation?: ReactNode;
}

export function VantiGlobalShell({ children, bottomNavigation }: VantiGlobalShellProps) {
  const isInitializing = useVantiStore((state) => state.isInitializing);
  const [activeStep, setActiveStep] = useState(0);
  const [cloudStatus, setCloudStatus] = useState<boolean | 'loading'>('loading');
  
  const itineraryCount = useVantiStore((state) => state.itinerary.length);
  const showTripSidebar = useVantiStore((state) => state.showTripSidebar);
  const setShowTripSidebar = useVantiStore((state) => state.setShowTripSidebar);

  useEffect(() => {
    return subscribeToCloudStatus((connected) => {
      setCloudStatus(connected);
    });
  }, []);

  // Cycle through high-precision status messages while initializing
  useEffect(() => {
    if (!isInitializing) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 450);
    return () => clearInterval(interval);
  }, [isInitializing]);

  const steps = [
    { text: 'SYSTEM CHECK: SECURE GEOPROCESSOR', icon: Cpu },
    { text: 'RASTERIZING VIEWPORT VECTOR MATRICES', icon: Compass },
    { text: 'LOADING LOCAL OFFLINE PLACE STORES', icon: Database },
    { text: 'ESTABLISHING SECURE DEEPMIND TELEMETRY', icon: Wifi }
  ];

  const CurrentStepIcon = steps[activeStep].icon;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0c10] flex flex-col items-stretch pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Custom Styles for Shimmer and Slowly Rotating Rings */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vanti-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .vanti-skeleton-shimmer {
          background: linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0.015) 25%, 
            rgba(255, 255, 255, 0.062) 50%, 
            rgba(255, 255, 255, 0.015) 75%
          );
          background-size: 200% 100%;
          animation: vanti-shimmer 2s infinite linear;
        }
        @keyframes radar-pulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.08); opacity: 0.52; }
        }
        .vanti-radar-glow {
          animation: radar-pulse 3s infinite ease-in-out;
        }
      `}} />

      {/* Persistent Base Layer for Map */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {children}
      </div>

      {/* Interactive Telemetry Loading Skeleton Screen (Z-index: 200) */}
      <AnimatePresence>
        {isInitializing && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.05, 
              filter: 'blur(8px)',
              transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] } 
            }}
            className="absolute inset-0 z-[200] bg-[#0c0e12]/98 flex flex-col items-stretch select-none overflow-hidden touch-none"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Top HUD Layout Skeleton */}
            <div className="absolute top-4 left-4 right-4 z-[210] flex flex-col gap-4">
              <div className="flex items-center justify-between w-full">
                {/* Cloud Status Indicator */}
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all duration-500 ${
                  cloudStatus === true 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : cloudStatus === false
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                      : 'bg-slate-500/10 border-slate-500/10 text-slate-500'
                }`}>
                  {cloudStatus === true ? (
                    <div className="relative">
                      <Cloud className="w-3.5 h-3.5" />
                      <Check className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-emerald-500 bg-[#0c0e12] rounded-full p-[0.5px]" />
                    </div>
                  ) : cloudStatus === false ? (
                    <CloudOff className="w-3.5 h-3.5 animate-pulse" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] font-black tracking-widest uppercase font-mono">
                    {cloudStatus === true ? 'Cloud Online' : cloudStatus === false ? 'Cloud Offline' : 'Syncing...'}
                  </span>
                </div>

                {/* HUD Toggle for My Trip Sidebar */}
                {!isInitializing && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTripSidebar(!showTripSidebar)}
                    className={cn(
                      "px-4 py-2 rounded-2xl border transition-all flex items-center gap-2 pointer-events-auto shadow-lg",
                      showTripSidebar 
                        ? "bg-rose-500 border-rose-400 text-white shadow-rose-900/40" 
                        : "bg-[#121620]/80 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    <Route className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">My Trip ({itineraryCount})</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Top HUD Layout Skeleton */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between w-full pt-[env(safe-area-inset-top,0px)]">
                {/* Brand Selector Skeleton */}
                <div className="bg-[#121620]/75 border border-white/5 rounded-2xl h-12 w-36 px-4 flex items-center gap-3 relative overflow-hidden">
                  <div className="absolute inset-0 vanti-skeleton-shimmer" />
                  <div className="w-8 h-8 rounded-full bg-slate-800/80 animate-pulse shrink-0 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-slate-600 animate-spin-slow" />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 select-none">
                    <div className="h-2.5 w-14 bg-slate-800 rounded-full" />
                    <div className="h-2 w-10 bg-slate-800/60 rounded-full" />
                  </div>
                </div>

                {/* Searchhud Capsule Skeleton */}
                <div className="flex-1 max-w-[300px] md:max-w-[420px] mx-auto relative">
                  <div className="bg-[#121620]/75 border border-white/5 rounded-2xl h-12 flex items-center px-4 gap-3 relative overflow-hidden">
                    <div className="absolute inset-0 vanti-skeleton-shimmer" />
                    <div className="w-4 h-4 rounded-full bg-slate-800 animate-pulse shrink-0" />
                    <div className="h-3 w-32 bg-slate-800 rounded-full" />
                  </div>
                </div>

                {/* Rightmost padding alignment card */}
                <div className="w-10 h-10 rounded-xl bg-[#121620]/75 border border-white/5 flex items-center justify-center opacity-0 uppercase" />
              </div>
            </div>

            {/* Central Holographic Spatial Radar Indicator */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Outer grid circles representing satellite calibration sweep */}
              <div className="relative flex items-center justify-center w-72 h-72 rounded-full border border-white/[0.02] bg-radial from-slate-900/10 to-transparent">
                <div className="absolute inset-2 rounded-full border border-rose-500/5 uppercase font-mono text-[6px] tracking-widest text-center flex items-center justify-center">
                  <span className="opacity-0">VAN-t OS V.3.5</span>
                </div>
                {/* Main Scanning Radar Rings */}
                <div className="absolute inset-10 rounded-full border border-dashed border-rose-500/10 animate-spin-slow" />
                <div className="absolute inset-16 rounded-full border border-white/5" />
                <div className="absolute inset-24 rounded-full border border-[#00ffff]/10 vanti-radar-glow flex items-center justify-center">
                  {/* Innermost holographic dot */}
                  <div className="w-3 h-3 rounded-full bg-rose-500/40 animate-ping absolute" />
                  <div className="w-2 h-2 rounded-full bg-rose-500 pointer-events-none" />
                </div>

                {/* Sweeping radar radial bar */}
                <div 
                  className="absolute top-1/2 left-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-rose-500/60 origin-left"
                  style={{ transform: 'rotate(45deg)', animation: 'spin 4s infinite linear' }}
                />
              </div>

              {/* Status Log Console Panel */}
              <div className="mt-8 flex flex-col items-center gap-2 max-w-sm px-6 text-center select-none">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full">
                  <CurrentStepIcon className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                  <span className="text-[9px] font-black font-mono tracking-[0.16em] text-slate-300">
                    {steps[activeStep].text}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Calibrating Map Nodes... Please wait
                </div>
              </div>
            </div>

            {/* Right-hand side vertical control stack Skeleton */}
            <div className="absolute top-[45%] -translate-y-1/2 right-4 md:right-6 flex flex-col gap-3 items-end pointer-events-none">
              <div className="bg-[#121620]/75 border border-white/5 rounded-full p-2 flex flex-col gap-2 items-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 vanti-skeleton-shimmer" />
                <div className="w-8 h-8 rounded-full bg-slate-800" />
                <div className="w-8 h-8 rounded-full bg-slate-800" />
                <div className="w-8 h-8 rounded-full bg-slate-800" />
                <div className="w-8 h-8 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* Bottom Nav Skeleton */}
            <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[340px] px-4 flex justify-center pb-2 z-10">
              <div className="bg-[#121620]/75 border border-white/5 rounded-full h-14 w-full flex items-center justify-between px-6 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 vanti-skeleton-shimmer" />
                <div className="w-7 h-7 rounded-full bg-slate-800" />
                <div className="w-7 h-7 rounded-full bg-slate-800" />
                <div className="w-7 h-7 rounded-full bg-slate-800" />
                <div className="w-7 h-7 rounded-full bg-slate-800" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interaction Overlay Root - Flex Container */}
      <div 
        className="InteractionOverlayRoot relative z-[150] h-full w-full pointer-events-none flex flex-col overflow-hidden"
        style={{ pointerEvents: 'none' }}
      >
        {/* Flexible middle area (transparent to events) */}
        <main className="flex-1 overflow-hidden relative" style={{ pointerEvents: 'none' }} />

        {/* Bottom Navigation Area - Anchored to bottom with safe-area padding */}
        <footer className="shrink-0 w-full flex flex-col justify-end items-center gap-4 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-12" style={{ pointerEvents: 'none' }}>
          <div className="w-full flex justify-center" style={{ pointerEvents: 'none' }}>
            {bottomNavigation}
          </div>
        </footer>
      </div>

      {/* Persistent Trip Planner Sidebar */}
      <MyTripSidebar 
        isOpen={showTripSidebar} 
        onClose={() => setShowTripSidebar(false)} 
      />
    </div>
  );
}
