import React from 'react';
import { Compass, Navigation, Sparkles, Users, Settings } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';
import { useViewport } from '../lib/ViewportContext';
import { motion } from 'motion/react';

// Safe Physical Haptic Feedback Trigger
const triggerHaptic = (type: 'tap' | 'switch' | 'success') => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      if (type === 'tap') window.navigator.vibrate(10);
      else if (type === 'switch') window.navigator.vibrate([8, 15, 8]);
      else if (type === 'success') window.navigator.vibrate([15, 30, 20]);
    } catch (e) {
      // Ignored
    }
  }
};

export const BottomNavigation = React.memo(function BottomNavigation() {
  const { 
    activeMode, 
    setActiveMode, 
    setIsSwitchingMode,
    isChatbotOpen,
    setIsChatbotOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isMapDragging,
    t 
  } = useVantiStore();
  const { scaleFactor, paddingFactor } = useViewport();

  const filterDispatch = (mode: any, e: React.MouseEvent, extraAction?: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    
    triggerHaptic('switch');
    
    // Close chatbot when navigating to other modes
    setIsChatbotOpen(false);
    
    if (activeMode === mode && !isChatbotOpen) return;

    // Trigger loading sequence
    setIsSwitchingMode(true);
    setActiveMode(mode);
    if (extraAction) extraAction();
    
    // Simulate high-speed vector recalculation duration
    setTimeout(() => {
      setIsSwitchingMode(false);
    }, 850);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    triggerHaptic('tap');
    setIsSettingsOpen?.(true);
  };

  const tabs = [
    {
      id: 'explore',
      label: 'Explore',
      icon: Compass,
      active: activeMode === 'all' && !isChatbotOpen,
      onClick: (e: React.MouseEvent) => filterDispatch('all', e),
      activeColor: 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.35)] shadow-inner',
      inactiveColor: 'text-slate-400 hover:text-white hover:bg-white/5'
    },
    {
      id: 'route',
      label: 'Route',
      icon: Navigation,
      active: activeMode === 'planner' && !isChatbotOpen,
      onClick: (e: React.MouseEvent) => filterDispatch('planner', e),
      activeColor: 'bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] border-t border-indigo-400/50',
      inactiveColor: 'text-slate-400 hover:text-white hover:bg-white/5'
    },
    {
      id: 'ai',
      label: 'Ask AI',
      icon: Sparkles,
      active: isChatbotOpen,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        triggerHaptic('success');
        setIsChatbotOpen(true);
      },
      activeColor: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.75)] border border-indigo-400 animate-pulse-subtle scale-110 -translate-y-2',
      inactiveColor: 'bg-gradient-to-br from-indigo-500/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-600 text-white border border-indigo-500/30 shadow-lg -translate-y-1 hover:scale-110 hover:-translate-y-2'
    },
    {
      id: 'nodes',
      label: 'Society',
      icon: Users,
      active: activeMode === 'profile' && !isChatbotOpen,
      onClick: (e: React.MouseEvent) => filterDispatch('profile', e),
      activeColor: 'bg-violet-600 text-white shadow-[0_0_25px_rgba(124,58,237,0.5)] border-t border-violet-400/50',
      inactiveColor: 'text-slate-400 hover:text-white hover:bg-white/5'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      active: isSettingsOpen,
      onClick: handleSettingsClick,
      activeColor: 'bg-slate-700 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] border-t border-slate-600/50',
      inactiveColor: 'text-slate-400 hover:text-white hover:bg-white/5'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: isMapDragging ? 0 : 1, y: isMapDragging ? 50 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="BottomNavigation bg-[#0f1117]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around md:justify-center transition-all duration-300 hover:border-white/20 select-none w-full max-w-[460px] shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)] relative pointer-events-auto" 
      style={{ 
        padding: `${8 * paddingFactor}px ${12 * paddingFactor}px`,
        gap: `${4 * paddingFactor}px`
      }}
    >
      <div className="absolute inset-0 rounded-[2.5rem] border border-white/5 pointer-events-none mix-blend-overlay" />
      
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isCenterButton = tab.id === 'ai';
        return (
          <motion.button 
            key={tab.id}
            id={`vanti-${tab.id}-nav`}
            onClick={tab.onClick} 
            title={tab.label}
            whileHover={{ scale: isCenterButton ? 1.15 : 1.05 }}
            whileTap={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={cn(
              "flex-1 md:flex-none rounded-full transition-all touch-manipulation flex flex-col items-center justify-center min-w-[52px] min-h-[52px] relative cursor-pointer group focus:outline-none focus:ring-2 focus:ring-white/10", 
              tab.active ? tab.activeColor : tab.inactiveColor
            )}
            style={{ 
              padding: isCenterButton 
                ? `${12 * paddingFactor}px` 
                : `${14 * paddingFactor}px`,
            }}
          >
            {/* Extended Touch Target Overlay (Transparent padding for accessibility) */}
            <span className="absolute -inset-2 rounded-full pointer-events-none" />

            <Icon style={{ 
              width: isCenterButton ? `${24 * scaleFactor}px` : `${20 * scaleFactor}px`, 
              height: isCenterButton ? `${24 * scaleFactor}px` : `${20 * scaleFactor}px` 
            }} className="shrink-0" />
            
            {!isCenterButton && (
              <span className="text-[7px] font-black uppercase tracking-[0.2em] scale-90 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 leading-none text-white pt-1">
                {tab.label}
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
});
