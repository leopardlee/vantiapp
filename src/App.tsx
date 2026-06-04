import { useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { VantiGlobalShell } from './components/VantiGlobalShell';
import VantiMap from './components/VantiMap';
import { BottomNavigation } from './components/BottomNavigation';
import { useRecenterToUser, useVantiStore } from './store/vantiStore';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function App() {
  // Trigger automatic recentering on first successful browser geolocation on launch
  useRecenterToUser();
  const language = useVantiStore((state) => state.language);

  const mapElement = useMemo(() => {
    if (!hasValidKey) {
      return (
        <div className="flex items-center justify-center p-10 text-slate-500 h-full w-full bg-slate-900/50">
          Map loading restricted (API Key missing)
        </div>
      );
    }
    return (
      <APIProvider key={language} apiKey={API_KEY} version="weekly" language={language}>
        <VantiMap />
      </APIProvider>
    );
  }, [language]);

  return (
    <VantiGlobalShell bottomNavigation={<BottomNavigation />}>
      {mapElement}
    </VantiGlobalShell>
  );
}

