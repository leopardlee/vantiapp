import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SafeAdvancedMarker } from './SafeAdvancedMarker';
import { MessageSquare, Camera, Sparkles, MapPin, Users } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useVantiStore } from '../store/vantiStore';

interface ActivityNode {
  id: string;
  lat: number;
  lng: number;
  type: 'tip' | 'photo' | 'alert' | 'vibe';
  intensity: number; // 1-10
  content: string;
}

const MOCK_ACTIVITIES: ActivityNode[] = [
  { id: 'act-1', lat: 37.5665, lng: 126.9780, type: 'vibe', intensity: 8, content: 'Crowded but great energy!' },
  { id: 'act-2', lat: 37.5326, lng: 127.0246, type: 'photo', intensity: 5, content: 'Beautiful sunset views here' },
  { id: 'act-3', lat: 37.4979, lng: 127.0276, type: 'alert', intensity: 9, content: 'Live music started!' },
];

export const CommunityActivityLayer: React.FC<{ isIdle: boolean }> = ({ isIdle }) => {
  const [activities, setActivities] = useState<ActivityNode[]>(MOCK_ACTIVITIES);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const mapViewport = useVantiStore(state => state.mapViewport);

  useEffect(() => {
    // We would use the geo-query here to limit to mapViewport.bounds
    // For now, we will simulate fetching real-time data from 'community_vibes'
    const q = query(collection(db, 'community_vibes'), orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vibes: ActivityNode[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lat && data.lng) {
          vibes.push({
            id: doc.id,
            lat: data.lat,
            lng: data.lng,
            type: data.type || 'vibe',
            intensity: data.intensity || 5,
            content: data.content || 'Activity spotted'
          });
        }
      });
      if (vibes.length > 0) {
        setActivities(vibes);
      }
    }, (error) => {
      console.warn("Could not fetch realtime vibes:", error);
    });

    return () => unsubscribe();
  }, []);

  if (!isIdle) return null;

  return (
    <>
      {activities.map((node) => {
        const isHovered = hoveredId === node.id;
        const colorClass = node.intensity > 7 ? 'rose' : node.intensity > 4 ? 'amber' : 'emerald';
        const colorHex = node.intensity > 7 ? '#f43f5e' : node.intensity > 4 ? '#fbbf24' : '#10b981';

        return (
          <SafeAdvancedMarker
            key={node.id}
            position={{ lat: node.lat, lng: node.lng }}
          >
            <div 
              className="relative flex items-center justify-center cursor-pointer group"
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(node.id)}
            >
              {/* Pulsing ring based on intensity */}
              <motion.div
                animate={{
                  scale: [1, 1 + (node.intensity / 5)],
                  opacity: [0.6, 0]
                }}
                transition={{
                  duration: 3 - (node.intensity / 10),
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute w-12 h-12 rounded-full blur-md z-0"
                style={{ backgroundColor: colorHex, opacity: 0.3 }}
              />
              
              {/* Inner Core */}
              <div 
                className="relative z-10 rounded-full border-2 border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform group-hover:scale-110"
                style={{ width: `${16 + node.intensity*2}px`, height: `${16 + node.intensity*2}px`, backgroundColor: colorHex }}
              >
                {node.type === 'tip' && <MessageSquare className="w-3 h-3 text-white" />}
                {node.type === 'photo' && <Camera className="w-3 h-3 text-white" />}
                {node.type === 'alert' && <Sparkles className="w-3 h-3 text-white" />}
                {node.type === 'vibe' && <Users className="w-3 h-3 text-white" />}
              </div>

              {/* Enhanced Interactive Hover Bubble */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                    className="absolute bottom-full mb-3 bg-[#090b15]/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl z-50 min-w-[160px]"
                    style={{ borderBottomColor: colorHex }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10">
                         {node.type === 'tip' && <MessageSquare className="w-2.5 h-2.5 text-white" />}
                         {node.type === 'photo' && <Camera className="w-2.5 h-2.5 text-white" />}
                         {node.type === 'alert' && <Sparkles className="w-2.5 h-2.5 text-white" />}
                         {node.type === 'vibe' && <Users className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Live {node.type}</span>
                      <span className="text-[9px] font-mono ml-auto" style={{ color: colorHex }}>Level {node.intensity}</span>
                    </div>
                    <p className="text-xs text-white leading-snug">{node.content}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SafeAdvancedMarker>
        );
      })}
    </>
  );
};
