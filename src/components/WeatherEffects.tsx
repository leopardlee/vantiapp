import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function RainEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
      <div className="rain-container absolute inset-0">
        {[...Array(60)].map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 2;
          const duration = 0.5 + Math.random() * 0.5;
          const opacity = 0.2 + Math.random() * 0.3;
          return (
            <div
              key={i}
              className="absolute w-[1.5px] bg-gradient-to-b from-blue-300 to-transparent"
              style={{
                left: `${left}%`,
                top: `-20px`,
                height: `${20 + Math.random() * 30}px`,
                opacity: opacity,
                animation: `fall ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0); }
          100% { transform: translateY(105vh); }
        }
      `}</style>
    </div>
  );
}

export function SnowEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/10 mix-blend-overlay"></div>
      <div className="snow-container absolute inset-0">
        {[...Array(50)].map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 5;
          const duration = 3 + Math.random() * 4;
          const size = 2 + Math.random() * 4;
          const opacity = 0.3 + Math.random() * 0.5;
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{
                left: `${left}%`,
                top: `-10px`,
                width: `${size}px`,
                height: `${size}px`,
                opacity: opacity,
                animation: `drift ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(50vh) translateX(${Math.random() * 20 - 10}px); }
          100% { transform: translateY(105vh) translateX(${Math.random() * 40 - 20}px); }
        }
      `}</style>
    </div>
  );
}

export default function WeatherEffects({ weather, activeWeather, mapTheme }: { 
  weather?: any; 
  activeWeather?: string | null;
  mapTheme?: string;
}) {
  const isSimulation = mapTheme === 'Simulation';
  const isGenie = mapTheme === 'Genie';
  const isCosmic = mapTheme === 'Cosmic';
  const isNeoTokyo = mapTheme === 'Neo-Tokyo';

  const condition = activeWeather || (weather?.current?.weather_code > 50 ? (weather?.current?.weather_code < 70 ? 'Rain' : 'Snow') : null);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden mix-blend-screen">
      {/* 3D Grid Overlay for cyber themes */}
      {(isSimulation || isNeoTokyo) && (
        <div 
          className="absolute inset-0"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          <motion.div 
            style={{
                transform: 'rotateX(60deg) translateY(-20%)',
                backgroundImage: 'linear-gradient(rgba(0,255,65,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.1) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                width: '200%',
                height: '200%',
                left: '-50%',
                top: '-50%'
            }}
            animate={isSimulation ? { backgroundPositionY: ['0px', '100px'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute opacity-20"
          />
        </div>
      )}

      {/* Cyber-Traffic Trails for Neo-Tokyo/Simulation */}
      {(isSimulation || isNeoTokyo) && (
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`traffic-${i}`}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ 
                scaleX: [0, 1, 0], 
                opacity: [0, 0.4, 0],
                x: ["-20%", "120%"] 
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 5,
                ease: "linear"
              }}
              style={{ 
                top: `${20 + Math.random() * 60}%`,
                left: "0",
                transformOrigin: "left"
              }}
              className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[1px]"
            />
          ))}
        </div>
      )}

      {/* Simulation "Matrix Rain" Effect */}
      {isSimulation && (
        <div className="absolute inset-0 opacity-40">
           {Array.from({ length: 25 }).map((_, i) => (
             <motion.div
               key={i}
               initial={{ y: -500, opacity: 0 }}
               animate={{ y: 1500, opacity: [0, 1, 0] }}
               transition={{ duration: Math.random() * 1.5 + 0.8, repeat: Infinity, delay: Math.random() * 2 }}
               style={{ left: `${i * 4}%` }}
               className="absolute w-[2px] h-48 bg-gradient-to-b from-transparent via-green-400 to-transparent"
             />
           ))}
        </div>
      )}

      {/* Neo-Tokyo Neon Glare */}
      {isNeoTokyo && (
        <div className="absolute inset-0">
           <motion.div 
             animate={{ opacity: [0.1, 0.2, 0.1] }}
             transition={{ duration: 0.1, repeat: Infinity }}
             className="absolute inset-0 bg-pink-500/5 mix-blend-overlay"
           />
           {Array.from({ length: 15 }).map((_, i) => (
             <motion.div
               key={i}
               initial={{ x: -100, y: Math.random() * 100 + "%", opacity: 0.2 }}
               animate={{ x: "120vw" }}
               transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, delay: Math.random() * 2 }}
               className="absolute h-[1px] w-64 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[2px]"
             />
           ))}
        </div>
      )}

      {/* Genie "Interdimensional Mist" */}
      {isGenie && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.2),transparent_60%)]"
        />
      )}

      {/* Cosmic "Stardust Burst" */}
      {isCosmic && (
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 0], 
                opacity: [0, 0.7, 0]
              }}
              transition={{ duration: Math.random() * 4 + 2, repeat: Infinity, delay: Math.random() * 5 }}
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              className="absolute w-1 h-1 bg-indigo-300 rounded-full blur-[1px] shadow-[0_0_10px_rgba(165,180,252,0.8)]"
            />
          ))}
        </div>
      )}

      {/* Standard Rain/Snow based on actual weather or command */}
      {(condition === 'Rain' || condition === 'Storm') && <RainEffect />}
      {condition === 'Snow' && <SnowEffect />}
      {condition === 'Storm' && (
        <motion.div 
            animate={{ opacity: [0, 0.8, 0, 0.4, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: Math.random() * 5 + 3 }}
            className="absolute inset-0 bg-white"
        />
      )}
    </div>
  );
}
