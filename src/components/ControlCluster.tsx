import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, CloudRain, Shield, 
  Mic, History, Radio, Bell, 
  Cpu, Wallet, Award, Sparkles,
  Search, Scan, MapPin, RefreshCw, Loader2,
  BarChart3, Route, Share2, LayoutGrid, Palette
} from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';

// Safe Physical Haptic Feedback Trigger
const triggerHaptic = (type: 'tap' | 'switch' | 'success') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      if (type === 'tap') window.navigator.vibrate(10);
      else if (type === 'switch') window.navigator.vibrate([10, 10]);
      else if (type === 'success') window.navigator.vibrate([15, 30, 20]);
    } catch {
      // Ignored
    }
  }
};

export function ControlCluster() {
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  // State from store
  const isAROpen = useVantiStore(state => state.isAROpen);
  const setIsAROpen = useVantiStore(state => state.setIsAROpen);
  const isAtmosphereOpen = useVantiStore(state => state.isAtmosphereOpen);
  const setIsAtmosphereOpen = useVantiStore(state => state.setIsAtmosphereOpen);
  const isOperationsHubOpen = useVantiStore(state => state.isOperationsHubOpen);
  const setIsOperationsHubOpen = useVantiStore(state => state.setIsOperationsHubOpen);
  const quickPin = useVantiStore(state => state.quickPin);
  const mapViewport = useVantiStore(state => state.mapViewport);
  const mapTheme = useVantiStore(state => state.mapTheme);
  const travelStyle = useVantiStore(state => state.travelStyle);
  const setTravelStyle = useVantiStore(state => state.setTravelStyle);
  const [experienceMode, setExperienceMode] = useState<'Focus' | 'Discovery' | 'Planner'>('Focus');
  
  const toggleExperienceMode = () => {
    triggerHaptic('switch');
    const modes = ['Focus', 'Discovery', 'Planner'] as const;
    setExperienceMode(prev => modes[(modes.indexOf(prev) + 1) % modes.length]);
  };

  const cycleTravelStyle = () => {
    triggerHaptic('switch');
    const styles = ['Minimalist', 'Vibrant', 'High-Contrast'] as const;
    const nextStyle = styles[(styles.indexOf(travelStyle) + 1) % styles.length];
    setTravelStyle(nextStyle);
  };
  
  const moodLabel = { 'Minimalist': 'Zen', 'Vibrant': 'Vibrant', 'High-Contrast': 'Noir' }[travelStyle];
  const isMapDragging = useVantiStore(state => state.isMapDragging);
  const isVoiceSearchVisible = useVantiStore(state => state.isVoiceSearchVisible);
  const setIsVoiceSearchVisible = useVantiStore(state => state.setIsVoiceSearchVisible);
  const isRadarActive = useVantiStore(state => state.isRadarActive);
  const setIsRadarActive = useVantiStore(state => state.setIsRadarActive);
  const isGaussianActive = useVantiStore(state => state.isGaussianActive);
  const setIsGaussianActive = useVantiStore(state => state.setIsGaussianActive);
  const is3DActive = useVantiStore(state => state.is3DActive);
  const setIs3DActive = useVantiStore(state => state.setIs3DActive);

  // New states for expanded clustering
  const showTripSidebar = useVantiStore(state => state.showTripSidebar);
  const setShowTripSidebar = useVantiStore(state => state.setShowTripSidebar);
  const showAITripSidebar = useVantiStore(state => state.showAITripSidebar);
  const setShowAITripSidebar = useVantiStore(state => state.setShowAITripSidebar);
  const isInsightsDrawerOpen = useVantiStore(state => state.isInsightsDrawerOpen);
  const setIsInsightsDrawerOpen = useVantiStore(state => state.setIsInsightsDrawerOpen);
  const setIsPassportOpen = useVantiStore(state => state.setIsPassportOpen);
  const setIsJourneyRecapOpen = useVantiStore(state => state.setIsJourneyRecapOpen);
  const setIsFinanceTrackerVisible = useVantiStore(state => state.setIsFinanceTrackerVisible);
  const setIsExportModalOpen = useVantiStore(state => state.setIsExportModalOpen);

  const toggleCluster = (id: string) => {
    triggerHaptic('switch');
    if (activeCluster === id) {
      setActiveCluster(null);
    } else {
      setActiveCluster(id);
    }
  };

  const isLightMap = !['Night', 'Simulation', 'Genie', 'Cosmic', 'Neo-Tokyo', 'Midnight', 'High-Contrast'].includes(mapTheme);
  const inactiveLensClass = isLightMap 
    ? "glass-lens bg-black/40 text-slate-200 border-white/20 hover:text-white hover:bg-black/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)]" 
    : "glass-lens bg-white/10 text-slate-400 border-white/10 hover:text-white hover:bg-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  const handlePointerDown = (e: React.PointerEvent) => {
    // Start long press timer for quick-pinning
    longPressTimer.current = setTimeout(() => {
      if (mapViewport?.center) {
        setIsPinning(true);
        quickPin(mapViewport.center.lat, mapViewport.center.lng);
        // Visual feedback / Haptic simulation
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
        setTimeout(() => setIsPinning(false), 2000);
      }
    }, 800); // 800ms for long press
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsRefreshing(false);
  };

  const mainClusters = [
    {
      id: 'vision',
      icon: Scan,
      label: 'EXPLORE',
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]',
      actions: [
        { id: '3d', icon: Cpu, label: '3D View', active: is3DActive, onClick: () => setIs3DActive(!is3DActive) },
        { id: 'ar', icon: Camera, label: 'AR Lens', active: isAROpen, onClick: () => setIsAROpen(!isAROpen) },
        { id: 'scan', icon: MapPin, label: 'Photo Route', onClick: () => document.getElementById('location-scanner-input')?.click() },
        { id: 'voice', icon: Mic, label: 'Assistant', active: isVoiceSearchVisible, onClick: () => setIsVoiceSearchVisible(!isVoiceSearchVisible) }
      ]
    },
    {
      id: 'insights',
      icon: BarChart3,
      label: 'DATA',
      color: 'text-purple-400',
      activeColor: 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
      actions: [
        { id: 'insights-dr', icon: BarChart3, label: 'Insights', active: isInsightsDrawerOpen, onClick: () => setIsInsightsDrawerOpen?.(!isInsightsDrawerOpen) },
        { id: 'mode', icon: LayoutGrid, label: experienceMode, onClick: toggleExperienceMode },
        { id: 'vibe', icon: Palette, label: moodLabel, onClick: cycleTravelStyle },
        { id: 'smart-mood', icon: Sparkles, label: 'Smart Mood', active: useVantiStore(state => state.isVibeModeActive), onClick: () => useVantiStore.getState().setIsVibeModeActive?.(!useVantiStore.getState().isVibeModeActive) },
        { id: 'radar', icon: Radio, label: 'Radar', active: isRadarActive, onClick: () => setIsRadarActive?.(!isRadarActive) },
        { id: 'refresh', icon: RefreshCw, label: 'Refresh', active: isRefreshing, onClick: handleRefresh }
      ]
    },
    {
      id: 'planner',
      icon: Route,
      label: 'PLANS',
      color: 'text-rose-400',
      activeColor: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]',
      actions: [
        { id: 'mytrip', icon: Route, label: 'My Trip', active: showTripSidebar, onClick: () => setShowTripSidebar(!showTripSidebar) },
        { id: 'aiplanner', icon: Sparkles, label: 'AI Planner', active: showAITripSidebar, onClick: () => setShowAITripSidebar(!showAITripSidebar) },
        { id: 'recap', icon: History, label: 'Recap', onClick: () => setIsJourneyRecapOpen?.(true) },
        { id: 'export', icon: Share2, label: 'Export', onClick: () => setIsExportModalOpen?.(true) }
      ]
    },
    {
      id: 'systems',
      icon: Shield,
      label: 'SYSTEM',
      color: 'text-amber-400',
      activeColor: 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
      actions: [
        { id: 'ops', icon: Cpu, label: 'Ops Hub', active: isOperationsHubOpen, onClick: () => setIsOperationsHubOpen?.(!isOperationsHubOpen) },
        { id: 'finance', icon: Wallet, label: 'Finance', onClick: () => setIsFinanceTrackerVisible?.(true) },
        { id: 'passport', icon: Award, label: 'Passport', onClick: () => setIsPassportOpen?.(true) },
        { id: 'settings', icon: LayoutGrid, label: 'Grid', onClick: () => {} }
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: isMapDragging ? 0 : 1, y: isMapDragging ? 50 : 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-6 right-6 bottom-32 md:translate-x-0 z-[100] flex flex-col gap-4 transition-opacity duration-300",
        isMapDragging ? "pointer-events-none" : "pointer-events-auto"
      )}
    >
      {/* Pinning Toast Indicator */}
      <AnimatePresence>
        {isPinning && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg z-[110] flex items-center gap-2 whitespace-nowrap"
          >
            <MapPin className="w-3 h-3" />
            Pinned to Memory Trail
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clusters List */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        {mainClusters.map((cluster) => (
          <div key={cluster.id} className="relative flex items-center md:flex-row flex-row-reverse group/cluster">
            {/* Main Trigger Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={() => toggleCluster(cluster.id)}
              className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative z-10 shrink-0 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-95 active:brightness-125",
                activeCluster === cluster.id 
                  ? `${cluster.activeColor} border border-white/20 text-white` 
                  : inactiveLensClass
              )}
            >
              <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-active:opacity-20 rounded-2xl pointer-events-none" />
              <cluster.icon strokeWidth={1.5} className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform group-active:scale-90", activeCluster !== cluster.id && cluster.color)} />
              <span className="hidden md:block text-[7px] font-black mt-0.5 tracking-widest uppercase opacity-60 transition-transform group-active:scale-90">
                {cluster.label}
              </span>
              
              {/* Active Sub-indicator */}
              {cluster.actions.some(a => a.active) && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm" />
              )}
            </motion.button>

            {/* Secondary Actions Row */}
            <AnimatePresence mode="wait">
              {activeCluster === cluster.id && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: -10, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  className="flex flex-row-reverse md:flex-row items-center gap-3 pr-2 md:pr-0 md:pl-4"
                >
                  {cluster.actions.map((action, idx) => (
                    <div key={action.id} className="relative group/action">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.5, x: -10 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          x: 0,
                          transition: { 
                            type: "spring", 
                            damping: 12, 
                            stiffness: 200, 
                            delay: idx * 0.08 
                          } 
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 1.15 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        onClick={(e) => {
                          triggerHaptic('tap');
                          action.onClick?.();
                        }}
                        className={cn(
                          "group outline-none flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 relative px-1 shrink-0 focus:ring-2 focus:ring-indigo-500/50 active:scale-95 active:brightness-125",
                          action.active 
                            ? "bg-white/20 border border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                            : inactiveLensClass
                        )}
                      >
                        <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-active:opacity-20 rounded-xl pointer-events-none" />
                        
                        {action.id === 'refresh' && isRefreshing ? (
                          <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <action.icon strokeWidth={1.5} className="w-4 h-4 transition-transform group-active:scale-90" />
                        )}
                        
                        <span className="text-[6px] font-bold mt-1 uppercase text-center leading-tight transition-transform group-active:scale-90">
                          {action.label}
                        </span>
                      </motion.button>
                      
                      {/* Sub-action Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs font-medium rounded opacity-0 invisible group-hover/action:opacity-100 group-hover/action:visible shadow-lg pointer-events-none whitespace-nowrap z-50 transition-all delay-500">
                        {action.label}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[4px] border-l-transparent border-t-[4px] border-t-black border-r-[4px] border-r-transparent" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
