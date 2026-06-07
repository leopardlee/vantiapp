import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, CloudRain, Sun, Cloud, Snowflake, Route, Navigation, 
  MapPin, Loader2, Compass, AlertCircle, ShieldAlert, CheckCircle2,
  Wallet, Info, TrendingUp
} from 'lucide-react';

interface WeatherRouteOptimizerProps {
  userLocation: { lat: number; lng: number } | null;
  selectedPlace: any | null;
  activeWeather: string | null;
  triggerHaptic: (type: 'tap' | 'switch' | 'success' | 'impact') => void;
  onFocusCoordinates?: (lat: number, lng: number) => void;
}

interface OptimizedRouteResult {
  comfortScore: number;
  analysis: string;
  suggestionType: 'walking' | 'transit' | string;
  optimizedPathSteps: string[];
  safetyNotes: string;
  costEstimates?: {
    currency: string;
    options: {
      mode: string;
      costLocal: string;
      costUSD: string;
      notes: string;
    }[];
    recommendation: string;
  };
}

export default function WeatherRouteOptimizer({
  userLocation,
  selectedPlace,
  activeWeather,
  triggerHaptic,
  onFocusCoordinates
}: WeatherRouteOptimizerProps) {
  const [destinationInput, setDestinationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCost, setLoadingCost] = useState(false);
  const [result, setResult] = useState<OptimizedRouteResult | null>(null);
  const [errorStatus, setErrorStatus] = useState('');
  const [weatherMetrics, setWeatherMetrics] = useState<{ temp: number; code: number; label: string } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Auto-fill target destination is selectedPlace changes on the map
  useEffect(() => {
    if (selectedPlace) {
      setDestinationInput(selectedPlace.displayName || selectedPlace.name || '');
    }
  }, [selectedPlace]);

  // Fetch true weather details based on current coords or map focus
  useEffect(() => {
    const lat = userLocation?.lat || 37.5665;
    const lng = userLocation?.lng || 126.9780;
    
    let active = true;
    async function loadCurrentWeather() {
      setLoadingWeather(true);
      try {
        const res = await fetch(`/api/weather/${lat.toFixed(4)}/${lng.toFixed(4)}`);
        const data = await res.json();
        if (active && data?.current) {
          const temp = data.current.temperature_2m;
          const code = data.current.weather_code;
          
          let label = 'Clear';
          if (code <= 1) label = 'Clear';
          else if (code <= 3) label = 'Cloudy';
          else if (code <= 67) label = 'Rainy';
          else label = 'Snowy';

          setWeatherMetrics({ temp, code, label });
        }
      } catch (err) {
        console.warn("Failed to fetch weather metrics for optimizer:", err);
      } finally {
        if (active) setLoadingWeather(false);
      }
    }

    loadCurrentWeather();
    return () => {
      active = false;
    };
  }, [userLocation]);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationInput.trim()) {
      triggerHaptic('impact');
      setErrorStatus('Please select a target destination.');
      return;
    }

    setLoading(true);
    setErrorStatus('');
    setResult(null);
    triggerHaptic('tap');

    const originCoords = userLocation || { lat: 37.5665, lng: 126.9780 };
    
    // Package weather data for OpenAI/Gemini consumption
    const compositeWeather = {
      activeSimulatedCondition: activeWeather || 'Clear',
      realtimeMetrics: weatherMetrics || { temp: 22, code: 0, label: 'Clear' },
      timestamp: Date.now()
    };

    try {
      const res = await fetch('/api/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLocation: originCoords,
          weatherData: compositeWeather,
          destination: destinationInput.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Routing computation failed');
      }

      const data = await res.json();
      
      // Also fetch cost estimates
      setLoadingCost(true);
      try {
        const costRes = await fetch('/api/calculate-transit-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: "Current Location",
            destination: destinationInput,
            locationContext: `Lat: ${originCoords.lat}, Lng: ${originCoords.lng}`
          })
        });
        const costData = await costRes.json();
        data.costEstimates = costData;
      } catch (ce) {
        console.warn("Cost estimation failed:", ce);
      } finally {
        setLoadingCost(false);
      }

      setResult(data);
      triggerHaptic('success');
    } catch (err: any) {
      console.error(err);
      setErrorStatus('Weather routing failed. Utilizing backup offline controller.');
      
      // Fallback response matching standard format
      const isWet = activeWeather === 'Rain' || activeWeather === 'Snow' || activeWeather === 'Storm';
      setResult({
        comfortScore: isWet ? 55 : 90,
        analysis: "VANTi offline router suggests covered transit corridors because of simulation weather limits.",
        suggestionType: isWet ? "transit" : "walking",
        optimizedPathSteps: isWet
          ? [
              "Board covered shuttle from current coordinates area.",
              "Transfer at nearest underground subway grid.",
              "Walk under connected tunnels directly to " + destinationInput
            ]
          : [
              "Choose leisurely walking trail through park walkways.",
              "Stay on sun-lit tree pathways for premium comfort.",
              "Arrive at destination " + destinationInput
            ],
        safetyNotes: isWet 
          ? "⚠️ Advised gear: Waterproof outerwear or umbrella." 
          : "☀️ Advised gear: Sunny. Sunglasses & casual wear."
      });
    } finally {
      setLoading(false);
    }
  };

  // Weather styling helper
  const getWeatherStyle = () => {
    const cond = activeWeather || weatherMetrics?.label || 'Clear';
    switch (cond.toLowerCase()) {
      case 'rain':
      case 'rainy':
      case 'storm':
        return { bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', icon: CloudRain };
      case 'snow':
      case 'snowy':
      case 'blizzard':
        return { bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400', icon: Snowflake };
      case 'cloudy':
        return { bg: 'bg-slate-500/10 border-slate-500/20 text-slate-300', icon: Cloud };
      case 'clear':
      default:
        return { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', icon: Sun };
    }
  };

  const weatherStyle = getWeatherStyle();
  const WeatherIcon = weatherStyle.icon;

  return (
    <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-4 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Route className="w-4 h-4 text-indigo-400 animate-pulse" />
          <h5 className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-extrabold">AI Climate Router</h5>
        </div>
        {loadingWeather ? (
          <Loader2 className="w-3 h-3 text-slate-600 animate-spin" />
        ) : (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider font-mono ${weatherStyle.bg}`}>
            <WeatherIcon className="w-3 h-3" />
            <span>
              {activeWeather || weatherMetrics?.label || 'CLEAR'} 
              {weatherMetrics ? ` (${Math.round(weatherMetrics.temp)}°C)` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Inputs Form */}
      <form onSubmit={handleOptimize} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Target Destination</label>
          <div className="relative">
            <input
              type="text"
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="e.g. N Seoul Tower, Kyoto Crossing..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-900 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-bold"
              required
            />
            <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
          </div>
          {selectedPlace && (
            <span className="text-[7.5px] font-bold text-emerald-400 font-mono tracking-wider block mt-0.5">
              ✓ SYNCED TARGET FROM SELECTED MAP ANCHOR
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !destinationInput.trim()}
          className="w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-slate-900 disabled:text-slate-600 text-white text-[10px] uppercase tracking-widest font-black rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:border-slate-900 border border-indigo-400/15"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>OPTIMIZING CLIMATE PATH...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>OPTIMIZE COMFORT ROUTE</span>
            </>
          )}
        </button>
      </form>

      {/* Error message */}
      <AnimatePresence>
        {errorStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] rounded-xl font-mono flex items-center gap-1.5 leading-snug"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimized result cards */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/5 pt-4 space-y-4"
          >
            {/* Score & suggestion banner */}
            <div className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block leading-none font-mono">RECOMMENDED OPTION</span>
                <span className="text-xs font-black uppercase text-white mt-1 block leading-tight font-sans">
                  {result.suggestionType.toLowerCase() === 'transit' ? '🚇 Sheltered Transit' : '🚶 Scenic Walking Trail'}
                </span>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  {/* Radial progress circle */}
                  <svg className="absolute w-full h-full rotate-[-90deg]">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      className="stroke-slate-800"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      className={result.comfortScore >= 75 ? "stroke-emerald-500" : result.comfortScore >= 50 ? "stroke-amber-400" : "stroke-rose-500"}
                      strokeWidth="3.5"
                      fill="transparent"
                      strokeDasharray="113"
                      strokeDashoffset={113 - (113 * result.comfortScore) / 100}
                    />
                  </svg>
                  <span className="text-[10px] font-mono font-black text-white">{result.comfortScore}%</span>
                </div>
                <span className="text-[7.5px] font-mono tracking-widest text-slate-500 uppercase mt-0.5 leading-none">Comfort</span>
              </div>
            </div>

            {/* AI explanation and analysis */}
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider font-mono">NEURAL CHOICE ANALYSIS</span>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans font-medium bg-[#0b0d12] p-2.5 rounded-xl border border-white/5 italic">
                "{result.analysis}"
              </p>
            </div>

            {/* Path Steps list */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider font-mono">COMFORTABLE WAYPOINTS</span>
                <span className="text-[7.5px] text-indigo-400 font-mono tracking-wider font-extrabold uppercase">ACTIVE CORRIDORS</span>
              </div>

              <div className="space-y-2">
                {result.optimizedPathSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] text-indigo-400 font-black font-mono">
                        {idx + 1}
                      </div>
                      {idx < result.optimizedPathSteps.length - 1 && (
                        <div className="w-0.5 h-6 bg-indigo-500/10 border-dashed border-l mt-1" />
                      )}
                    </div>
                    <div className="flex-1 bg-slate-950/40 border border-white/5 p-2 rounded-xl">
                      <p className="text-[9.5px] text-slate-200 font-bold leading-normal font-sans">
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Cost Estimates Section */}
            {result.costEstimates && (
              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider font-mono">AI COST ESTIMATES ({result.costEstimates.currency})</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {result.costEstimates.options.map((opt, i) => (
                    <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl flex justify-between items-center">
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-white uppercase block leading-none">{opt.mode}</span>
                        <p className="text-[8px] text-slate-400 mt-1 truncate">{opt.notes}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-emerald-400 block tabular-nums">{opt.costLocal}</span>
                        <span className="text-[7.5px] font-mono text-slate-500 block leading-none mt-0.5">{opt.costUSD} USD</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl mt-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3 h-3 text-indigo-400" />
                    <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">BEST VALUE PATH</span>
                  </div>
                  <p className="text-[9.5px] text-slate-300 leading-normal font-sans">
                    {result.costEstimates.recommendation}
                  </p>
                </div>
              </div>
            )}

            {/* Safety and Preparation Note */}
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/15 rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-rose-300 font-medium leading-relaxed font-mono">
                {result.safetyNotes}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
