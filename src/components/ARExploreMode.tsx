import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { 
  Camera, 
  X, 
  Compass, 
  MapPin, 
  Plus, 
  Check, 
  Eye, 
  Sparkles, 
  ArrowRight,
  Navigation,
  Info,
  InfoIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

export function ARExploreMode() {
  const isAROpen = useVantiStore((state) => state.isAROpen);
  const setIsAROpen = useVantiStore((state) => state.setIsAROpen);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isTranslationActive, setIsTranslationActive] = useState(false);
  const [scannedTranslations, setScannedTranslations] = useState<{ id: string, kor: string, x: number, y: number, w: number, h: number }[]>([]);

  // Simulation for Korean AR translations
  useEffect(() => {
    let interval: any;
    if (isAROpen && isTranslationActive) {
      interval = setInterval(() => {
        // Mock CV detection stream with floating translations
        setScannedTranslations([
          { id: '1', kor: '서울역 (Seoul Station)', x: 40 + Math.random() * 5, y: 30 + Math.random() * 5, w: 25, h: 10 },
          { id: '2', kor: '순대국밥 (Blood Sausage Soup)', x: 60 + Math.random() * 5, y: 50 + Math.random() * 5, w: 20, h: 8 },
        ]);
      }, 1500);
    } else {
      setScannedTranslations([]);
    }
    return () => clearInterval(interval);
  }, [isAROpen, isTranslationActive]);

  // Zustand state and actions
  const viewportLandmarks = useVantiStore(state => state.viewportLandmarks || []);
  const bookmarkedPlaces = useVantiStore(state => state.bookmarkedPlaces || {});
  const mapViewport = useVantiStore(state => state.mapViewport);
  const userLocation = useVantiStore(state => state.userLocation);
  const addToItinerary = useVantiStore(state => state.addToItinerary);
  const itinerary = useVantiStore(state => state.itinerary || []);
  
  const [heading, setHeading] = useState(120); // Default simulated heading in degrees
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeStartRef = useRef<number>(0);
  const headingStartRef = useRef<number>(0);
  
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // Fallback landmarks if map is not loaded / viewport is empty
  const fallbackLandmarks = [
    { id: 'fb-1', name: 'Historic Grand Cathedral', position: { lat: 37.566, lng: 126.978 }, types: ['historic', 'landmark'] },
    { id: 'fb-2', name: 'Central Gyeongbok Palace', position: { lat: 37.579, lng: 126.977 }, types: ['museum', 'landmark'] },
    { id: 'fb-3', name: 'Bukchon Hanok Traditional Village', position: { lat: 37.582, lng: 126.982 }, types: ['historic_site'] },
    { id: 'fb-4', name: 'Namsan Mountain Seoul Tower', position: { lat: 37.551, lng: 126.988 }, types: ['tourist_attraction', 'monument'] },
    { id: 'fb-5', name: 'Dongdaemun Design Plaza (DDP)', position: { lat: 37.566, lng: 127.009 }, types: ['landmark', 'art'] }
  ];

  const currentCenter = mapViewport?.center || userLocation || { lat: 37.5665, lng: 126.9780 };

  // Combine viewport landmarks from Google Maps and high-fidelity local backups
  const displayPlaces = React.useMemo(() => {
    const arr = [...viewportLandmarks];
    
    // Add fallback items if list is sparse (under 3 items)
    if (arr.length < 3) {
      fallbackLandmarks.forEach(item => {
        // Adapt coordinates slightly around current center to feel live
        const latOffset = (item.position.lat - 37.5665) + currentCenter.lat;
        const lngOffset = (item.position.lng - 126.9780) + currentCenter.lng;
        
        arr.push({
          id: item.id,
          name: typeof item.name === 'object' ? (item.name as any).text || 'Landmark' : item.name,
          position: { lat: latOffset, lng: lngOffset },
          types: item.types
        });
      });
    }

    // Filter duplicates
    const uniqueMap = new Map();
    arr.forEach(p => {
      const nameStr = typeof p.name === 'object' ? p.name.text : p.name;
      if (nameStr && !uniqueMap.has(nameStr)) {
        uniqueMap.set(nameStr, p);
      }
    });

    return Array.from(uniqueMap.values());
  }, [viewportLandmarks, currentCenter]);

  // Turn on device camera if available
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isAROpen) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(s => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(e => console.log("Video play request failed", e));
            }
          })
          .catch(err => {
            console.warn("Real camera access denied or unavailable. Running in high-fidelity computer-vision simulated sandbox mode.", err);
          });
      }

      // Gyro sensor fallback on mobile
      const handleOrientation = (e: DeviceOrientationEvent) => {
         if (e.alpha !== null) {
            setHeading(360 - e.alpha);
         }
      };
      
      if (typeof window !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
         (DeviceOrientationEvent as any).requestPermission()
           .then((res: string) => {
              if (res === 'granted') {
                 window.addEventListener('deviceorientation', handleOrientation);
              }
           })
           .catch(console.error);
      } else if (typeof window !== 'undefined') {
         window.addEventListener('deviceorientation', handleOrientation);
      }
      
      return () => {
         if (stream) {
            stream.getTracks().forEach(t => t.stop());
         }
         if (typeof window !== 'undefined') {
           window.removeEventListener('deviceorientation', handleOrientation);
         }
      };
    }
  }, [isAROpen]);

  // Handle Drag / Swipe on the screen to Pan Bearing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsSwiping(true);
    swipeStartRef.current = e.clientX;
    headingStartRef.current = heading;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    const diffX = e.clientX - swipeStartRef.current;
    // Scale panning sensitivity
    let nextHeading = (headingStartRef.current - diffX * 0.4) % 360;
    if (nextHeading < 0) nextHeading += 360;
    setHeading(nextHeading);
  };

  const handleMouseUp = () => {
    setIsSwiping(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setIsSwiping(true);
      swipeStartRef.current = e.touches[0].clientX;
      headingStartRef.current = heading;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || !e.touches[0]) return;
    const diffX = e.touches[0].clientX - swipeStartRef.current;
    let nextHeading = (headingStartRef.current - diffX * 0.4) % 360;
    if (nextHeading < 0) nextHeading += 360;
    setHeading(nextHeading);
  };

  // Compute spatial metrics for the nodes relative to our current center & heading
  const processedNodes = React.useMemo(() => {
    return displayPlaces.map((p: any) => {
      const latDiff = p.position.lat - currentCenter.lat;
      const lngDiff = p.position.lng - currentCenter.lng;

      // Calculate absolute compass bearing pointing to this landmark
      // standard trigonometry: Math.atan2(dx, dy) where x is East, y is North
      // converting to bearing: 0 is North, 90 East, 180 South, 270 West
      let bearing = Math.atan2(lngDiff, latDiff) * (180 / Math.PI);
      if (bearing < 0) bearing += 360;

      // Distance estimation in meters
      // Degree of latitude represents roughly 111,000 meters
      const distanceM = Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000);

      const nameText = typeof p.name === 'object' ? p.name.text : p.name;

      return {
        ...p,
        displayNameStr: nameText,
        bearing,
        distanceM
      };
    });
  }, [displayPlaces, currentCenter]);

  // Is Stop Already Added to Itinerary?
  const isStopSaved = (name: string) => {
    return itinerary.some((item: any) => 
      item.name?.toLowerCase() === name.toLowerCase() || 
      item.displayName?.toLowerCase() === name.toLowerCase()
    );
  };

  const handleAddStop = (node: any) => {
    const newStop = {
      id: `ar-added-${Date.now()}`,
      displayName: node.displayNameStr,
      name: node.displayNameStr,
      lat: node.position.lat,
      lng: node.position.lng,
      formattedAddress: `${node.displayNameStr} • Scanned in AR Compass View`
    };
    addToItinerary(newStop);

    // Tactile vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40]);
    }
  };

  return (
    <>
      {/* AR Overlay Viewport Container */}
      <AnimatePresence>
        {isAROpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="fixed inset-0 z-[200] bg-black overflow-hidden flex flex-col justify-end select-none cursor-grab active:cursor-grabbing font-sans"
          >
             {/* Dynamic Video Stream Background or Visual Cyber Matrix Layer */}
             <video 
               ref={videoRef}
               playsInline
               autoPlay
               muted
               className="absolute inset-0 w-full h-full object-cover filter brightness-[0.45] contrast-[1.1] hue-rotate-[10deg] saturate-[1.2]"
             />

             {/* Dynamic Digital Mesh Grid Pattern if Camera is Sandbox Simulated */}
             <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(12,14,20,0.8)_80%)]" />
             <div 
               className="absolute inset-0 pointer-events-none opacity-[0.04]" 
               style={{ 
                 backgroundImage: 'linear-gradient(rgba(18, 161, 255, 0.4) 50%, transparent 50%), linear-gradient(90deg, rgba(18, 161, 255, 0.4) 50%, transparent 50%)', 
                 backgroundSize: '16px 16px' 
               }} 
             />

             {/* Glitch CRT scanning lines effect */}
             <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-gradient-to-b from-transparent via-purple-500/10 to-transparent bg-[length:100%_4px]" />

             {/* AR HUD Crosshairs & Safe-Zone */}
             <div className="absolute inset-4 pointer-events-none border border-purple-500/20 rounded-[32px]">
               {/* Corner brackets */}
               <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-400/50 rounded-tl-xl" />
               <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-400/50 rounded-tr-xl" />
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-400/50 rounded-bl-xl" />
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-400/50 rounded-br-xl" />
               
               <div className="absolute top-4 left-6 text-[10px] font-mono tracking-widest text-purple-400/60 font-medium">
                 RASTER FIELD SCAN: {(heading).toFixed(1)}° BEAR
               </div>
               <div className="absolute top-4 right-6 text-[10px] font-mono tracking-widest text-emerald-400/80 font-medium flex items-center gap-1.5 animate-pulse">
                 <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                 LIDAR DEPTH SYNCD
               </div>
               
               {/* Reticle Area */}
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <div className="w-24 h-24 border border-dashed border-purple-500/40 rounded-full animate-spin-slow" style={{ animationDuration: '30s' }} />
                  <div className="absolute w-28 h-28 border border-white/5 rounded-full" />
                  <div className="absolute w-12 h-[1px] bg-purple-400/40" />
                  <div className="absolute h-12 w-[1px] bg-purple-400/40" />
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_10px_#ef4444]" />
               </div>
             </div>

             {/* SPATIAL LABES / LANDMARKS AR RENDERER */}
             <div 
               className="absolute inset-0 overflow-hidden select-none pointer-events-auto"
               onTouchStart={handleTouchStart}
               onMouseDown={handleMouseDown}
             >
                {processedNodes.map((node: any, idx: number) => {
                  // Find deviation angle between the landmark's absolute bearing and current camera bearing
                  let angleDiff = node.bearing - heading;
                  
                  // Wrap to -180 to 180 degrees
                  angleDiff = Math.atan2(Math.sin(angleDiff * Math.PI / 180), Math.cos(angleDiff * Math.PI / 180)) * (180 / Math.PI);
                  
                  // FOV limits: Hide if more than 48 degrees left or right from center
                  const FOV = 48;
                  if (Math.abs(angleDiff) > FOV) return null;

                  // Translate angle to screen % (50% is center)
                  const leftOffset = 50 + (angleDiff / FOV) * 50;
                  
                  // Stagger height based on index or distance to avoid clumping
                  const baseTop = 32;
                  const staggerOffset = (idx * 14) % 36;
                  const topOffset = baseTop + staggerOffset;

                  // Depth scaling: further objects look smaller and more faint
                  const scale = Math.max(0.65, Math.min(1.05, 1 - (node.distanceM / 2800) * 0.3));
                  const opacity = Math.max(0.4, Math.min(1, 1 - (node.distanceM / 2800) * 0.45));

                  const isSaved = isStopSaved(node.displayNameStr);

                  return (
                    <motion.div
                      key={node.id || idx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: scale, opacity: opacity }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute group flex flex-col items-center justify-center transition-all duration-300 pointer-events-auto origin-center z-10"
                      style={{
                        left: `${leftOffset}%`,
                        top: `${topOffset}%`,
                        transform: `translate(-50%, -50%) scale(${scale})`
                      }}
                    >
                      {/* Connection Pointer Line */}
                      <div className="h-10 w-[1px] bg-gradient-to-b from-purple-500/80 to-transparent mb-1" />

                      {/* Interactive Spatial Node */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(node);
                        }}
                        className={cn(
                          "px-3.5 py-2.5 rounded-2xl border backdrop-blur-md flex flex-col gap-1 items-start shadow-[0_15px_30px_rgba(0,0,0,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-all max-w-[200px]",
                          selectedNode?.displayNameStr === node.displayNameStr
                            ? "bg-purple-600/90 border-purple-400 text-white shadow-purple-900/40"
                            : "bg-black/75 border-purple-500/30 text-slate-100 hover:border-purple-400"
                        )}
                      >
                        {/* Title & Badge */}
                        <div className="flex items-center gap-1.5 w-full">
                          <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="text-[11px] font-black line-clamp-1 flex-1 leading-tight tracking-tight">
                            {node.displayNameStr}
                          </span>
                        </div>

                        {/* Bearing vs Distance Metric */}
                        <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400 font-bold border-t border-white/5 pt-1 mt-0.5">
                          <span>{node.distanceM > 1000 ? `${(node.distanceM / 1000).toFixed(1)} km` : `${node.distanceM}m`}</span>
                          <span className="text-purple-400">{Math.round(node.bearing)}°</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
             </div>

             {/* SELECTED LANDMARK BOTTOM PANEL */}
             <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    className="absolute bottom-28 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md bg-[#0e1118]/95 border border-purple-500/40 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30 pointer-events-auto"
                  >
                     <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[9px] tracking-widest font-bold uppercase">
                            HISTORICAL LANDMARK
                          </span>
                          <h3 className="text-base font-black text-white mt-1.5 leading-snug">{selectedNode.displayNameStr}</h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            A historical point of interest scanned from your live viewport coordinates. Bearing {Math.round(selectedNode.bearing)}° relative to your current panning vector.
                          </p>
                        </div>
                        <button 
                          onClick={() => setSelectedNode(null)}
                          className="p-1.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors border border-transparent hover:border-white/5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2.5 flex flex-col justify-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-wider">LIDAR Distance</span>
                          <span className="text-sm font-extrabold text-[#22d3ee] mt-0.5 font-mono">
                            {selectedNode.distanceM > 1000 ? `${(selectedNode.distanceM / 1000).toFixed(1)} km` : `${selectedNode.distanceM} m`}
                          </span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2.5 flex flex-col justify-center">
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-wider">Compass Bearing</span>
                          <span className="text-sm font-extrabold text-purple-400 mt-0.5 font-mono">
                            {Math.round(selectedNode.bearing)}° ({selectedNode.bearing < 45 || selectedNode.bearing >= 315 ? 'N' : selectedNode.bearing < 135 ? 'E' : selectedNode.bearing < 225 ? 'S' : 'W'})
                          </span>
                        </div>
                     </div>

                     <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                        <button
                          onClick={() => {
                            const saved = isStopSaved(selectedNode.displayNameStr);
                            if (!saved) {
                              handleAddStop(selectedNode);
                            }
                          }}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all outline-none",
                            isStopSaved(selectedNode.displayNameStr)
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30"
                          )}
                        >
                          {isStopSaved(selectedNode.displayNameStr) ? (
                            <>
                              <Check className="w-4 h-4" />
                              Saved In Trip
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add Stop to Trip
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            // Set as destinations triggering map pathing back in shell
                             useVantiStore.setState({
                              selectedPlace: {
                                id: selectedNode.id || `ar-poi-${Date.now()}`,
                                displayName: selectedNode.displayNameStr,
                                name: selectedNode.displayNameStr,
                                lat: selectedNode.position.lat,
                                lng: nodeToLatLng(selectedNode.position.lng),
                                location: selectedNode.position
                              },
                              activeMode: 'all'
                            });
                            setIsAROpen(false);
                          }}
                          className="p-3 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          title="View on Main Map"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>

             {/* COAXIAL ROTOR COMPASS BAR (Horizontal compass strip across screen) */}
             <div className="relative z-10 w-full px-6 flex flex-col items-center pb-8 pt-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-auto">
                <div className="text-[10px] font-mono font-bold tracking-widest text-purple-400/80 mb-2.5 flex items-center gap-1.5">
                   <Compass className="w-3.5 h-3.5 rotate-12 text-purple-400" />
                   COMPASS AZIMUTH RADAR (TAP & DRAG TO SWIPE)
                </div>

                {/* Sliding scale ruler */}
                <div className="w-full h-12 relative overflow-hidden bg-slate-950/80 border border-purple-500/20 rounded-2xl flex items-center justify-center">
                  <div 
                    className="absolute h-full flex items-center transition-all duration-75 text-[10px] font-mono font-bold text-slate-500"
                    style={{ 
                      width: '3600px', 
                      transform: `translateX(${-heading * 4 + 180}px)` 
                    }}
                  >
                    {/* Tick marks every 10 degrees */}
                    {Array.from({ length: 36 }).map((_, i) => {
                      const deg = i * 10;
                      let label = `${deg}°`;
                      if (deg === 0) label = 'N';
                      if (deg === 90) label = 'E';
                      if (deg === 180) label = 'S';
                      if (deg === 270) label = 'W';

                      return (
                        <div 
                          key={deg} 
                          className="absolute flex flex-col items-center justify-end h-full pb-1.5"
                          style={{ left: `${deg * 4}px`, width: '40px' }}
                        >
                          <span className={cn(
                            (deg === 0 || deg === 90 || deg === 180 || deg === 270) ? "text-purple-400 text-[11px] font-black" : "text-slate-500"
                          )}>
                            {label}
                          </span>
                          <div className={cn(
                            "w-[1.5px] bg-slate-700 mt-1",
                            (deg % 30 === 0) ? "h-3.5 bg-purple-500/80" : "h-1.5"
                          )} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Red Center Reticle Line */}
                  <div className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-10 shadow-[0_0_12px_#f43f5e]" />
                </div>

                {/* Direct Heading slider for ease of accessibility */}
                <div className="flex items-center gap-4 w-full mt-4 max-w-sm">
                   <span className="text-[10px] font-mono text-slate-400">0°</span>
                   <input 
                     type="range"
                     min="0"
                     max="359"
                     value={Math.round(heading)}
                     onChange={(e) => setHeading(Number(e.target.value))}
                     className="flex-1 accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                   />
                   <span className="text-[10px] font-mono text-slate-400">360°</span>
                </div>

                <div className="flex justify-between items-center w-full mt-4 border-t border-white/5 pt-3">
                   <div className="flex flex-col font-mono text-left">
                     <span className="text-[9px] text-slate-500 uppercase font-black">Bearing Angle</span>
                     <span className="text-xl font-extrabold text-white font-mono">{Math.floor(heading)}° Azimuth</span>
                   </div>

                   {/* Close overlay */}
                   <div className="flex gap-2">
                     <button 
                       onClick={() => setIsTranslationActive(!isTranslationActive)}
                       className={cn(
                         "px-4 py-2.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 text-xs",
                         isTranslationActive
                           ? "bg-emerald-600/90 text-white border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                           : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
                       )}
                     >
                       <Eye className="w-4 h-4" />
                       AR Scan
                     </button>
                     <button 
                       onClick={() => setIsAROpen(false)}
                       className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                     >
                       <X className="w-4 h-4" />
                       Exit
                     </button>
                   </div>
                </div>
             </div>

             {/* AR TRANSLATION SCANNER OVERLAYS */}
             <AnimatePresence>
                {isTranslationActive && (
                   <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none z-[100]"
                   >
                     {scannedTranslations.map(tx => (
                        <motion.div
                           key={tx.id}
                           layout
                           className="absolute border-2 border-emerald-400 bg-emerald-950/40 backdrop-blur-sm p-2 flex flex-col justify-end"
                           style={{
                              left: `${tx.x}%`,
                              top: `${tx.y}%`,
                              width: `${tx.w}%`,
                              height: `${tx.h}%`,
                              boxShadow: '0 0 20px rgba(52, 211, 153, 0.2)'
                           }}
                        >
                           <div className="bg-emerald-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 w-fit uppercase mb-auto tracking-widest flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> CV TRANSLATED
                           </div>
                           <span className="text-white font-black text-sm drop-shadow-md">{tx.kor}</span>
                        </motion.div>
                     ))}
                   </motion.div>
                )}
             </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Convert latitude / longitude coordinates strings helper
function nodeToLatLng(val: any) {
  if (typeof val === 'function') return val();
  return val;
}
