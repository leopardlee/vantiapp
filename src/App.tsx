import { useMemo, lazy, Suspense } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { VantiGlobalShell } from './components/VantiGlobalShell';
import VantiMap from './components/VantiMap';
import { BottomNavigation } from './components/BottomNavigation';
import { useRecenterToUser, useVantiStore } from './store/vantiStore';
import { useLocationSharing } from './hooks/useLocationSharing';
import { ViewportProvider } from './lib/ViewportContext';
import { WowExperienceLayer } from './components/WowExperienceLayer';
import { ControlCluster } from './components/ControlCluster';
import { LeftOperationsPanel } from './components/LeftOperationsPanel';

// Lazy load heavy overlays to optimize main bundle (non-essential)
const SpatialAudioEngine = lazy(() => import('./components/SpatialAudioEngine').then(m => ({ default: m.SpatialAudioEngine })));
const VoiceSearchAssistant = lazy(() => import('./components/VoiceSearchAssistant').then(m => ({ default: m.VoiceSearchAssistant })));
const ARExploreMode = lazy(() => import('./components/ARExploreMode').then(m => ({ default: m.ARExploreMode })));
const MemoryTrailLayer = lazy(() => import('./components/MemoryTrailLayer').then(m => ({ default: m.MemoryTrailLayer })));
const ExportItineraryWidget = lazy(() => import('./components/ExportItineraryWidget').then(m => ({ default: m.ExportItineraryWidget })));
const AtmosphereFeed = lazy(() => import('./components/AtmosphereFeed').then(m => ({ default: m.AtmosphereFeed })));
const PassportRewardsSystem = lazy(() => import('./components/PassportRewardsSystem').then(m => ({ default: m.PassportRewardsSystem })));
const JourneyRecapWidget = lazy(() => import('./components/JourneyRecapWidget').then(m => ({ default: m.JourneyRecapWidget })));
const TransitAlertSystem = lazy(() => import('./components/TransitAlertSystem').then(m => ({ default: m.TransitAlertSystem })));
const PersistentTripCostWidget = lazy(() => import('./components/PersistentTripCostWidget').then(m => ({ default: m.PersistentTripCostWidget })));
const LocalEventNotifier = lazy(() => import('./components/LocalEventNotifier').then(m => ({ default: m.LocalEventNotifier })));

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function App() {
  // Trigger automatic recentering on first successful browser geolocation on launch
  useRecenterToUser();
  useLocationSharing();
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
        <ControlCluster />
        <LeftOperationsPanel />
        <Suspense fallback={null}>
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
        </Suspense>
      </VantiGlobalShell>
    </ViewportProvider>
  );
}

