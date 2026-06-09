import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Touchpad, Move3d, MousePointer2, Target, Mic } from 'lucide-react';
import { cn } from '../lib/utils';

export function GestureOnboarding() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem('vanti_gesture_onboarding');
    if (!hasSeen) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleNext = () => {
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem('vanti_gesture_onboarding', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <div className="pointer-events-auto">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl w-[300px] flex flex-col items-center text-center space-y-4"
          >
            {/* Step 1: Pan */}
            {step === 0 && (
              <>
                <motion.div
                  animate={{ x: [-20, 20, -20] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-2"
                >
                  <MousePointer2 className="w-8 h-8" />
                </motion.div>
                <div className="space-y-1">
                  <h3 className="text-white font-bold text-sm tracking-wide">Pan Around</h3>
                  <p className="text-xs text-slate-400">Drag with one finger or your mouse to explore the world.</p>
                </div>
              </>
            )}

            {/* Step 2: Pinch to Zoom */}
            {step === 1 && (
              <>
                <div className="relative w-16 h-16 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 border-2 border-emerald-500/50 rounded-full"
                  />
                  <div className="absolute inset-0 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                    <Touchpad className="w-8 h-8" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-bold text-sm tracking-wide">Pinch to Zoom</h3>
                  <p className="text-xs text-slate-400">Use two fingers to zoom in or out of the map.</p>
                </div>
              </>
            )}

            {/* Step 3: Rotate & Tilt */}
            {step === 2 && (
              <>
                 <motion.div
                  animate={{ rotateX: [0, 60, 0], rotateZ: [0, 30, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-2 transform-gpu"
                >
                  <Move3d className="w-8 h-8" />
                </motion.div>
                <div className="space-y-1">
                  <h3 className="text-white font-bold text-sm tracking-wide">Rotate & Tilt</h3>
                  <p className="text-xs text-slate-400">Hold Option/Alt (or two fingers) and drag to tilt into 3D space.</p>
                </div>
              </>
            )}

            {/* Step 4: Radial Menu */}
            {step === 3 && (
              <>
                <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-2">
                  <Target className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-bold text-sm tracking-wide">Quick Actions</h3>
                  <p className="text-xs text-slate-400">Long-press anywhere on the map to open the Quick Actions menu.</p>
                </div>
              </>
            )}

            {/* Step 5: Voice Search */}
            {step === 4 && (
              <>
                <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center mb-2">
                  <Mic className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-bold text-sm tracking-wide">Voice Search</h3>
                  <p className="text-xs text-slate-400">Tap the microphone to search locations quickly using your voice.</p>
                </div>
              </>
            )}

            <button
              onClick={handleNext}
              className="mt-6 w-full py-3 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors"
            >
              {step < 4 ? "Got it" : "Start Exploring"}
            </button>
            
            {/* Progress Dots */}
            <div className="flex gap-2 justify-center pt-2">
               {[0,1,2,3,4].map(i => (
                 <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === step ? "bg-white w-3" : "bg-white/20")} />
               ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
