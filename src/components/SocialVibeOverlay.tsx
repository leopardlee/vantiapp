import { useEffect, useState } from 'react';
import { useVantiStore } from '../store/vantiStore';
import { motion } from 'motion/react';

export function SocialVibeOverlay() {
  const userLocation = useVantiStore(state => state.userLocation);
  const [vibe, setVibe] = useState({ intensity: 0.5, description: '' });

  useEffect(() => {
    if (!userLocation) return;
    
    async function fetchVibe() {
      try {
        const response = await fetch('/api/social-vibe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: userLocation?.lat, lng: userLocation?.lng })
        });
        const data = await response.json();
        setVibe(data);
      } catch (e) {
        console.error("Vibe fetch error", e);
      }
    }
    fetchVibe();
  }, [userLocation]);

  if (vibe.intensity < 0.3) return null;

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay"
        style={{
            background: `radial-gradient(circle at 50% 50%, rgba(200, 50, 50, ${vibe.intensity}) 0%, transparent 70%)`
        }}
    />
  );
}
