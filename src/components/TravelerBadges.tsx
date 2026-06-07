import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Award, Star, Compass, Map, Globe, Shield, Zap, Target } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  threshold: number;
  unlocked: boolean;
}

export const TravelerBadges = () => {
  const { bookmarkedPlaces, itinerary, language } = useVantiStore();
  
  // Calculate unique locations and cities interacted with
  const stats = useMemo(() => {
    const bookmarkedIds = Object.keys(bookmarkedPlaces);
    const itineraryIds = itinerary.map(p => p.id);
    const uniqueIds = new Set([...bookmarkedIds, ...itineraryIds]);
    
    // Attempt to extract unique cities from titles (common format: "Place Name, City")
    const allPlaces = [
      ...Object.values(bookmarkedPlaces),
      ...itinerary
    ];
    
    const citySet = new Set<string>();
    allPlaces.forEach((p: any) => {
      const title = p.title || p.name || '';
      if (title.includes(',')) {
        const parts = title.split(',');
        const city = parts[parts.length - 1].trim();
        if (city) citySet.add(city);
      }
    });

    return {
      total: uniqueIds.size,
      cities: Math.max(1, citySet.size),
      saved: bookmarkedIds.length,
      planned: itineraryIds.length
    };
  }, [bookmarkedPlaces, itinerary]);

  const badgeDefinitions: Badge[] = [
    {
      id: 'starter',
      name: language === 'ko' ? '뉴비 여행자' : 'Starter',
      description: language === 'ko' ? '첫 번째 장소를 저장하여 여행을 시작하세요' : 'Start your journey by saving your first place',
      icon: Zap,
      color: 'text-slate-400',
      threshold: 0,
      unlocked: stats.total >= 0
    },
    {
      id: 'rookie',
      name: language === 'ko' ? '루키 모험가' : 'Rookie Explorer',
      description: language === 'ko' ? '5개 이상의 장소를 탐색했습니다' : 'Explored 5+ unique locations',
      icon: Target,
      color: 'text-emerald-400',
      threshold: 5,
      unlocked: stats.total >= 5
    },
    {
      id: 'local',
      name: language === 'ko' ? '로컬 마스터' : 'Local Master',
      description: language === 'ko' ? '10개 이상의 장소를 발견했습니다' : 'Discovered 10+ unique locations',
      icon: Map,
      color: 'text-sky-400',
      threshold: 10,
      unlocked: stats.total >= 10
    },
    {
      id: 'pathfinder',
      name: language === 'ko' ? '패스파인더' : 'Pathfinder',
      description: language === 'ko' ? '25개 이상의 장소를 이정표로 남겼습니다' : 'Marked 25+ unique locations',
      icon: Compass,
      color: 'text-amber-400',
      threshold: 25,
      unlocked: stats.total >= 25
    },
    {
      id: 'nomad',
      name: language === 'ko' ? '글로벌 노마드' : 'Global Nomad',
      description: language === 'ko' ? '50개 이상의 세상을 경험했습니다' : 'Experienced 50+ unique locations',
      icon: Globe,
      color: 'text-rose-400',
      threshold: 50,
      unlocked: stats.total >= 50
    },
    {
      id: 'vanti_elite',
      name: language === 'ko' ? '반티 엘리트' : 'VANTi Elite',
      description: language === 'ko' ? '100개 이상의 정점을 찍은 전설적인 여행자' : 'Legendary traveler with 100+ unique pins',
      icon: Award,
      color: 'text-indigo-400',
      threshold: 100,
      unlocked: stats.total >= 100
    }
  ];

  const currentBadge = [...badgeDefinitions].reverse().find(b => b.unlocked);

  return (
    <div className="space-y-6 pt-4 animate-fadeIn">
      {/* Traveler Identity Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#121622] to-[#0a0c10] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-rose-500/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-slow" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-[#0f1117] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
              {currentBadge && (
                <currentBadge.icon className={cn("w-12 h-12", currentBadge.color)} />
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-rose-500 border-4 border-[#0a0c10] flex items-center justify-center shadow-lg"
            >
              <Star className="w-4 h-4 text-white fill-white" />
            </motion.div>
          </div>

          <div className="flex-1">
            <h4 className="text-2xl font-display font-black text-white uppercase tracking-tight leading-none mb-2">
              {currentBadge?.name || 'Explorer'}
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (stats.total / (badgeDefinitions.find(b => !b.unlocked)?.threshold || 100)) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                />
              </div>
              <span className="text-xs font-mono font-black text-rose-500 tracking-tighter">{stats.total} Pts</span>
            </div>
            <div className="flex items-center gap-4 mt-4">
               <div>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Cities</p>
                  <p className="text-xs font-mono font-black text-white">{stats.cities}</p>
               </div>
               <div className="w-px h-6 bg-white/5" />
               <div>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Visits</p>
                  <p className="text-xs font-mono font-black text-white">{stats.total}</p>
               </div>
               <div className="w-px h-6 bg-white/5" />
               <div>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Places</p>
                  <p className="text-xs font-mono font-black text-white">{stats.saved}</p>
               </div>
               <div className="w-px h-6 bg-white/5" />
               <div>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">Rank</p>
                  <p className="text-xs font-mono font-black text-emerald-400">#{stats.total > 50 ? 'Elite' : 'Explorer'}</p>
               </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-400" />
            <h5 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Traveler Milestones</h5>
          </div>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{stats.total} Unique Markers</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {badgeDefinitions.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div 
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "p-5 rounded-[2rem] border transition-all flex flex-col gap-4 relative overflow-hidden group",
                  badge.unlocked 
                    ? "bg-[#121622] border-white/10 hover:border-white/20 shadow-xl" 
                    : "bg-[#090b11] border-white/5 opacity-50 grayscale"
                )}
              >
                {!badge.unlocked && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="w-6 h-6 text-slate-600" />
                      <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{badge.threshold} Pts Required</span>
                    </div>
                  </div>
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 duration-500",
                  badge.unlocked ? "bg-white/5 border-white/5" : "bg-slate-900 border-white/5"
                )}>
                  <Icon className={cn("w-6 h-6", badge.unlocked ? badge.color : "text-slate-700 shadow-none")} />
                </div>
                
                <div>
                  <h6 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">{badge.name}</h6>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">{badge.description}</p>
                </div>

                {badge.unlocked && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                       <CheckCircle className="w-3 h-3 text-emerald-500" />
                    </div>
                  </motion.div>
                )}
                
                {/* Decoration */}
                {badge.unlocked && (
                  <div className={cn("absolute -bottom-4 -right-4 w-12 h-12 rounded-full blur-2xl opacity-20", badge.color.replace('text-', 'bg-'))} />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
