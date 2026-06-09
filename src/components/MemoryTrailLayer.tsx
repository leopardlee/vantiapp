import React, { useEffect, useState } from 'react';
import { useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { collection, query, where, orderBy, getDocs, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useVantiStore } from '../store/vantiStore';

interface MemoryTrailPin {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export function MemoryTrailLayer() {
  const map = useMap();
  const [pins, setPins] = useState<MemoryTrailPin[]>([]);
  const userLocation = useVantiStore(state => state.userLocation);
  
  // Track and save user location periodically
  useEffect(() => {
    let interval: any;
    if (auth.currentUser && userLocation) {
        // save location to firestore every minute if it changes significantly
        const trackLocation = async () => {
            try {
                const timestamp = Date.now();
                const pinId = timestamp.toString();
                await setDoc(doc(db, 'users', auth.currentUser!.uid, 'memoryTrail', pinId), {
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    timestamp
                });
            } catch (err) {
                console.log('Failed to save memory trail pin:', err);
            }
        };
        trackLocation(); // Initial save
        interval = setInterval(trackLocation, 60000);
    }
    return () => clearInterval(interval);
  }, [userLocation?.lat, userLocation?.lng]); // Depend on actual changing coords

  // Load last 24h of pins
  useEffect(() => {
    const fetchTrail = async () => {
      if (!auth.currentUser) return;
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      try {
        const q = query(
            collection(db, 'users', auth.currentUser.uid, 'memoryTrail'),
            where('timestamp', '>=', twentyFourHoursAgo),
            orderBy('timestamp', 'asc')
        );
        const snapshot = await getDocs(q);
        const fetchedPins = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as MemoryTrailPin[];
        setPins(fetchedPins);
      } catch (e) {
          console.log('Error fetching memory trail', e);
      }
    };
    fetchTrail();
    const refreshInterval = setInterval(fetchTrail, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  if (!map || pins.length === 0) return null;

  return (
    <>
      {/* Visual Pins */}
      {pins.map((pin, index) => (
        <AdvancedMarker key={pin.id} position={{ lat: pin.lat, lng: pin.lng }}>
           <div className="w-2 h-2 rounded-full bg-cyan-400 opacity-60 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </AdvancedMarker>
      ))}

      {/* Connection SVG Line (optional but neat) */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 0 }}>
        {/* You could render an SVG polyline here by projecting lat/lng to view coordinates, but it requires projecting through Map projection API. We'll simplify with just the pins for now. */}
      </svg>
    </>
  );
}
