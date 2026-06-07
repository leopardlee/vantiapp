import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, X, Compass, Search, Navigation, Users, Layers, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'vanti-search-nav',
    title: 'Precision Search',
    content: 'Query any global coordinate or point of interest. Our neural engine indexed over 200M nodes for instant retrieval.',
    position: 'bottom',
    icon: <Search className="w-5 h-5 text-indigo-400" />
  },
  {
    targetId: 'vanti-layers-nav',
    title: 'Visual Modalities',
    content: 'Toggle between Neo-Tokyo, Midnight, or Terrain-Focused aesthetics. Real-time atmospheric synthesis available.',
    position: 'left',
    icon: <Layers className="w-5 h-5 text-rose-400" />
  },
  {
    targetId: 'vanti-ai-nav',
    title: 'Gemini 3.5 Core',
    content: 'Direct link to the VANTi intelligence. Ask for travel optimization, local secrets, or itinerary synthesis.',
    position: 'top',
    icon: <Sparkles className="w-5 h-5 text-amber-400" />
  },
  {
    targetId: 'vanti-nodes-nav',
    title: 'Society Network',
    content: 'Sync with the network. Access your profile, travel diary, and active social nodes in your vicinity.',
    position: 'top',
    icon: <Users className="w-5 h-5 text-indigo-400" />
  },
  {
    targetId: 'vanti-explore-nav',
    title: 'OS Hub',
    content: 'Your central command. access curated collections, rewards, and real-time telemetry here.',
    position: 'top',
    icon: <Compass className="w-5 h-5 text-emerald-400" />
  }
];

export const OnboardingTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 means welcome screen
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('vanti_tour_seen');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateCoords = useCallback(() => {
    if (currentStep < 0 || currentStep >= TOUR_STEPS.length) return;
    
    const element = document.getElementById(TOUR_STEPS[currentStep].targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      
      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep]);

  useEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [updateCoords]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('vanti_tour_seen', 'true');
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('vanti_tour_seen', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[500] pointer-events-none overflow-hidden">
      <AnimatePresence mode="wait">
        {currentStep === -1 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#07090d]/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full p-8 bg-[#0f1117] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] text-center space-y-6"
            >
              <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Welcome to VANTi</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Initializing neural interface... Your cinematic travel assistant is ready to help you navigate the world with unprecedented precision.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleSkip}
                  className="flex-1 py-3 px-6 rounded-2xl bg-white/5 text-slate-500 text-xs font-black uppercase tracking-widest hover:text-slate-300 transition-colors"
                >
                  Skip Link
                </button>
                <button 
                  onClick={() => setCurrentStep(0)}
                  className="flex-[2] py-3 px-6 rounded-2xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Begin Core Training
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {/* Darkened overlay with spotlight effect */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 pointer-events-auto bg-black/40"
               style={{
                 maskImage: `radial-gradient(circle ${Math.max(coords.width, coords.height) * 0.8}px at ${coords.left + coords.width / 2}px ${coords.top + coords.height / 2}px, transparent, black)`,
                 WebkitMaskImage: `radial-gradient(circle ${Math.max(coords.width, coords.height) * 0.8}px at ${coords.left + coords.width / 2}px ${coords.top + coords.height / 2}px, transparent, black)`
               }}
            />

            {/* Tooltip */}
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                x: TOUR_STEPS[currentStep].position === 'left' ? coords.left - 280 : 
                   TOUR_STEPS[currentStep].position === 'right' ? coords.left + coords.width + 20 : 
                   coords.left + coords.width / 2 - 130,
                top: TOUR_STEPS[currentStep].position === 'top' ? coords.top - 180 : 
                     TOUR_STEPS[currentStep].position === 'bottom' ? coords.top + coords.height + 20 : 
                     coords.top + coords.height / 2 - 80
              }}
              className="absolute w-[260px] p-5 bg-[#0f1117] border border-white/10 rounded-3xl shadow-2xl pointer-events-auto z-[510]"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  {TOUR_STEPS[currentStep].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">{TOUR_STEPS[currentStep].title}</h4>
                  <div className="flex gap-0.5 mt-1">
                    {TOUR_STEPS.map((_, i) => (
                      <div key={i} className={cn("h-1 flex-1 rounded-full", i <= currentStep ? "bg-indigo-500" : "bg-white/10")} />
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-[11px] text-slate-400 leading-relaxed mb-5">
                {TOUR_STEPS[currentStep].content}
              </p>

              <div className="flex items-center justify-between">
                <button 
                  onClick={handleSkip}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  onClick={handleNext}
                  className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 group hover:gap-3 transition-all"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Initiate' : 'Next Node'}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
