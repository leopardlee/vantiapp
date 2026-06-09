import { useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { VantiGlobalShell } from './components/VantiGlobalShell';
import VantiMap from './components/VantiMap';
import { BottomNavigation } from './components/BottomNavigation';
import { useRecenterToUser, useVantiStore } from './store/vantiStore';
import { ViewportProvider } from './lib/ViewportContext';
import { WowExperienceLayer } from './components/WowExperienceLayer';
import { SpatialAudioEngine } from './components/SpatialAudioEngine';
import { FloatingRadarWidget } from './components/FloatingRadarWidget';
import { VoiceSearchAssistant } from './components/VoiceSearchAssistant';
import { ARExploreMode } from './components/ARExploreMode';
import { MemoryTrailLayer } from './components/MemoryTrailLayer';
import { ExportItineraryWidget } from './components/ExportItineraryWidget';
import { AtmosphereFeed } from './components/AtmosphereFeed';
import { PassportRewardsSystem } from './components/PassportRewardsSystem';
import { JourneyRecapWidget } from './components/JourneyRecapWidget';
import { TransitAlertSystem } from './components/TransitAlertSystem';
import { PersistentTripCostWidget } from './components/PersistentTripCostWidget';
import { LocalEventNotifier } from './components/LocalEventNotifier';
import { ControlCluster } from './components/ControlCluster';
import { LeftOperationsPanel } from './components/LeftOperationsPanel';

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
    <ViewportProvider>
      <VantiGlobalShell bottomNavigation={<BottomNavigation />}>
        {mapElement}
        <WowExperienceLayer />
        <SpatialAudioEngine />
        <VoiceSearchAssistant />
        <ARExploreMode />
        <ExportItineraryWidget />
        <AtmosphereFeed />
        <PassportRewardsSystem />
        <JourneyRecapWidget />
        <TransitAlertSystem />
        <PersistentTripCostWidget />
        <LocalEventNotifier />
        <ControlCluster />
        <LeftOperationsPanel />
      </VantiGlobalShell>
    </ViewportProvider>
  );
}

