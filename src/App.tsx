import { useMemo, lazy, Suspense, useEffect } from 'react';
import { APIProvider, useApiLoadingStatus, APILoadingStatus } from '@vis.gl/react-google-maps';
import { VantiGlobalShell } from './components/VantiGlobalShell';
import VantiMap from './components/VantiMap';
import { BottomNavigation } from './components/BottomNavigation';
import { FriendsLocationListener } from './components/FriendsLocationListener';
import { useRecenterToUser, useVantiStore } from './store/vantiStore';
import { useLocationSharing } from './hooks/useLocationSharing';
import { useViewportLayoutManager } from './hooks/useViewportLayoutManager';
import { ViewportProvider } from './lib/ViewportContext';
import { WowExperienceLayer } from './components/WowExperienceLayer';
import { ControlCluster } from './components/ControlCluster';
import { LeftOperationsPanel } from './components/LeftOperationsPanel';

// Lazy load heavy overlays to optimize main bundle (non-essential)
const SpatialAudioEngine = lazy(() => import('./components/SpatialAudioEngine').then(m => ({ default: m.SpatialAudioEngine })));
const VoiceSearchAssistant = lazy(() => import('./components/VoiceSearchAssistant').then(m => ({ default: m.VoiceSearchAssistant })));
const ARExploreMode = lazy(() => import('./components/ARExploreMode').then(m => ({ default: m.ARExploreMode })));
const ExportItineraryWidget = lazy(() => import('./components/ExportItineraryWidget').then(m => ({ default: m.ExportItineraryWidget })));
const AtmosphereFeed = lazy(() => import('./components/AtmosphereFeed').then(m => ({ default: m.AtmosphereFeed })));
const PassportRewardsSystem = lazy(() => import('./components/PassportRewardsSystem').then(m => ({ default: m.PassportRewardsSystem })));
const JourneyRecapWidget = lazy(() => import('./components/JourneyRecapWidget').then(m => ({ default: m.JourneyRecapWidget })));
const TransitAlertSystem = lazy(() => import('./components/TransitAlertSystem').then(m => ({ default: m.TransitAlertSystem })));
const PersistentTripCostWidget = lazy(() => import('./components/PersistentTripCostWidget').then(m => ({ default: m.PersistentTripCostWidget })));
const LocalEventNotifier = lazy(() => import('./components/LocalEventNotifier').then(m => ({ default: m.LocalEventNotifier })));

const getSafeApiKey = (): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_MAPS_PLATFORM_KEY) {
      return process.env.GOOGLE_MAPS_PLATFORM_KEY;
    }
  } catch (e) {}
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv.VITE_GOOGLE_MAPS_PLATFORM_KEY) {
      return metaEnv.VITE_GOOGLE_MAPS_PLATFORM_KEY;
    }
  } catch (e) {}
  try {
    if ((globalThis as any).GOOGLE_MAPS_PLATFORM_KEY) {
      return (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY;
    }
    if ((window as any).GOOGLE_MAPS_PLATFORM_KEY) {
      return (window as any).GOOGLE_MAPS_PLATFORM_KEY;
    }
  } catch (e) {}
  return '';
};

const API_KEY = getSafeApiKey();
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function MapReadyBoundary() {
  const status = useApiLoadingStatus();
  const setIsInitializing = useVantiStore((state) => state.setIsInitializing);

  useEffect(() => {
    if (status === APILoadingStatus.LOADED && setIsInitializing) {
      setIsInitializing(false);
    }
  }, [status, setIsInitializing]);

  if (status === APILoadingStatus.LOADING) {
    return (
      <div 
        className="flex flex-col items-center justify-center p-10 w-full bg-[#0a0c10] text-slate-100 font-sans z-[1001]"
        style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      >
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full border border-rose-500/10 mb-6">
          <div className="absolute inset-4 rounded-full border border-dashed border-rose-500/20 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute w-8 h-8 rounded-full border-2 border-slate-500 border-t-rose-500 animate-spin" />
        </div>
        <span className="text-[10px] font-black tracking-widest text-[#f43f5e] uppercase">INITIALIZING VANTI MAP ENGINE</span>
        <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase mt-2">Connecting to Google Maps API...</span>
      </div>
    );
  }

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div 
        className="flex flex-col items-center justify-center p-10 w-full bg-[#0a0c10] text-slate-100 font-sans z-[1001]"
        style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
      >
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full border border-rose-500/25 mb-6">
          <div className="absolute w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V14M12 17.01L12.01 16.999M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <span className="text-[10px] font-black tracking-widest text-[#f43f5e] uppercase">MAP INITIALIZATION RESTRICTED</span>
        <span className="text-[8px] text-rose-450 text-rose-400 font-mono tracking-widest uppercase mt-2 text-center max-w-xs leading-relaxed">
          Google Maps API key validation failed. Dynamic maps and routing modules may be restricted until keys are active.
        </span>
      </div>
    );
  }

  // Only mount the heavy VantiMap component when API is confirmed ready
  return <VantiMap />;
}

export default function App() {
  // Initialize dynamic viewport height manager
  useViewportLayoutManager();

  // Trigger automatic recentering on first successful browser geolocation on launch
  useRecenterToUser();
  useLocationSharing();
  const language = useVantiStore((state) => state.language);
  const setIsInitializing = useVantiStore((state) => state.setIsInitializing);

  // If there is no valid Google Maps API Key, bypass the infinite initialization screen immediately
  useEffect(() => {
    if (!hasValidKey && setIsInitializing) {
      setIsInitializing(false);
    }
  }, [setIsInitializing]);

  const appContent = useMemo(() => {
    const layout = (
      <VantiGlobalShell bottomNavigation={<BottomNavigation />}>
        <FriendsLocationListener />
        <MapReadyBoundary />
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
    );

    if (!hasValidKey) {
      return (
        <div 
          className="flex flex-col items-center justify-center p-10 text-slate-500 w-full bg-slate-900/50"
          style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        >
          <span className="text-[10px] font-black tracking-widest text-[#f43f5e] uppercase mb-2">MAP ENVIRONMENT UNConfigured</span>
          <span className="text-[8px] font-mono tracking-widest uppercase text-slate-400">Map loading restricted (API Key missing)</span>
        </div>
      );
    }

    return (
      <APIProvider key={language} apiKey={API_KEY} version="weekly" language={language}>
        {layout}
      </APIProvider>
    );
  }, [language]);

  return (
    <ViewportProvider>
      {appContent}
    </ViewportProvider>
  );
}

