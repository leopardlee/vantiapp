import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Zap, Mic, MapPin, X } from 'lucide-react';

interface MapRadialMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string) => void;
  placeName?: string;
}

export function MapRadialMenu({ isOpen, position, onClose, onAction, placeName }: MapRadialMenuProps) {
  const actions = [
    { id: 'save', icon: MapPin, label: 'Save Location', color: 'bg-emerald-500' },
    { id: 'directions', icon: Zap, label: 'Get Directions', color: 'bg-blue-500' },
    { id: 'share', icon: Mic, label: 'Share to Community', color: 'bg-rose-500' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[1000] pointer-events-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute"
          style={{ 
            left: position.x, 
            top: position.y,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Central Backdrop Ring */}
          <div className="absolute inset-0 -m-20 w-40 h-40 rounded-full border border-white/10 bg-slate-900/40 backdrop-blur-xl pointer-events-none" />
          
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Action Buttons */}
            {actions.map((action, i) => {
              const angle = (i / actions.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 70;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={action.id}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                  animate={{ x, y, opacity: 1, scale: 1 }}
                  exit={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200, delay: i * 0.05 }}
                  className="absolute"
                >
                  <button
                    onClick={() => {
                      onAction(action.id);
                      onClose();
                    }}
                    className={`group relative w-12 h-12 ${action.color} rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all outline-none`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-950/90 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                      {action.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}

            {/* Central Close Button */}
            <motion.button
              whileHover={{ rotate: 90 }}
              onClick={onClose}
              className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-white/10 shadow-xl z-10 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Place Name HUD */}
          {placeName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full"
            >
              <p className="text-[9px] font-black text-white uppercase tracking-widest">{placeName}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
