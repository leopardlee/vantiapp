import React, { useEffect, useRef, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Car, Footprints, Bus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RouteDisplay({
  origin,
  destination,
  userLocation,
  waypoints = [],
  routeStyle = 'classic',
  onDeviate,
}: {
  origin: string | google.maps.LatLngLiteral;
  destination: string | google.maps.LatLngLiteral;
  userLocation?: { lat: number; lng: number } | null;
  waypoints?: (string | google.maps.LatLngLiteral)[];
  routeStyle?: 'classic' | 'traffic';
  onDeviate?: () => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const geometryLib = useMapsLibrary('geometry');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastDeviateTimeRef = useRef<number>(0);

  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string, durationMinutes: number} | null>(null);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING' | 'TRANSIT'>('DRIVING');

  // Route Deviation Check
  useEffect(() => {
    if (!geometryLib || !userLocation || polylinesRef.current.length === 0 || !onDeviate) return;
    
    const now = Date.now();
    if (now - lastDeviateTimeRef.current < 5000) return; // Wait 5s between haptics

    const latLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
    let isOnRoute = false;
    
    for (const poly of polylinesRef.current) {
        // tolerance in degrees approx, 0.0002 is about 20m
        if (geometryLib.poly.isLocationOnEdge(latLng, poly, 0.0002)) {
            isOnRoute = true;
            break;
        }
    }
    
    if (!isOnRoute) {
        onDeviate();
        lastDeviateTimeRef.current = now;
    }
  }, [userLocation, geometryLib, onDeviate]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;
    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];
    setRouteInfo(null);
    cancelAnimationFrame(animationFrameRef.current);

    routesLib.Route.computeRoutes({
      origin,
      destination,
      intermediates: waypoints.map(waypoint => ({
          location: waypoint
      })),
      travelMode: travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
      routingPreference: travelMode === 'DRIVING' ? 'TRAFFIC_AWARE' : undefined,
    }).then(({ routes }) => {
      if (routes && routes.length > 0) {
        const route = routes[0];
        const newPolylines = route.createPolylines();
        
        // Calculate info
        const distKm = (route.distanceMeters / 1000).toFixed(1) + ' km';
        const durMin = Math.round(route.durationMillis / 60000);
        setRouteInfo({ distance: distKm, duration: durMin + ' min', durationMinutes: durMin });
        
        // Style polylines perfectly for dark mode
        newPolylines.forEach(p => {
          const isWalking = travelMode === 'WALKING';
          const isTransit = travelMode === 'TRANSIT';
          p.setOptions({
             strokeColor: routeStyle === 'traffic' ? '#ef4444' : isWalking ? '#10b981' : isTransit ? '#f59e0b' : '#3b82f6',
             strokeOpacity: 0.8,
             strokeWeight: 6,
             zIndex: 100
          });
          
          // Tracing animation effect using strokeDasharray symbols
          const lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 4
          };

          p.setOptions({
            icons: [{
              icon: lineSymbol,
              offset: '0',
              repeat: '20px'
            }]
          });

          p.setMap(map);
        });
        
        polylinesRef.current = newPolylines;

        // Path-tracing "draw-in" animation
        const fullPath = route.path || [];
        let pointsVisible = 0;
        const totalPoints = fullPath.length;
        const pointsPerFrame = Math.max(1, Math.ceil(totalPoints / 45)); // Draw in ~0.75s at 60fps

        const drawLoop = () => {
          pointsVisible += pointsPerFrame;
          if (pointsVisible <= totalPoints) {
            const currentPath = fullPath.slice(0, pointsVisible);
            newPolylines.forEach(p => p.setPath(currentPath));
            animationFrameRef.current = requestAnimationFrame(drawLoop);
          } else {
            newPolylines.forEach(p => p.setPath(fullPath));
            startFlowAnimation();
          }
        };

        // Continual flow animation (dashes moving)
        const startFlowAnimation = () => {
          let offset = 0;
          const animateRoute = () => {
              offset = (offset + 1) % 200;
              const pulseOpacity = 0.5 + 0.3 * Math.sin(Date.now() / 600);
              
              polylinesRef.current.forEach(p => {
                const icons = p.get('icons');
                if (icons && icons[0]) {
                  icons[0].offset = offset + 'px';
                  p.set('icons', icons);
                }
                p.setOptions({ strokeOpacity: pulseOpacity });
              });
              
              animationFrameRef.current = requestAnimationFrame(animateRoute);
          };
          animateRoute();
        };

        if (totalPoints > 0) {
          drawLoop();
        } else {
          startFlowAnimation();
        }

        if (route.viewport) map.fitBounds(route.viewport, 40);
      }
    }).catch(err => console.error("Route calculation failed:", err));

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin, destination, routeStyle, travelMode]);

  if (!routeInfo) return null;

  return (
    <div className="absolute top-20 left-4 right-4 md:left-6 md:w-[350px] bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl z-[80] flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white">Route Active</h3>
                <span className="text-xs text-rose-400 font-mono mt-0.5">{routeInfo.distance} total</span>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold text-white tabular-nums tracking-tighter">{routeInfo.duration}</span>
            </div>
        </div>
        
        {/* Travel Mode Selector */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl">
          <button
            onClick={() => setTravelMode('DRIVING')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
              travelMode === 'DRIVING' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-white"
            )}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>
          <button
            onClick={() => setTravelMode('WALKING')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
              travelMode === 'WALKING' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"
            )}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walk</span>
          </button>
          <button
            onClick={() => setTravelMode('TRANSIT')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
              travelMode === 'TRANSIT' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-slate-400 hover:text-white"
            )}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Transit</span>
          </button>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
             <div className={cn(
               "h-full transition-all duration-1000",
               travelMode === 'DRIVING' ? 'bg-blue-500' : travelMode === 'WALKING' ? 'bg-emerald-500' : 'bg-amber-500'
             )} style={{ width: '10%' }}></div>
        </div>
    </div>
  );
}
