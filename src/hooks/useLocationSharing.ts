import { useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useVantiStore } from '../store/vantiStore';

export function useLocationSharing() {
  const setUserLocation = useVantiStore((state) => state.setUserLocation);
  const setPeerLocation = useVantiStore((state) => state.setPeerLocation);
  
  // 1. Publish own location
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const userRef = doc(db, 'userLocations', auth.currentUser!.uid);
          setDoc(userRef, {
            uid: auth.currentUser!.uid,
            lat: latitude,
            lng: longitude,
            updatedAt: Date.now(),
            displayName: auth.currentUser!.displayName || 'Anonymous'
          }, { merge: true });
          
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (err) => console.warn("Location sharing failed:", err),
        { enableHighAccuracy: true }
      );
    }, 5000); // Update every 5s
    
    return () => clearInterval(interval);
  }, [setUserLocation]);

  // 2. Listen to other users
  useEffect(() => {
    const q = query(collection(db, 'userLocations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (data.uid !== auth.currentUser?.uid) {
           setPeerLocation(data.uid, { lat: data.lat, lng: data.lng, displayName: data.displayName });
        }
      });
    }, (error) => {
      console.error("Firestore userLocations listener error: ", error);
    });
    return () => unsubscribe();
  }, [setPeerLocation]);
}
