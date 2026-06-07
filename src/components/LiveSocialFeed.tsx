import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, UserCircle, MapPin, Heart } from 'lucide-react';

const MOCK_ACTIVITIES = [
  { id: 1, user: "Alex T.", action: "saved", location: "Oia, Santorini", time: "just now" },
  { id: 2, user: "Sarah M.", action: "is exploring", location: "Shibuya Crossing", time: "2m ago" },
  { id: 3, user: "David J.", action: "reviewed", location: "Colosseum, Rome", time: "5m ago" },
  { id: 4, user: "Emma L.", action: "planned a trip to", location: "Kyoto, Japan", time: "10m ago" },
  { id: 5, user: "Michael G.", action: "generated a cinematic for", location: "Machu Picchu", time: "15m ago" },
];

export function LiveSocialFeed() {
  const [feed, setFeed] = useState([MOCK_ACTIVITIES[0]]);
  const [index, setIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeed(prev => {
        const nextFeed = [MOCK_ACTIVITIES[index], ...prev];
        return nextFeed.slice(0, 3); // keep only top 3
      });
      setIndex((prev) => (prev + 1) % MOCK_ACTIVITIES.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [index]);

  return (
    <div className="fixed top-24 left-6 z-[90] pointer-events-none hidden lg:block">
      <div className="flex items-center gap-2 mb-3 px-2">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">Live Global Activity</span>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {feed.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="bg-black/50 backdrop-blur-md border border-white/5 rounded-xl p-2.5 w-64 shadow-2xl overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-slate-800 rounded-full shrink-0">
                  <UserCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    <span className="font-bold text-white">{item.user}</span> {item.action}{' '}
                    <span className="text-indigo-300 font-semibold">{item.location}</span>
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{item.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
