import React, { useState, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Car, Clock, ChevronDown, CheckCircle2, TrendingDown, Info, Loader2 } from 'lucide-react';

export default function TrafficDeparturePredictor({ 
  destination,
  origin
}: { 
  destination?: google.maps.LatLngLiteral;
  origin?: google.maps.LatLngLiteral;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [predictions, setPredictions] = useState<{ time: Date, durationStr: string, durationValue: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!map || !routesLib || !destination || !origin) return;
    
    // We only want to run this once when the module mounts to give a quick forecast
    calculateOptimalDepartures();
  }, [map, routesLib, destination, origin]);

  const calculateOptimalDepartures = async () => {
    if (!routesLib || !origin || !destination) return;
    setLoading(true);
    setError(null);

    try {
      const directionsService = new routesLib.DirectionsService();

      const hoursToTest = [0, 1, 2, 3, 4, 5];
      const now = new Date();

      const promises = hoursToTest.map(hourOffsets => {
        const testTime = new Date(now.getTime() + hourOffsets * 60 * 60 * 1000 + 15 * 60 * 1000); // offset + 15min buffer
        return new Promise<any>((resolve) => {
          directionsService.route({
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
            drivingOptions: {
              departureTime: testTime,
              trafficModel: google.maps.TrafficModel.BEST_GUESS
            }
          }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result && result.routes[0]?.legs[0]) {
              const leg = result.routes[0].legs[0];
              resolve({
                time: testTime,
                durationStr: leg.duration_in_traffic?.text || leg.duration?.text || '',
                durationValue: leg.duration_in_traffic?.value || leg.duration?.value || Infinity
              });
            } else {
              // Graceful fallback for failed routes
              resolve(null);
            }
          });
        });
      });

      const results = await Promise.all(promises);
      const validResults = results.filter(r => r !== null) as { time: Date, durationStr: string, durationValue: number }[];
      
      validResults.sort((a, b) => a.time.getTime() - b.time.getTime());
      setPredictions(validResults);
    } catch (err) {
      setError("Failed to fetch traffic predictions.");
    } finally {
      setLoading(false);
    }
  };

  if (!origin || !destination) return null;

  const optimal = predictions.length > 0 
    ? [...predictions].sort((a, b) => a.durationValue - b.durationValue)[0] 
    : null;

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Car className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Smart Departure</h3>
      </div>
      
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Leveraging historical traffic patterns to find the optimal driving departure time to this saved destination.
      </p>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
          {error}
        </div>
      )}

      {!loading && predictions.length > 0 && optimal && (
        <div className="space-y-4">
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase">Optimal Departure</p>
              <p className="text-sm text-emerald-100 font-medium mt-0.5">
                {optimal.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span className="text-emerald-400/80 text-xs ml-2">({optimal.durationStr} drive)</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Forecasted Windows</h4>
            <div className="flex flex-col gap-1.5 pt-1">
              {predictions.map((p, idx) => {
                const isOptimal = p.time.getTime() === optimal.time.getTime();
                return (
                  <div key={idx} className="flex flex-row items-center justify-between py-1 px-2 hover:bg-white/5 rounded-lg transition-colors">
                    <span className="text-xs text-slate-300 font-mono">
                      {p.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {p.durationStr}
                      </span>
                      {isOptimal && (
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
