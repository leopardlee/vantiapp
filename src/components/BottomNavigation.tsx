import React from 'react';
import { Map as MapIcon, Users, Sparkles, Wallet, Settings, Route, Plane } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';
import { useViewport } from '../lib/ViewportContext';

export const BottomNavigation = React.memo(function BottomNavigation() {
  const { 
    activeMode, 
    setActiveMode, 
    setShowList, 
    setShowControls, 
    setIsOmniaScanning, 
    setSelectedCategory, 
    setIsSwitchingMode,
    t 
  } = useVantiStore();
  const { scaleFactor, paddingFactor } = useViewport();

  const filterDispatch = (mode: any, category: string, e: React.MouseEvent, extraAction?: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (activeMode === mode) return;

    // Trigger loading sequence
    setIsSwitchingMode(true);
    setActiveMode(mode);
    setSelectedCategory(category);
    if (extraAction) extraAction();
    
    // Simulate high-speed vector recalculation duration
    setTimeout(() => {
      setIsSwitchingMode(false);
    }, 850);
  };

  return (
    <div 
      className="BottomNavigation bg-[#0f1117]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center justify-around md:justify-center transition-all duration-300 hover:border-white/20 hover:bg-[#0f1117]/90 select-none w-full max-w-[440px] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative" 
      style={{ 
        pointerEvents: 'auto',
        padding: `${8 * paddingFactor}px ${8 * paddingFactor}px`,
        gap: `${8 * paddingFactor}px`
      }}
    >
      <div className="absolute inset-0 rounded-[2.5rem] border border-white/5 pointer-events-none mix-blend-overlay" />
      <button 
        onClick={(e) => filterDispatch('all', 'All', e)} 
        title="Home"
        className={cn("flex-1 md:flex-none rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px] relative", activeMode === 'all' ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5")}
        style={{ padding: `${16 * paddingFactor}px` }}
      >
        <MapIcon style={{ width: `${20 * scaleFactor}px`, height: `${20 * scaleFactor}px` }} />
      </button>

      <button 
        onClick={(e) => filterDispatch('planner', 'All', e)} 
        title={t('nav.planner')}
        className={cn("flex-1 md:flex-none rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px] relative", activeMode === 'planner' ? "bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] border-t border-indigo-400/50" : "text-slate-400 hover:text-white hover:bg-white/5")}
        style={{ padding: `${16 * paddingFactor}px` }}
      >
        <Route style={{ width: `${20 * scaleFactor}px`, height: `${20 * scaleFactor}px` }} />
      </button>

      <button 
        onClick={(e) => filterDispatch('social', 'Dining', e, () => setShowList(true))} 
        title="Social Mode"
        className={cn("flex-1 md:flex-none rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px] relative", activeMode === 'social' ? "bg-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.5)] border-t border-rose-400/50" : "text-slate-400 hover:text-white hover:bg-white/5")}
        style={{ padding: `${16 * paddingFactor}px` }}
      >
        <Users style={{ width: `${20 * scaleFactor}px`, height: `${20 * scaleFactor}px` }} />
      </button>

      <button 
        onClick={(e) => filterDispatch('genius', 'Cultural', e, () => { setShowList(true); setIsOmniaScanning(true); setTimeout(() => setIsOmniaScanning(false), 2000); })} 
        title="Genius Mode"
        className={cn("flex-1 md:flex-none rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px] relative", activeMode === 'genius' ? "bg-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] border-t border-white/50" : "text-slate-400 hover:text-white hover:bg-white/5")}
        style={{ padding: `${16 * paddingFactor}px` }}
      >
        <Sparkles style={{ width: `${20 * scaleFactor}px`, height: `${20 * scaleFactor}px` }} />
      </button>

      <button 
        onClick={(e) => filterDispatch('profile', 'All', e, () => setShowList(true))} 
        title="Perks Hub"
        className={cn("flex-1 md:flex-none rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px] relative", activeMode === 'profile' ? "bg-violet-600 text-white shadow-[0_0_25px_rgba(124,58,237,0.5)] border-t border-violet-400/50" : "text-slate-400 hover:text-white hover:bg-white/5")}
        style={{ padding: `${16 * paddingFactor}px` }}
      >
        <Wallet style={{ width: `${20 * scaleFactor}px`, height: `${20 * scaleFactor}px` }} />
      </button>
    </div>
  );
});
