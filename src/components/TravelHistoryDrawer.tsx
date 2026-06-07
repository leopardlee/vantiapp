import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Map as MapIcon, Award, TrendingUp, Calendar } from 'lucide-react';
import * as d3 from 'd3';
import { cn } from '../lib/utils';

interface TravelHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    totalDistance: number;
    countriesVisited: number;
    citiesVisited: number;
    topDestinations: { name: string; visits: number; color: string }[];
  };
}

export const TravelHistoryDrawer = ({ isOpen, onClose, stats }: TravelHistoryDrawerProps) => {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isOpen || !chartRef.current || stats.topDestinations.length === 0) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const width = 300;
    const height = 180;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };

    const x = d3.scaleBand()
      .domain(stats.topDestinations.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stats.topDestinations, d => d.visits) || 10])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Draw Bars
    svg.append('g')
      .selectAll('rect')
      .data(stats.topDestinations)
      .join('rect')
      .attr('x', d => x(d.name)!)
      .attr('y', height - margin.bottom)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('y', d => y(d.visits))
      .attr('height', d => y(0) - y(d.visits));

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '10px')
      .style('font-weight', '600');

    // Y Axis (Grid lines)
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-width + margin.left + margin.right))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#334155').attr('stroke-dasharray', '2,2'))
      .call(g => g.selectAll('.tick text').style('fill', '#64748b').style('font-size', '9px'));

  }, [isOpen, stats]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] md:hidden"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0f1117] border-l border-white/10 z-[301] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-none">Travel Insights</h2>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Spatial Analytics</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <Globe className="w-4 h-4 text-emerald-400 mb-2" />
                  <div className="text-2xl font-black text-white">{stats.countriesVisited}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Countries</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                  <MapIcon className="w-4 h-4 text-rose-400 mb-2" />
                  <div className="text-2xl font-black text-white">{stats.citiesVisited}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cities</div>
                </div>
                <div className="col-span-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-white tracking-tight">{stats.totalDistance.toLocaleString()} km</div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Total Distance Explored</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* D3 Chart Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Frequency by Locale</h3>
                  <Calendar className="w-3 h-3 text-slate-500" />
                </div>
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex justify-center">
                  <svg ref={chartRef} width="300" height="180" viewBox="0 0 300 180" />
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Top Destinations</h3>
                <div className="space-y-2">
                  {stats.topDestinations.map((dest, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs" style={{ backgroundColor: `${dest.color}20`, color: dest.color }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{dest.name}</div>
                        <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(dest.visits / stats.topDestinations[0].visits) * 100}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="h-full rounded-full" 
                            style={{ backgroundColor: dest.color }} 
                          />
                        </div>
                      </div>
                      <div className="text-xs font-black text-slate-500">{dest.visits} VISITS</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-900/80 border-t border-white/5">
              <button 
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                onClick={onClose}
              >
                Close Insights
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
