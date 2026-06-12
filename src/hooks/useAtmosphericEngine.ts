import { useState, useEffect } from 'react';
import { useVantiStore } from '../store/vantiStore';

export function useAtmosphericEngine() {
  const [filter, setFilter] = useState<string>('default');
  const weather = useVantiStore((state) => state.weatherData);
  const timePhase = useVantiStore((state) => state.timePhase);

  useEffect(() => {
    async function fetchFilter() {
        if (!weather || !timePhase) return;
        try {
            const response = await fetch('/api/atmospheric-filter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weather, timePhase })
            });
            const data = await response.json();
            setFilter(data.filter);
        } catch (err) {
            console.error("Atmospheric engine failed:", err);
            setFilter('default');
        }
    }
    fetchFilter();
  }, [weather, timePhase]);

  return filter;
}
