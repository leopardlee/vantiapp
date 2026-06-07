import React, { useState, useEffect, useMemo } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MessageSquare, ThumbsUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface Activity {
  id: string;
  lat: number;
  lng: number;
  user: string;
  type: 'photo' | 'tip';
  content: string;
  timestamp: string;
  votes: number;
  imageUrl?: string;
}

const MOCK_MAP_ACTIVITIES: Activity[] = [
  {
    id: 'act1',
    lat: 37.5665,
    lng: 126.9780,
    user: 'K***',
    type: 'photo',
    content: 'Amazing sunset at the plaza!',
    timestamp: '2m ago',
    votes: 12,
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-e94e270b2d42?w=200&q=80'
  },
  {
    id: 'act2',
    lat: 37.5700,
    lng: 126.9800,
    user: 'J***',
    type: 'tip',
    content: 'Best hidden coffee shop behind the library. Try the cold brew!',
    timestamp: '15m ago',
    votes: 45,
  },
  {
    id: 'act3',
    lat: 37.5630,
    lng: 126.9850,
    user: 'M***',
    type: 'photo',
    content: 'Street food paradise!',
    timestamp: '5m ago',
    votes: 28,
    imageUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=200&q=80'
  }
];

export const ActivityStreamLayer = () => {
  const map = useMap();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleActivities, setVisibleActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!map) return;

    const updateVisible = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const filtered = MOCK_MAP_ACTIVITIES.filter(act => 
        bounds.contains({ lat: act.lat, lng: act.lng })
      );
      setVisibleActivities(filtered);
    };

    const listener = map.addListener('bounds_changed', updateVisible);
    updateVisible();

    return () => listener.remove();
  }, [map]);

  return (
    <>
      {visibleActivities.map((act) => (
        <AdvancedMarker
          key={act.id}
          position={{ lat: act.lat, lng: act.lng }}
          onClick={() => setActiveId(activeId === act.id ? null : act.id)}
        >
          <div className="relative group cursor-pointer">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className={cn(
                "w-10 h-10 rounded-2xl border-2 shadow-2xl flex items-center justify-center transition-all bg-slate-900/90",
                act.type === 'photo' ? "border-amber-500 shadow-amber-500/20" : "border-indigo-500 shadow-indigo-500/20"
              )}
            >
              {act.type === 'photo' ? (
                <Camera className="w-5 h-5 text-amber-400" />
              ) : (
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              )}
              
              {/* Privacy Masked User Indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-900 flex items-center justify-center overflow-hidden">
                 <div className="w-full h-full bg-slate-200" />
              </div>
            </motion.div>

            <AnimatePresence>
              {activeId === act.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-60 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
                >
                  {act.imageUrl && (
                    <img 
                      src={act.imageUrl} 
                      alt="Activity" 
                      className="w-full h-32 object-cover rounded-xl mb-3 border border-white/5"
                    />
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{act.user} • {act.timestamp}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                      <ThumbsUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400">{act.votes}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    {act.content}
                  </p>

                  <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/95 border-b border-r border-white/10 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </AdvancedMarker>
      ))}
    </>
  );
};
