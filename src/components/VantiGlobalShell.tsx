import React, { ReactNode, useEffect, useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { useThemeManager } from '../hooks/useThemeManager';
import { useAdaptiveScaling } from '../hooks/useAdaptiveScaling';
import { useViewportLayoutManager } from '../hooks/useViewportLayoutManager';
import { useSwipe } from '../hooks/useSwipe';
import { Compass, ShieldAlert, Cpu, Database, Wifi, CloudOff, Cloud, Check, Route, Sparkles, Loader2 } from 'lucide-react';
import { subscribeToCloudStatus } from '../lib/firebase';

// Lazy Load non-essential features to prioritize core shell interactivity
const MyTripSidebar = lazy(() => import('./MyTripSidebar').then(m => ({ default: m.MyTripSidebar })));
const AITravelPlannerSidebar = lazy(() => import('./AITravelPlannerSidebar').then(m => ({ default: m.AITravelPlannerSidebar })));
const TravelInsightsDrawer = lazy(() => import('./TravelInsightsDrawer').then(m => ({ default: m.TravelInsightsDrawer })));
const GaussianSplatOverlay = lazy(() => import('./GaussianSplatOverlay').then(m => ({ default: m.GaussianSplatOverlay })));

import { AreaVibeOverlay } from './AreaVibeOverlay';
import { SpatialTelemetry } from './VantiMap';
import { cn } from '../lib/utils';
import { BarChart3 } from 'lucide-react';

// Core Shell Fallback for Lazy Components
const HUDComponentFallback = () => (
  <div className="w-10 h-10 flex items-center justify-center">
    <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
  </div>
);

interface VantiGlobalShellProps {
  children: ReactNode;
  bottomNavigation?: ReactNode;
}

export function VantiGlobalShell({ children, bottomNavigation }: VantiGlobalShellProps) {
  useViewportLayoutManager();
  const travelStyle = useVantiStore((state) => state.travelStyle);
  const isInitializing = useVantiStore((state) => state.isInitializing);
  const setIsInitializing = useVantiStore((state) => state.setIsInitializing);
  const { isDarkMode, timePhase } = useThemeManager();
  const [activeStep, setActiveStep] = useState(0);
  const [cloudStatus, setCloudStatus] = useState<boolean | 'loading'>('loading');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const moodClass = travelStyle === 'High-Contrast' ? 'mood-noir' : `mood-${travelStyle.toLowerCase().replace(' ', '-')}`;

  const itineraryCount = useVantiStore((state) => state.itinerary.length);
  const showTripSidebar = useVantiStore((state) => state.showTripSidebar);
  const setShowTripSidebar = useVantiStore((state) => state.setShowTripSidebar);
  const showAITripSidebar = useVantiStore((state) => state.showAITripSidebar);
  const setShowAITripSidebar = useVantiStore((state) => state.setShowAITripSidebar);
  const isInsightsDrawerOpen = useVantiStore((state) => state.isInsightsDrawerOpen);
  const setIsInsightsDrawerOpen = useVantiStore((state) => state.setIsInsightsDrawerOpen);
  const isSwitchingMode = useVantiStore((state) => state.isSwitchingMode);
  const activeMode = useVantiStore((state) => state.activeMode);
  const closeAllOverlays = useVantiStore((state) => state.closeAllOverlays);

  const isOperationsHubOpen = useVantiStore((state) => state.isOperationsHubOpen);
  const setIsOperationsHubOpen = useVantiStore((state) => state.setIsOperationsHubOpen!);
  
  const isAROpen = useVantiStore((state) => state.isAROpen);
  const isGaussianActive = useVantiStore((state) => state.isGaussianActive);
  const isGaussianActiveStore = useVantiStore((state) => state.isGaussianActive); // Duplicate for safety if needed, but let's just use one.
  const setIsAROpen = useVantiStore((state) => state.setIsAROpen);
  
  const isAtmosphereOpen = useVantiStore((state) => state.isAtmosphereOpen);
  const setIsAtmosphereOpen = useVantiStore((state) => state.setIsAtmosphereOpen!);

  useAdaptiveScaling();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllOverlays();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeAllOverlays]);

  useSwipe({
    edgeThreshold: 40,
    onSwipeRight: () => {
      // Swiping right from left edge triggers Operations Hub
      setIsOperationsHubOpen(!isOperationsHubOpen);
    },
    onSwipeUp: () => {
      // Swipe up for AR Lens
      if (!isAROpen) setIsAROpen(true);
    },
    onSwipeDown: () => {
      // Swipe down for Atmosphere
      if (!isAtmosphereOpen) setIsAtmosphereOpen(true);
    }
  });

  useEffect(() => {
    return subscribeToCloudStatus((connected) => {
      setCloudStatus(connected);
    });
  }, []);

  // Safety loading screen dismiss fallback
  useEffect(() => {
    if (isInitializing) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isInitializing, setIsInitializing]);

  // Cycle through high-precision status messages while initializing
  useEffect(() => {
    if (!isInitializing) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 450);
    return () => clearInterval(interval);
  }, [isInitializing]);

  const steps = [
    { text: 'ARCHITECTING SPATIAL JOURNEY', icon: Cpu },
    { text: 'CALIBRATING PRECISION GEOMETRY', icon: Compass },
    { text: 'SYNCHRONIZING VANTI REGISTRY', icon: Database },
    { text: 'ESTABLISHING SECURE SIGNAL', icon: Wifi }
  ];

  const CurrentStepIcon = steps[activeStep].icon;

  return (
    <div 
      className={cn("relative w-full flex flex-col items-stretch transition-colors duration-1000 overflow-hidden", moodClass)}
      style={{
        height: 'calc(var(--vh, 1vh) * 100)',
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        '--mouse-x': `${mousePos.x}px`,
        '--mouse-y': `${mousePos.y}px`
      } as React.CSSProperties}
    >
      {/* VANTI ADVANCED SKELETON HUD (mimics final layout structure while initializing) */}
      <AnimatePresence>
        {isInitializing && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.05, 
              filter: 'blur(20px)',
              transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] } 
            }}
            className="absolute inset-0 z-[200] bg-[#07090d]/80 backdrop-blur-xl flex flex-col items-stretch select-none overflow-hidden touch-none"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Top HUD Skeleton */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 pt-[env(safe-area-inset-top,24px)] flex justify-between items-start">
               <div className="flex flex-col gap-4">
                  <div className="w-48 h-14 rounded-2xl bg-white/5 vanti-skeleton-shimmer border border-white/5" />
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-10 rounded-2xl bg-white/5 vanti-skeleton-shimmer border border-white/5" />
                    <div className="w-40 h-10 rounded-2xl bg-white/5 vanti-skeleton-shimmer border border-white/5" />
                  </div>
               </div>
               <div className="w-36 h-10 rounded-2xl bg-white/5 vanti-skeleton-shimmer border border-white/5" />
            </div>

            {/* Central Precision Radar Indicator */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
               <div className="relative w-64 h-64 rounded-full border border-white/5 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500/40"
                  />
                  <div className="text-center">
                    <div className="text-[10px] font-black tracking-[0.2em] text-white/40 mb-2 font-mono">{steps[activeStep].text}</div>
                    <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: '100%' }}
                         transition={{ duration: 3.5, ease: "linear" }}
                         className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                       />
                    </div>
                  </div>
               </div>
            </div>

            {/* Bottom HUD Skeleton */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-[env(safe-area-inset-bottom,32px)] flex justify-center">
               <div className="w-full max-w-lg h-20 rounded-3xl bg-white/5 vanti-skeleton-shimmer border border-white/5 flex items-center justify-around px-8">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5" />
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Vignette & Grain */}
      <div className="absolute inset-0 pointer-events-none z-[120] glass-vignette opacity-60" />
      <div className="absolute inset-0 pointer-events-none z-[120] opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />


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

      {/* Switching/Loading Skeleton Overlay */}
      <AnimatePresence>
        {isSwitchingMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[180] bg-[#0c0e12]/30 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full border border-white/5 vanti-radar-glow" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   className="w-8 h-8 rounded-full border-2 border-slate-500 border-t-rose-500"
                 />
                 <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">Syncing Nodes</span>
              </div>
            </div>
            {/* Subtle skeleton shapes appearing over the map area */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-rose-500/10 blur-[100px]" 
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Base Layer for Map */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AreaVibeOverlay />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{ 
              duration: 0.45, 
              ease: [0.23, 1, 0.32, 1] 
            }}
            className="absolute inset-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interaction Overlay Root - High Depth Layer Stack */}
      <div 
        className="InteractionOverlayRoot absolute inset-0 z-[150] pointer-events-none flex flex-col overflow-hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)'
        }}
      >
        {/* Top HUD Cluster */}
        <div className="p-6 flex justify-between items-start">
           <div className="flex flex-col gap-4 pointer-events-auto">
              <VantiBrandLogo />
              <div className="flex items-start gap-4">
                 <AreaVibeOverlay />
                 <SpatialTelemetry />
              </div>
           </div>
           <div className="pointer-events-auto">
              <CloudStatusIndicator status={cloudStatus} />
           </div>
        </div>

        <div className="flex-1" />

        {/* Bottom Persistent Navigation */}
        <footer className="w-full flex justify-center pb-8 md:pb-12 px-6 pointer-events-none">
           <div className="pointer-events-auto">
              {bottomNavigation}
           </div>
        </footer>
      </div>

      {/* Primary Sidebars & Drawers (Z-[190]+) */}
      <Suspense fallback={<HUDComponentFallback />}>
        <MyTripSidebar 
          isOpen={showTripSidebar} 
          onClose={() => setShowTripSidebar(false)} 
        />

        <AITravelPlannerSidebar />
        
        {/* 3D Visual Layers */}
        {isGaussianActive && <GaussianSplatOverlay />}

        <TravelInsightsDrawer
          isOpen={isInsightsDrawerOpen}
          onClose={() => setIsInsightsDrawerOpen(false)}
        />
      </Suspense>
    </div>
  );
}

// Local HUD Sub-components for cleaner shell
function VantiBrandLogo() {
  return (
    <div className="vanti-glass px-4 py-2 rounded-2xl flex items-center gap-3 border-white/5 shadow-none backdrop-blur-3xl">
      <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
        <Compass className="w-5 h-5 text-rose-500 animate-pulse-soft" />
      </div>
      <div className="flex flex-col select-none">
        <span className="text-[12px] font-black text-white/90 tracking-tighter font-display uppercase leading-none">VANTI</span>
        <span className="text-[8px] text-white/30 font-mono tracking-widest uppercase leading-none mt-0.5">TRIP ENGINE</span>
      </div>
    </div>
  );
}

function CloudStatusIndicator({ status }: { status: boolean | 'loading' }) {
  return (
    <div className={cn(
      "px-4 py-2 rounded-2xl vanti-glass flex items-center gap-2 border-white/5 shadow-none transition-colors duration-500",
      status === true ? 'text-emerald-400' : status === false ? 'text-rose-400' : 'text-white/20'
    )}>
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" />
      <span className="text-[10px] font-black tracking-widest uppercase font-mono">
        {status === true ? 'LINK ESTABLISHED' : status === false ? 'LOCAL MODE' : 'SYNCING...'}
      </span>
    </div>
  );
}
