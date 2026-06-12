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
  
  const moodLabel = { 'Minimalist': 'Zen', 'Vibrant': 'Vibes', 'High-Contrast': 'Noir' }[travelStyle];
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
  const inactiveLensClass = "vanti-glass border-white/5 text-white/40 hover:text-white hover:bg-white/5 shadow-none backdrop-blur-3xl";

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
      label: 'VISION',
      color: 'text-rose-500',
      activeColor: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      actions: [
        { id: '3d', icon: Cpu, label: '3D View', active: is3DActive, onClick: () => setIs3DActive(!is3DActive) },
        { id: 'ar', icon: Camera, label: 'AR Lens', active: isAROpen, onClick: () => setIsAROpen(!isAROpen) },
        { id: 'scan', icon: MapPin, label: 'Scanner', onClick: () => document.getElementById('location-scanner-input')?.click() },
        { id: 'voice', icon: Mic, label: 'Assistance', active: isVoiceSearchVisible, onClick: () => setIsVoiceSearchVisible(!isVoiceSearchVisible) }
      ]
    },
    {
      id: 'insights',
      icon: BarChart3,
      label: 'SIGNAL',
      color: 'text-indigo-400',
      activeColor: 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.3)]',
      actions: [
        { id: 'insights-dr', icon: BarChart3, label: 'Insights', active: isInsightsDrawerOpen, onClick: () => setIsInsightsDrawerOpen?.(!isInsightsDrawerOpen) },
        { id: 'mode', icon: LayoutGrid, label: experienceMode, onClick: toggleExperienceMode },
        { id: 'vibe', icon: Palette, label: moodLabel, onClick: cycleTravelStyle },
        { id: 'radar', icon: Radio, label: 'Radar', active: isRadarActive, onClick: () => setIsRadarActive?.(!isRadarActive) },
        { id: 'refresh', icon: RefreshCw, label: 'Sync', active: isRefreshing, onClick: handleRefresh }
      ]
    },
    {
      id: 'planner',
      icon: Route,
      label: 'TASKS',
      color: 'text-white/60',
      activeColor: 'bg-white/10 shadow-none border-white/20',
      actions: [
        { id: 'mytrip', icon: Route, label: 'Log', active: showTripSidebar, onClick: () => setShowTripSidebar(!showTripSidebar) },
        { id: 'aiplanner', icon: Sparkles, label: 'Planner', active: showAITripSidebar, onClick: () => setShowAITripSidebar(!showAITripSidebar) },
        { id: 'recap', icon: History, label: 'History', onClick: () => setIsJourneyRecapOpen?.(true) },
        { id: 'export', icon: Share2, label: 'Share', onClick: () => setIsExportModalOpen?.(true) }
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isMapDragging ? 0.3 : 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed md:top-1/2 md:-translate-y-1/2 md:left-6 left-6 bottom-32 z-[100] flex flex-col gap-3 transition-all duration-500",
        isMapDragging ? "pointer-events-none scale-95 blur-sm" : "pointer-events-auto"
      )}
    >
      {/* Pinning Toast Indicator */}
      <AnimatePresence>
        {isPinning && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute -top-12 left-0 vanti-glass text-rose-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest z-[110] flex items-center gap-2 whitespace-nowrap border-rose-500/20"
          >
            <MapPin className="w-4 h-4" />
            GEOTAG SAVED
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clusters List */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        {mainClusters.map((cluster) => (
          <div key={cluster.id} className="relative flex items-center group/cluster">
            {/* Main Trigger Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={() => toggleCluster(cluster.id)}
              className={cn(
                "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative z-10 shrink-0 group focus:outline-none",
                activeCluster === cluster.id 
                  ? `${cluster.activeColor} border border-white/20 text-white` 
                  : inactiveLensClass
              )}
            >
              <cluster.icon strokeWidth={2} className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform", activeCluster !== cluster.id && cluster.color)} />
              <div className="text-[6px] font-black mt-1 tracking-[0.2em] uppercase opacity-40 group-hover:opacity-100 transition-opacity">
                {cluster.label}
              </div>
              
              {/* Active Sub-indicator */}
              {cluster.actions.some(a => a.active) && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse-soft shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              )}
            </motion.button>

            {/* Secondary Actions Row */}
            <AnimatePresence mode="wait">
              {activeCluster === cluster.id && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 12 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 pl-2"
                >
                  {cluster.actions.map((action, idx) => (
                    <div key={action.id} className="relative group/action">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          transition: { delay: idx * 0.05 } 
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          triggerHaptic('tap');
                          action.onClick?.();
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 relative shrink-0 focus:outline-none",
                          action.active 
                            ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
                            : inactiveLensClass
                        )}
                      >
                        {action.id === 'refresh' && isRefreshing ? (
                          <Loader2 strokeWidth={2.5} className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <action.icon strokeWidth={2.5} className="w-4 h-4" />
                        )}
                        <span className="text-[6px] font-black mt-1 uppercase text-center leading-none tracking-tighter opacity-70">
                          {action.label}
                        </span>
                      </motion.button>
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
