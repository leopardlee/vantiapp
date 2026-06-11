import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Navigation, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';

import { StatusIndicator } from './StatusIndicator';

export function WowExperienceLayer() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isMagicLensActive, setIsMagicLensActive] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  
  const currentWeatherData = useVantiStore(state => state.currentWeatherData);
  const isBatterySaverEnabled = useVantiStore(state => state.isBatterySaverEnabled);
  const language = useVantiStore(state => state.language);
  
  // Weather to visual effect mapping
  const weatherEffects = React.useMemo(() => {
    if (!currentWeatherData || isBatterySaverEnabled) return { overlay: '', blur: '' };
    
    const condition = (currentWeatherData.main || '').toLowerCase();
    
    switch (condition) {
      case 'clear':
        return { overlay: 'bg-amber-500/5 mix-blend-overlay', blur: '' };
      case 'clouds':
        return { overlay: 'bg-slate-400/5 mix-blend-overlay', blur: '' };
      case 'rain':
      case 'drizzle':
        return { overlay: 'bg-blue-900/10 mix-blend-multiply', blur: '' };
      case 'snow':
        return { overlay: 'bg-white/10 mix-blend-screen', blur: '' };
      case 'thunderstorm':
        return { overlay: 'bg-purple-900/10 mix-blend-multiply animate-pulse', blur: '' };
      case 'mist':
      case 'smoke':
      case 'haze':
      case 'dust':
      case 'fog':
        return { overlay: 'bg-gray-300/10 mix-blend-overlay', blur: '' };
      default:
        return { overlay: '', blur: '' };
    }
  }, [currentWeatherData]);
  
  useEffect(() => {
    if (isBatterySaverEnabled) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Update CSS variables for the magic lens
      if (layerRef.current) {
        layerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        layerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        setIsMagicLensActive(prev => !prev);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBatterySaverEnabled]);

  if (isBatterySaverEnabled) return null;

  return (
    <div 
      ref={layerRef} 
      className={cn("absolute inset-0 pointer-events-none z-[100] overflow-hidden transition-all duration-1000", weatherEffects.blur)}
    >
      {/* Realtime Weather Overlay Effect */}
      {weatherEffects.overlay && (
        <div className={cn("absolute inset-0 transition-opacity duration-1000 pointer-events-none", weatherEffects.overlay)} />
      )}

      {/* 1. Cinematic Glass Vignette */}
      <div className="absolute inset-0 glass-vignette opacity-20" />

      {/* 2. Cyberpunk Scanline */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent animate-wow-scanline opacity-30 mix-blend-screen" />

      {/* 3. Floating Ambient Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/40 blur-[1px]"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.5 + 0.1
          }}
          animate={{
            y: [null, Math.random() * -100 - 50],
            opacity: [null, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}

      {/* 4. Magic Lens Overlay */}
      <AnimatePresence>
        {isMagicLensActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 magic-lens-view border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
          />
        )}
      </AnimatePresence>

      {/* 5. System Status HUD moved to VantiMap.tsx for proper unified desktop/mobile container layout with 4 dots */}
      
      {/* 6. Mouse Aura Follower */}
      {mousePos.x > -1 && (
        <motion.div
          animate={{ x: mousePos.x, y: mousePos.y }}
          transition={{ type: "spring", stiffness: 100, damping: 25, mass: 0.5 }}
          className="absolute -top-10 -left-10 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none mix-blend-screen"
        />
      )}
    </div>
  );
}
