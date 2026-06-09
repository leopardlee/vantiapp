import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, MapPin, CloudRain, Zap, BarChart3, Activity } from 'lucide-react';
import * as d3 from 'd3';
import { useVantiStore } from '../store/vantiStore';

interface TravelInsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TravelInsightsDrawer({ isOpen, onClose }: TravelInsightsDrawerProps) {
  const tripStats = useVantiStore((state) => state.tripStats);
  const t = useVantiStore((state) => state.t);
  const chartRef = useRef<SVGSVGElement>(null);
  const weatherChartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isOpen || !chartRef.current) return;

    // Distance & Landmarks Bar Chart
    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const data = [
      { label: 'Distance', value: tripStats.totalDistance, color: '#f43f5e' },
      { label: 'Landmarks', value: tripStats.landmarksVisited * 10, color: '#10b981' } // Scaled for visibility
    ];

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.4);
    
    const y = d3.scaleLinear()
      .range([height, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    x.domain(data.map(d => d.label));
    y.domain([0, d3.max(data, d => d.value) || 100]);

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label) || 0)
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => d.color)
      .attr('rx', 6)
      .transition()
      .duration(1000)
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value));

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .attr('color', '#475569');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#475569');

  }, [isOpen, tripStats]);

  useEffect(() => {
    if (!isOpen || !weatherChartRef.current) return;

    // Weather Preferences Donut Chart
    const svg = d3.select(weatherChartRef.current);
    svg.selectAll('*').remove();

    const weatherData = Object.entries(tripStats.weatherPreferences).map(([name, value]) => ({ name, value }));
    const data = weatherData.length > 0 ? weatherData : [{ name: 'Default', value: 1 }];
    
    const width = 280;
    const height = 180;
    const radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.name))
      .range(['#fbbf24', '#38bdf8', '#818cf8', '#f43f5e', '#10b981']);

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.8)
      .cornerRadius(4);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const path = g.selectAll('path')
      .data(pie(data))
      .enter().append('path')
      .attr('fill', d => color(d.data.name) || '#ccc')
      .attr('d', arc)
      .each(function(d) { (this as any)._current = d; });

    path.transition()
      .duration(750)
      .attrTween('d', function(d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => arc(i(t)) as string;
      });

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 80}, ${20})`);

    data.forEach((d, i) => {
      const g = legend.append('g').attr('transform', `translate(0, ${i * 15})`);
      g.append('rect').attr('width', 8).attr('height', 8).attr('fill', color(d.name) || '#ccc').attr('rx', 2);
      g.append('text').attr('x', 12).attr('y', 8).text(d.name).style('font-size', '8px').attr('fill', '#94a3b8').style('text-transform', 'uppercase');
    });

  }, [isOpen, tripStats]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[360px] bg-[#0c0e12]/95 backdrop-blur-2xl border-l border-white/10 z-[301] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Travel Insights</h2>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Voyage Telemetry</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#121620] p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
                    <Activity className="w-16 h-16 text-rose-500" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Km</p>
                  <p className="text-2xl font-black text-white">{tripStats.totalDistance.toFixed(1)}</p>
                </div>
                <div className="bg-[#121620] p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
                    <MapPin className="w-16 h-16 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Landmarks</p>
                  <p className="text-2xl font-black text-white">{tripStats.landmarksVisited}</p>
                </div>
              </div>

              {/* Trip Progression Chart */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voyage Progression</h3>
                </div>
                <div className="bg-[#121620]/50 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
                  <svg ref={chartRef} width="300" height="180" className="overflow-visible" />
                </div>
              </div>

              {/* Weather Trends Chart */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-slate-400" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ambient Preferences</h3>
                </div>
                <div className="bg-[#121620]/50 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
                  <svg ref={weatherChartRef} width="280" height="180" className="overflow-visible" />
                  <p className="text-[9px] text-slate-500 font-medium uppercase mt-2">Mood Trends by Condition</p>
                </div>
              </div>

              {/* Battery Efficiency Hint */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex gap-3 items-start">
                <Zap className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Efficiency Node</p>
                  <p className="text-[11px] text-yellow-500/80 leading-relaxed font-medium">
                    Your current travel patterns suggest high scenic exploration. Enable Battery Saver in settings to extend viewport endurance.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-white/5">
              <button
                onClick={onClose}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-indigo-900/40"
              >
                Close Metrics
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
