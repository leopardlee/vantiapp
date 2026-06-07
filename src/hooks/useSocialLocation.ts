import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, query, where, limit } from 'firebase/firestore';

export interface SharedLocation {
  uid: string;
  displayName: string;
  photoURL: string;
  lat: number;
  lng: number;
  updatedAt: number;
}

/**
 * Real-time location sharing hook for seeing friends on the map.
 * Synchronizes user's current coordinates with Firestore and subscribes
 * to active sessions from others.
 */
export function useSocialLocation(enabled: boolean) {
  const [activePeers, setActivePeers] = useState<SharedLocation[]>([]);

  useEffect(() => {
    // Only share and listen if explicitly enabled and user is authenticated
    if (!enabled || !auth.currentUser) {
      setActivePeers([]);
      return;
    }

    const currentUser = auth.currentUser;

    /**
     * Broadcasts current position to Firestore
     */
    const broadcastLocation = async () => {
      if (!navigator.geolocation || !auth.currentUser) return;
      
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const userRef = doc(db, 'userLocations', auth.currentUser!.uid);
            await setDoc(userRef, {
              uid: auth.currentUser!.uid,
              displayName: auth.currentUser?.displayName || 'Anonymous Explorer',
              photoURL: auth.currentUser?.photoURL || '',
              lat: latitude,
              lng: longitude,
              updatedAt: Date.now()
            }, { merge: true });
          } catch (err) {
            console.warn("[Social Location] Failed to broadcast position:", err);
          }
        },
        (err) => console.warn("[Social Location] Geolocation access failed:", err),
        { enableHighAccuracy: true }
      );
    };

    // Initial broadcast
    broadcastLocation();
    
    // Pulse location updates every 45 seconds to keep session alive but save quota
    const interval = setInterval(broadcastLocation, 45000);

    /**
     * Real-time subscription to others' locations
     * We look for any session updated in the last 15 minutes
     */
    const activeThreshold = Date.now() - 15 * 60 * 1000;
    const q = query(
      collection(db, 'userLocations'),
      where('updatedAt', '>', activeThreshold),
      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs
        .map(d => d.data() as SharedLocation)
        .filter(u => u.uid !== currentUser.uid);
      
      setActivePeers(users);
    }, (error) => {
      console.error("[Social Location] Subscription error:", error);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [enabled]);

  return activePeers;
}
