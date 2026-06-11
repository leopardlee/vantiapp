import React, { useMemo, useState, useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { LightingEffect, AmbientLight, _SunLight as SunLight } from '@deck.gl/core';

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.2
});
const dirLight = new SunLight({
  timestamp: Date.UTC(2023, 7, 1, 22),
  color: [255, 255, 255],
  intensity: 1.5,
});
const lightingEffect = new LightingEffect({ambientLight, dirLight});

const material = {
  ambient: 0.8,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [255, 255, 255] as [number, number, number]
};

export function DeckGlOverlay({ data, mapTheme, showTrafficLayer = false }: { data?: any[], mapTheme: string, showTrafficLayer?: boolean }) {
  const map = useMap();
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setTime(t => (t + 3) % 1500);
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  const overlay = useMemo(() => {
    return new GoogleMapsOverlay({
      layers: [],
      effects: [lightingEffect]
    });
  }, []);

  useEffect(() => {
    if (map) {
      overlay.setMap(map);
    }
    return () => {
      overlay.setMap(null);
    };
  }, [map, overlay]);

  const trips = useMemo(() => {
    if (!data || data.length < 2) return [];
    const _trips = [];
    for (let i = 0; i < Math.min(data.length, 50); i++) {
        _trips.push({
            path: [
                [data[i % data.length].lng, data[i % data.length].lat],
                [data[(i + 1) % data.length].lng, data[(i + 1) % data.length].lat],
                [data[(i + 2) % data.length].lng, data[(i + 2) % data.length].lat]
            ],
            timestamps: [0, 750, 1500],
            color: (i % 2 === 0) ? [255, 0, 128] : [0, 255, 128]
        });
    }
    return _trips;
  }, [data]);

  useEffect(() => {
    const layers = [];
    
    const isCyberTheme = mapTheme === 'Simulation' || mapTheme === 'Neo-Tokyo' || mapTheme === 'Cosmic';
    const isDarkTheme = isCyberTheme || mapTheme === 'Midnight' || mapTheme === 'Night' || mapTheme === 'Night-Shift' || mapTheme === 'High-Contrast';
    
    // Omni-Ambient Climate & Context Syncer: Detect dawn, evening, and night
    const hour = new Date().getHours();
    const isDawning = hour >= 5 && hour < 8;
    const isEvening = hour >= 17 && hour < 20;
    const isNight = hour >= 20 || hour < 5;
    const isSpecialHour = isDawning || isEvening || isNight;

    // Harmonic pulse calculated on the fly using the animated time multiplier
    const pulseFactor = 1 + 0.22 * Math.sin(time / 120);
    const elevationScaleFactor = isSpecialHour 
      ? (isCyberTheme ? 26 * pulseFactor : 16 * pulseFactor) 
      : (isCyberTheme ? 10 : 4);

    const specialNeonColors: [number, number, number][] = [
      [255, 0, 128],   // Crimson Hot Pink
      [180, 0, 255],   // Deep Indigo Neon
      [0, 255, 230],   // Cyan Cyberpunk Glow
      [240, 255, 0],   // Acid Green Core
      [255, 120, 200], // Electric Blossom
      [255, 255, 255]  // Luminescent White
    ];

    // Abstract data points visualization using Deck.gl
    if (data && data.length > 0) {
      layers.push(
        new HexagonLayer({
          id: 'hexagon-layer',
          data,
          pickable: true,
          extruded: true,
          radius: 120,
          elevationScale: elevationScaleFactor,
          getPosition: (d: any) => [d.lng, d.lat],
          colorRange: isSpecialHour ? specialNeonColors : (isDarkTheme ? [
             [10, 40, 60],
             [20, 80, 120],
             [40, 160, 200],
             [80, 200, 240],
             [160, 240, 255],
             [255, 255, 255]
          ] : [
             [255, 255, 204],
             [199, 233, 180],
             [127, 205, 187],
             [65, 182, 196],
             [44, 127, 184],
             [37, 52, 148]
          ]),
          material,
          transitions: {
            elevationScale: {
              duration: 1500,
              easing: (t: number) => t * (2 - t)
            }
          }
        }),
        new ScatterplotLayer({
          id: 'scatter-layer',
          data,
          pickable: true,
          opacity: isCyberTheme ? 0.9 : 0.6,
          stroked: true,
          filled: true,
          radiusScale: 6,
          radiusMinPixels: 2,
          radiusMaxPixels: 150,
          lineWidthMinPixels: 2,
          getPosition: d => [d.lng, d.lat],
          getFillColor: d => isCyberTheme ? [0, 255, 255, 180] : [255, 200, 0, 150],
          getLineColor: d => isCyberTheme ? [255, 0, 255, 255] : [255, 255, 255, 200],
          transitions: {
            getFillColor: 1000,
            getLineColor: 1000
          }
        })
      );
    }
    
    if (isCyberTheme && trips.length > 0) {
      layers.push(
        new TripsLayer({
          id: 'trips-layer',
          data: trips,
          getPath: d => d.path,
          getTimestamps: d => d.timestamps,
          getColor: d => d.color,
          opacity: 0.8,
          widthMinPixels: 4,
          jointRounded: true,
          capRounded: true,
          trailLength: 400,
          currentTime: time,
          shadowEnabled: false
        })
      );
    }

    // Traffic visualization simulation via ArcLayer
    if (showTrafficLayer && data && data.length > 1) {
       const arcs = [];
       for(let i=0; i<Math.min(data.length-1, 15); i++) {
         arcs.push({
           source: [data[i].lng, data[i].lat],
           target: [data[i+1].lng, data[i+1].lat],
           gain: Math.random() * 100
         });
       }
       layers.push(
         new ArcLayer({
           id: 'arc-layer',
           data: arcs,
           getSourcePosition: d => d.source,
           getTargetPosition: d => d.target,
           getSourceColor: isCyberTheme ? [255, 0, 255, 200] : [0, 128, 200, 200],
           getTargetColor: isCyberTheme ? [0, 255, 255, 200] : [200, 0, 80, 200],
           getWidth: 3,
           getHeight: d => d.gain * 5,
           tilt: 15,
           transitions: {
             getSourceColor: 1500,
             getTargetColor: 1500
           }
         })
       );
    }

    overlay.setProps({ layers, effects: [lightingEffect] });
  }, [data, overlay, mapTheme, showTrafficLayer, time, trips]);

  return null;
}
