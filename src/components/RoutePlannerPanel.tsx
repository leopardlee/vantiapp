import React, { useState, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { X, Navigation, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import RouteDisplay from './RouteDisplay';

export default function RoutePlannerPanel({ onClose }: { onClose: () => void }) {
  const map = useMap();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState<{ origin: string, destination: string } | null>(null);

  return (
    <div className="absolute top-20 left-4 right-4 md:left-6 md:w-[350px] bg-[#0f1117]/95 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl shadow-2xl z-[60]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Route Planner</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
           <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Origin"
            className="w-full pl-9 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
          />
        </div>
        <div className="relative">
          <Navigation className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input 
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination"
            className="w-full pl-9 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
          />
        </div>
        <button 
          onClick={() => setRoute({ origin, destination })}
          className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
        >
          Plan Route
        </button>
      </div>
      
      {route && <RouteDisplay origin={route.origin} destination={route.destination} />}
    </div>
  );
}
