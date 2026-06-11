import React, { useEffect, useState } from 'react';
import { Car, Footprints, Bus, Navigation, Flame, Leaf } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface RouteComparisonProps {
  origin: { lat: number; lng: number } | null | string;
  destination: string | { lat: number; lng: number } | any;
  onSelectRoute?: (mode: 'DRIVING' | 'WALKING' | 'TRANSIT') => void;
}

export function RouteComparison({ origin, destination, onSelectRoute }: RouteComparisonProps) {
  const routesLib = useMapsLibrary('routes');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<{
    DRIVING: { duration: string; distance: string; eco: boolean; co2: number } | null;
    WALKING: { duration: string; distance: string; calories: number } | null;
    TRANSIT: { duration: string; distance: string; eco: boolean; co2: number } | null;
  }>({ DRIVING: null, WALKING: null, TRANSIT: null });

  useEffect(() => {
    if (!routesLib || !origin || !destination) return;
    
    let isMounted = true;
    setLoading(true);

    const getRouteInfo = async (mode: 'DRIVING' | 'WALKING' | 'TRANSIT') => {
      try {
        let dest = destination;
        if (dest && dest.location) {
           dest = { lat: dest.location.lat(), lng: dest.location.lng() };
        } else if (dest && dest.geometry && dest.geometry.location) {
           dest = { lat: dest.geometry.location.lat(), lng: dest.geometry.location.lng() };
        }
        const res = await routesLib.Route.computeRoutes({
          origin: typeof origin === 'string' ? origin : origin,
          destination: dest,
          travelMode: mode,
          fields: ['distanceMeters', 'durationMillis'],
        });
        if (res.routes && res.routes.length > 0) {
          const r = res.routes[0];
          const distKm = (r.distanceMeters / 1000).toFixed(1);
          const durMin = Math.round(r.durationMillis / 60000);
          
          let durationText = `${durMin} min`;
          if (durMin > 60) {
            durationText = `${Math.floor(durMin / 60)}h ${durMin % 60}m`;
          }

          const resData: any = {
            duration: durationText,
            distance: `${distKm} km`,
          };

          if (mode === 'DRIVING') {
            resData.eco = false;
            resData.co2 = r.distanceMeters * 0.00012; // approx 120g per km
          } else if (mode === 'TRANSIT') {
            resData.eco = true;
            resData.co2 = r.distanceMeters * 0.00004; // approx 40g per km
          } else if (mode === 'WALKING') {
            resData.calories = Math.round((r.distanceMeters / 1000) * 50); // ~50 kcal per km
          }

          return resData;
        }
      } catch (e) {
        console.warn(`Could not get route for ${mode}`);
      }
      return null;
    };

    Promise.all([
      getRouteInfo('DRIVING'),
      getRouteInfo('WALKING'),
      getRouteInfo('TRANSIT')
    ]).then(([driving, walking, transit]) => {
      if (isMounted) {
        setRoutes({ DRIVING: driving, WALKING: walking, TRANSIT: transit });
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [origin, destination, routesLib]);

  if (!origin) return null;

  return (
    <div className="p-3 bg-slate-900/50 border border-white/5 rounded-xl space-y-3">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
        <Navigation className="w-3 h-3 text-indigo-400" /> Route Comparison
      </h3>
      
      {loading ? (
        <div className="flex justify-between gap-2">
          {[1,2,3].map(i => (
            <div key={`route-comp-skeleton-${i}`} className="flex-1 bg-slate-800/50 animate-pulse h-16 rounded-lg border border-slate-700/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
           {/* Driving */}
           <div 
             onClick={() => onSelectRoute?.('DRIVING')}
             className={cn(
               "flex flex-col items-center justify-center p-2 rounded-lg border bg-slate-800/40 text-slate-300 transition-all cursor-pointer hover:bg-slate-800 hover:border-slate-600",
               !routes.DRIVING ? "opacity-30 pointer-events-none border-transparent" : "border-slate-700"
             )}
           >
             <Car className="w-5 h-5 mb-1 text-blue-400" />
             <span className="text-[11px] font-black">{routes.DRIVING?.duration || '--'}</span>
             <span className="text-[9px] text-slate-500">{routes.DRIVING?.distance || '--'}</span>
             {routes.DRIVING && (
               <span className="text-[8px] font-mono text-rose-400/80 mt-1">{routes.DRIVING.co2?.toFixed(1)}kg CO₂</span>
             )}
           </div>

           {/* Walking */}
           <div 
             onClick={() => onSelectRoute?.('WALKING')}
             className={cn(
               "flex flex-col items-center justify-center p-2 rounded-lg border bg-slate-800/40 text-slate-300 transition-all cursor-pointer hover:bg-slate-800 hover:border-slate-600 relative overflow-hidden",
               !routes.WALKING ? "opacity-30 pointer-events-none border-transparent" : "border-emerald-500/20 bg-emerald-500/5"
             )}
           >
             <Footprints className="w-5 h-5 mb-1 text-emerald-400" />
             <span className="text-[11px] font-black text-emerald-100">{routes.WALKING?.duration || '--'}</span>
             <span className="text-[9px] text-slate-500">{routes.WALKING?.distance || '--'}</span>
             {routes.WALKING && (
                <span className="text-[8px] font-mono text-amber-400/80 flex items-center gap-0.5 mt-1">
                  <Flame className="w-2 h-2" /> {routes.WALKING.calories} cal
                </span>
             )}
           </div>

           {/* Transit */}
           <div 
             onClick={() => onSelectRoute?.('TRANSIT')}
             className={cn(
               "flex flex-col items-center justify-center p-2 rounded-lg border bg-slate-800/40 text-slate-300 transition-all cursor-pointer hover:bg-slate-800 hover:border-slate-600",
               !routes.TRANSIT ? "opacity-30 pointer-events-none border-transparent" : "border-amber-500/20 bg-amber-500/5"
             )}
           >
             <Bus className="w-5 h-5 mb-1 text-amber-400" />
             <span className="text-[11px] font-black text-amber-100">{routes.TRANSIT?.duration || '--'}</span>
             <span className="text-[9px] text-slate-500">{routes.TRANSIT?.distance || '--'}</span>
             {routes.TRANSIT && (
               <span className="text-[8px] font-mono text-emerald-400/80 flex items-center gap-0.5 mt-1">
                  <Leaf className="w-2 h-2" /> Eco
               </span>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
