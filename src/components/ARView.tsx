import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Navigation, Compass, AlertCircle, Info, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';
import { CloseButton } from './CloseButton';
import { MockPlace, UserFriend } from '../data/mockPlaces';

interface ARViewProps {
  places: MockPlace[];
  friends: UserFriend[];
  userLocation: google.maps.LatLngLiteral | null;
  onClose: () => void;
  onSelectPlace: (place: any) => void;
}

interface ARMarker {
  id: string;
  name: string;
  distance: number; // meters
  bearing: number; // degrees
  relativeBearing: number; // degrees relative to user heading
  x: number; // screen pixel x
  y: number; // screen pixel y
  item: any;
  type: 'place' | 'friend';
}

const FOV_HORIZONTAL = 70; // field of view in degrees
const FOV_VERTICAL = 50;

/**
 * Advanced AR View HUD
 * Uses device gyroscope and geolocation to project POIs into camera-space.
 */
export default function ARView({ places, friends, userLocation, onClose, onSelectPlace }: ARViewProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [heading, setHeading] = useState<number>(0);
  const [tilt, setTilt] = useState<number>(0);
  const [arMarkers, setArMarkers] = useState<ARMarker[]>([]);
  const { language, addOverlay, removeOverlay } = useVantiStore();

  useEffect(() => {
    addOverlay('ar_view');
    return () => removeOverlay('ar_view');
  }, []);

  // 1. Initialize Camera
  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("AR Camera Access Denied:", err);
        setHasPermission(false);
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Initialize Device Orientation
  useEffect(() => {
    // Request permission for iOS 13+
    const requestOrientation = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
             console.warn("Orientation permission denied on iOS");
          }
        } catch (e) {
          console.warn("Orientation permission request failed:", e);
        }
      }
    };

    requestOrientation();

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // heading: 0 is North, clockwise 0-360
      // webkitCompassHeading is available on iOS
      let currentHeading = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      setHeading(currentHeading);
      
      // tilt: gamma for landscape/tilt, beta for pitch
      setTilt(e.beta || 0); // pitch
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // 3. Compute AR Projections
  useEffect(() => {
    if (!userLocation) return;

    const calculateDistance = (p1: google.maps.LatLngLiteral, p2: { lat: number, lng: number }) => {
      const R = 6371e3; // Earth radius in meters
      const φ1 = p1.lat * Math.PI / 180;
      const φ2 = p2.lat * Math.PI / 180;
      const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
      const Δλ = (p2.lng - p1.lng) * Math.PI / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const calculateBearing = (p1: google.maps.LatLngLiteral, p2: { lat: number, lng: number }) => {
      const startLat = p1.lat * Math.PI / 180;
      const startLng = p1.lng * Math.PI / 180;
      const destLat = p2.lat * Math.PI / 180;
      const destLng = p2.lng * Math.PI / 180;

      const y = Math.sin(destLng - startLng) * Math.cos(destLat);
      const x = Math.cos(startLat) * Math.sin(destLat) -
                Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
      let brng = Math.atan2(y, x);
      brng = brng * 180 / Math.PI;
      return (brng + 360) % 360;
    };

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const allItems = [
      ...places.map(p => ({ ...p, arType: 'place' as const })),
      ...friends.map(f => ({ ...f, arType: 'friend' as const, displayName: f.name }))
    ];

    const markers: ARMarker[] = allItems.map(item => {
      const dist = calculateDistance(userLocation, { lat: item.lat, lng: item.lng });
      const bear = calculateBearing(userLocation, { lat: item.lat, lng: item.lng });
      
      // Calculate relative bearing
      let relBear = bear - heading;
      if (relBear > 180) relBear -= 360;
      if (relBear < -180) relBear += 360;

      // Project onto screen (linear approximation)
      const x = (relBear / (FOV_HORIZONTAL / 2)) * (vw / 2) + (vw / 2);
      
      // Vertical project based on distance and device tilt
      // Further items are higher up, closer are lower, modified by device pitch
      const pitchOffset = (tilt - 75) * 5; // adjust labels based on how up/down phone is held
      const distanceFactor = Math.min(1, dist / 1500); 
      const y = (vh / 2) + pitchOffset - (distanceFactor * 100);

      return {
        id: item.id,
        name: item.displayName || 'Unnamed',
        distance: dist,
        bearing: bear,
        relativeBearing: relBear,
        x,
        y: y,
        item,
        type: item.arType
      };
    }).filter(m => m.distance < 2000); // Only show items within 2km

    setArMarkers(markers);
  }, [userLocation, heading, tilt, places, friends]);

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Camera Access Required</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xs">
          VANTi AR mode requires camera access to overlay location data onto the real world.
        </p>
        <button 
          onClick={onClose}
          className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-slate-200 transition-colors"
        >
          Return to Map
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black overflow-hidden"
    >
      {/* Background Camera Feed */}
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* AR HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dynamic Scan Line */}
        <motion.div 
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-[1px] bg-cyan-400/30 shadow-[0_0_10px_cyan]"
        />

        {/* Orientation Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full opacity-50" />
          <div className="absolute w-12 h-[1px] bg-white/20 left-0" />
          <div className="absolute w-12 h-[1px] bg-white/20 right-0" />
          <div className="absolute h-12 w-[1px] bg-white/20 top-0" />
          <div className="absolute h-12 w-[1px] bg-white/20 bottom-0" />
        </div>

        {/* AR Markers */}
        <AnimatePresence>
          {arMarkers.map(m => {
             // Only render if within horizontal FOV
             if (m.x < -100 || m.x > window.innerWidth + 100) return null;
             
              const scale = Math.max(0.6, 1 - (m.distance / 1500));
             const opacity = Math.max(0.2, 1 - (m.distance / 2000));

             return (
               <motion.div
                 key={m.id}
                 initial={{ scale: 0, opacity: 0, filter: 'blur(20px)' }}
                 animate={{ 
                   left: m.x, 
                   top: m.y, 
                   scale, 
                   opacity,
                   filter: 'blur(0px)'
                 }}
                 exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
                 transition={{ type: "spring", stiffness: 150, damping: 25 }}
                 className="absolute -translate-x-1/2 -translate-y-1/2 p-2 pointer-events-auto cursor-pointer"
                 onClick={() => onSelectPlace(m.item)}
               >
                 <div className="group flex flex-col items-center">
                    {/* Gaussian Splat Simulation Particles */}
                    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden blur-sm">
                        {[...Array(6)].map((_, i) => (
                           <motion.div 
                              key={i}
                              animate={{ 
                                x: [0, (Math.random() - 0.5) * 40, 0],
                                y: [0, (Math.random() - 0.5) * 40, 0],
                                opacity: [0.3, 0.6, 0.3]
                              }}
                              transition={{ 
                                duration: 2 + Math.random() * 2, 
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="absolute w-2 h-2 bg-white/20 rounded-full"
                              style={{ 
                                left: `${50 + (Math.random() - 0.5) * 100}%`,
                                top: `${50 + (Math.random() - 0.5) * 100}%`
                              }}
                           />
                        ))}
                    </div>

                    <div className={cn(
                      "w-12 h-12 rounded-full border-2 border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center transition-all group-hover:scale-125 bg-black/60 backdrop-blur-3xl",
                      m.type === 'friend' ? "ring-2 ring-violet-500/50" : "ring-2 ring-rose-500/50"
                    )}>
                      {m.type === 'friend' ? (
                        <img src={m.item.avatar} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="relative">
                           <MapPin className="w-6 h-6 text-white" />
                           <motion.div 
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 bg-white rounded-full -z-10"
                           />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 bg-black/60 backdrop-blur-3xl border border-white/20 px-3 py-1.5 rounded-xl whitespace-nowrap shadow-2xl">
                       <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <p className="text-[10px] font-black text-white uppercase tracking-tighter">{m.name}</p>
                       </div>
                       <div className="flex items-center gap-1 mt-0.5 border-t border-white/10 pt-1">
                          <Navigation className="w-2.5 h-2.5 text-cyan-400 rotate-45" />
                          <span className="text-[9px] font-mono font-bold text-white/70">
                            {m.distance > 1000 ? `${(m.distance / 1000).toFixed(1)}km` : `${Math.round(m.distance)}m`}
                          </span>
                       </div>
                    </div>
                    
                    {/* Gaussian Gradient Tail */}
                    <div className="w-[2px] h-16 bg-gradient-to-t from-white/60 via-white/20 to-transparent mt-1" />
                 </div>
               </motion.div>
             );
          })}
        </AnimatePresence>
      </div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center relative overflow-hidden">
              <Camera className="w-6 h-6 text-white" />
              <motion.div 
                 animate={{ opacity: [0, 0.5, 0], x: ['-100%', '100%'] }}
                 transition={{ duration: 1.5, repeat: Infinity }}
                 className="absolute inset-0 bg-white/20 -skew-x-12"
              />
           </div>
           <div>
              <h1 className="text-white font-black text-lg tracking-tighter leading-none">GAUSSIAN VISION</h1>
              <p className="text-white/40 text-[10px] font-mono mt-1 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                 Neural Reconstruction Active
              </p>
           </div>
        </div>

        <CloseButton onClick={onClose} isAbsolute={false} className="border-white/10 scale-125" />
      </div>

      {/* Compass / Orientation Stats HUD */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 pointer-events-none">
         <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-white/40 uppercase mb-2">Heading</span>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black font-mono text-white tracking-tighter">{Math.round(heading)}°</span>
               <span className="text-[10px] font-bold text-cyan-400">BRNG</span>
            </div>
         </div>

         <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Visual Compass Disk */}
            <div 
              className="absolute inset-0 border-2 border-white/10 rounded-full transition-transform duration-100"
              style={{ transform: `rotate(${-heading}deg)` }}
            >
               <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-rose-500">N</span>
               <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/40">S</span>
               <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/40">E</span>
               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/40">W</span>
            </div>
            <Compass className="w-12 h-12 text-white/20" />
         </div>

         <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-white/40 uppercase mb-2">Pitch</span>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black font-mono text-white tracking-tighter">{Math.round(tilt)}°</span>
               <span className="text-[10px] font-bold text-cyan-400">DEG</span>
            </div>
         </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">COORDINATES</span>
               <span className="text-[10px] font-mono text-white/80">
                  {userLocation?.lat.toFixed(5)}N / {userLocation?.lng.toFixed(5)}E
               </span>
            </div>
            <div className="flex flex-col">
               <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">VISIBILITY</span>
               <span className="text-[10px] font-mono text-white/80">
                  2.0 KM RADIUS
               </span>
            </div>
         </div>

         <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-[9px] font-bold text-white/60 tracking-wider">SYSTEMS NOMINAL</span>
         </div>
      </div>

    </motion.div>
  );
}
