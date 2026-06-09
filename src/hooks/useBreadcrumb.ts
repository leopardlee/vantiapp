import { useState, useEffect } from 'react';

export function useBreadcrumb(enabled: boolean) {
  const [trail, setTrail] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setTrail((prev) => [...prev, { lat: latitude, lng: longitude }]);
      },
      (err) => console.error("Geolocation watch error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return trail;
}
