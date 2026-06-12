import { useEffect, useState } from 'react';
import { useVantiStore } from '../store/vantiStore';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export function FriendsLocationListener() {
  const setFriendsLocations = useVantiStore((state) => state.setFriendsLocations);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Assuming friends are stored in 'friends' collection
    const unsubscribe = onSnapshot(collection(db, 'friends'), (snapshot) => {
        const locations: Record<string, any> = {};
        snapshot.forEach((doc) => {
            locations[doc.id] = doc.data();
        });
        setFriendsLocations(locations);
    }, (error) => {
        console.warn("Friends listener error ignored:", error);
    });

    return () => unsubscribe();
  }, [currentUser, setFriendsLocations]);

  return null;
}
