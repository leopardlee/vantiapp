import React from 'react';
import { Map as MapIcon, Users, Sparkles, Wallet, Settings, Route } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';

export const BottomNavigation = React.memo(function BottomNavigation() {
  const { activeMode, setActiveMode, setShowList, setShowControls, setIsOmniaScanning, setSelectedCategory, t } = useVantiStore();

  const filterDispatch = (mode: any, category: string, e: React.MouseEvent, extraAction?: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMode(mode);
    setSelectedCategory(category);
    if (extraAction) extraAction();
  };

  return (
    <div 
      className="bg-[#0f1117]/95 backdrop-blur-3xl border border-white/10 px-2 py-2 rounded-[2.5rem] flex items-center justify-around md:justify-center gap-1 md:gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 select-none w-full max-w-[440px]" 
      style={{ pointerEvents: 'auto' }}
    >
      <button 
        onClick={(e) => filterDispatch('all', 'All', e)} 
        title={t('nav.explore')}
        className={cn("flex-1 md:flex-none p-4 rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px]", activeMode === 'all' ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white hover:bg-white/5")}
      >
        <MapIcon className="w-5 h-5" />
      </button>

      <button 
        onClick={(e) => filterDispatch('planner', 'All', e)} 
        title={t('nav.planner')}
        className={cn("flex-1 md:flex-none p-4 rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px]", activeMode === 'planner' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-500 hover:text-white hover:bg-white/5")}
      >
        <Route className="w-5 h-5" />
      </button>

      <button 
        onClick={(e) => filterDispatch('social', 'Dining', e, () => setShowList(true))} 
        title="Dining"
        className={cn("flex-1 md:flex-none p-4 rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px]", activeMode === 'social' ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" : "text-slate-500 hover:text-white hover:bg-white/5")}
      >
        <Users className="w-5 h-5" />
      </button>

      <button 
        onClick={(e) => filterDispatch('genius', 'Cultural', e, () => { setShowList(true); setIsOmniaScanning(true); setTimeout(() => setIsOmniaScanning(false), 2000); })} 
        title="Genius"
        className={cn("flex-1 md:flex-none p-4 rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px]", activeMode === 'genius' ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/20" : "text-slate-500 hover:text-white hover:bg-white/5")}
      >
        <Sparkles className="w-5 h-5" />
      </button>

      <button 
        onClick={(e) => filterDispatch('profile', 'All', e, () => setShowList(true))} 
        title="Wallet"
        className={cn("flex-1 md:flex-none p-4 rounded-full transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px]", activeMode === 'profile' ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20" : "text-slate-500 hover:text-white hover:bg-white/5")}
      >
        <Wallet className="w-5 h-5" />
      </button>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowControls(true);
        }} 
        title={t('nav.config')}
        className="flex-1 md:flex-none p-4 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all active:scale-90 touch-manipulation flex items-center justify-center min-w-[44px] min-h-[44px]"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
});
