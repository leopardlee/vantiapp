import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useRef } from 'react';
import { VantiMode } from '../types';

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
  units: 'metric' | 'imperial';
  mapStyle: 'streets' | 'satellite';
  mapAesthetic: MapAesthetic;
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
  currentWeatherData: any | null;
}

export interface VantiActions {
  setActiveMode: (mode: VantiMode) => void;
  setMapTheme: (theme: string) => void;
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
  setShowTripSidebar: (show: boolean) => void;
  setIsCinematicMode: (active: boolean) => void;
  setTravelMood: (mood: TravelMood) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTrendingDestinations: (destinations: any[]) => void;
  toggleItinerarySegment: (segmentId: string) => void;
  setAccessibilityScale: (scale: number) => void;
  setIsPrefetchingEnabled: (enabled: boolean) => void;
  setCurrentWeatherData: (weather: any | null) => void;
}

type VantiStore = VantiState & VantiActions;

const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.explore': 'Explore',
    'nav.route': 'Route',
    'nav.planner': 'Planner',
    'nav.config': 'Config',
    'nav.profile': 'Profile',
    'planner.title': 'Trip Planner',
    'planner.subtitle': 'Design your perfect journey',
    'planner.empty': 'No stops added yet. Select places on the map to start building your itinerary.',
    'planner.summary': 'Route Summary',
    'planner.distance': 'Total Distance',
    'planner.duration': 'Est. Travel Time',
    'planner.clear': 'Clear All',
    'settings.title': 'Hyper-Settings',
    'settings.language': 'Interface Language',
    'settings.units': 'Measurement Units',
    'settings.aesthetic': 'Map Aesthetic',
    'settings.theme': 'Visual Theme',
    'common.close': 'Close',
    'common.km': 'km',
    'common.mi': 'mi',
    'common.min': 'min',
    'common.hr': 'hr'
  },
  ko: {
    'nav.explore': '탐색',
    'nav.route': '경로',
    'nav.planner': '플래너',
    'nav.config': '설정',
    'nav.profile': '프로필',
    'planner.title': '트립 플래너',
    'planner.subtitle': '완벽한 여행을 설계하세요',
    'planner.empty': '추가된 장소가 없습니다. 지도를 클릭하여 일정을 만들어보세요.',
    'planner.summary': '경로 요약',
    'planner.distance': '총 거리',
    'planner.duration': '예상 소요 시간',
    'planner.clear': '모두 삭제',
    'settings.title': '하이퍼 설정',
    'settings.language': '인터페이스 언어',
    'settings.units': '측정 단위',
    'settings.aesthetic': '지도 미학',
    'settings.theme': '비주얼 테마',
    'common.close': '닫기',
    'common.km': 'km',
    'common.mi': 'mi',
    'common.min': '분',
    'common.hr': '시간'
  }
};

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
      isAROpen: false,
      setIsAROpen: (isOpen) => set({ isAROpen: isOpen }),
      isChatbotOpen: false,
      setIsChatbotOpen: (isOpen) => set({ isChatbotOpen: isOpen }),
      units: 'metric',
      setUnits: (units) => set({ units }),
      mapStyle: 'streets',
      setMapStyle: (mapStyle) => set({ mapStyle }),
      mapAesthetic: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'none',
      setMapAesthetic: (mapAesthetic) => set({ mapAesthetic }),
      language: (typeof navigator !== 'undefined' && navigator.language.startsWith('ko')) ? 'ko' : 'en',
      setLanguage: (language) => set({ language }),
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
      t: (key) => {
        const lang = get().language;
        return translations[lang]?.[key] || key;
      },
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
      currentWeatherData: null,
      setCurrentWeatherData: (currentWeatherData) => set({ currentWeatherData }),
    }),
    {
      name: 'vanti-storage',
      partialize: (state) => ({
        bookmarkedPlaces: state.bookmarkedPlaces,
        customMarkers: state.customMarkers,
        units: state.units,
        mapTheme: state.mapTheme,
        themeOverride: state.themeOverride,
        mapAesthetic: state.mapAesthetic,
        language: state.language,
        itinerary: state.itinerary,
        showTripSidebar: state.showTripSidebar,
        areNotificationsEnabled: state.areNotificationsEnabled,
        hiddenItinerarySegments: state.hiddenItinerarySegments,
        accessibilityScale: state.accessibilityScale,
        isPrefetchingEnabled: state.isPrefetchingEnabled
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

