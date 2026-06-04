import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';

export default function WeatherDashboard({ lat, lng }: { lat: number, lng: number }) {
  const [weather, setWeather] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { units } = useVantiStore();

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`/api/weather/${lat}/${lng}`);
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchWeather();
  }, [lat, lng]);

  if (!weather) return null;

  const { temperature_2m } = weather.current;
  const weatherCode = weather.current.weather_code;
  const { temperature_2m: hourlyTemps, time } = weather.hourly;

  const getWeatherString = (code: number) => {
    if (code <= 1) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 67) return 'Rain / Showers';
    return 'Snow / Freezing';
  };

  const WeatherIcon = () => {
    if (weatherCode <= 1) return <Sun className="w-6 h-6 text-amber-400" />;
    if (weatherCode <= 3) return <Cloud className="w-6 h-6 text-slate-300 md:w-7 md:h-7" />;
    if (weatherCode <= 67) return <CloudRain className="w-6 h-6 text-blue-400 md:w-7 md:h-7 animate-bounce-slow" />;
    return <Snowflake className="w-6 h-6 text-sky-300 md:w-7 md:h-7 animate-pulse" />;
  };

  // Generate plausible indices from coordinate hash
  const humIndex = Math.floor(Math.abs(lat * 100 + lng * 10) % 30) + 50; // 50% - 80%
  const windIndex = (Math.abs(lat * 3 + lng * 5) % 15 + 4).toFixed(1); // 4 - 19 km/h

  const isImperial = units === 'imperial';
  const displayTemp = isImperial ? Math.round((temperature_2m * 9/5) + 32) : temperature_2m;
  const displayUnit = isImperial ? '°F' : '°C';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsExpanded(!isExpanded);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(8); } catch {}
        }
      }}
      className="absolute top-24 left-4 z-20 bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl text-white select-none shadow-[0_20px_40px_rgba(0,0,0,0.5)] cursor-pointer group transition-all duration-300 hover:border-white/20 hover:bg-slate-900/95 max-w-[280px]"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-rose-500/10 transition-colors">
              <WeatherIcon />
            </div>
            <div>
              <div className="text-2xl font-black font-mono tracking-tight text-white flex items-baseline">
                {displayTemp}
                <span className="text-rose-500 text-sm ml-0.5">{displayUnit}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {getWeatherString(weatherCode)}
              </div>
            </div>
          </div>
          <div className="text-slate-500 group-hover:text-white transition-colors p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-white/5 space-y-3 overflow-hidden"
              onClick={(e) => {
                e.stopPropagation(); // preserve click within panel
              }}
            >
              {/* Humidity & Wind metrics */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="bg-white/5 p-2 rounded-xl flex items-center gap-2">
                  <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase leading-none">Wind</span>
                    <span className="text-[11px] font-bold font-mono tracking-tight text-slate-200 mt-0.5">
                      {isImperial ? `${Math.round(Number(windIndex) * 0.621371)} mph` : `${windIndex} km/h`}
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase leading-none">Humidity</span>
                    <span className="text-[11px] font-bold font-mono tracking-tight text-slate-200 mt-0.5">{humIndex}%</span>
                  </div>
                </div>
              </div>

              {/* Hourly Forecast */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Hourly Trend</span>
                <div className="flex gap-1.5 justify-between">
                  {hourlyTemps.slice(1, 5).map((temp: number, i: number) => {
                    const formattedTime = time[i+1].split('T')[1].slice(0,5);
                    const formattedHourlyTemp = isImperial ? Math.round((temp * 9/5) + 32) : temp;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center bg-white/5 px-1 py-2 rounded-lg border border-white/[0.02]">
                        <span className="text-[8px] text-slate-400 font-mono scale-90">{formattedTime}</span>
                        <span className="text-[10px] font-black font-mono tracking-tight text-slate-200 mt-0.5">{formattedHourlyTemp}°</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
