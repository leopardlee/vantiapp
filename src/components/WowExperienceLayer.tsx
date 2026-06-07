import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Navigation, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';

export function WowExperienceLayer() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isMagicLensActive, setIsMagicLensActive] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
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
  }, []);

  return (
    <div 
      ref={layerRef} 
      className="absolute inset-0 pointer-events-none z-[100] overflow-hidden"
    >
      {/* 1. Cinematic Glass Vignette */}
      <div className="absolute inset-0 glass-vignette opacity-70" />

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

      {/* 5. Dynamic Island / Top Notification Hub */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex justify-center pointer-events-auto">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 1 }}
          className="glass-lens rounded-full py-2 px-4 flex items-center gap-3 animate-wow-float"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span className="text-[10px] font-mono tracking-widest font-black uppercase text-white/90">
            Neuro-Link Active
          </span>
          <div className="w-[1px] h-3 bg-white/20 mx-1" />
          <div className="flex items-center gap-1.5 text-xs text-white/60">
             <span className="opacity-0 group-hover:opacity-100 transition-opacity">Press 'M' for Magic Lens</span>
             <Sparkles className="w-3 h-3 text-indigo-400" />
          </div>
        </motion.div>
      </div>
      
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
