import { useEffect, useState } from 'react';
import SunCalc from 'suncalc';
import { useVantiStore } from '../store/vantiStore';

export type TimePhase = 'dawn' | 'day' | 'dusk' | 'night';

export function useThemeManager(): { isDarkMode: boolean; timePhase: TimePhase } {
  const userLocation = useVantiStore((state) => state.userLocation);
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const setMapAesthetic = useVantiStore((state) => state.setMapAesthetic);
  const themeOverride = useVantiStore((state) => state.themeOverride);
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [timePhase, setTimePhase] = useState<TimePhase>('night');

  useEffect(() => {
    const checkTheme = () => {
      const now = new Date(); // Note: This uses standard local Date, but coordinates handle the light shift mathematically via SunCalc
      const targetPos = mapViewport?.center || userLocation;

      if (targetPos) {
         // SunCalc takes any time and returns when the sun crosses local horizon for those coords. 
         // For true local time matching we should adjust the Date to local, but since Suncalc uses absolute UTC mathematically to determine sun pos, passing `now` just gives current sun position AT that location.
         
         const times = SunCalc.getTimes(now, targetPos.lat, targetPos.lng);
         
         if (now < times.nauticalDawn || now > times.nauticalDusk) {
             setTimePhase('night');
         } else if (now >= times.nauticalDawn && now < times.sunriseEnd) {
             setTimePhase('dawn');
         } else if (now >= times.sunsetStart && now <= times.nauticalDusk) {
             setTimePhase('dusk');
         } else {
             setTimePhase('day');
         }
         
         setIsDarkMode(now < times.sunrise || now > times.sunset);
      } else {
         // Fallback to simple time based
         const hours = now.getHours();
         if (hours < 5 || hours >= 20) setTimePhase('night');
         else if (hours >= 5 && hours < 8) setTimePhase('dawn');
         else if (hours >= 17 && hours < 20) setTimePhase('dusk');
         else setTimePhase('day');

         setIsDarkMode(hours < 6 || hours > 18);
      }

      if (themeOverride !== 'Auto') {
         setIsDarkMode(themeOverride === 'Dark');
         setTimePhase(themeOverride === 'Dark' ? 'night' : 'day');
      }
    };

    checkTheme();
    const interval = setInterval(checkTheme, 30000); // 30s updates
    return () => clearInterval(interval);
  }, [themeOverride, userLocation, mapViewport]);

  useEffect(() => {
    // Dynamic overlay for entire UI shell indicating mood 
    const isDark = timePhase === 'night' || timePhase === 'dusk';
    document.body.style.backgroundColor = timePhase === 'day' ? '#e2e8f0' : timePhase === 'dawn' ? '#fdf4ff' : timePhase === 'dusk' ? '#2e1065' : '#0a0c10';
    document.body.style.color = isDark ? '#f1f5f9' : '#0f1115';
    
    // Assign a data attribute to root for UI components to read if they need Tailwind styling based on time
    document.documentElement.setAttribute('data-time-phase', timePhase);
    
    // Map Lighting System Integration
    const mapTheme = (window as any).VantiMapTheme;
    if (mapTheme) {
        if (timePhase === 'dawn') mapTheme.setStyles('Golden Hour');
        else if (timePhase === 'dusk') mapTheme.setStyles('Blue Hour');
        else if (timePhase === 'night') mapTheme.setStyles('Deep Midnight');
        else mapTheme.setStyles('Default');
    }
    
    // Automatically set map aesthetic based on phase
    if (themeOverride === 'Auto') {
        if (timePhase === 'night') setMapAesthetic('night');
        else if (timePhase === 'day') setMapAesthetic('none');
        else setMapAesthetic('contrast'); // Default/dusk/dawn
    }
  }, [timePhase, themeOverride, setMapAesthetic]);

  return { isDarkMode, timePhase };
}
