import { useState, useEffect } from 'react';
import { MUST_DOS } from '../data/mustDos';

export function useLocalSuggestions(lat?: number, lng?: number) {
  const [suggestion, setSuggestion] = useState<any | null>(null);
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;

    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18) timeOfDay = 'evening';

    if (lastCheck === `${lat}-${lng}-${timeOfDay}`) return;
    
    // Find nearby (very simple distance check)
    const nearby = MUST_DOS.find(mustDo => {
      const dist = Math.sqrt(Math.pow(mustDo.coords.lat - lat, 2) + Math.pow(mustDo.coords.lng - lng, 2));
      return dist < 0.05 && mustDo.time === timeOfDay;
    });

    if (nearby) {
        setSuggestion(nearby);
        setLastCheck(`${lat}-${lng}-${timeOfDay}`);
    }
  }, [lat, lng]);

  return suggestion;
}
