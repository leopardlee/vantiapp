import React, { useEffect, useRef, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Car, Footprints, Bus, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RouteDisplay({
  origin,
  destination,
  userLocation,
  waypoints = [],
  routeStyle = 'classic',
  onDeviate,
  onRouteInfoUpdate,
}: {
  origin: string | google.maps.LatLngLiteral;
  destination: string | google.maps.LatLngLiteral;
  userLocation?: { lat: number; lng: number } | null;
  waypoints?: (string | google.maps.LatLngLiteral)[];
  routeStyle?: 'classic' | 'traffic';
  onDeviate?: () => void;
  onRouteInfoUpdate?: (info: { distance: string; duration: string; durationMinutes: number } | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const geometryLib = useMapsLibrary('geometry');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const incidentMarkersRef = useRef<google.maps.Marker[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastDeviateTimeRef = useRef<number>(0);

  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string, durationMinutes: number} | null>(null);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING' | 'TRANSIT'>('DRIVING');
  const [transitData, setTransitData] = useState<any | null>(null);
  const [isTransitLoading, setIsTransitLoading] = useState<boolean>(false);

  useEffect(() => {
    onRouteInfoUpdate?.(routeInfo);
  }, [routeInfo, onRouteInfoUpdate]);

  const lastWaypointVibrateRef = useRef<number>(0);

  // Route Deviation & Waypoint Proximity Check
  useEffect(() => {
    if (!geometryLib || !userLocation || polylinesRef.current.length === 0) return;
    
    const now = Date.now();
    const latLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
    let isOnRoute = false;
    
    if (onDeviate && now - lastDeviateTimeRef.current >= 5000) {
      for (const poly of polylinesRef.current) {
          // tolerance in degrees approx, 0.0002 is about 20m
          if (geometryLib.poly.isLocationOnEdge(latLng, poly, 0.0002)) {
              isOnRoute = true;
              break;
          }
      }
      
      if (!isOnRoute) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            // Three distinct, harsh buzzes for deviation guidance
            navigator.vibrate([150, 50, 150, 50, 300]);
          }
          onDeviate();
          lastDeviateTimeRef.current = now;
      }
    }

    // Check Waypoint proximity
    if (now - lastWaypointVibrateRef.current >= 30000) { // Limit to once per 30s
      let nearWaypoint = false;
      const checkDist = (pt: any) => {
        if (!pt) return;
        const ptLoc = typeof pt === 'string' ? null : new google.maps.LatLng(typeof pt.lat === 'function' ? pt.lat() : pt.lat, typeof pt.lng === 'function' ? pt.lng() : pt.lng);
        if (ptLoc && geometryLib.spherical.computeDistanceBetween(latLng, ptLoc) < 50) {
          nearWaypoint = true;
        }
      };

      checkDist(origin);
      checkDist(destination);
      waypoints.forEach(w => checkDist(w));

      if (nearWaypoint) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          // Distinct, rhythmic triple pulse for waypoint arrival
          navigator.vibrate([200, 50, 200, 50, 200]);
        }
        lastWaypointVibrateRef.current = now;
      }
    }
  }, [userLocation, geometryLib, origin, destination, waypoints, onDeviate]);

  useEffect(() => {
    if (!map || !origin || !destination) return;
    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];
    incidentMarkersRef.current.forEach(m => m.setMap(null));
    incidentMarkersRef.current = [];
    setRouteInfo(null);
    setTransitData(null);
    cancelAnimationFrame(animationFrameRef.current);

    const getLatLng = (val: any): { lat: number, lng: number } | null => {
      if (!val) return null;
      if (typeof val === 'object' && typeof val.lat === 'number' && typeof val.lng === 'number') {
        return { lat: val.lat, lng: val.lng };
      }
      if (typeof val === 'object' && typeof val.lat === 'function' && typeof val.lng === 'function') {
        return { lat: val.lat(), lng: val.lng() };
      }
      if (typeof val === 'string') {
        const parts = val.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }
      }
      return null;
    };

    if (travelMode === 'TRANSIT') {
      const origLoc = getLatLng(origin);
      const destLoc = getLatLng(destination);
      if (!origLoc || !destLoc) return;

      setIsTransitLoading(true);
      fetch('/api/transit-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: origLoc, destination: destLoc })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.routes && data.routes.length > 0) {
          setTransitData(data);
          const route = data.routes[0];
          const leg = route.legs[0];
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
            durationMinutes: Math.round(leg.duration.value / 60)
          });

          // Plot segments with correct high contrast colors
          const createdPolylines: google.maps.Polyline[] = [];
          leg.steps.forEach((step: any) => {
            const start = step.start_location;
            const end = step.end_location;
            const path = [start, end];

            const isWalking = step.travel_mode === 'WALKING';
            let strokeColor = '#f59e0b'; // transit yellow
            if (isWalking) {
              strokeColor = '#10b981'; // walking green
            } else if (step.transit_details?.line?.color) {
              strokeColor = step.transit_details.line.color;
            }

            const poly = new google.maps.Polyline({
              path: path,
              strokeColor: strokeColor,
              strokeOpacity: 0.9,
              strokeWeight: 8,
              map: map
            });

            if (isWalking) {
              poly.setOptions({
                strokeWeight: 6,
                strokeOpacity: 0.6,
                icons: [{
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillOpacity: 1,
                    scale: 3,
                  },
                  offset: '0',
                  repeat: '15px'
                }]
              });
            } else {
              poly.setOptions({
                icons: [{
                  icon: {
                    path: 'M 0,-2 0,2',
                    strokeColor: '#ffffff',
                    strokeOpacity: 0.5,
                    scale: 4,
                    strokeWeight: 2
                  },
                  offset: '0',
                  repeat: '30px'
                }]
              });
            }

            createdPolylines.push(poly);
          });

          polylinesRef.current = createdPolylines;

          // Fit viewport bounds
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(origLoc);
          bounds.extend(destLoc);
          map.fitBounds(bounds, 60);
        }
      })
      .catch(err => console.error("Transit action routing API failed, fallback active:", err))
      .finally(() => setIsTransitLoading(false));

      return () => {
        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];
      };
    } else {
      if (!routesLib) return;
      // Client-side Directions api for driving or walking
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
          const distKmRaw = route.distanceMeters / 1000;
          const distKm = distKmRaw.toFixed(1) + ' km';
          const durMin = Math.round(route.durationMillis / 60000);
          setRouteInfo({ distance: distKm, duration: durMin + ' min', durationMinutes: durMin });

          // Traffic Segmentation Logic (Mocking if not provided by API)
          // Cinematic Path Interpolation: Smooth out the navigation lines using Chaikin's algorithm
          const smoothPathChaikin = (path: google.maps.LatLngLiteral[], iterations = 3): google.maps.LatLngLiteral[] => {
            if (path.length < 3) return path;
            let currentPath = path;
            for (let i = 0; i < iterations; i++) {
              const nextPath: google.maps.LatLngLiteral[] = [];
              nextPath.push(currentPath[0]);
              for (let j = 0; j < currentPath.length - 1; j++) {
                const p0 = currentPath[j];
                const p1 = currentPath[j + 1];
                nextPath.push({
                  lat: 0.75 * p0.lat + 0.25 * p1.lat,
                  lng: 0.75 * p0.lng + 0.25 * p1.lng
                });
                nextPath.push({
                  lat: 0.25 * p0.lat + 0.75 * p1.lat,
                  lng: 0.25 * p0.lng + 0.75 * p1.lng
                });
              }
              nextPath.push(currentPath[currentPath.length - 1]);
              currentPath = nextPath;
            }
            return currentPath;
          };

          // Apply path interpolation smoothing for more cinematic movement depending on mode
          const fullPathRaw = route.path || [];
          const fullPath = travelMode === 'DRIVING' ? smoothPathChaikin(fullPathRaw, 3) : fullPathRaw;
          
          const segments: google.maps.LatLngLiteral[][] = [];
          const segmentCount = Math.min(6, Math.max(2, Math.floor(fullPath.length / 50)));
          const segmentSize = Math.floor(fullPath.length / segmentCount);

          for (let i = 0; i < segmentCount; i++) {
            segments.push(fullPath.slice(i * segmentSize, (i + 1) * segmentSize + 1));
          }

          const trafficColors = ['#10b981', '#f59e0b', '#ef4444', '#10b981']; // Clear, Moderate, Heavy

          const createdPolylines: google.maps.Polyline[] = [];

          segments.forEach((segPath, idx) => {
            const isWalking = travelMode === 'WALKING';
            const isTransit = (travelMode as string) === 'TRANSIT';
            
            // Use traffic colors for driving mode if style is traffic
            let strokeColor = isWalking ? '#10b981' : isTransit ? '#f59e0b' : '#3b82f6';
            if (travelMode === 'DRIVING' && routeStyle === 'traffic') {
              strokeColor = trafficColors[idx % trafficColors.length];
            }

            const poly = new google.maps.Polyline({
              path: segPath,
              strokeColor: strokeColor,
              strokeOpacity: 0.8,
              strokeWeight: 8,
              zIndex: 100,
              map: map
            });

            // Tracing animation effect using a glowing dash pattern
            const mainIcon = {
              path: 'M 0,-2 0,2',
              strokeOpacity: 1,
              strokeColor: strokeColor,
              scale: 4,
              strokeWeight: 3
            };

            poly.setOptions({
              icons: [{
                icon: mainIcon,
                offset: '0',
                repeat: '24px'
              }]
            });

            createdPolylines.push(poly);
          });

          polylinesRef.current = createdPolylines;

          // Incident Markers
          if (routeStyle === 'traffic' && travelMode === 'DRIVING' && fullPath.length > 50) {
             const incidentIdx = Math.floor(fullPath.length * 0.4);
             const pos = fullPath[incidentIdx];
             const marker = new google.maps.Marker({
               position: pos,
               map: map,
               label: { text: "🚧", fontSize: "20px" },
               title: "Road Work Ahead",
               zIndex: 101,
               optimized: true
             });
             incidentMarkersRef.current.push(marker);
          }
          
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
             const distanceFactor = Math.min(distKmRaw / 25, 2); 
             const hapticPattern = [30, 40, 50].map(v => v * distanceFactor);
             navigator.vibrate(hapticPattern);
          }

          newPolylines.forEach(p => {
            const isWalking = travelMode === 'WALKING';
            const isTransit = (travelMode as string) === 'TRANSIT';
            const baseColor = routeStyle === 'traffic' ? '#ef4444' : isWalking ? '#10b981' : isTransit ? '#f59e0b' : '#3b82f6';
            
            p.setOptions({
               strokeColor: baseColor,
               strokeOpacity: 0.4,
               strokeWeight: 8,
               zIndex: 100
            });
            
            const mainIcon = {
              path: 'M 0,-2 0,2',
              strokeOpacity: 1,
              strokeColor: baseColor,
              scale: 4,
              strokeWeight: 3
            };

            const glowIcon = {
              path: 'M 0,-3 0,3',
              strokeOpacity: 0.3,
              strokeColor: '#fff',
              scale: 5,
              strokeWeight: 1
            };

            p.setOptions({
              icons: [
                {
                  icon: mainIcon,
                  offset: '0',
                  repeat: '24px'
                },
                {
                  icon: glowIcon,
                  offset: '12px',
                  repeat: '48px'
                }
              ]
            });

            p.setMap(map);
          });
          
          polylinesRef.current = newPolylines;

          const fullPathTotal = route.path || [];
          let pointsVisible = 0;
          const totalPoints = fullPathTotal.length;
          const pointsPerFrame = Math.max(1, Math.ceil(totalPoints / 45)); 

          const drawLoop = () => {
            pointsVisible += pointsPerFrame;
            if (pointsVisible <= totalPoints) {
              startFlowAnimation();
            } else {
              startFlowAnimation();
            }
          };

          const startFlowAnimation = () => {
            let offset = 0;
            const animateRoute = () => {
                offset = (offset + 1) % 200;
                const pulseOpacity = 0.5 + 0.3 * Math.sin(Date.now() / 600);
                
                polylinesRef.current.forEach(p => {
                  const icons = p.get('icons');
                  if (icons) {
                    icons.forEach((icon: any, idx: number) => {
                      const staggeredOffset = (offset + (idx * 24)) % 200;
                      icon.offset = staggeredOffset + 'px';
                    });
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
        incidentMarkersRef.current.forEach(m => m.setMap(null));
      };
    }
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
             )} style={{ width: travelMode === 'TRANSIT' ? '100%' : '10%' }}></div>
        </div>

        {/* Real-time Transit Route Loading Overlay */}
        {isTransitLoading && (
          <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-2xl border border-white/5 mt-1">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin mb-1.5" />
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Syncing Transit Schedule</span>
          </div>
        )}

        {/* Real-time Transit Steps List */}
        {travelMode === 'TRANSIT' && transitData && !isTransitLoading && (
          <div className="flex flex-col gap-2.5 mt-1 border-t border-white/5 pt-3 max-h-[220px] overflow-y-auto custom-scrollbar">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Multi-Modal Travel Summary
            </span>

            <div className="flex flex-col gap-3 relative border-l-2 border-slate-800 ml-2.5 pl-4 pb-1">
              {transitData.routes[0]?.legs[0]?.steps?.map((step: any, idx: number) => {
                const isWalk = step.travel_mode === 'WALKING';
                const stepColor = isWalk ? '#10b981' : (step.transit_details?.line?.color || '#3b82f6');
                const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

                return (
                  <div key={`transit-step-${idx}`} className="relative text-xs">
                    {/* Node connector indicator */}
                    <div 
                      className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900 border-2"
                      style={{ borderColor: stepColor }}
                    />

                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isWalk ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">
                            Walk
                          </span>
                        ) : (
                          <span 
                            className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold text-white shadow"
                            style={{ backgroundColor: stepColor }}
                          >
                            {step.transit_details?.line?.short_name || step.transit_details?.line?.name || 'Transit'}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {step.duration?.text || '3 mins'} ({step.distance?.text || '200m'})
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-200 leading-relaxed mt-0.5">
                        {stripHtml(step.html_instructions || '')}
                      </p>

                      {!isWalk && step.transit_details && (
                        <span className="text-[9px] text-slate-500 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5 w-fit mt-1">
                          {step.transit_details.num_stops} stops • {step.transit_details.departure_stop?.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
