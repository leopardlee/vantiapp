import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useVantiStore } from '../store/vantiStore';

export default function ItineraryLegsDisplay() {
  const map = useMap();
  const itinerary = useVantiStore((state) => state.itinerary);
  const hiddenItinerarySegments = useVantiStore((state) => state.hiddenItinerarySegments);
  const polylinesRef = useRef<Record<string, google.maps.Polyline>>({});
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) return;

    const activeSegmentIds = new Set<string>();
    
    for (let i = 0; i < itinerary.length - 1; i++) {
      const stopA = itinerary[i];
      const stopB = itinerary[i + 1];
      const segmentId = `${stopA.id}_to_${stopB.id}`;
      
      const latA = Number(stopA.lat || stopA.location?.lat);
      const lngA = Number(stopA.lng || stopA.location?.lng);
      const latB = Number(stopB.lat || stopB.location?.lat);
      const lngB = Number(stopB.lng || stopB.location?.lng);

      if (isNaN(latA) || isNaN(lngA) || isNaN(latB) || isNaN(lngB)) continue;
      
      const isHidden = !!hiddenItinerarySegments[segmentId];
      if (isHidden) continue;

      activeSegmentIds.add(segmentId);

      if (polylinesRef.current[segmentId]) {
        continue;
      }

      // Animated, glowing geodesic line segment
      const poly = new google.maps.Polyline({
        path: [
          { lat: latA, lng: lngA },
          { lat: latB, lng: lngB }
        ],
        strokeColor: '#f43f5e',
        strokeOpacity: 0.5,
        strokeWeight: 4,
        geodesic: true,
        zIndex: 90,
        map: map,
        icons: [
          {
            icon: {
              path: 'M 0,-1.5 0,1.5',
              strokeOpacity: 1,
              strokeColor: '#fda4af',
              scale: 3,
              strokeWeight: 2.5
            },
            offset: '0px',
            repeat: '20px'
          }
        ]
      });

      polylinesRef.current[segmentId] = poly;
    }

    // Clean up inactive polylines
    Object.keys(polylinesRef.current).forEach((key) => {
      if (!activeSegmentIds.has(key)) {
        polylinesRef.current[key].setMap(null);
        delete polylinesRef.current[key];
      }
    });

  }, [map, itinerary, hiddenItinerarySegments]);

  // Dashflow animation loop
  useEffect(() => {
    let offset = 0;
    const animate = () => {
      offset = (offset + 1) % 200;
      Object.values(polylinesRef.current).forEach((poly) => {
        const icons = poly.get('icons');
        if (icons && icons[0]) {
          icons[0].offset = offset + 'px';
          poly.set('icons', icons);
        }
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Total cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(polylinesRef.current).forEach((p) => p.setMap(null));
      polylinesRef.current = {};
    };
  }, []);

  return null;
}
