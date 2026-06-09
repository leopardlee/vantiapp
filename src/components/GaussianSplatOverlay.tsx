import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';

export const GaussianSplatOverlay: React.FC = () => {
  const isGaussianActive = useVantiStore(state => state.isGaussianActive);
  const isAROpen = useVantiStore(state => state.isAROpen);

  // Overlay is active in specific modes or when manually toggled
  const isActive = isGaussianActive || isAROpen;

  // Cinematic Splat Generation with Depth Simulation - INTENSIFIED
  const splats = React.useMemo(() => {
    return [...Array(120)].map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      scale: 0.8 + Math.random() * 4.5,
      // Simulate depth-sorting: higher 'z' means smaller, more blurred, slower
      z: Math.random(), 
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 3,
      hue: Math.random() > 0.6 ? 190 : (Math.random() > 0.5 ? 280 : 320) // cyan, purple, and magenta
    }));
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, filter: 'blur(30px) saturate(0)', scale: 1.15 }}
          animate={{ 
            opacity: 1, 
            filter: 'blur(0px) saturate(1.8)', 
            scale: 1,
            transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } 
          }}
          exit={{ 
            opacity: 0, 
            filter: 'blur(20px) saturate(0)', 
            scale: 0.9,
            transition: { duration: 0.6 } 
          }}
          className="fixed inset-0 pointer-events-none z-[50] overflow-hidden bg-cyan-950/10"
        >
          {/* Neural Reconstruction Noise Layer */}
          <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat scale-150 rotate-12" />
          
          {/* Shimmering Gaussian Splat Particles (Simulated 3D Splats) */}
          <div className="absolute inset-0">
             {splats.map((s) => {
                // Determine cinematic visual properties based on simulated depth 'z'
                const blurAmount = s.z * 18;
                const opacityAmount = 0.2 + (1 - s.z) * 0.6;
                const speedFactor = 1.2 + (1 - s.z) * 2.5;

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, opacityAmount, 0],
                      scale: [s.scale * 0.9, s.scale * 1.3, s.scale * 0.9],
                      x: [`${parseFloat(s.x)}%`, `${parseFloat(s.x) + (Math.random() - 0.5) * 15}%`, `${parseFloat(s.x)}%`],
                      y: [`${parseFloat(s.y)}%`, `${parseFloat(s.y) + (Math.random() - 0.5) * 15}%`, `${parseFloat(s.y)}%`]
                    }}
                    transition={{
                      duration: s.duration / speedFactor,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: s.delay
                    }}
                    className="absolute rounded-full"
                    style={{
                      left: s.x,
                      top: s.y,
                      width: `${6 + (1 - s.z) * 35}px`,
                      height: `${6 + (1 - s.z) * 35}px`,
                      backgroundColor: `hsla(${s.hue}, 95%, 65%, ${opacityAmount})`,
                      filter: `blur(${blurAmount}px)`,
                      boxShadow: `0 0 ${40 * (1 - s.z)}px hsla(${s.hue}, 80%, 50%, 0.6)`,
                      zIndex: Math.floor((1 - s.z) * 100) // Simulated occlusion
                    }}
                  />
                );
             })}
          </div>

          {/* Chromatic Aberration Vignette (Cinematic Edge) */}
          <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(34,211,238,0.3)] pointer-events-none" />
          
          {/* Vertical Scanning Data Reconstruction Beam */}
          <motion.div 
            animate={{ top: ['-100%', '200%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-[60vh] bg-gradient-to-b from-transparent via-cyan-400/[0.15] to-transparent mix-blend-screen"
          />

          {/* HUD Data Text Overlay (Neural Network Status) */}
          <div className="absolute top-24 right-10 text-right opacity-50 select-none">
             <p className="text-[12px] font-mono font-black text-cyan-400 tracking-[0.2em] uppercase">Gaussian Engine: High Intensity</p>
             <p className="text-[9px] font-mono text-white/70 mt-1 uppercase">Splat Density: 300% | Latency: 0.04ms</p>
             <p className="text-[9px] font-mono text-cyan-400/50 uppercase leading-none mt-1">Neural Field Active</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
