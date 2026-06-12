import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useVantiStore } from '../store/vantiStore';
import { onAuthStateChanged, User } from 'firebase/auth';

export function useLocationSharing() {
  const setUserLocation = useVantiStore((state) => state.setUserLocation);
  const setPeerLocation = useVantiStore((state) => state.setPeerLocation);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // 1. Publish own location
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const userRef = doc(db, 'userLocations', currentUser.uid);
          setDoc(userRef, {
            uid: currentUser.uid,
            lat: latitude,
            lng: longitude,
            updatedAt: Date.now(),
            displayName: currentUser.displayName || 'Anonymous'
          }, { merge: true });
          
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (err) => console.warn("Location sharing failed:", err),
        { enableHighAccuracy: true }
      );
    }, 5000); // Update every 5s
    
    return () => clearInterval(interval);
  }, [currentUser, setUserLocation]);

  // 2. Listen to other users
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'userLocations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (data.uid !== currentUser.uid) {
           setPeerLocation(data.uid, { lat: data.lat, lng: data.lng, displayName: data.displayName });
        }
      });
    }, (error) => {
      console.error("Firestore userLocations listener error: ", error);
    });
    return () => unsubscribe();
  }, [currentUser, setPeerLocation]);
}
