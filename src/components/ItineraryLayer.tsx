import React, { useEffect, useState } from 'react';
import { useVantiStore } from '../store/vantiStore';
import { SafeAdvancedMarker } from './SafeAdvancedMarker';

interface ItineraryLayerProps {
  map: google.maps.Map | google.maps.maps3d.Map3DElement | null;
  markerLib: any;
  isMapIdle: boolean;
}

export const ItineraryLayer: React.FC<ItineraryLayerProps> = ({ map, markerLib, isMapIdle }) => {
  const activeSmartItinerary = useVantiStore((state) => state.activeSmartItinerary);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !activeSmartItinerary || !activeSmartItinerary.days) {
      // Cleanup polylines if removed
      polylines.forEach(p => p.setMap(null));
      setPolylines([]);
      return;
    }

    // Since map could be Map3DElement, polyline rendering is tricky on Map3D.
    // If it's a standard map, we can draw a polyline connecting the day's events.
    if ((map as google.maps.Map).data === undefined) {
      // It's probably a Map3DElement, which doesn't support Polyline natively yet
      // without specific advanced overlays, we'll just render the markers.
      return;
    }

    const m = map as google.maps.Map;
    const newPolylines: google.maps.Polyline[] = [];

    activeSmartItinerary.days.forEach((day: any, i: number) => {
      const pathCoordinates = day.activities
        .filter((act: any) => typeof act.lat === 'number' && typeof act.lng === 'number')
        .map((act: any) => ({ lat: act.lat, lng: act.lng }));
        
      if (pathCoordinates.length > 1) {
        const poly = new google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: ['#8b5cf6', '#3b82f6', '#10b981'][i % 3], // different color per day
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: m,
          icons: [{
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              fillColor: '#ffffff',
              fillOpacity: 1,
              strokeColor: '#3b82f6',
              strokeWeight: 1,
            },
            offset: '50%',
            repeat: '100px'
          }]
        });
        newPolylines.push(poly);
      }
    });

    setPolylines(newPolylines);

    return () => {
      newPolylines.forEach(p => p.setMap(null));
    };
  }, [map, activeSmartItinerary]);

  if (!isMapIdle || !map || !markerLib || !activeSmartItinerary || !activeSmartItinerary.days) return null;

  return (
    <>
      {activeSmartItinerary.days.map((day: any, dayIdx: number) =>
        day.activities?.map((act: any, actIdx: number) => {
          if (typeof act.lat !== 'number' || typeof act.lng !== 'number') return null;
          return (
            <SafeAdvancedMarker
              key={`smart-it-${dayIdx}-${actIdx}`}
              position={{ lat: act.lat, lng: act.lng }}
              title={`${day.dayNumber}: ${act.placeName}`}
              onClick={() => {
                const mapObj = map as any;
                if (mapObj.panTo) {
                   mapObj.panTo({ lat: act.lat, lng: act.lng });
                   mapObj.setZoom(16);
                } else if (mapObj.flyCameraTo) {
                   mapObj.flyCameraTo({
                     endCamera: { center: { lat: act.lat, lng: act.lng, altitude: 600 }, tilt: 45, heading: 0 },
                     durationMillis: 1000
                   });
                }
              }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-[#090b15] border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] px-2.5 py-1 rounded-xl whitespace-nowrap mb-1">
                  <span className="text-[10px] font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                    Day {day.dayNumber} · Stop {actIdx + 1}
                  </span>
                </div>
                <div className="w-8 h-8 bg-purple-500/20 backdrop-blur-sm rounded-full border-2 border-purple-400 shadow-xl flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                </div>
              </div>
            </SafeAdvancedMarker>
          );
        })
      )}
    </>
  );
};
