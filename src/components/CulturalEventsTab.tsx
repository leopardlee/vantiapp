import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Loader2, Clock, Map as MapIcon } from 'lucide-react';

export default function CulturalEventsTab({ 
  placesLib, 
  mapCenter, 
  onFocusPlace,
  setEventPlaces
}: { 
  placesLib: any; 
  mapCenter: google.maps.LatLngLiteral;
  onFocusPlace: (place: any) => void;
  setEventPlaces: (places: any[]) => void;
}) {
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'weekend' | 'month'>('weekend');

  useEffect(() => {
    if (placesLib && mapCenter) {
      const dbnc = setTimeout(fetchEvents, 500); // Small debounce
      return () => clearTimeout(dbnc);
    }
  }, [placesLib, mapCenter, timeFilter]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let timeStr = "this weekend";
      if (timeFilter === 'today') timeStr = "today";
      if (timeFilter === 'month') timeStr = "this month";

      const query = `cultural events ${timeStr}`;

      const { places } = await placesLib.Place.searchByText({
        textQuery: query,
        locationBias: {
          center: mapCenter,
          radius: 5000
        },
        fields: ['id', 'displayName', 'formattedAddress', 'rating', 'types', 'location']
      });
      
      setLocalEvents(places || []);
      setEventPlaces(places || []);
    } catch (err) {
      console.error("Error fetching local events:", err);
      setLocalEvents([]);
      setEventPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn space-y-4">
      <div className="bg-gradient-to-br from-[#1b1c22] to-[#121318] border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-fuchsia-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Culture & Events</h3>
          </div>
          
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'weekend', label: 'Wknd' },
              { id: 'month', label: 'Month' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeFilter(tf.id as any)}
                className={`text-[9px] uppercase font-black px-2 py-1 rounded transition-colors ${timeFilter === tf.id ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-70">
            <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mb-3" />
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase animate-pulse">Scouting Area...</span>
          </div>
        ) : localEvents.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <Calendar className="w-6 h-6 text-slate-700 mx-auto mb-2 opacity-50" />
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">No events found nearby</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {localEvents.map((evt, idx) => (
              <div 
                key={evt.id || idx}
                className="bg-[#0a0b0e]/50 border border-slate-800 hover:border-fuchsia-500/30 rounded-xl p-3 transition-colors cursor-pointer group"
                onClick={() => {
                  if (evt.location) {
                    onFocusPlace(evt);
                  }
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-fuchsia-400 transition-colors line-clamp-1">{evt.displayName}</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {evt.formattedAddress}
                    </p>
                  </div>
                  {evt.rating && (
                    <div className="flex items-center gap-0.5 bg-fuchsia-500/10 px-1.5 py-0.5 rounded border border-fuchsia-500/20">
                      <span className="text-[10px] font-bold text-fuchsia-400">{evt.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
