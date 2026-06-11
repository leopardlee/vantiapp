import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useRef } from 'react';
import { VantiMode } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import i18n from '../lib/i18n';

export type MapAesthetic = 'none' | 'night' | 'contrast' | 'minimalist' | 'sepia' | 'cyberpunk' | 'retro-blueprint' | 'midnight-cyberpunk' | 'minimalist-paper' | 'terrain-focused';
export type TravelMood = 'normal' | 'adventure' | 'relaxation' | 'culinary';

export interface CustomMarker {
  id: string;
  lat: number;
  lng: number;
  nickname: string;
  note: string;
  category: string;
}

export interface VantiState {
  activeMode: VantiMode;
  mapTheme: string;
  showList: boolean;
  selectedPlace: any | null;
  selectedCategory: string;
  isOmniaScanning: boolean;
  showControls: boolean;
  themeOverride: 'Auto' | 'Light' | 'Dark';
  recenterTrigger: { lat: number; lng: number } | null;
  isInitializing: boolean;
  isAROpen: boolean;
  isChatbotOpen: boolean;
  isAtmosphereOpen?: boolean;
  isOperationsHubOpen?: boolean;
  isSpatialAudioActive?: boolean;
  isTransitAlertsActive?: boolean;
  isRadarActive?: boolean;
  isExportModalOpen?: boolean;
  setIsExportModalOpen?: (isOpen: boolean) => void;
  isLocalEventVisible?: boolean;
  setIsLocalEventVisible?: (isVisible: boolean) => void;
  isPassportOpen?: boolean;
  setIsPassportOpen?: (isOpen: boolean) => void;
  isJourneyRecapOpen?: boolean;
  setIsJourneyRecapOpen?: (isOpen: boolean) => void;
  isVoiceSearchVisible?: boolean;
  setIsVoiceSearchVisible?: (isVisible: boolean) => void;
  isFinanceTrackerVisible?: boolean;
  setIsFinanceTrackerVisible?: (isVisible: boolean) => void;
  isMapOverlayVisible?: boolean;
  setIsMapOverlayVisible?: (isVisible: boolean) => void;
  isSettingsOpen?: boolean;
  setIsSettingsOpen?: (isOpen: boolean) => void;
  isMapDragging: boolean;
  setIsMapDragging: (isDragging: boolean) => void;
  quickPin: (lat: number, lng: number) => void;
  units: 'metric' | 'imperial';
  mapStyle: 'streets' | 'satellite';
  mapAesthetic: MapAesthetic;
  travelStyle: 'Minimalist' | 'Vibrant' | 'High-Contrast';
  language: 'en' | 'ko';
  itinerary: any[];
  showWeatherLayer: boolean;
  weatherLayerType: 'precipitation' | 'temp';
  offlineAreas: any[];
  isLocalAILoading: boolean;
  routingOrigin: any | null;
  bookmarkedPlaces: Record<string, any>;
  customMarkers: CustomMarker[];
  showTripSidebar: boolean;
  isCinematicMode: boolean;
  travelMood: TravelMood;
  areNotificationsEnabled: boolean;
  trendingDestinations: any[];
  hiddenItinerarySegments: Record<string, boolean>;
  accessibilityScale: number;
  isPrefetchingEnabled: boolean;
  isBatterySaverEnabled: boolean;
  setIsBatterySaverEnabled: (enabled: boolean) => void;
  isInsightsDrawerOpen: boolean;
  setIsInsightsDrawerOpen: (isOpen: boolean) => void;
  isSwitchingMode: boolean;
  setIsSwitchingMode: (isSwitching: boolean) => void;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  tripStats: {
    totalDistance: number; // in km
    landmarksVisited: number;
    weatherPreferences: Record<string, number>;
  };
  addVisitedLandmark: () => void;
  updateTotalDistance: (dist: number) => void;
  recordWeatherPreference: (condition: string) => void;
  currentWeatherData: any | null;
  userLocation: google.maps.LatLngLiteral | null;
  peerLocations: Record<string, { lat: number, lng: number, displayName: string }>;
  setPeerLocation: (uid: string, location: { lat: number, lng: number, displayName: string }) => void;
  mapViewport: { center: { lat: number; lng: number }; bounds: { north: number; south: number; east: number; west: number } | null; zoom: number } | null;
  viewportLandmarks: any[];
  setViewportLandmarks: (landmarks: any[]) => void;
  showAITripSidebar: boolean;
  setShowAITripSidebar: (show: boolean) => void;
  isGaussianActive: boolean;
  setIsGaussianActive: (active: boolean) => void;
  is3DActive: boolean;
  setIs3DActive: (active: boolean) => void;
  purgeInactiveAssets: () => void;
  activeOverlays: string[];
  addOverlay: (id: string) => void;
  removeOverlay: (id: string) => void;
  closeAllOverlays: () => void;
  isEcoFriendly: boolean;
  setIsEcoFriendly: (isEcoFriendly: boolean) => void;
  communityMoments: any[];
  setCommunityMoments: (moments: any[]) => void;
  parsedReceipts?: any[];
  isCrowdPulseActive?: boolean;
  userProfile?: {
    name: string;
    avatarUrl: string;
    snsProvider?: string;
  };
}

export interface VantiActions {
  setActiveMode: (mode: VantiMode) => void;
  setMapTheme: (theme: string) => void;
  setTravelStyle: (travelStyle: 'Minimalist' | 'Vibrant' | 'High-Contrast') => void;
  setIsEcoFriendly: (isEcoFriendly: boolean) => void;
  setShowList: (show: boolean) => void;
  setSelectedPlace: (place: any | null) => void;
  setSelectedCategory: (category: string) => void;
  setIsOmniaScanning: (isScanning: boolean) => void;
  setShowControls: (show: boolean) => void;
  setThemeOverride: (mode: 'Auto' | 'Light' | 'Dark') => void;
  recenterToUser: (lat: number, lng: number) => void;
  clearRecenterTrigger: () => void;
  setIsInitializing: (isInitializing: boolean) => void;
  setIsAROpen: (isOpen: boolean) => void;
  setIsChatbotOpen: (isOpen: boolean) => void;
  setIsAtmosphereOpen?: (isOpen: boolean) => void;
  setIsOperationsHubOpen?: (isOpen: boolean) => void;
  setIsSpatialAudioActive?: (isActive: boolean) => void;
  setIsTransitAlertsActive?: (isActive: boolean) => void;
  setIsRadarActive?: (isActive: boolean) => void;
  setIsExportModalOpen?: (isOpen: boolean) => void;
  setIsLocalEventVisible?: (isVisible: boolean) => void;
  setIsPassportOpen?: (isOpen: boolean) => void;
  setIsJourneyRecapOpen?: (isOpen: boolean) => void;
  setIsVoiceSearchVisible?: (isVisible: boolean) => void;
  setIsFinanceTrackerVisible?: (isVisible: boolean) => void;
  setIsMapOverlayVisible?: (isVisible: boolean) => void;
  addParsedReceipt?: (receipt: any) => void;
  removeParsedReceipt?: (id: string) => void;
  clearParsedReceipts?: () => void;
  setIsCrowdPulseActive?: (active: boolean) => void;
  setUserProfile?: (profile: { name: string; avatarUrl: string; snsProvider?: string } | undefined) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  setMapStyle: (mapStyle: 'streets' | 'satellite') => void;
  setMapAesthetic: (aesthetic: MapAesthetic) => void;
  setLanguage: (lang: 'en' | 'ko') => void;
  addToItinerary: (place: any) => void;
  removeFromItinerary: (id: string) => void;
  clearItinerary: () => void;
  setItinerary: (itinerary: any[]) => void;
  reorderItinerary: (startIndex: number, endIndex: number) => void;
  t: (key: string) => string;
  setShowWeatherLayer: (show: boolean) => void;
  setWeatherLayerType: (type: 'precipitation' | 'temp') => void;
  addOfflineArea: (area: any) => void;
  setLocalAILoading: (loading: boolean) => void;
  setRoutingOrigin: (place: any | null) => void;
  toggleBookmark: (place: any) => void;
  addCustomMarker: (marker: CustomMarker) => void;
  removeCustomMarker: (id: string) => void;
  setUserLocation: (loc: google.maps.LatLngLiteral | null) => void;
  setShowTripSidebar: (show: boolean) => void;
  setShowAITripSidebar: (show: boolean) => void;
  setIsCinematicMode: (active: boolean) => void;
  setTravelMood: (mood: TravelMood) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTrendingDestinations: (destinations: any[]) => void;
  toggleItinerarySegment: (segmentId: string) => void;
  setAccessibilityScale: (scale: number) => void;
  setIsPrefetchingEnabled: (enabled: boolean) => void;
  setCurrentWeatherData: (weather: any | null) => void;
  setQuery: (query: string) => void;
  setSimulatedRoutingCondition: (condition: string, active?: boolean) => void;
  addRecentSearch: (term: string) => void;
  setMapViewport: (viewport: { center: { lat: number; lng: number }; bounds: { north: number; south: number; east: number; west: number } | null; zoom: number } | null) => void;
  setViewportLandmarks: (landmarks: any[]) => void;
}

type VantiStore = VantiState & VantiActions;

export const useVantiStore = create<VantiStore>()(
  persist(
    (set, get) => ({
      activeMode: 'all',
      setActiveMode: (mode) => set({ activeMode: mode }),
      mapTheme: 'Default',
      setMapTheme: (theme) => set({ mapTheme: theme }),
      showList: false,
      setShowList: (show) => set({ showList: show }),
      selectedPlace: null,
      setSelectedPlace: (place) => set({ selectedPlace: place }),
      selectedCategory: 'All',
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      isOmniaScanning: false,
      setIsOmniaScanning: (isScanning) => set({ isOmniaScanning: isScanning }),
      showControls: false,
      setShowControls: (show) => set({ showControls: show }),
      themeOverride: 'Auto',
      setThemeOverride: (mode) => set({ themeOverride: mode }),
      recenterTrigger: null,
      recenterToUser: (lat, lng) => set({ recenterTrigger: { lat, lng } }),
      clearRecenterTrigger: () => set({ recenterTrigger: null }),
      isInitializing: true,
      setIsInitializing: (isInitializing) => set({ isInitializing }),
      isGaussianActive: false,
      isAROpen: false,
      setIsAROpen: (isOpen) => set({ isAROpen: isOpen }),
      isAtmosphereOpen: false,
      setIsAtmosphereOpen: (isOpen) => set({ isAtmosphereOpen: isOpen }),
      isOperationsHubOpen: false,
      setIsOperationsHubOpen: (isOpen) => set({ isOperationsHubOpen: isOpen }),
      isSpatialAudioActive: false,
      setIsSpatialAudioActive: (isActive) => set({ isSpatialAudioActive: isActive }),
      isTransitAlertsActive: true,
      setIsTransitAlertsActive: (isActive) => set({ isTransitAlertsActive: isActive }),
      isRadarActive: false,
      setIsRadarActive: (isActive) => set({ isRadarActive: isActive }),
      isExportModalOpen: false,
      setIsExportModalOpen: (isOpen) => set({ isExportModalOpen: isOpen }),
      isLocalEventVisible: true,
      setIsLocalEventVisible: (isVisible) => set({ isLocalEventVisible: isVisible }),
      isPassportOpen: false,
      setIsPassportOpen: (isOpen) => set({ isPassportOpen: isOpen }),
      isJourneyRecapOpen: false,
      setIsJourneyRecapOpen: (isOpen) => set({ isJourneyRecapOpen: isOpen }),
      isVoiceSearchVisible: false,
      setIsVoiceSearchVisible: (isVisible) => set({ isVoiceSearchVisible: isVisible }),
      isFinanceTrackerVisible: false,
      setIsFinanceTrackerVisible: (isVisible) => set({ isFinanceTrackerVisible: isVisible }),
      parsedReceipts: [],
      addParsedReceipt: (receipt) => set((state) => ({
        parsedReceipts: [...(state.parsedReceipts || []), { ...receipt, id: `receipt-${Date.now()}` }]
      })),
      removeParsedReceipt: (id) => set((state) => ({
        parsedReceipts: (state.parsedReceipts || []).filter((r: any) => r.id !== id)
      })),
      clearParsedReceipts: () => set({ parsedReceipts: [] }),
      isCrowdPulseActive: false,
      setIsCrowdPulseActive: (active) => set({ isCrowdPulseActive: active }),
      userProfile: {
        name: 'Guest Traveler',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        snsProvider: 'None'
      },
      setUserProfile: (profile) => set({ userProfile: profile }),
      isMapOverlayVisible: false,
      setIsMapOverlayVisible: (isVisible) => set({ isMapOverlayVisible: isVisible }),
      isSettingsOpen: false,
      setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
      isMapDragging: false,
      setIsMapDragging: (isDragging) => set({ isMapDragging: isDragging }),
      quickPin: (lat, lng) => set((state) => {
        const newPin = {
          id: `pin-${Date.now()}`,
          lat,
          lng,
          nickname: 'Memory Trail Pin',
          note: `Pinned via quick-gesture at ${new Date().toLocaleTimeString()}`,
          category: 'Memory Trail'
        };
        return { customMarkers: [...state.customMarkers, newPin] };
      }),
      isChatbotOpen: false,
      setIsChatbotOpen: (isOpen) => set({ isChatbotOpen: isOpen }),
      units: 'metric',
      setUnits: (units) => set({ units }),
      mapStyle: 'streets',
      setMapStyle: (mapStyle) => set({ mapStyle }),
      travelStyle: 'Minimalist',
      setTravelStyle: (travelStyle) => set({ travelStyle }),
      mapAesthetic: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'none',
      setMapAesthetic: (mapAesthetic) => set({ mapAesthetic }),
      isEcoFriendly: false,
      setIsEcoFriendly: (isEcoFriendly) => set({ isEcoFriendly }),
      communityMoments: [],
      setCommunityMoments: (communityMoments) => set({ communityMoments }),
      language: (typeof navigator !== 'undefined' && navigator.language.startsWith('ko')) ? 'ko' : 'en',
      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
        if (auth.currentUser) {
          setDoc(doc(db, 'users', auth.currentUser.uid), { language }, { merge: true }).catch(console.error);
        }
      },
      itinerary: [],
      addToItinerary: (place) => set((state) => {
        if (state.itinerary.find(p => p.id === place.id)) return state;
        return { itinerary: [...state.itinerary, place] };
      }),
      removeFromItinerary: (id) => set((state) => ({
        itinerary: state.itinerary.filter(p => p.id !== id)
      })),
      clearItinerary: () => set({ itinerary: [] }),
      setItinerary: (itinerary) => set({ itinerary }),
      reorderItinerary: (startIndex, endIndex) => set((state) => {
        const next = [...state.itinerary];
        const [removed] = next.splice(startIndex, 1);
        next.splice(endIndex, 0, removed);
        return { itinerary: next };
      }),
      t: (key) => i18n.t(key) as string,
      showWeatherLayer: false,
      weatherLayerType: 'precipitation',
      setShowWeatherLayer: (showWeatherLayer) => set({ showWeatherLayer }),
      setWeatherLayerType: (weatherLayerType) => set({ weatherLayerType }),
      offlineAreas: [],
      isLocalAILoading: false,
      addOfflineArea: (area) => set((state) => ({ 
        offlineAreas: [...state.offlineAreas, { ...area, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() }] 
      })),
      setLocalAILoading: (isLocalAILoading) => set({ isLocalAILoading }),
      routingOrigin: null,
      setRoutingOrigin: (routingOrigin) => set({ routingOrigin }),
      bookmarkedPlaces: {},
      customMarkers: [],
      addCustomMarker: (marker) => set((state) => ({ customMarkers: [...state.customMarkers, marker] })),
      removeCustomMarker: (id) => set((state) => ({ customMarkers: state.customMarkers.filter(m => m.id !== id) })),
      toggleBookmark: (place) => set((state) => {
        const newBookmarks = { ...state.bookmarkedPlaces };
        if (newBookmarks[place.id]) {
          delete newBookmarks[place.id];
        } else {
          newBookmarks[place.id] = place;
        }
        return { bookmarkedPlaces: newBookmarks };
      }),
      showTripSidebar: false,
      setShowTripSidebar: (showTripSidebar) => set({ showTripSidebar }),
      showAITripSidebar: false,
      setShowAITripSidebar: (showAITripSidebar) => set({ showAITripSidebar }),
      setIsGaussianActive: (active) => {
        set({ isGaussianActive: active });
        if (!active) get().purgeInactiveAssets();
      },
      is3DActive: false,
      setIs3DActive: (is3DActive) => {
        set({ is3DActive });
        if (!is3DActive) get().purgeInactiveAssets();
      },
      purgeInactiveAssets: () => {
        console.log("[Vanti Memory Management] Purging inactive cache and assets...");
        set({ 
          viewportLandmarks: [],
          trendingDestinations: [], // Temporary list
        });
        
        // Potential for more aggressive manual GC hint if needed
        if (window.gc) {
          try { window.gc(); } catch(e) {}
        }
      },
      activeOverlays: [],
      addOverlay: (id) => set((state) => ({ activeOverlays: state.activeOverlays.includes(id) ? state.activeOverlays : [...state.activeOverlays, id] })),
      removeOverlay: (id) => set((state) => ({ activeOverlays: state.activeOverlays.filter(oid => oid !== id) })),
      closeAllOverlays: () => {
        const state = useVantiStore.getState();
        // Close all known overlays
        state.setIsOperationsHubOpen?.(false);
        state.setIsAtmosphereOpen?.(false);
        state.setIsAROpen(false);
        state.setIsChatbotOpen(false);
        state.setIsPassportOpen?.(false);
        state.setIsJourneyRecapOpen?.(false);
        state.setIsVoiceSearchVisible?.(false);
        state.setIsFinanceTrackerVisible?.(false);
        state.setIsMapOverlayVisible?.(false);
        state.setShowTripSidebar(false);
        state.setShowAITripSidebar(false);
        state.setIsInsightsDrawerOpen?.(false);
        set({ activeOverlays: [] });
      },
      mapViewport: null,
      setMapViewport: (mapViewport) => set({ mapViewport }),
      viewportLandmarks: [],
      setViewportLandmarks: (viewportLandmarks) => set({ viewportLandmarks }),
      isCinematicMode: false,
      setIsCinematicMode: (isCinematicMode) => set({ isCinematicMode }),
      travelMood: 'normal',
      setTravelMood: (travelMood) => set({ travelMood }),
      areNotificationsEnabled: false,
      setNotificationsEnabled: (areNotificationsEnabled) => set({ areNotificationsEnabled }),
      trendingDestinations: [],
      setTrendingDestinations: (trendingDestinations) => set({ trendingDestinations }),
      hiddenItinerarySegments: {},
      toggleItinerarySegment: (segmentId) => set((state) => {
        const next = { ...state.hiddenItinerarySegments };
        next[segmentId] = !next[segmentId];
        return { hiddenItinerarySegments: next };
      }),
      accessibilityScale: 1,
      setAccessibilityScale: (accessibilityScale) => set({ accessibilityScale }),
      isPrefetchingEnabled: true,
      setIsPrefetchingEnabled: (isPrefetchingEnabled) => set({ isPrefetchingEnabled }),
      isBatterySaverEnabled: false,
      setIsBatterySaverEnabled: (isBatterySaverEnabled) => set({ isBatterySaverEnabled }),
      isSwitchingMode: false,
      setIsSwitchingMode: (isSwitchingMode) => set({ isSwitchingMode }),
      isInsightsDrawerOpen: false,
      setIsInsightsDrawerOpen: (isInsightsDrawerOpen) => set({ isInsightsDrawerOpen }),
      recentSearches: [],
      addRecentSearch: (term) => set((state) => {
        const cleaned = term.trim();
        if (!cleaned) return state;
        const filtered = state.recentSearches.filter(t => t.toLowerCase() !== cleaned.toLowerCase());
        return { recentSearches: [cleaned, ...filtered].slice(0, 5) };
      }),
      tripStats: {
        totalDistance: 0,
        landmarksVisited: 0,
        weatherPreferences: {}
      },
      addVisitedLandmark: () => set((state) => ({
        tripStats: { ...state.tripStats, landmarksVisited: state.tripStats.landmarksVisited + 1 }
      })),
      updateTotalDistance: (dist) => set((state) => ({
        tripStats: { ...state.tripStats, totalDistance: state.tripStats.totalDistance + dist }
      })),
      recordWeatherPreference: (condition) => set((state) => {
        const next = { ...state.tripStats.weatherPreferences };
        next[condition] = (next[condition] || 0) + 1;
        return { tripStats: { ...state.tripStats, weatherPreferences: next } };
      }),
      currentWeatherData: null,
      setCurrentWeatherData: (currentWeatherData) => set({ currentWeatherData }),
      userLocation: null,
      setUserLocation: (userLocation) => set({ userLocation }),
      peerLocations: {},
      setPeerLocation: (uid, location) => set((state) => ({ 
        peerLocations: { ...state.peerLocations, [uid]: location } 
      })),
      setQuery: (query) => {
        // Typically triggers a search or filter
        console.log("Setting global search query:", query);
      },
      setSimulatedRoutingCondition: (condition, active) => {
        console.log("Setting simulated routing condition:", condition, active);
      }
    }),
    {
      name: 'vanti-storage',
      partialize: (state) => ({
        bookmarkedPlaces: state.bookmarkedPlaces,
        customMarkers: state.customMarkers,
        units: state.units,
        mapTheme: state.mapTheme,
        travelStyle: state.travelStyle,
        themeOverride: state.themeOverride,
        mapAesthetic: state.mapAesthetic,
        language: state.language,
        itinerary: state.itinerary,
        showTripSidebar: state.showTripSidebar,
        showAITripSidebar: state.showAITripSidebar,
        areNotificationsEnabled: state.areNotificationsEnabled,
        hiddenItinerarySegments: state.hiddenItinerarySegments,
        accessibilityScale: state.accessibilityScale,
        isPrefetchingEnabled: state.isPrefetchingEnabled,
        tripStats: state.tripStats,
        recentSearches: state.recentSearches,
        parsedReceipts: state.parsedReceipts,
        isCrowdPulseActive: state.isCrowdPulseActive,
        userProfile: state.userProfile
      }),
    }
  )
);

/**
 * Custom React hook that triggers a recenter store action on the
 * first successful browser geolocation.
 */
export function useRecenterToUser() {
  const recenterToUser = useVantiStore((state) => state.recenterToUser);
  const didRecenterRef = useRef(false);

  useEffect(() => {
    if (didRecenterRef.current) return;
    
    let active = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!active || didRecenterRef.current) return;
          didRecenterRef.current = true;
          recenterToUser(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("[Zustand Locator] Geolocation failed or denied:", err);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
    
    return () => {
      active = false;
    };
  }, [recenterToUser]);
}

