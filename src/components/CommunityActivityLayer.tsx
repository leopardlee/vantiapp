import React from 'react';
import { motion } from 'motion/react';
import { SafeAdvancedMarker } from './SafeAdvancedMarker';
import { MessageSquare, Camera, Sparkles } from 'lucide-react';

interface ActivityNode {
  id: string;
  lat: number;
  lng: number;
  type: 'tip' | 'photo' | 'alert';
  pulseColor: string;
}

const MOCK_ACTIVITIES: ActivityNode[] = [
  { id: 'act-1', lat: 37.5665, lng: 126.9780, type: 'tip', pulseColor: 'indigo' }, // Seoul
  { id: 'act-2', lat: 37.5326, lng: 127.0246, type: 'photo', pulseColor: 'rose' },
  { id: 'act-3', lat: 37.4979, lng: 127.0276, type: 'alert', pulseColor: 'amber' },
  { id: 'act-4', lat: 43.6532, lng: -79.3832, type: 'photo', pulseColor: 'emerald' }, // Toronto
  { id: 'act-5', lat: 43.6426, lng: -79.3871, type: 'tip', pulseColor: 'indigo' },
];

export const CommunityActivityLayer: React.FC<{ isIdle: boolean }> = ({ isIdle }) => {
  if (!isIdle) return null;

  return (
    <>
      {MOCK_ACTIVITIES.map((node) => (
        <SafeAdvancedMarker
          key={node.id}
          position={{ lat: node.lat, lng: node.lng }}
        >
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <motion.div
              animate={{
                scale: [1, 2.5],
                opacity: [0.6, 0]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className={`absolute w-10 h-10 rounded-full bg-${node.pulseColor}-500/40 blur-md`}
            />
            
            {/* Inner Core */}
            <div className={`relative z-10 w-5 h-5 rounded-full bg-${node.pulseColor}-500 border-2 border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm`}>
              {node.type === 'tip' && <MessageSquare className="w-2.5 h-2.5 text-white" />}
              {node.type === 'photo' && <Camera className="w-2.5 h-2.5 text-white" />}
              {node.type === 'alert' && <Sparkles className="w-2.5 h-2.5 text-white" />}
            </div>

            {/* Label (Optional, shown on zoom/hover if needed) */}
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-7 whitespace-nowrap"
            >
               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                 Live {node.type}
               </span>
            </motion.div>
          </div>
        </SafeAdvancedMarker>
      ))}
    </>
  );
};
