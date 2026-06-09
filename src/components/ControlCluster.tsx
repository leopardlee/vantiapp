import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, CloudRain, Shield, 
  Mic, History, Radio, Bell, 
  Cpu, Wallet, Award, Sparkles,
  Search, Scan, MapPin
} from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';

export function ControlCluster() {
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [isPinning, setIsPinning] = useState(false);
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
  
  const isVoiceSearchVisible = useVantiStore(state => state.isVoiceSearchVisible);
  const setIsVoiceSearchVisible = useVantiStore(state => state.setIsVoiceSearchVisible);
  const isRadarActive = useVantiStore(state => state.isRadarActive);
  const setIsRadarActive = useVantiStore(state => state.setIsRadarActive);
  const isGaussianActive = useVantiStore(state => state.isGaussianActive);
  const setIsGaussianActive = useVantiStore(state => state.setIsGaussianActive);
  const is3DActive = useVantiStore(state => state.is3DActive);
  const setIs3DActive = useVantiStore(state => state.setIs3DActive);

  const toggleCluster = (id: string) => {
    setActiveCluster(activeCluster === id ? null : id);
  };

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

  const mainClusters = [
    {
      id: 'vision',
      icon: Scan,
      label: 'VISION',
      color: 'text-cyan-400',
      activeColor: 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]',
      actions: [
        { id: '3d', icon: Cpu, label: '3D View', active: is3DActive, onClick: () => setIs3DActive(!is3DActive) },
        { id: 'ar', icon: Camera, label: 'AR Lens', active: isAROpen, onClick: () => setIsAROpen(!isAROpen) },
        { id: 'gaussian', icon: Sparkles, label: 'Gaussian', active: isGaussianActive, onClick: () => setIsGaussianActive(!isGaussianActive) },
        { id: 'voice', icon: Mic, label: 'Assistant', active: isVoiceSearchVisible, onClick: () => setIsVoiceSearchVisible(!isVoiceSearchVisible) }
      ]
    },
    {
      id: 'insights',
      icon: Radio,
      label: 'INSIGHTS',
      color: 'text-purple-400',
      activeColor: 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
      actions: [
        { id: 'vibe', icon: CloudRain, label: 'Atmosphere', active: isAtmosphereOpen, onClick: () => setIsAtmosphereOpen(!isAtmosphereOpen) },
        { id: 'radar', icon: Radio, label: 'Radar', active: isRadarActive, onClick: () => setIsRadarActive(!isRadarActive) },
        { id: 'recap', icon: History, label: 'Recap', onClick: () => useVantiStore.getState().setIsJourneyRecapOpen?.(true) },
        { id: 'layers', icon: Scan, label: 'Aesthetic', onClick: () => useVantiStore.getState().setIsGaussianActive(!isGaussianActive) }
      ]
    },
    {
      id: 'systems',
      icon: Shield,
      label: 'SYSTEMS',
      color: 'text-amber-400',
      activeColor: 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
      actions: [
        { id: 'ops', icon: Cpu, label: 'Ops Hub', active: isOperationsHubOpen, onClick: () => setIsOperationsHubOpen(!isOperationsHubOpen) },
        { id: 'finance', icon: Wallet, label: 'Finance', onClick: () => useVantiStore.getState().setIsFinanceTrackerVisible?.(true) },
        { id: 'passport', icon: Award, label: 'Passport', onClick: () => useVantiStore.getState().setIsPassportOpen?.(true) }
      ]
    }
  ];

  return (
    <div className="fixed bottom-24 left-6 z-[100] flex flex-col gap-4 pointer-events-none">
      {/* Pinning Toast Indicator */}
      <AnimatePresence>
        {isPinning && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute -top-12 left-0 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg z-[110] flex items-center gap-2 whitespace-nowrap"
          >
            <MapPin className="w-3 h-3" />
            Pinned to Memory Trail
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clusters List */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        {mainClusters.map((cluster) => (
          <div key={cluster.id} className="relative flex items-center">
            {/* Main Trigger Button */}
            <motion.button
              whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.92 }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={() => toggleCluster(cluster.id)}
              className={cn(
                "w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all border backdrop-blur-3xl relative z-10",
                activeCluster === cluster.id 
                  ? `${cluster.activeColor} border-white/20 text-white` 
                  : "bg-black/60 border-white/10 text-slate-400 hover:text-white"
              )}
            >
              <cluster.icon className={cn("w-6 h-6", activeCluster !== cluster.id && cluster.color)} />
              <span className="text-[7px] font-black mt-0.5 tracking-widest uppercase opacity-60">
                {cluster.label}
              </span>
              
              {/* Active Sub-indicator */}
              {cluster.actions.some(a => a.active) && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm" />
              )}
            </motion.button>

            {/* Secondary Actions Row */}
            <AnimatePresence>
              {activeCluster === cluster.id && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 10, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.9 }}
                  className="flex items-center gap-2 pl-4"
                >
                  {cluster.actions.map((action, idx) => (
                    <motion.button
                      key={action.id}
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
                      whileHover={{ scale: 1.1, filter: 'brightness(1.2)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={action.onClick}
                      className={cn(
                        "group flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all border backdrop-blur-2xl px-1",
                        action.active 
                          ? "bg-white/20 border-white/40 text-white" 
                          : "bg-black/40 border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <action.icon className="w-4 h-4" />
                      <span className="text-[6px] font-bold mt-1 uppercase text-center leading-tight">
                        {action.label}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Neural Link / Connection Line Simulation for Context - REMOVED */}
    </div>
  );
}
