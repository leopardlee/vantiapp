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
      activeColor: 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.4)]',
      inactiveColor: 'text-white/40 hover:text-white hover:bg-white/5'
    },
    {
      id: 'route',
      label: 'Plan',
      icon: Navigation,
      active: activeMode === 'planner' && !isChatbotOpen,
      onClick: (e: React.MouseEvent) => filterDispatch('planner', e),
      activeColor: 'bg-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.5)]',
      inactiveColor: 'text-white/40 hover:text-white hover:bg-white/5'
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
      activeColor: 'bg-gradient-to-br from-rose-500 to-indigo-600 text-white shadow-[0_0_30px_rgba(244,63,94,0.6)] border border-rose-400 scale-110 -translate-y-2',
      inactiveColor: 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/5 -translate-y-1 hover:scale-110 hover:-translate-y-2'
    },
    {
      id: 'nodes',
      label: 'Link',
      icon: Users,
      active: activeMode === 'profile' && !isChatbotOpen,
      onClick: (e: React.MouseEvent) => filterDispatch('profile', e),
      activeColor: 'bg-indigo-600 text-white shadow-[0_0_25px_rgba(79,70,229,0.5)]',
      inactiveColor: 'text-white/40 hover:text-white hover:bg-white/5'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      active: isSettingsOpen,
      onClick: handleSettingsClick,
      activeColor: 'bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]',
      inactiveColor: 'text-white/40 hover:text-white hover:bg-white/5'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: isMapDragging ? 0 : 1, y: isMapDragging ? 80 : 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="BottomNavigation vanti-glass rounded-full flex items-center justify-around md:justify-center transition-all duration-300 w-full max-w-[420px] shadow-2xl relative pointer-events-auto mb-6 mx-auto sm:mx-0 p-1 font-sans border-white/10 h-16 sm:h-18"
    >
      <div className="absolute inset-x-0 bottom-[-20px] h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none -z-10 blur-xl" />
      
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
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className={cn(
              "flex-1 md:flex-none rounded-full transition-all touch-manipulation flex flex-col items-center justify-center min-w-[50px] min-h-[50px] relative cursor-pointer group focus:outline-none", 
              tab.active ? tab.activeColor : tab.inactiveColor
            )}
            style={{ 
              padding: isCenterButton ? "0" : "0",
              height: isCenterButton ? "56px" : "48px",
              width: isCenterButton ? "56px" : "48px",
              margin: isCenterButton ? "0 4px" : "0"
            }}
          >
            <Icon style={{ 
              width: isCenterButton ? `${22 * scaleFactor}px` : `${18 * scaleFactor}px`, 
              height: isCenterButton ? `${22 * scaleFactor}px` : `${18 * scaleFactor}px` 
            }} className={cn("shrink-0", isCenterButton && "animate-pulse-soft")} />
            
            {!isCenterButton && (
              <span className="text-[8px] font-black uppercase tracking-[0.15em] scale-90 opacity-0 group-hover:opacity-100 transition-all absolute bottom-1.5 leading-none text-current">
                {tab.label}
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
});
