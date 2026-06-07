import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface FinancialTelemetryProps {
  routeInfo?: {
    distance: string;
    duration: string;
    durationMinutes: number;
  } | null;
  budgetLimit?: number;
}

export const FinancialTelemetry = ({ routeInfo, budgetLimit = 150 }: FinancialTelemetryProps) => {
  const calculations = useMemo(() => {
    if (!routeInfo) return null;

    // Mock calculation logic based on route duration and common transit costs
    const baseFare = 2.50;
    const ratePerMinute = 0.50;
    const estimatedCost = baseFare + (routeInfo.durationMinutes * ratePerMinute);
    const activityCosts = 15.00; // Mock average activity cost (cafe/museum)
    const total = estimatedCost + activityCosts;
    
    const percentageOfBudget = (total / budgetLimit) * 100;
    const isOverBudget = total > budgetLimit;

    return {
      transit: estimatedCost.toFixed(2),
      activity: activityCosts.toFixed(2),
      total: total.toFixed(2),
      percentage: percentageOfBudget.toFixed(1),
      isOverBudget
    };
  }, [routeInfo, budgetLimit]);

  if (!routeInfo || !calculations) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, x: 20, filter: 'blur(4px)' }}
      transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      className="fixed top-24 right-6 z-40 w-48 pointer-events-auto"
    >
      <div className="bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl overflow-hidden relative">
        {/* Background Accent */}
        <div className={cn(
          "absolute top-0 right-0 w-12 h-12 -mr-4 -mt-4 rounded-full blur-2xl opacity-20",
          calculations.isOverBudget ? "bg-rose-500" : "bg-emerald-500"
        )} />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Spending</span>
          </div>
          {calculations.isOverBudget && (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-bold text-white/40 uppercase">Est. Total</span>
            <span className="text-lg font-black text-white leading-none">${calculations.total}</span>
          </div>

          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, parseFloat(calculations.percentage))}%` }}
              className={cn(
                "h-full transition-colors",
                calculations.isOverBudget ? "bg-rose-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
              <div className="text-[8px] font-bold text-white/30 uppercase leading-none mb-1">Transit</div>
              <div className="text-[10px] font-black text-white/80">${calculations.transit}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
              <div className="text-[8px] font-bold text-white/30 uppercase leading-none mb-1">Activities</div>
              <div className="text-[10px] font-black text-white/80">${calculations.activity}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-[8px] font-bold text-emerald-400/80 uppercase tracking-tighter">
              {calculations.percentage}% of daily limit
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
