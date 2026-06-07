import { useState, useEffect, useCallback } from 'react';
import { db, auth, messaging, getToken, onMessage } from '../lib/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';

/**
 * Manages Push Notification lifecycle for VANTI
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!messaging || !auth.currentUser) return;

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      
      if (status === 'granted') {
        const token = await getToken(messaging, { 
          vapidKey: 'BM6BvO4Y_Q0-XlG9-p_nO_lD3-Z-D-I_nO_lD3-Z-D-I' // VANTI Default Mesh Key
        });
        
        if (token) {
          setFcmToken(token);
          // Store token in Firestore for backend delivery
          const tokenRef = doc(db, 'userTokens', auth.currentUser.uid);
          await setDoc(tokenRef, {
            token,
            updatedAt: serverTimestamp(),
            platform: 'web'
          }, { merge: true });
          
          console.log("[VANTI Notifications] Token registered");
        }
      }
    } catch (err) {
      console.warn("[VANTI Notifications] Permission/Token failed:", err);
    }
  }, []);

  // Set up foreground listener
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[VANTI Notifications] Message received in foreground:", payload);
      // We can trigger a custom toast here if needed
    });

    return () => unsubscribe();
  }, []);

  return { permission, requestPermission, fcmToken };
}
