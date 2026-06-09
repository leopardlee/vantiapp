import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { Wallet, Utensils, Ticket, Train, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export function PersistentTripCostWidget() {
  const itinerary = useVantiStore((state) => state.itinerary || []);
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const isVisible = useVantiStore((state) => state.isFinanceTrackerVisible);

  // Derive local currency from longitude (very rough approximation for immersion)
  const currency = useMemo(() => {
    if (!mapViewport) return { symbol: '$', code: 'USD', rate: 1 };
    const lng = mapViewport.center.lng;
    if (lng > 120 && lng < 150) return { symbol: '¥', code: 'JPY', rate: 155 }; // Japan
    if (lng > 120 && lng < 130) return { symbol: '₩', code: 'KRW', rate: 1350 }; // Korea
    if (lng > -10 && lng < 30) return { symbol: '€', code: 'EUR', rate: 0.92 }; // Europe
    if (lng > -5 && lng < 2) return { symbol: '£', code: 'GBP', rate: 0.79 }; // UK
    return { symbol: '$', code: 'USD', rate: 1 };
  }, [mapViewport]);

  const stats = useMemo(() => {
    let dining = 0;
    let attractions = 0;
    let transit = 0;

    itinerary.forEach((stop: any) => {
      const types = stop.types || [];
      const typesStr = types.join(',').toLowerCase();
      
      // Predict cost tier from Google map price level or historical averages
      let multiplier = 1;
      if (stop.priceLevel) multiplier = stop.priceLevel;

      if (typesStr.includes('restaurant') || typesStr.includes('food') || typesStr.includes('cafe')) {
        dining += 25 * multiplier;
      } else if (typesStr.includes('museum') || typesStr.includes('attraction') || typesStr.includes('landmark')) {
        attractions += 18 * multiplier;
      } else if (typesStr.includes('transit') || typesStr.includes('station')) {
        transit += 4 * multiplier;
      } else {
        // Generic browsing
        dining += 5; 
      }
    });

    // Baseline transit cost for moving between places
    if (itinerary.length > 1) {
       transit += (itinerary.length - 1) * 3.5;
    }

    return {
      dining: dining * currency.rate,
      attractions: attractions * currency.rate,
      transit: transit * currency.rate,
      total: (dining + attractions + transit) * currency.rate
    };
  }, [itinerary, currency]);

  if (!isVisible || itinerary.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute bottom-28 right-4 z-[70] w-64 bg-slate-950/90 border border-slate-700/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md pointer-events-auto"
    >
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
          <Wallet className="w-4 h-4 text-emerald-400" />
          Trip Estimate
        </h4>
        <span className="text-[9px] font-mono font-bold text-slate-400">{currency.code}</span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Utensils className="w-3.5 h-3.5 text-orange-400" />
            <span>Dining</span>
          </div>
          <span className="font-mono">{currency.symbol}{Math.round(stats.dining).toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Ticket className="w-3.5 h-3.5 text-purple-400" />
            <span>Attractions</span>
          </div>
          <span className="font-mono">{currency.symbol}{Math.round(stats.attractions).toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Train className="w-3.5 h-3.5 text-blue-400" />
            <span>Transit</span>
          </div>
          <span className="font-mono">{currency.symbol}{Math.round(stats.transit).toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-white/10 pt-3 flex justify-between items-end">
        <div className="text-[10px] text-slate-500 max-w-[100px] leading-tight flex items-start gap-1">
          <Info className="w-3 h-3 shrink-0" />
          Historical area average
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-black block">Total</span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            {currency.symbol}{Math.round(stats.total).toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
