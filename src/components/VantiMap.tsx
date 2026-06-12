import React, { useState, useEffect, useRef, useCallback, useMemo, Component, ReactNode } from 'react';
import SunCalc from 'suncalc';
import throttle from 'lodash/throttle';
import { Map, AdvancedMarker, useMap, useMapsLibrary, Map3D, MapMode, GestureHandling, Map3DRef, Marker3D } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { 
  Search, MapPin, Navigation, List, X, Loader2, LogIn, LogOut, Box, Globe, Star, Cpu,
  Bookmark, Users, Sparkles, Tag, User, Layers, LocateFixed, Eye, EyeOff, Ticket, History, Landmark, Palette,
  HelpCircle, ChevronRight, Award, Wallet, Info, Camera, Video, BookOpen, Plane,
  Plus, Minus, Mountain, Download, Radar as RadarIcon, Settings, Map as MapIcon, TrendingUp,
  Check, CheckSquare, Square, Wifi, Battery, Flame, Activity, ShieldAlert, Lock, Unlock,
  Compass, Coffee, Utensils, Cloud, Sun, CloudRain, Snowflake, AlertCircle, Heart, Crosshair, Mic, Trash2, Zap, LayoutGrid, Calendar, Edit2, Check as CheckIcon,
  Wind, SlidersHorizontal, Radio, Route
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getEmojiForPlace } from '../lib/placeIcons';
import { MapMarkerIcon, getIconForType } from './MapMarkerIcon';
import FocusLock from 'react-focus-lock';
import PlaceDetailsPanel from './PlaceDetailsPanel';
import { StatusIndicator } from './StatusIndicator';
import { LandmarkMarker } from './LandmarkMarker';
import { CommunityActivityLayer } from './CommunityActivityLayer';
import { SafeAdvancedMarker, MapErrorBoundary } from './SafeAdvancedMarker';
import { ItineraryLayer } from './ItineraryLayer';
import { NavigationFlyout } from './NavigationFlyout';
// import { AtmosphericOverlay } from './AtmosphericOverlay';
import { SocialVibeOverlay } from './SocialVibeOverlay';
import { MoodFilterWidget } from './MoodFilterWidget';
import { ARPreviewWidget } from './ARPreviewWidget';
import RouteDisplay from './RouteDisplay';
import ItineraryLegsDisplay from './ItineraryLegsDisplay';
import RoutePlannerPanel from './RoutePlannerPanel';
import { MemoryTrailLayer } from './MemoryTrailLayer';
import { MemoryReplayViewer } from './MemoryReplayViewer';
import { AtmosphereD3Overlay } from './AtmosphereD3Overlay';
import { AtmosphericEngineOverlay } from './AtmosphericEngineOverlay';
import Chatbot from './Chatbot';
import InfoBubble from './InfoBubble';
import { MapRadialMenu } from './MapRadialMenu';
import { useLongPress } from '../hooks/useLongPress';
import SpeedometerWidget from './SpeedometerWidget';
import MobileControlDrawer from './MobileControlDrawer';
import WeatherEffects from './WeatherEffects';
import { FloatingRadarWidget } from './FloatingRadarWidget';
import SoundEngine from './SoundEngine';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { Skeleton, SkeletonCircle, SkeletonText } from './common/Skeleton';
import { TripPlannerTab } from './TripPlannerTab';
import RecommendedTab from './RecommendedTab';
import CulturalEventsTab from './CulturalEventsTab';
import SettingsModal from './SettingsModal';
import TravelDiary from './TravelDiary';
import DeveloperInsights from './DeveloperInsights';
import WeatherRouteOptimizer from './WeatherRouteOptimizer';
import { DeckGlOverlay } from './DeckGlOverlay';
import ARView from './ARView';
import { LiveSocialFeed } from './LiveSocialFeed';
import { GestureOnboarding } from './GestureOnboarding';
import { TravelerBadges } from './TravelerBadges';
import { QuickPhrasesOverlay } from './QuickPhrases';
import { QuickViewBottomSheet } from './QuickViewBottomSheet';
import { TravelHistoryDrawer } from './TravelHistoryDrawer';
import { OnboardingTour } from './OnboardingTour';
import { usePrefetchEngine } from '../hooks/usePrefetchEngine';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useSocialLocation } from '../hooks/useSocialLocation';
import { BookmarksLayer } from './BookmarksLayer';
import { PlacesAutocompleteInput } from './PlacesAutocompleteInput';
import { DestinationPickerModal } from './DestinationPickerModal';
import { useThemeManager } from '../hooks/useThemeManager';
import { DestinationBriefingModal } from './DestinationBriefingModal';
import { useBreadcrumb } from '../hooks/useBreadcrumb';
import { useLocalSuggestions } from '../hooks/useLocalSuggestions';
import { BreadcrumbLayer } from './BreadcrumbLayer';
import { useViewportLayoutManager } from '../hooks/useViewportLayoutManager';

import { MINIMALIST_STYLE, TERRAIN_FOCUSED_STYLE, HIGH_CONTRAST_STYLE } from '../lib/mapStyles';
import { auth, loginWithGoogle, logout, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, getDocs, getDoc, doc, orderBy, onSnapshot, limit, deleteDoc, setDoc } from 'firebase/firestore';
import { SEOUL_MOCK_PLACES, CANADA_MOCK_PLACES, MOCK_FRIENDS, MOCK_COUPONS, MockPlace, UserFriend } from '../data/mockPlaces';
import trendingPlaces from '../data/trendingPlaces.json';
import { VantiMode } from '../types';
import { saveOfflineArea, getOfflineAreas, renameOfflineArea, deleteOfflineArea, OfflineArea } from '../lib/offline';
import * as d3 from 'd3';
import { useVantiStore, VantiState, MapAesthetic } from '../store/vantiStore';
import { getTranslation } from '../lib/translations';
import { pipeline } from '@xenova/transformers';

const MAP_ID = (import.meta as any).env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID';
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };

type HapticType = 'tap' | 'switch' | 'close' | 'open_panel' | 'save' | 'mode3d' | 'impact' | 'success';

const CURATED_LISTS = [
  { id: 'dua_lipa_seoul', title: 'Dua Lipa\'s Seoul Top Hits', description: 'Hidden gems and favorite shops', categoryTag: 'Dining' },
  { id: 'night_vision', title: 'Seoul Neon Night', description: 'Best night street spots', categoryTag: 'Cultural' },
  { id: 'canada_working_holiday', title: '프리티 캐나다 워홀맵', description: '캐나다 한인 보금자리 및 필수 체크포인트', categoryTag: 'All' }
];

const CANADA_CENTER = { lat: 49.2827, lng: -123.1207 }; // Vancouver Center

const matchesCategoryFilter = (types: string[] | undefined, filter: string): boolean => {
  if (!types || types.length === 0) return filter === 'All';
  if (filter === 'All') return true;

  const lowerTypes = types.map(t => t.toLowerCase());

  switch (filter) {
    case 'Coffee':
      return lowerTypes.some(t => t.includes('coffee') || t.includes('cafe') || t.includes('bakery') || t.includes('barista'));
    case 'Dining':
      return lowerTypes.some(t => t.includes('restaurant') || t.includes('bar') || t.includes('food') || t.includes('dining') || t.includes('meal') || t.includes('eatery'));
    case 'Parks':
      return lowerTypes.some(t => t.includes('park') || t.includes('garden') || t.includes('forest') || t.includes('playground') || t.includes('recreation'));
    case 'Culture':
    case 'Cultural':
      return lowerTypes.some(t => t.includes('culture') || t.includes('cultural') || t.includes('museum') || t.includes('art') || t.includes('landmark') || t.includes('historic') || t.includes('scenic') || t.includes('library') || t.includes('embassy') || t.includes('worship') || t.includes('attraction'));
    case 'Shopping':
      return lowerTypes.some(t => t.includes('shopping') || t.includes('store') || t.includes('mall') || t.includes('grocery') || t.includes('supermarket') || t.includes('commerce') || t.includes('clothing') || t.includes('department') || t.includes('boutique'));
    default:
      return lowerTypes.some(t => t.includes(filter.toLowerCase()));
  }
};

const markerVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: ({ idx, scale }: { idx: number, scale: number }) => ({
    scale: scale,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 280,
      damping: 24,
      delay: Math.min(0.6, idx * 0.04), // dynamic staggered entry with a ceiling
    }
  })
};

interface D3TrafficLayerProps {
  mapTheme: string;
  activeMode: VantiMode;
  isPowerEfficiencyEnabled: boolean;
}

const D3TrafficLayer = React.memo(function D3TrafficLayer({ mapTheme, activeMode, isPowerEfficiencyEnabled }: D3TrafficLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const gMaps = (window as any).google?.maps;
    if (!gMaps) return;

    class D3OverlayView extends gMaps.OverlayView {
      private div: HTMLDivElement | null = null;
      constructor() {
        super();
      }

      onAdd() {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.width = '100vw';
        div.style.height = '100vh';
        div.style.pointerEvents = 'none';
        this.div = div;
        const panes = this.getPanes();
        panes.overlayLayer.appendChild(div);
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        if (!projection) return;

        const roads = [
          // Seoul main arteries (visible when center is Seoul)
          {
            name: "Han-river Expressway",
            coords: [{ lat: 37.530, lng: 126.910 }, { lat: 37.525, lng: 126.960 }, { lat: 37.520, lng: 127.010 }, { lat: 37.512, lng: 127.050 }],
            speed: "fast"
          },
          {
            name: "Gangnam Expressway Axis",
            coords: [{ lat: 37.480, lng: 127.025 }, { lat: 37.495, lng: 127.025 }, { lat: 37.515, lng: 127.021 }, { lat: 37.530, lng: 127.023 }],
            speed: "heavy"
          },
          {
            name: "Olympic-Daero Sector C",
            coords: [{ lat: 37.545, lng: 126.915 }, { lat: 37.540, lng: 126.980 }, { lat: 37.536, lng: 127.045 }],
            speed: "moderate"
          },
          {
            name: "Sejong Avenue Route",
            coords: [{ lat: 37.560, lng: 126.973 }, { lat: 37.576, lng: 126.975 }],
            speed: "slow"
          },
          // Canada Main arteries
          {
            name: "Georgia Centerline",
            coords: [{ lat: 49.290, lng: -123.131 }, { lat: 49.282, lng: -123.120 }, { lat: 49.272, lng: -123.110 }],
            speed: "fast"
          },
          {
            name: "Granville Bypass",
            coords: [{ lat: 49.260, lng: -123.125 }, { lat: 49.270, lng: -123.130 }, { lat: 49.283, lng: -123.124 }],
            speed: "heavy"
          },
          {
            name: "Lions Gate Connection Segment",
            coords: [{ lat: 49.300, lng: -123.138 }, { lat: 49.310, lng: -123.137 }, { lat: 49.322, lng: -123.130 }],
            speed: "slow"
          }
        ];

        const currentCenter = map.getCenter();
        const centerLat = currentCenter ? currentCenter.lat() : 37.56;
        const isNearCanada = centerLat > 40;

        const activeRoads = roads.filter(r => {
          const firstCoordLat = r.coords[0].lat;
          if (isNearCanada) {
            return firstCoordLat > 40;
          } else {
            return firstCoordLat < 40;
          }
        });

        const containerSelection = d3.select(this.div as any);
        let svg = containerSelection.select('svg');
        if (svg.empty()) {
          svg = containerSelection.append('svg')
            .style('position', 'absolute')
            .style('width', '100%')
            .style('height', '100%')
            .style('pointer-events', 'none');
        }

        const lineData = activeRoads.map(road => {
          const points = road.coords.map(c => {
            try {
              const latLng = new gMaps.LatLng(c.lat, c.lng);
              const pixel = projection.fromLatLngToDivPixel(latLng);
              return pixel ? [pixel.x, pixel.y] : null;
            } catch (err) {
              console.warn("fromLatLngToDivPixel failed under active projection:", err);
              return null;
            }
          }).filter(Boolean) as [number, number][];
          return { name: road.name, speed: road.speed, points };
        });

        const d3Line = d3.line<[number, number]>()
          .x(d => d[0])
          .y(d => d[1])
          .curve(d3.curveBasis);

        const paths = svg.selectAll<SVGPathElement, typeof lineData[0]>('path.traffic-stream')
          .data(lineData, d => d.name);

        paths.exit().remove();

        const pathsEnter = paths.enter()
          .append('path')
          .attr('class', 'traffic-stream')
          .attr('fill', 'none')
          .attr('stroke-linecap', 'round');

        paths.merge(pathsEnter as any)
          .attr('d', d => d3Line(d.points) || '')
          .attr('stroke', d => {
            if (d.speed === 'fast') return '#10b981';
            if (d.speed === 'moderate') return '#f59e0b';
            if (d.speed === 'slow') return '#f97316';
            return '#f43f5e';
          })
          .attr('stroke-width', () => {
            const currentZoom = map.getZoom() || 12;
            return Math.max(2, (currentZoom - 8) * 1.1);
          })
          .style('stroke-dasharray', '12, 10')
          .style('opacity', () => {
            const currentZoom = map.getZoom() || 12;
            return currentZoom < 10 ? '0' : '0.82';
          })
          .style('animation', d => {
            if (isPowerEfficiencyEnabled) return 'none'; // Reduce refresh rate/animation load
            const duration = d.speed === 'fast' ? '1s' : d.speed === 'moderate' ? '2s' : d.speed === 'slow' ? '4.5s' : '8s';
            return `vanti-traffic-pulsing ${duration} linear infinite`;
          });
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode?.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const overlay = new D3OverlayView();
    overlay.setMap(map);

    // If power efficiency is on, we might debounce or limit bounds_changed if possible,
    // but the CSS animation disable above significantly saves GPU/CPU rendering cycles.
    const cameraListener = map.addListener('bounds_changed', () => {
      overlay.draw();
    });

    return () => {
      cameraListener.remove();
      overlay.setMap(null);
    };
  }, [map, activeMode, mapTheme, isPowerEfficiencyEnabled]);

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes vanti-traffic-pulsing {
        to {
          stroke-dashoffset: -44;
        }
      }
    `}} />
  );
});

const WeatherMapLayer = React.memo(function WeatherMapLayer() {
  const map = useMap();
  const showWeatherLayer = useVantiStore(state => state.showWeatherLayer);
  const weatherLayerType = useVantiStore(state => state.weatherLayerType);

  useEffect(() => {
    if (!map || !showWeatherLayer) return;

    let weatherLayer: google.maps.ImageMapType | null = null;
    
    // We use OpenWeatherMap for live radar (precipitation/temp)
    const setupOpenWeather = () => {
      try {
        const layerType = weatherLayerType === 'precipitation' ? 'precipitation_new' : 'temp_new';
        weatherLayer = new google.maps.ImageMapType({
          getTileUrl: (coord, zoom) => {
            return `/api/weather-tile/${layerType}/${zoom}/${coord.x}/${coord.y}`;
          },
          tileSize: new google.maps.Size(256, 256),
          opacity: weatherLayerType === 'precipitation' ? 0.75 : 0.45,
          name: 'Weather'
        });

        map.overlayMapTypes.push(weatherLayer);
      } catch (err) {
        console.error("OpenWeatherMap layer setup failed", err);
      }
    };

    setupOpenWeather();

    return () => {
      if (weatherLayer) {
        const index = map.overlayMapTypes.getArray().indexOf(weatherLayer);
        if (index !== -1) map.overlayMapTypes.removeAt(index);
      }
    };
  }, [map, showWeatherLayer, weatherLayerType]);

  return null;
});

const WeatherOverlay = React.memo(({ weather }: { weather: string | null }) => {
  if (!weather) return null;
  const w = weather.toLowerCase();
  const isSnow = w.includes('snow');
  const isRain = w.includes('rain');
  
  if (isSnow) {
    return (
      <div className="absolute inset-0 rounded-full border border-white/40 bg-white/20 backdrop-blur-[1px] overflow-hidden pointer-events-none">
        <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full opacity-80"></div>
      </div>
    );
  }
  
  if (isRain) {
    return (
      <div className="absolute inset-0 rounded-full border border-blue-300/40 bg-blue-400/20 backdrop-blur-[2px] overflow-hidden pointer-events-none">
        <div className="absolute top-0.5 right-2 w-1 h-3 rounded-full bg-white/40 rotate-[20deg]"></div>
        <div className="absolute bottom-1 left-1 w-1 h-2 rounded-full bg-white/30 rotate-[20deg]"></div>
      </div>
    );
  }

  return null;
});

const WeatherCenterOverlay = React.memo(({ lat, lng }: { lat: number; lng: number }) => {
  const { currentWeatherData, setCurrentWeatherData, units } = useVantiStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadWeather() {
      setLoading(true);
      try {
        const res = await fetch(`/api/weather/openweathermap/${lat.toFixed(4)}/${lng.toFixed(4)}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (active) {
          setCurrentWeatherData(data);
        }
      } catch (err) {
        console.warn("Failed to load map center weather:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    
    loadWeather();
    // Refresh every 10 minutes
    const interval = setInterval(loadWeather, 600000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [lat, lng, setCurrentWeatherData]);

  if (!currentWeatherData) return null;

  const temp = currentWeatherData.temp;
  const condition = currentWeatherData.main;
  const description = currentWeatherData.description;
  const humidity = currentWeatherData.humidity;
  const wind = currentWeatherData.windSpeed;

  const getWeatherDisplay = (main: string) => {
    switch (main) {
      case 'Clear': return { label: 'Clear', color: 'text-amber-400', icon: Sun };
      case 'Clouds': return { label: 'Cloudy', color: 'text-slate-300', icon: Cloud };
      case 'Rain': 
      case 'Drizzle': return { label: 'Rainy', color: 'text-blue-400', icon: CloudRain };
      case 'Thunderstorm': return { label: 'Storm', color: 'text-indigo-400', icon: Zap };
      case 'Snow': return { label: 'Snowy', color: 'text-sky-300', icon: Snowflake };
      default: return { label: main, color: 'text-slate-400', icon: Cloud };
    }
  };

  const info = getWeatherDisplay(condition);
  const Icon = info.icon;

  const isImperial = units === 'imperial';
  const displayTemp = isImperial ? Math.round((temp * 9/5) + 32) : Math.round(temp);
  const tempUnit = isImperial ? '°F' : '°C';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-[#0b0e14]/90 backdrop-blur-3xl border border-white/20 rounded-3xl h-14 flex items-center px-4 gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto animate-wow-glow"
    >
      <div className="relative">
        <div className={cn("p-2 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5", loading && "animate-pulse")}>
          <Icon className={cn("w-5 h-5", info.color)} />
        </div>
        {loading && (
          <div className="absolute -top-1 -right-1">
            <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-start min-w-[60px] select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-black font-mono leading-none text-white tracking-tighter">{displayTemp}{tempUnit}</span>
          <div className="w-[1px] h-3 bg-white/10" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">{info.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-0.5 opacity-60">
            <div className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-[8px] font-bold text-slate-400 uppercase">{humidity}%</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-60">
            <Wind className="w-2.5 h-2.5 text-slate-400" />
            <span className="text-[8px] font-bold text-slate-400 uppercase">{wind}m/s</span>
          </div>
        </div>
      </div>
      
      <div className="w-[1px] h-8 bg-white/5 mx-1" />
      
      <div className="flex flex-col items-start opacity-70">
        <span className="text-[7px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-0.5">LOCAL SOURCE</span>
        <span className="text-[9px] font-bold text-slate-500 capitalize max-w-[80px] truncate">{description}</span>
      </div>
    </motion.div>
  );
});

const AtmosphericOverlay = React.memo(({ weather }: { weather: any }) => {
  if (!weather) return null;
  const condition = weather.main || "Clear";

  if (condition === "Rain" || condition === "Drizzle" || condition === "Thunderstorm") {
    const isThunder = condition === "Thunderstorm";
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[10] select-none">
        {/* Ambient storm glow & dark sky vignette */}
        <div className="absolute inset-0 bg-indigo-950/20 mix-blend-multiply shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
        
        {/* Animated Lightning Flash for Thunderstorms */}
        {isThunder && (
          <div className="absolute inset-0 bg-white/0 animate-[lightning_9s_ease-out_infinite]" />
        )}

        {/* Rain Streaks Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.06)_50%,transparent_100%)] bg-[size:3px_200px] opacity-40 animate-[rain_0.3s_linear_infinite]" />
        
        {/* Falling droplets */}
        <div className="absolute inset-0 flex justify-around">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={`drop-${i}`}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: "110vh", opacity: [0, 0.7, 0.7, 0] }}
              transition={{
                duration: 1 + Math.random() * 0.8,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear"
              }}
              className="w-[1.5px] h-[30px] bg-gradient-to-t from-sky-400/50 to-transparent"
              style={{ marginLeft: `${Math.random() * 20}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (condition === "Clouds") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[10] select-none">
        {/* Moody soft overcast tone - minimal impact */}
        <div className="absolute inset-0 bg-slate-900/5" />
      </div>
    );
  }

  if (condition === "Snow") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[10] select-none">
        <div className="absolute inset-0 bg-sky-900/5 shadow-[inset_0_0_60px_rgba(255,255,255,0.1)]" />
        
        {/* Drifting Snowflake Particles */}
        {Array.from({ length: 35 }).map((_, i) => (
          <motion.div
            key={`snow-${i}`}
            initial={{ y: -40, x: `${Math.random() * 110}%`, opacity: 0, scale: 0.5 }}
            animate={{ 
              y: "110vh", 
              x: [`${Math.random() * 100}%`, `${Math.random() * 100 - 10}%`],
              opacity: [0, 0.8, 0.8, 0],
              rotate: 360,
              scale: [0.5, 1, 1, 0.5]
            }}
            transition={{
              duration: 8 + Math.random() * 12,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute rounded-full bg-white flex items-center justify-center"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>
    );
  }

  // "Clear" or "Sun" Condition: Clean view
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[10] select-none mix-blend-screen opacity-95">
      {/* Very subtle warm map wide golden filter */}
      <div className="absolute inset-0 bg-amber-500/[0.005]" />
    </div>
  );
});

/**
 * Cinematic custom "fly-to" camera transition animation.
 * Smoothly interpolates the map camera (center, zoom, heading, tilt) over time,
 * using a elegant arc trajectory for long-distance transitions.
 */
const animateFlyTo = (
  map: google.maps.Map,
  targetLoc: google.maps.LatLngLiteral,
  targetZoom: number = 18.8,
  targetTilt: number = 67.5,
  targetHeadingOffset: number = 35,
  duration: number = 1400
) => {
  const startCenter = map.getCenter();
  if (!startCenter) {
    map.panTo(targetLoc);
    map.setZoom(targetZoom);
    return;
  }
  const startLat = startCenter.lat();
  const startLng = startCenter.lng();
  const startZoom = map.getZoom() || 12;
  const startTilt = map.getTilt() || 0;
  const startHeading = map.getHeading() || 0;

  const targetHeading = (startHeading + targetHeadingOffset) % 360;
  const startTime = performance.now();

  const step = (time: number) => {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing: cubic out for ultra smooth ending
    const ease = 1 - Math.pow(1 - progress, 3);

    // Arcing zoom response:
    // If we're flying a notable distance, zoom OUT (upwards) slightly to simulate aerial camera panning
    const distanceLat = Math.abs(targetLoc.lat - startLat);
    const distanceLng = Math.abs(targetLoc.lng - startLng);
    const isFar = (distanceLat + distanceLng) > 0.004;

    let curZoom = startZoom + (targetZoom - startZoom) * ease;
    if (isFar) {
      const arcHeight = Math.min(2.5, Math.max(1, startZoom - 9));
      const dip = arcHeight * Math.sin(Math.PI * progress);
      curZoom = curZoom - dip;
    }

    // Occlusion Area Avoidance: Exponential geodesic offset based on current zoom.
    // This shifts the camera center slightly South so the target POI remains perfectly visible in the upper 60-65% viewport half.
    const geodesicOffset = 115 / Math.pow(2, curZoom);
    const curLat = startLat + ((targetLoc.lat - geodesicOffset) - startLat) * ease;
    const curLng = startLng + (targetLoc.lng - startLng) * ease;

    let diffHeading = targetHeading - startHeading;
    if (diffHeading > 180) diffHeading -= 360;
    if (diffHeading < -180) diffHeading += 360;
    const curHeading = (startHeading + diffHeading * ease + 360) % 360;

    const curTilt = startTilt + (targetTilt - startTilt) * ease;

    map.moveCamera({
      center: { lat: curLat, lng: curLng },
      zoom: curZoom,
      heading: curHeading,
      tilt: (map.getMapTypeId() === 'satellite' || map.getMapTypeId() === 'hybrid') ? 0 : curTilt
    });

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

/**
 * Robust nearby highlights service fetching high-quality tourist sights
 * with fallback placeholder generation.
 */
const fetchNearbyHighlights = async (
  center: google.maps.LatLngLiteral,
  placesLib: any,
  mapInstance: any
) => {
  if (placesLib && mapInstance) {
    try {
      const { places } = await placesLib.Place.searchNearby({
        locationRestriction: {
          center: center,
          radius: 1200
        },
        fields: ['id', 'displayName', 'formattedAddress', 'rating', 'userRatingCount', 'types', 'reviews', 'regularOpeningHours', 'photos', 'location'],
        maxResultCount: 6
      });
      if (places && places.length > 0) {
        return places
          .filter((p: any) => p.rating && p.rating >= 4.0)
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 4);
      }
    } catch (e) {
      console.warn("Real searchNearby failed, invoking advanced placeholder highlights system:", e);
    }
  }

  // Adaptive placeholder Google Places API generator matching context coordinates
  const syntheticSpots = [
    {
      id: `synthetic_cafe_${center.lat.toFixed(3)}_${center.lng.toFixed(3)}`,
      displayName: "The Neon Grid Café",
      rating: 4.8,
      userRatingCount: 312,
      formattedAddress: `District 4, Near Coordinate ${center.lat.toFixed(3)}N, ${center.lng.toFixed(3)}E`,
      types: ["cafe", "food", "establishment"],
      lat: center.lat + 0.0015,
      lng: center.lng + 0.0012,
      imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: `synthetic_bar_${center.lat.toFixed(3)}_${center.lng.toFixed(3)}`,
      displayName: "Vanti Horizon Lounge",
      rating: 4.9,
      userRatingCount: 546,
      formattedAddress: `Skyline Plaza, Near Coordinate ${center.lat.toFixed(3)}N, ${center.lng.toFixed(3)}E`,
      types: ["bar", "restaurant", "establishment"],
      lat: center.lat - 0.0012,
      lng: center.lng - 0.0018,
      imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: `synthetic_park_${center.lat.toFixed(3)}_${center.lng.toFixed(3)}`,
      displayName: "Quantum Meridian Park",
      rating: 4.7,
      userRatingCount: 228,
      formattedAddress: `Scenic Lookout, Near Coordinate ${center.lat.toFixed(3)}N, ${center.lng.toFixed(3)}E`,
      types: ["park", "tourist_attraction", "establishment"],
      lat: center.lat + 0.0021,
      lng: center.lng - 0.0015,
      imageUrl: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=300&q=80"
    }
  ];

  return syntheticSpots;
};

// A minimal ErrorBoundary for map components to prevent total app crashes

/**
 * Processes a list of markers through a high-performance spatial grid system.
 * 1) Clips markers that are outside the current map viewport bounds.
 * 2) Clusters markers within computed grid cells based on zoom level.
 * 3) Respects power efficiency modes by clustering more aggressively.
 */
function processSpatialGrid<T extends { id: any; lat: number; lng: number; displayName?: string; name?: string; photos?: any[] }>(
  items: T[],
  zoom: number,
  center: { lat: number; lng: number } | null | undefined,
  bounds: google.maps.LatLngBounds | null,
  isPowerEfficiency: boolean
): Array<T & { isCluster?: boolean; clusterCount?: number; members?: T[] }> {
  if (items.length === 0) return [];

  const safeCenter = {
    lat: center?.lat ?? 37.5665,
    lng: center?.lng ?? 126.9780
  };

  // 1. Viewport Clipping Bounds Estimation
  let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
  const hasValidBounds = bounds && typeof bounds.contains === 'function';
  
  if (!hasValidBounds) {
    const latSpan = 180 / Math.pow(2, Math.max(1, zoom - 2));
    const lngSpan = 360 / Math.pow(2, Math.max(1, zoom - 2));
    minLat = safeCenter.lat - latSpan;
    maxLat = safeCenter.lat + latSpan;
    minLng = safeCenter.lng - lngSpan;
    maxLng = safeCenter.lng + lngSpan;
  }

  // 2. Filter items strictly within viewport (Viewport Clipping)
  const visibleItems = items.filter(item => {
    if (hasValidBounds) {
      try {
        return bounds.contains({ lat: item.lat, lng: item.lng });
      } catch (e) {
        // fall through to bounding box approximation
      }
    }
    return item.lat >= minLat && item.lat <= maxLat && item.lng >= minLng && item.lng <= maxLng;
  });

  // 3. Grid Cell Size Selection
  const baseFactor = isPowerEfficiency ? 0.001 : 0.0005;
  const gridSize = baseFactor * Math.pow(2.2, Math.max(0, 16 - zoom));

  if (zoom >= 16.5 && !isPowerEfficiency) {
    // Zoomed in close: retain all individual spots to prevent pop-ins but still limit if extremely dense
    const results = visibleItems.map(item => ({ ...item, isCluster: false }));
    const maxNodes = 100;
    if (results.length > maxNodes) {
      return results
        .map(r => {
          const distSq = Math.pow(r.lat - safeCenter.lat, 2) + Math.pow(r.lng - safeCenter.lng, 2);
          return { item: r, distSq };
        })
        .sort((a, b) => a.distSq - b.distSq)
        .map(entry => entry.item)
        .slice(0, maxNodes);
    }
    return results;
  }

  // 4. Assign items to Grid Cells (Spatial Hashing)
  const cellMap: Record<string, T[]> = {};
  for (const item of visibleItems) {
    const latCell = Math.floor(item.lat / gridSize);
    const lngCell = Math.floor(item.lng / gridSize);
    const key = `${latCell}_${lngCell}`;
    if (!cellMap[key]) {
      cellMap[key] = [];
    }
    cellMap[key].push(item);
  }

  // 5. Build clustered and unclustered items from Grid Cells
  const results: Array<T & { isCluster?: boolean; clusterCount?: number; members?: T[] }> = [];

  for (const cellItems of Object.values(cellMap)) {
    if (cellItems.length === 1) {
      results.push({ ...cellItems[0], isCluster: false });
    } else {
      const avgLat = cellItems.reduce((sum, m) => sum + m.lat, 0) / cellItems.length;
      const avgLng = cellItems.reduce((sum, m) => sum + m.lng, 0) / cellItems.length;
      
      results.push({
        ...cellItems[0],
        lat: avgLat,
        lng: avgLng,
        isCluster: true,
        clusterCount: cellItems.length,
        members: cellItems
      });
    }
  }

  // 6. Dynamic DOM Node Limiting based on Zoom levels & Power Status to conserve mobile performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  let maxDomNodes = isMobile ? 40 : 80; // default safe limit
  if (zoom <= 5) {
    maxDomNodes = isMobile ? 12 : 20;
  } else if (zoom <= 8) {
    maxDomNodes = isMobile ? 18 : 30;
  } else if (zoom <= 11) {
    maxDomNodes = isMobile ? 25 : 45;
  } else if (zoom <= 14) {
    maxDomNodes = isMobile ? 35 : 65;
  } else if (zoom <= 16) {
    maxDomNodes = isMobile ? 50 : 85;
  } else {
    maxDomNodes = isMobile ? 65 : 110;
  }

  if (isPowerEfficiency) {
    maxDomNodes = Math.floor(maxDomNodes * 0.6); // Clamp tightly in power efficiency mode
  }

  // If node count exceeds budget, prioritize heavy clusters and center-proximity items
  if (results.length > maxDomNodes) {
    return results
      .map(node => {
        const clusterWeight = node.isCluster ? (node.clusterCount || 2) * 45 : 1;
        const distSq = Math.pow(node.lat - safeCenter.lat, 2) + Math.pow(node.lng - safeCenter.lng, 2);
        // Score: higher cluster weight and lower distance yields higher rating
        const score = clusterWeight / (distSq + 0.00001);
        return { node, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.node)
      .slice(0, maxDomNodes);
  }

  return results;
}

const getAestheticFilter = (aesthetic: string): string => {
  switch (aesthetic) {
    case 'night':
      return 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%) saturate(85%)';
    case 'contrast':
      return 'contrast(140%) saturate(125%) brightness(95%)';
    case 'minimalist':
      return 'grayscale(100%) brightness(105%) contrast(115%) opacity(90%)';
    case 'sepia':
      return 'sepia(60%) hue-rotate(-15deg) contrast(110%) brightness(95%) saturate(110%)';
    case 'cyberpunk':
      return 'hue-rotate(240deg) saturate(220%) contrast(120%) brightness(90%)';
    case 'retro-blueprint':
      return 'invert(80%) sepia(20%) hue-rotate(170deg) saturate(180%) contrast(110%) brightness(90%) drop-shadow(0 0 1px rgba(0,0,0,0.5))';
    case 'midnight-cyberpunk':
      return 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(130%) saturate(200%) drop-shadow(0 0 5px rgba(255,0,255,0.2))';
    case 'minimalist-paper':
      return 'grayscale(15%) brightness(102%) contrast(90%) sepia(15%) opacity(95%)';
    case 'none':
    default:
      return 'none';
  }
};

const BuzzMarker = React.memo(({ 
  userRatingCount, 
  isSelected, 
  activeWeather,
  mode,
  types,
  name
}: { 
  userRatingCount?: number; 
  isSelected?: boolean; 
  activeWeather?: string | null;
  mode?: string;
  types?: string[];
  name?: string;
}) => {
  const buzz = userRatingCount || 0;
  const isHighBuzz = buzz > 1200;
  const hue = Math.min(350, 210 + (Math.sqrt(buzz) / 10) * 14); 
  
  const IconComponent = getIconForType(types, name);

  return (
    <div className="relative group/buzz flex flex-col items-center">
      <motion.div 
        animate={{ 
          scale: isSelected ? 1.2 : 1,
          y: isSelected ? -8 : 0
        }}
        className="relative"
      >
        {/* Hexagonal Precision Frame */}
        <div className={cn(
          "w-12 h-12 flex items-center justify-center relative transition-all duration-500",
          isSelected ? "opacity-100" : "opacity-90"
        )}>
           {/* Outer Ring / Glow */}
           <div 
             className="absolute inset-0 rounded-xl rotate-45 border-2 border-white/10 blur-[2px]"
             style={{ borderColor: isSelected ? 'rgba(244, 63, 94, 0.4)' : '' }}
           />
           
           {/* Inner Core */}
           <div className={cn(
             "w-10 h-10 rounded-xl rotate-45 flex items-center justify-center relative overflow-hidden backdrop-blur-xl border border-white/20",
             isSelected ? "bg-rose-500/20 border-rose-500/40" : "bg-slate-950/80"
           )}>
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[size:100%_4px] animate-scanline pointer-events-none" />
              
              {/* Icon - Rotated back to normal */}
              <div className="-rotate-45 relative z-10">
                {IconComponent ? (
                  <IconComponent className={cn("w-5 h-5", isSelected ? "text-white" : "text-white/70")} />
                ) : (
                  <MapPin className={cn("w-5 h-5", isSelected ? "text-white" : "text-white/70")} />
                )}
              </div>
           </div>

           {/* Pulse Ring for high buzz */}
           {isHighBuzz && (
             <div className="absolute inset-0 rounded-xl rotate-45 border border-rose-500/40 animate-ping-slow" />
           )}
        </div>

        {/* Small Status Tag */}
        {isHighBuzz && (
          <div className="absolute -top-1 -right-1 bg-rose-500 px-1 py-0.5 rounded-sm flex items-center gap-0.5 shadow-lg">
            <Zap className="w-2 h-2 text-white fill-white" />
            <span className="text-[6px] font-black text-white uppercase tracking-tighter">BUZZ</span>
          </div>
        )}
      </motion.div>
      
      {/* Anchor Point */}
      <div className="w-1 h-1 bg-white/20 rounded-full mt-1 blur-[1px]" />
      
      <WeatherOverlay weather={activeWeather} />
    </div>
  );
});

import { ActivityStreamLayer } from './ActivityStreamLayer';
import { CrowdPulseLayer } from './CrowdPulseLayer';
import { SmartPlanner } from './SmartPlanner';
import { FinancialTelemetry } from './FinancialTelemetry';
import AILogPanel from './AILogPanel';

const VantiMap = React.memo(function VantiMap() {
  useViewportLayoutManager();
  const { timePhase } = useThemeManager();
  const map = useMap();
  const { stats: prefStats, markLoaded } = usePerformanceMonitor();
  const map3dRef = useRef<Map3DRef>(null);
  const placesLib = useMapsLibrary('places');
  const markerLib = useMapsLibrary('marker');
  const geometryLib = useMapsLibrary('geometry');

  const activeMode = useVantiStore((state) => state.activeMode);
  const is3DActive = useVantiStore((state) => state.is3DActive);
  const setIs3DActive = useVantiStore((state) => state.setIs3DActive);
  const setActiveMode = useVantiStore((state) => state.setActiveMode);
  const isCrowdPulseActive = useVantiStore((state) => state.isCrowdPulseActive);
  const setIsCrowdPulseActive = useVantiStore((state) => state.setIsCrowdPulseActive);
  const mapTheme = useVantiStore((state) => state.mapTheme);
  const setMapTheme = useVantiStore((state) => state.setMapTheme);
  const currentWeatherData = useVantiStore((state) => state.currentWeatherData);
  const setMapViewport = useVantiStore((state) => state.setMapViewport);
  const setIsMapDragging = useVantiStore((state) => state.setIsMapDragging);
  const setGlobalViewportLandmarks = useVantiStore((state) => state.setViewportLandmarks);
  const showList = useVantiStore((state) => state.showList);
  const setShowList = useVantiStore((state) => state.setShowList);
  const selectedPlace = useVantiStore((state) => state.selectedPlace);
  const setSelectedPlace = useVantiStore((state) => state.setSelectedPlace);
  const routingOrigin = useVantiStore((state) => state.routingOrigin);
  const setRoutingOrigin = useVantiStore((state) => state.setRoutingOrigin);
  const selectedCategory = useVantiStore((state) => state.selectedCategory);
  const isChatbotOpen = useVantiStore((state) => state.isChatbotOpen);
  const setIsChatbotOpen = useVantiStore((state) => state.setIsChatbotOpen);
  const isSettingsOpen = useVantiStore((state) => state.isSettingsOpen);
  const setIsSettingsOpen = useVantiStore((state) => state.setIsSettingsOpen);
  const setSelectedCategory = useVantiStore((state) => state.setSelectedCategory);
  const isOmniaScanning = useVantiStore((state) => state.isOmniaScanning);
  const setIsOmniaScanning = useVantiStore((state) => state.setIsOmniaScanning);
  const customMarkers = useVantiStore((state) => state.customMarkers);
  const addCustomMarker = useVantiStore((state) => state.addCustomMarker);

  const [addingMarkerLat, setAddingMarkerLat] = useState<number | null>(null);
  const [addingMarkerLng, setAddingMarkerLng] = useState<number | null>(null);
  const [addingMarkerNick, setAddingMarkerNick] = useState('');
  const [addingMarkerNote, setAddingMarkerNote] = useState('');
  const [addingMarkerCategory, setAddingMarkerCategory] = useState('Restaurant');
  const [showToast, setShowToast] = useState(false);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(DEFAULT_CENTER);
  const [activeWeather, setActiveWeather] = useState<string | null>(null);
  const [ambientLightLevel, setAmbientLightLevel] = useState<number | null>(null);
  const [showPinchHelper, setShowPinchHelper] = useState(true);

  useEffect(() => {
    // Attempt to use the Ambient Light Sensor API (experimental but functional in compatible browsers with flags)
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          setAmbientLightLevel(sensor.illuminance);
        });
        sensor.start();
        // Ignoring cleanup for simple implementation here to avoid duplicate return conflicts
      } catch (err) {
        console.warn("Ambient Light Sensor not available or permission denied", err);
      }
    }

    const timer = setTimeout(() => {
      setShowPinchHelper(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const trail = useBreadcrumb(true);
  const suggestion = useLocalSuggestions(userLocation?.lat, userLocation?.lng);

  useEffect(() => {
    if (suggestion) {
      addToast(`Must-Do Nearby: ${suggestion.name}`, 'info');
    }
  }, [suggestion]);

  const showControls = useVantiStore((state) => state.showControls);
  const userProfile = useVantiStore((state) => state.userProfile);
  const isBatterySaverEnabled = useVantiStore((state) => state.isBatterySaverEnabled);
  const setShowControls = useVantiStore((state) => state.setShowControls);
  const themeOverride = useVantiStore((state) => state.themeOverride);
  const setThemeOverride = useVantiStore((state) => state.setThemeOverride);
  const recenterToUser = useVantiStore((state) => state.recenterToUser);
  const recenterTrigger = useVantiStore((state) => state.recenterTrigger);
  const clearRecenterTrigger = useVantiStore((state) => state.clearRecenterTrigger);
  const isInitializing = useVantiStore((state) => state.isInitializing);
  const setIsInitializing = useVantiStore((state) => state.setIsInitializing);

  const isAROpen = useVantiStore((state) => state.isAROpen);
  const setIsAROpen = useVantiStore((state) => state.setIsAROpen);
  const isAtmosphereOpen = useVantiStore((state) => state.isAtmosphereOpen);
  const setIsAtmosphereOpen = useVantiStore((state) => state.setIsAtmosphereOpen);
  const isOperationsHubOpen = useVantiStore((state) => state.isOperationsHubOpen);
  const setIsOperationsHubOpen = useVantiStore((state) => state.setIsOperationsHubOpen);
  const units = useVantiStore((state) => state.units);
  const setUnits = useVantiStore((state) => state.setUnits);
  const mapStyle = useVantiStore((state) => state.mapStyle);
  const setMapStyle = useVantiStore((state) => state.setMapStyle);
  const mapAesthetic = useVantiStore((state) => state.mapAesthetic);
  const setMapAesthetic = useVantiStore((state) => state.setMapAesthetic);
  const addToItinerary = useVantiStore((state) => state.addToItinerary);
  const removeFromItinerary = useVantiStore((state) => state.removeFromItinerary);
  const isCinematicMode = useVantiStore((state) => state.isCinematicMode);
  const setIsCinematicMode = useVantiStore((state) => state.setIsCinematicMode);
  const travelMood = useVantiStore((state) => state.travelMood);
  const setTravelMood = useVantiStore((state) => state.setTravelMood);
  const language = useVantiStore((state) => state.language);
  const setLanguage = useVantiStore((state) => state.setLanguage);

  const showWeatherLayer = useVantiStore((state) => state.showWeatherLayer);
  const setShowWeatherLayer = useVantiStore((state) => state.setShowWeatherLayer);
  const weatherLayerType = useVantiStore((state) => state.weatherLayerType);
  const setWeatherLayerType = useVantiStore((state) => state.setWeatherLayerType);

  const t = getTranslation(language);

  const isVibeModeActive = useVantiStore((state) => state.isVibeModeActive);
  const setMarkers = useVantiStore((state) => state.setMarkers); // Assuming this exists or similar
  const originalMarkers = useRef<any[]>([]); // Need to keep original markers to restore them

  useEffect(() => {
    async function filterMarkers() {
        if (isVibeModeActive) {
            // Save original markers if not already saved
            if (originalMarkers.current.length === 0) {
                originalMarkers.current = [...(useVantiStore.getState().markers || [])];
            }
            
            try {
                const response = await fetch('/api/vibe-filter-pois', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        pois: originalMarkers.current, 
                        vibe: travelMood 
                    })
                });
                if (!response.ok) throw new Error(`Status ${response.status}`);
                const filtered = await response.json();
                useVantiStore.setState({ markers: filtered });
            } catch (err) {
                console.error("Vibe filter failed", err);
            }
        } else {
            // Restore markers
            if (originalMarkers.current.length > 0) {
                useVantiStore.setState({ markers: originalMarkers.current });
                originalMarkers.current = [];
            }
        }
    }
    filterMarkers();
  }, [isVibeModeActive, travelMood]);
  const isGaussianActive = useVantiStore((state) => state.isGaussianActive);
  const setIsGaussianActive = useVantiStore((state) => state.setIsGaussianActive);
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const [isMapIdle, setIsMapIdle] = useState(false);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showVectorGuide, setShowVectorGuide] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [selectedCityForBriefing, setSelectedCityForBriefing] = useState<any | null>(null);
  const [radialMenu, setRadialMenu] = useState<{ isOpen: boolean; position: { x: number; y: number }; place: any } | null>(null);

  const handleMapLongPress = useCallback((e: any) => {
    const x = e.pageX || (e.touches && e.touches[0].pageX);
    const y = e.pageY || (e.touches && e.touches[0].pageY);
    if (x && y) {
      setRadialMenu({
        isOpen: true,
        position: { x, y },
        place: { name: 'Picked Location' }
      });
      console.log("Long press on map");
    }
  }, []);

  const longPressHandlers = useLongPress(handleMapLongPress, { threshold: 800 });

  const stats = useVantiStore((state) => state.tripStats);
  const addVisitedLandmark = useVantiStore((state) => state.addVisitedLandmark);
  const updateTotalDistance = useVantiStore((state) => state.updateTotalDistance);
  const recordWeatherPreference = useVantiStore((state) => state.recordWeatherPreference);

  const handleMarkerLongPress = useCallback((e: any, place: any) => {
    if (e.detail?.domEvent) {
      setRadialMenu({
        isOpen: true,
        position: { x: e.detail.domEvent.clientX, y: e.detail.domEvent.clientY },
        place
      });
      triggerHaptic('impact');
    } else if (e.clientX && e.clientY) {
      setRadialMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        place
      });
      triggerHaptic('impact');
    }
  }, []);

  const [viewportLandmarks, setViewportLandmarks] = useState<any[]>([]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'landmarks' | 'budget'>('all');

  // Track total distance by measuring movement between userLocation updates
  const lastTrackedLocRef = useRef<{ lat: number, lng: number } | null>(null);
  useEffect(() => {
    if (userLocation && geometryLib) {
      if (lastTrackedLocRef.current) {
        const dist = geometryLib.spherical.computeDistanceBetween(
          lastTrackedLocRef.current,
          userLocation
        );
        // Only record if moved more than 50 meters to avoid jitter
        if (dist > 50) {
          updateTotalDistance(dist / 1000); // km
          lastTrackedLocRef.current = userLocation;
        }
      } else {
        lastTrackedLocRef.current = userLocation;
      }
    }
  }, [userLocation, geometryLib, updateTotalDistance]);

  // Landmark Extraction Logic
  useEffect(() => {
    if (!map || !placesLib || !isMapIdle || isAROpen) return;

    const scanLandmarks = async () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      if (!bounds || !center) return;

      try {
        // searchNearby requires a Circle (center + radius)
        const { places } = await placesLib.Place.searchNearby({
          locationRestriction: {
            center: { lat: center.lat(), lng: center.lng() },
            radius: 1000 // 1km radius for landmarks
          },
          fields: ['id', 'displayName', 'location', 'types'],
          maxResultCount: 6,
          includedTypes: ['landmark', 'tourist_attraction', 'museum', 'monument']
        });

        if (places) {
          const mapped = places.map((p: any) => ({
            id: p.id,
            name: p.displayName,
            position: { lat: p.location.lat(), lng: p.location.lng() },
            types: p.types
          }));
          setViewportLandmarks(mapped);
          setGlobalViewportLandmarks(mapped); // global store sync
        }
      } catch (err) {
        console.warn("Landmark viewport scan failed:", err);
      }
    };

    scanLandmarks();
  }, [map, placesLib, isMapIdle, isAROpen]);

  useEffect(() => {
    // Safety fallback: Ensure initialization screen hides even if map libraries fail
    const fallbackTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 4000);

    if (map && placesLib && markerLib && geometryLib) {
      markLoaded();
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 1200); 
      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
      };
    }
    return () => clearTimeout(fallbackTimer);
  }, [map, placesLib, markerLib, geometryLib, setIsInitializing]);

  useEffect(() => {
    if (recenterTrigger && map) {
      if (is3DActive) {
        map.panTo(recenterTrigger);
        map.setZoom(16.5);
      } else {
        animateFlyTo(map, recenterTrigger, 16.5, 0, 35, 1200);
      }
      setUserLocation(recenterTrigger);
      clearRecenterTrigger();
    }
  }, [recenterTrigger, map, clearRecenterTrigger, is3DActive]);

  useEffect(() => {
    if (!map) return;
    const idleL = map.addListener('idle', () => setIsMapIdle(true));
    const dragL = map.addListener('dragstart', () => setIsMapIdle(false));
    const zoomL = map.addListener('zoom_changed', () => setIsMapIdle(false));
    
    return () => {
      idleL.remove();
      dragL.remove();
      zoomL.remove();
    };
  }, [map]);

  const handlePoiClickRef = useRef<any>(null);
  const handleQuickSaveBookmarkRef = useRef<any>(null);
  const [quickSaveStatus, setQuickSaveStatus] = useState<{
    status: 'idle' | 'saving' | 'success' | 'error';
    message: string;
    locationName?: string;
  }>({ status: 'idle', message: '' });

  const [queryText, setQueryText] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [kmlLayer, setKmlLayer] = useState<google.maps.KmlLayer | null>(null);
  const [places, setPlaces] = useState<google.maps.places.Place[]>([]);
  const [searchFilter, setSearchFilter] = useState<'all' | 'nearby' | 'high_rated' | 'open_now'>('all');
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [showingSaved, setShowingSaved] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const routeOrigin = useMemo(() => {
    if (routingOrigin) {
      return {
        lat: typeof routingOrigin.location?.lat === 'function' ? routingOrigin.location.lat() : (routingOrigin.location?.lat || routingOrigin.lat),
        lng: typeof routingOrigin.location?.lng === 'function' ? routingOrigin.location.lng() : (routingOrigin.location?.lng || routingOrigin.lng)
      };
    }
    return userLocation || { lat: 37.5665, lng: 126.9780 };
  }, [routingOrigin, userLocation]);
  
  const routeDestination = useMemo(() => {
    if (!selectedPlace) return { lat: 37.5665, lng: 126.9780 };
    return { 
      lat: typeof selectedPlace.location?.lat === 'function' ? selectedPlace.location.lat() : (selectedPlace.location?.lat || selectedPlace.lat), 
      lng: typeof selectedPlace.location?.lng === 'function' ? selectedPlace.location.lng() : (selectedPlace.location?.lng || selectedPlace.lng)
    };
  }, [selectedPlace]);
  const [isMapTilesLoading, setIsMapTilesLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [offlineAreas, setOfflineAreas] = useState<OfflineArea[]>([]);

  // States for Coordinate Bookmarking
  const [bookmarkingName, setBookmarkingName] = useState('');
  const [bookmarkingCategory, setBookmarkingCategory] = useState('point_of_interest');
  const [bookmarkingLat, setBookmarkingLat] = useState<number | null>(null);
  const [bookmarkingLng, setBookmarkingLng] = useState<number | null>(null);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);

  const saveCoordinateBookmark = async () => {
    if (!user || bookmarkingLat === null || bookmarkingLng === null) return;
    setIsSavingBookmark(true);
    const placeId = `coord-${Date.now()}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'savedPlaces', placeId);
      await setDoc(docRef, {
        placeId,
        displayName: bookmarkingName || 'Saved Coordinate',
        lat: Number(bookmarkingLat),
        lng: Number(bookmarkingLng),
        savedAt: Date.now(),
        formattedAddress: `Coordinates: ${bookmarkingLat.toFixed(5)}, ${bookmarkingLng.toFixed(5)}`,
        types: [bookmarkingCategory],
        userId: user.uid,
        isCustomCoordinate: true
      });
      triggerHaptic('success');
      setBookmarkingLat(null);
      setBookmarkingLng(null);
    } catch (err) {
      console.error("Error creating coordinate bookmark", err);
    } finally {
      setIsSavingBookmark(false);
    }
  };

  // States for Recent Searches (persisted both locally and in Firestore)
  const [recentSearches, setRecentSearches] = useState<{ id: string; query: string; timestamp: number }[]>([]);
  const [localRecentSearches, setLocalRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vanti_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Standard OperationType for Firestore compliance
  const OP_GET = 'get' as any;
  const OP_CREATE = 'create' as any;
  const OP_DELETE = 'delete' as any;

  const saveSearchQuery = async (queryTextVal: string) => {
    const trimmed = queryTextVal.trim();
    if (!trimmed) return;

    // A. Update local storage cache
    let newLocals = [trimmed, ...localRecentSearches.filter(q => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setLocalRecentSearches(newLocals);
    try {
      localStorage.setItem('vanti_recent_searches', JSON.stringify(newLocals));
    } catch (e) {}

    // B. Save to user's remote firestore collection
    if (user) {
      try {
        const dup = recentSearches.find(rs => rs.query.toLowerCase() === trimmed.toLowerCase());
        if (dup) {
          const docRef = doc(db, 'users', user.uid, 'recentSearches', dup.id);
          await setDoc(docRef, { query: trimmed, timestamp: Date.now() }, { merge: true });
          return;
        }

        const searchId = `search-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const docRef = doc(db, 'users', user.uid, 'recentSearches', searchId);
        await setDoc(docRef, { query: trimmed, timestamp: Date.now() });

        // Maintain only top 5 limit in the remote Firestore
        if (recentSearches.length >= 5) {
          const sorted = [...recentSearches].sort((a, b) => a.timestamp - b.timestamp);
          const overflowCount = (recentSearches.length + 1) - 5;
          for (let i = 0; i < overflowCount; i++) {
            if (sorted[i]) {
              await deleteDoc(doc(db, 'users', user.uid, 'recentSearches', sorted[i].id));
            }
          }
        }
      } catch (err) {
        console.error("Failed to save search query to Firestore", err);
      }
    }
  };

  const handleClearSearches = async () => {
    setLocalRecentSearches([]);
    try {
      localStorage.removeItem('vanti_recent_searches');
    } catch {}

    if (user) {
      try {
        for (const rs of recentSearches) {
          await deleteDoc(doc(db, 'users', user.uid, 'recentSearches', rs.id));
        }
      } catch (err) {
        console.error("Failed to clear searches from Firestore", err);
      }
    }
  };

  // Automated Geofencing Welcome Banner State
  const [geofenceWelcome, setGeofenceWelcome] = useState<'Seoul' | 'Canada' | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // Interactive Features State for GNB Modes
  const [scratchedCoupons, setScratchedCoupons] = useState<string[]>([]);

  const [pingKey, setPingKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPingKey(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [pingLatency, setPingLatency] = useState(42);
  const [isQuantumScanning, setIsQuantumScanning] = useState(false);
  const [quantumScannerLogs, setQuantumScannerLogs] = useState<string[]>([]);
  const [socialMeetpoint, setSocialMeetpoint] = useState<{ lat: number, lng: number, name: string } | null>(null);

  // [PLACE-ME DNA]: Background tracking simulation for cinematic EOD recap
  const [isRecording, setIsRecording] = useState(false);
  const [trajectory, setTrajectory] = useState<google.maps.LatLngLiteral[]>([]);
  const [showEodMovie, setShowEodMovie] = useState(false);

  const simulateEodMovie = async () => {
    if (trajectory.length < 2) return;
    setShowEodMovie(true);
    triggerHaptic('success');
    
    if (map3dRef.current) {
        const m3d = map3dRef.current as any;
        await m3d.flyTo({ center: { ...trajectory[0], altitude: 5000 }, tilt: 0, durationMillis: 2000 });
        for (let i = 0; i < trajectory.length; i++) {
           await m3d.flyTo({
               center: { ...trajectory[i], altitude: 320 },
               tilt: 65,
               heading: (i * 25) % 360,
               durationMillis: 1800
           });
        }
    }
  };



  const [hapticIntensity, setHapticIntensity] = useState(50);

  const triggerHaptic = useCallback((type: HapticType, intensityOffset: number = 0) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        const factor = (hapticIntensity + intensityOffset) / 50;
        if (type === 'tap') navigator.vibrate(10 * factor); // Crisp click
        else if (type === 'switch') navigator.vibrate([8, 15, 8].map(v => v * factor)); // Precise physical double-click ripple for GNB switches
        else if (type === 'success') navigator.vibrate([15, 30, 15, 30, 40].map(v => v * factor)); // Rich alert success
        else if (type === 'close') navigator.vibrate([10, 30, 10].map(v => v * factor));
        else if (type === 'open_panel') navigator.vibrate([8, 20, 12].map(v => v * factor));
        else if (type === 'mode3d') navigator.vibrate([15, 25, 20].map(v => v * factor));
        else if (type === 'impact') navigator.vibrate(20 * factor);
      } catch (e) {
        // ignore if not supported
      }
    }
  }, [hapticIntensity]);

  useEffect(() => {
    if (!map) return;
    
    const center = map.getCenter();
    if (!center) return;
    const currentLoc = { lat: center.lat(), lng: center.lng() };

    if (is3DActive) {
      // Cinematic Sweep to 3D
      triggerHaptic('mode3d');
      animateFlyTo(map, currentLoc, 18.2, 55, 45, 1200);
    } else {
      // Return to Overview
      triggerHaptic('switch');
      animateFlyTo(map, currentLoc, 14.5, 0, 0, 1000);
    }
  }, [is3DActive, map, triggerHaptic]);

  // Automated Solar Positioning, Weather Theme Management, and Auto-Language Sync
  useEffect(() => {
    if (!userLocation) return;
    
    // Reverse Geocode for Auto Language selection (basic ISO logic)
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: userLocation.lat, lng: userLocation.lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const countryComp = results[0].address_components.find(c => c.types.includes('country'));
          if (countryComp) {
            const isoCode = countryComp.short_name;
            if (isoCode === 'KR') setLanguage('ko');
            else setLanguage('en');
          }
        }
      });
    }

    if (themeOverride !== 'Auto') return;

    const updateSolarTheme = () => {
      const now = new Date();
      const times = SunCalc.getTimes(now, userLocation.lat, userLocation.lng);
      const sunPos = SunCalc.getPosition(now, userLocation.lat, userLocation.lng);
      
      const azimuthDeg = sunPos.azimuth * (180 / Math.PI) + 180; 
      const altitudeDeg = sunPos.altitude * (180 / Math.PI);
      
      document.documentElement.style.setProperty('--sun-azimuth', `${azimuthDeg}deg`);
      document.documentElement.style.setProperty('--sun-altitude', `${altitudeDeg}deg`);
      document.documentElement.style.setProperty('--sun-intensity', Math.max(0, Math.min(1, altitudeDeg / 90)).toFixed(2));
      
      const isNight = now < times.sunrise || now > times.sunset;
      const targetAesthetic: MapAesthetic = isNight ? 'midnight-cyberpunk' : 'none';
      let targetTheme = mapTheme;

      const weatherCondition = currentWeatherData?.weather?.[0]?.main || activeWeather || '';
      if (weatherCondition) {
        const wStr = weatherCondition.toLowerCase();
        if (wStr.includes('rain') || wStr.includes('drizzle')) targetTheme = 'Auto-Rainy';
        else if (wStr.includes('sun') || wStr.includes('clear')) targetTheme = 'Auto-Sunny';
        else if (wStr.includes('cloud')) targetTheme = 'Auto-Cloudy';
      }

      if (mapAesthetic !== targetAesthetic) {
        setMapAesthetic(targetAesthetic);
        triggerHaptic('switch', 10);
      }
      if (targetTheme !== mapTheme && ['Auto-Rainy', 'Auto-Sunny', 'Auto-Cloudy'].includes(targetTheme)) {
        setMapTheme(targetTheme);
      }
    };

    updateSolarTheme();
    const interval = setInterval(updateSolarTheme, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [userLocation, themeOverride, mapAesthetic, setMapAesthetic, setMapTheme, mapTheme, currentWeatherData, activeWeather, triggerHaptic, setLanguage]);

  const reverseGeocode = useCallback((lat: number, lng: number): Promise<string> => {
    return new Promise((resolve) => {
      try {
        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results[0].formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            } else {
              resolve(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            }
          });
        } else {
          resolve(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } catch (e) {
        resolve(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    });
  }, []);

  const handleQuickSaveBookmark = useCallback(async (lat: number, lng: number, spotName?: string) => {
    triggerHaptic('success');
    if (!user) {
      setQuickSaveStatus({
        status: 'error',
        message: 'Authentication required. Please sign in to save location bookmarks to your Travel Diary.'
      });
      setTimeout(() => setQuickSaveStatus({ status: 'idle', message: '' }), 5000);
      return;
    }

    setQuickSaveStatus({
      status: 'saving',
      message: spotName ? `Saving "${spotName}"...` : `Geocoding coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}...`
    });

    try {
      const locationName = spotName || await reverseGeocode(lat, lng);
      setQuickSaveStatus({
        status: 'saving',
        message: `Saving "${locationName}" to Travel Diary...`
      });

      const path = 'travelSnapshots';
      const snapshotRef = doc(collection(db, path));
      const payload = {
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous Explorer',
        userPhotoURL: user.photoURL || '',
        text: spotName ? `📍 Saved hotspot: ${spotName}. Added to my VANTi Travel Diary for future explorations!` : `📍 Instantly bookmarked this beautiful location near ${locationName} through map long-press / context menu override. Perfect spot for future journeys!`,
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80', // Default gorgeous Neon Kyoto preset
        locationName: locationName,
        lat: Number(lat),
        lng: Number(lng),
        createdAt: Date.now()
      };

      await setDoc(snapshotRef, payload);

      setQuickSaveStatus({
        status: 'success',
        message: `Successfully bookmarked!`,
        locationName: locationName
      });
      setTimeout(() => setQuickSaveStatus({ status: 'idle', message: '' }), 4000);
    } catch (err: any) {
      console.error(err);
      setQuickSaveStatus({
        status: 'error',
        message: 'Failed to save pinned location bookmark.'
      });
      setTimeout(() => setQuickSaveStatus({ status: 'idle', message: '' }), 5000);
    }
  }, [user, reverseGeocode, triggerHaptic]);

  // Check if current area is cached
  useEffect(() => {
    if (!map || offlineAreas.length === 0) {
      setIsCurrentAreaCached(false);
      return;
    }
    const checkCache = () => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const center = bounds.getCenter();
      const isInside = offlineAreas.some(area => {
        const areaBounds = new google.maps.LatLngBounds(
          { lat: area.bounds.south, lng: area.bounds.west },
          { lat: area.bounds.north, lng: area.bounds.east }
        );
        return areaBounds.contains(center);
      });
      setIsCurrentAreaCached(prev => prev === isInside ? prev : isInside);
    };
    const listener = map.addListener('idle', checkCache);
    checkCache();
    return () => listener.remove();
  }, [map, offlineAreas]);

  // Accessibility: Dynamic Text Sizing based on window/system (simulated via store or window)
  useEffect(() => {
    const updateScale = () => {
      const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setMapScaleFixed(fontSize / 16);
    };
    window.addEventListener('resize', updateScale);
    updateScale();
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (!map) return;
    const l = map.addListener('contextmenu', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        triggerHaptic('success');
        handleQuickSaveBookmark(e.latLng.lat(), e.latLng.lng());
      }
    });

    let longPressTimer: any;
    const touchListener = map.addListener('mousedown', (e: any) => {
      longPressTimer = setTimeout(() => {
        if (e.latLng) {
          triggerHaptic('success');
          handleQuickSaveBookmark(e.latLng.lat(), e.latLng.lng());
        }
      }, 700);
    });
    const upListener = map.addListener('mouseup', () => clearTimeout(longPressTimer));
    const dragListener = map.addListener('dragstart', () => clearTimeout(longPressTimer));

    return () => {
      l.remove();
      touchListener.remove();
      upListener.remove();
      dragListener.remove();
    };
  }, [map, handleQuickSaveBookmark]);


  // Zoom velocity refs & interactive tactile feedback handler
  const lastZoomRef = useRef(16);
  const lastZoomTimeRef = useRef(Date.now());

  const handleZoomChangeHaptic = useCallback((newZoom: number) => {
    const now = Date.now();
    const dt = now - lastZoomTimeRef.current;
    const dz = Math.abs(newZoom - lastZoomRef.current);
    lastZoomRef.current = newZoom;
    lastZoomTimeRef.current = now;

    if (dt > 12 && dz > 0.008) {
      const velocity = dz / dt; // zoom change per millisecond
      if (velocity > 0.0004) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            const intensityFactor = hapticIntensity / 50;
            const duration = Math.min(45, Math.max(4, Math.round(velocity * 8000 * intensityFactor)));
            if (duration > 18) {
              // High velocity zoom / quick scroll - double dynamic tap
              navigator.vibrate([duration, 10, Math.round(duration * 0.75)]);
            } else {
              // Fine low-velocity scrolling tactile click
              navigator.vibrate(duration);
            }
          } catch (e) {}
        }
      }
    }
  }, [hapticIntensity]);
  const [aiSuiteOpen, setAiSuiteOpen] = useState(false);
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [markerTheme, setMarkerTheme] = useState<'minimalist' | 'glow' | 'classic'>('minimalist');
  const [routeStyle, setRouteStyle] = useState<'classic' | 'traffic'>('classic');
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [showPinsLayer, setShowPinsLayer] = useState(true);
  const [eventPlaces, setEventPlaces] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [debouncedCenter, setDebouncedCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCenter(mapCenter);
    }, 600); // Debounce to prevent rapid polling of OpenMeteo API when dragging/panning
    return () => clearTimeout(handler);
  }, [mapCenter]);
  const [popularSearches, setPopularSearches] = useState<string[]>(['Popular spot near you', 'Trending coffee shops', 'Nearby parks']);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(16);
  const [isLODMoving, setIsLODMoving] = useState(false);
  const lodTimeoutRef = useRef<any>(null);
  const lastCameraChangeTimeRef = useRef<number>(Date.now());
  const lastCameraCenterRef = useRef<{lat: number; lng: number} | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [mapHeading, setMapHeading] = useState(0);
  const [mapTilt, setMapTilt] = useState(45);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [isDeveloperInsightsOpen, setIsDeveloperInsightsOpen] = useState(false);
  const [diaryCount, setDiaryCount] = useState(0);
  const [userSnapshots, setUserSnapshots] = useState<any[]>([]);
  const [isTransitioningStyle, setIsTransitioningStyle] = useState(false);
  const [transitionTargetStyle, setTransitionTargetStyle] = useState<'streets' | 'satellite'>('streets');
  const prevMapTypeRef = useRef(mapType);

  useEffect(() => {
    setIsMapTilesLoading(true);
  }, [mapTheme, mapType, mapAesthetic]);

  useEffect(() => {
    if (prevMapTypeRef.current !== mapType) {
      const isSat = mapType === 'satellite' || mapType === 'hybrid';
      const wasSat = prevMapTypeRef.current === 'satellite' || prevMapTypeRef.current === 'hybrid';
      
      if (isSat !== wasSat) {
        setTransitionTargetStyle(isSat ? 'satellite' : 'streets');
        setIsTransitioningStyle(true);
        triggerHaptic('impact');
        
        const timer = setTimeout(() => {
          setIsTransitioningStyle(false);
        }, 750);
        
        prevMapTypeRef.current = mapType;
        return () => clearTimeout(timer);
      }
      prevMapTypeRef.current = mapType;
    }
  }, [mapType]);

  const [isTerrainActive, setIsTerrainActive] = useState(true);
  const [isFlightMode, setIsFlightMode] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [mapScaleFixed, setMapScaleFixed] = useState(1); // For dynamic text sizing
  const [isCurrentAreaCached, setIsCurrentAreaCached] = useState(false);
  const [perspectiveLock, setPerspectiveLock] = useState(false);
  const [isPowerEfficiencyEnabled, setIsPowerEfficiencyEnabled] = useState(false);
  const [showPois, setShowPois] = useState(true);
  
  // Nearby Highlights Summary Card state and logic
  const [nearbyHighlights, setNearbyHighlights] = useState<any[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const highlightsCache = useRef<Record<string, any>>({});
  const [isHighlightsExpanded, setIsHighlightsExpanded] = useState(false);
  const [isDiscoverMode, setIsDiscoverMode] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [showTravelInsights, setShowTravelInsights] = useState(false);
  const [activeMarkerFilters, setActiveMarkerFilters] = useState<string[]>(['all']);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };
  const [bookmarkedSpotIds, setBookmarkedSpotIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isDiscoverMode) {
      setNearbyHighlights([]);
      return;
    }
  }, [isDiscoverMode]);

  useEffect(() => {
    if (isDiscoverMode && debouncedCenter) {
      fetchHighlightsForCenter();
    }
  }, [debouncedCenter, isDiscoverMode]);

  const fetchHighlightsForCenter = async () => {
    if (!map || !placesLib || !isDiscoverMode) return;
    
    // Simple coordinate-based cache key
    const key = `${Math.round(debouncedCenter.lat * 1000)}_${Math.round(debouncedCenter.lng * 1000)}`;
    if (highlightsCache.current[key]) {
      setNearbyHighlights(highlightsCache.current[key]);
      return;
    }

    setLoadingHighlights(true);
    setNearbyHighlights([]);
    try {
      const spots = await fetchNearbyHighlights(debouncedCenter, placesLib, map);
      highlightsCache.current[key] = spots;
      setNearbyHighlights(spots);
    } catch (err) {
      console.warn("Failed to load nearby highlights:", err);
    } finally {
      setLoadingHighlights(false);
    }
  };


  // Cinematic Mode Animation Loop
  useEffect(() => {
    if (!isCinematicMode || !map) return;

    const targetLoc = userLocation || DEFAULT_CENTER;
    map.panTo(targetLoc);
    map.setZoom(17);

    let frameId: number;
    let currentHeading = map.getHeading() || 0;
    
    const animate = (time: number) => {
      currentHeading += 1.0; // Moderate rotation speed for active cinematic orbit
      const driftTilt = 45 + Math.sin(time / 2000) * 10;
      
      map.moveCamera({
        center: targetLoc,
        heading: currentHeading % 360,
        tilt: driftTilt,
        zoom: 17 + Math.cos(time / 4000) * 0.8
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isCinematicMode, map, userLocation]);

  // Handle Map3D camera changes to update global state
  const handleMap3DCameraChange = useCallback((e: any) => {
    const { center, heading, tilt, range } = e.detail;
    const zoomConstant = 150;
    const calculatedZoom = 21 - Math.log2(range / zoomConstant);

    setMapCenter(prev => {
        if (Math.abs(prev.lat - center.lat) < 1e-7 && Math.abs(prev.lng - center.lng) < 1e-7) return prev;
        return { lat: center.lat, lng: center.lng };
    });
    setMapHeading(prev => Math.abs(prev - heading) < 0.1 ? prev : heading);
    setMapTilt(prev => Math.abs(prev - tilt) < 0.1 ? prev : tilt);
    setMapZoom(prev => Math.abs(prev - calculatedZoom) < 0.01 ? prev : calculatedZoom);
    handleZoomChangeHaptic(calculatedZoom);
  }, [handleZoomChangeHaptic]);
  const [isTransitioning3D, setIsTransitioning3D] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStage, setDownloadStage] = useState('');
  const accessibilityScale = useVantiStore((state) => state.accessibilityScale);
  const setAccessibilityScale = useVantiStore((state) => state.setAccessibilityScale);
  const isPrefetchingEnabled = useVantiStore((state) => state.isPrefetchingEnabled);
  const setIsPrefetchingEnabled = useVantiStore((state) => state.setIsPrefetchingEnabled);

  // Initialize Prefetch Engine
  usePrefetchEngine(map);

  // System Accessibility Detection
  useEffect(() => {
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleAccessibilityChange = () => {
      if (contrastQuery.matches) {
        addToast('High Contrast Mode Detected', 'info');
      }
    };

    contrastQuery.addEventListener('change', handleAccessibilityChange);
    return () => contrastQuery.removeEventListener('change', handleAccessibilityChange);
  }, [addToast]);

  const [activeHubTab, setActiveHubTab] = useState<'hub' | 'diary' | 'planner' | 'offline' | 'recommended' | 'events' | 'summary'>('hub');

  useEffect(() => {
    if (activeMode === 'planner' && activeHubTab !== 'planner') {
      setActiveHubTab('planner');
    } else if (activeMode === 'profile' && activeHubTab !== 'diary') {
      setActiveHubTab('diary');
    }
  }, [activeMode]);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [lastFlyoverId, setLastFlyoverId] = useState<string | null>(null);
  const [showSpeedometer, setShowSpeedometer] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);
  const [showTrendingPins, setShowTrendingPins] = useState(true);
  const [showActivityLayer, setShowActivityLayer] = useState(true);
  const [showSmartPlanner, setShowSmartPlanner] = useState(false);
  const [activeRouteInfo, setActiveRouteInfo] = useState<{distance: string, duration: string, durationMinutes: number} | null>(null);

  // Cinematic Flyover Logic
  const triggerFlyover = useCallback((place: any) => {
    if (is3DActive && map3dRef.current) {
        const m3d = map3dRef.current as any;
        m3d.flyCameraTo({
            endCamera: {
              center: { lat: place.lat, lng: place.lng, altitude: 400 },
              tilt: 65,
              heading: (mapHeading + (Math.random() > 0.5 ? 45 : -45)) % 360,
              range: 1000
            },
            durationMillis: 2500
        });
    } else if (map) {
        map.panTo({ lat: place.lat, lng: place.lng });
        map.setZoom(18);
    }
  }, [is3DActive, map, mapHeading]);

  // FLYTHROUGH MODE: Smooth transition sequence between scenic points
  useEffect(() => {
    let timeoutId: any;
    let active = true;
    
    if (activeMode === 'flythrough') {
      if (!is3DActive) {
        setIs3DActive(true); // Force 3D mode for better flythrough experience
      }
      
      const scenicPoints = [
        { lat: 48.8584, lng: 2.2945, name: 'Eiffel Tower' },
        { lat: 35.6586, lng: 139.7454, name: 'Tokyo Tower' },
        { lat: 40.6892, lng: -74.0445, name: 'Statue of Liberty' },
        { lat: -33.8568, lng: 151.2153, name: 'Sydney Opera House' },
        { lat: 51.5033, lng: -0.1196, name: 'London Eye' },
        { lat: 25.0973, lng: 55.1520, name: 'Palm Jumeirah' },
        { lat: -22.9519, lng: -43.2105, name: 'Christ the Redeemer' }
      ];
      
      let currentIndex = 0;
      
      const nextFlypoint = async () => {
        if (!active || activeMode !== 'flythrough') return;
        
        const pt = scenicPoints[currentIndex];
        
        if (map3dRef.current) {
          const m3d = map3dRef.current as any;
          // Easing-based transition
          m3d.flyCameraTo({
            endCamera: {
              center: { lat: pt.lat, lng: pt.lng, altitude: 500 },
              tilt: 60,
              heading: Math.random() * 360,
              range: 1200
            },
            durationMillis: 15000 // Very slow, cinematic
          });
        }
        
        currentIndex = (currentIndex + 1) % scenicPoints.length;
        
        // Schedule next transition well after this one ends, allowing a pause
        timeoutId = setTimeout(nextFlypoint, 22000);
      };
      
      // Start immediately
      nextFlypoint();
    }
    
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [activeMode, is3DActive]);


  // Automated theme switcher based on local time
  useEffect(() => {
    if (themeOverride !== 'Auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = (e?: MediaQueryListEvent | MediaQueryList) => {
      const isDark = e ? e.matches : mediaQuery.matches;
      setMapTheme(isDark ? 'Night' : 'Default');
    };

    updateTheme(mediaQuery);
    
    // Listen for changes in system preference
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [themeOverride]);

  // Handle manual theme override changes
  useEffect(() => {
    if (themeOverride === 'Light') {
      setMapTheme('Default');
    } else if (themeOverride === 'Dark') {
      setMapTheme('Night');
    }
    // 'Auto' is handled by the first effect
  }, [themeOverride]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Dynamic HUD background tint based on zoom: navy color (altitude zoom 12) -> charcoal (street zoom 19)
  const getDynamicHudBackground = () => {
    const minZoom = 12;
    const maxZoom = 19;
    const clampedZoom = Math.min(maxZoom, Math.max(minZoom, mapZoom));
    const fraction = (clampedZoom - minZoom) / (maxZoom - minZoom); // 0 (altitude) to 1 (street)

    // Dark Navy RGB at altitude: (6, 12, 34)
    // Sharp Charcoal RGB at street: (18, 20, 24)
    const r = Math.round(6 + (18 - 6) * fraction);
    const g = Math.round(12 + (20 - 12) * fraction);
    const b = Math.round(34 + (24 - 34) * fraction);

    return `rgba(${r}, ${g}, ${b}, 0.45)`;
  };

  // Telemetry Ping Updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPingLatency(Math.floor(35 + Math.random() * 12));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const MAP_STYLES = {
    'Default': [
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ opacity: 0.2 }] },
      { featureType: 'poi', elementType: 'labels.icon', stylers: [{ opacity: 0.2 }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ opacity: 0.2 }] }
    ],
    'Day': [
      { elementType: 'geometry', stylers: [{ color: '#ebe6dd' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#fcfcfc' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#aadaff' }] }
    ],
    'Dawn': [
      { elementType: 'geometry', stylers: [{ color: '#f5e8e4' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#fcfcfc' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#685966' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#fee7d1' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dcd1f3' }] }
    ],
    'Dusk': [
      { elementType: 'geometry', stylers: [{ color: '#382a47' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#271932' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#b9a5c4' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#4f3a61' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a1025' }] }
    ],
    'Night': [
      { elementType: 'geometry', stylers: [{ color: '#1a1c23' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1c23' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
      // DE-CLUTTER: Fade out standard POI labels to spotlight vanT partners
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }, { opacity: 0.15 }] },
      { featureType: 'poi', elementType: 'labels.icon', stylers: [{ opacity: 0.15 }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2b2e3a' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1c23' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c4151' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ opacity: 0.2 }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1117' }] }
    ],
    'Silver': [
      { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
      { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e9e9e9' }] }
    ],
    'Retro': [
      { elementType: 'geometry', stylers: [{ color: '#ebe3cd' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#523735' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1e6' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f1e6' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f8c967' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dfd2ae' }] }
    ],
    'Simulation': [
      { elementType: 'geometry', stylers: [{ color: '#000000' }] },
      { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#00ff41' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#003b00' }, { weight: 3 }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#008f11' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#001100' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#002200' }] }
    ],
    'Genie': [
      { elementType: 'geometry', stylers: [{ color: '#08081a' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#f0abfc' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e1065' }, { weight: 2 }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4c1d95' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1e1b4b' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#818cf8' }] },
      { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2e1065' }] }
    ],
    'Cosmic': [
      { elementType: 'geometry', stylers: [{ color: '#020617' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#064e3b' }] }
    ],
    'Neo-Tokyo': [
      { elementType: 'geometry', stylers: [{ color: '#130d1e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#ff00ff' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#00ffff' }, { weight: 1 }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ff00ff' }, { weight: 2 }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#001133' }] },
      { featureType: 'poi', elementType: 'labels.icon', stylers: [{ hue: '#ff00ff' }] }
    ],
    'Midnight': [
      { elementType: 'geometry', stylers: [{ color: '#020617' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#312e81' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] }
    ],
    'Sketch': [
      { elementType: 'geometry', stylers: [{ color: '#fafaf9' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }, { weight: 1 }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dcfce7' }] },
      { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#fafaf9' }] }
    ],
    'Minimalist': MINIMALIST_STYLE,
    'Terrain-Focused': TERRAIN_FOCUSED_STYLE,
    'High-Contrast': HIGH_CONTRAST_STYLE,
    'Auto-Sunny': [
      { elementType: 'geometry', stylers: [{ color: '#fbf8f1' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#886745' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#aee0fc' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e8f3e5' }] }
    ],
    'Auto-Rainy': [
      { elementType: 'geometry', stylers: [{ color: '#9baab3' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#314457' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#d0dae0' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#5f7b91' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#b9cad6' }] },
      { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#859a9e' }] }
    ],
    'Auto-Cloudy': [
      { elementType: 'geometry', stylers: [{ color: '#cbd4db' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#556573' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#f0f4f7' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#8aaac2' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f8fa' }] },
      { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#b9cacc' }] }
    ],
    'Night-Shift': [] // Handled via condition check for High-Contrast or Default depending on system time/light sensor
  };

  const getActiveMapStyle = () => {
    if (mapTheme === 'Night-Shift') {
      const now = new Date();
      const isNight = userLocation ? (() => {
        const times = SunCalc.getTimes(now, userLocation.lat, userLocation.lng);
        return now < times.sunrise || now > times.sunset;
      })() : false;
      const PrefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // If ambient light is extremely low (e.g., < 10 lux), snap to high-contrast dark style
      if (ambientLightLevel !== null && ambientLightLevel < 10) return MAP_STYLES['High-Contrast'];
      if (ambientLightLevel !== null && ambientLightLevel >= 10) return MAP_STYLES['Default'];
      // Fallback
      if (isNight || PrefersDark) return MAP_STYLES['High-Contrast'];
      return MAP_STYLES['Default'];
    }
    const themeKey = mapTheme === 'Default' ? timePhase.charAt(0).toUpperCase() + timePhase.slice(1) : mapTheme;
    return MAP_STYLES[themeKey as keyof typeof MAP_STYLES] || [];
  };

  const [agentMarkers, setAgentMarkers] = useState<any[]>([]);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, lat: number, lng: number } | null>(null);

  const handleMapCommand = (name: string, args: any) => {
    if (!map) return;
    
    switch(name) {
      case 'recenterMap':
        triggerHaptic('switch');
        setIsTransitioning3D(true);
        if (is3DActive) {
          map.panTo({ lat: args.lat, lng: args.lng });
          if (args.zoom) map.setZoom(args.zoom);
          if (args.tilt !== undefined) map.setTilt(args.tilt);
          else map.setTilt(55);
        } else {
          animateFlyTo(map, { lat: args.lat, lng: args.lng }, args.zoom || 16.5, args.tilt || 0, 35, 1200);
        }
        setTimeout(() => setIsTransitioning3D(false), 1200);
        break;
      case 'setWeather':
        triggerHaptic('tap');
        setActiveWeather(args.condition);
        break;
      case 'setFlightMode':
        triggerHaptic('mode3d');
        setIsFlightMode(args.active);
        if (args.active && map) {
            map.setTilt(65);
            map.setZoom(17);
        } else if (map) {
            map.setHeading(0);
        }
        break;
      case 'setMapMode':
        triggerHaptic('switch');
        if (args.mode === '3D' || args.mode === '2D') {
            const active = args.mode === '3D';
            setIs3DActive(active);
            if (map) {
              map.moveCamera({
                tilt: active ? 67.5 : 0,
                heading: (map.getHeading() || 0) + (active ? 25 : -25),
                zoom: Math.max(map.getZoom() || 17, active ? 17.5 : 15)
              });
            }
        } else if (args.mode === 'Terrain' || args.mode === 'Flat') {
            setIsTerrainActive(args.mode === 'Terrain');
        }
        break;
      case 'setMapStyle':
        setMapTheme(args.style);
        triggerHaptic('mode3d');
        setIsTransitioning3D(true);
        
        if (args.style === 'Genie') {
          map.setTilt(75);
          map.setHeading(map.getHeading() + 45);
        } else if (args.style === 'Simulation') {
          map.setTilt(45);
          map.setHeading(180);
        } else if (args.style === 'Cosmic') {
          map.setTilt(85);
          map.setZoom(map.getZoom() - 1);
        } else if (args.style === 'Neo-Tokyo') {
          map.setTilt(60);
          map.setHeading(-20);
        } else {
          map.setTilt(0);
          map.setHeading(0);
        }
        
        setTimeout(() => setIsTransitioning3D(false), 1200);
        break;
      case 'showPlaces':
        triggerHaptic('impact');
        setAgentMarkers(args.places);
        if (args.places.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            args.places.forEach((p: any) => bounds.extend({ lat: p.lat, lng: p.lng }));
            map.fitBounds(bounds, { top: 100, bottom: 100, left: 100, right: 100 });
        }
        break;
      case 'showRoute':
        // Implementation for showing route
        setQueryText(args.destination);
        handleSearch();
        break;
    }
  };

  const setTrendingDestinations = useVantiStore((state) => state.setTrendingDestinations);
  const trendingDestinations = useVantiStore((state) => state.trendingDestinations);

  // Fetch trending destinations based on time and weather
  useEffect(() => {
    if (!debouncedCenter || !isDiscoverMode) return;

    const fetchTrending = async () => {
      try {
        const localTime = new Date().toISOString();
        const res = await fetch('/api/trending-destinations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            localTime,
            weather: activeWeather,
            locationContext: debouncedCenter,
            searchHistory: user ? recentSearches.map(r => r.query) : localRecentSearches
          })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.trending) {
          setTrendingDestinations(data.trending);
        }
      } catch (err) {
        console.warn("Trending fetch failed:", err);
      }
    };

    fetchTrending();
  }, [debouncedCenter, activeWeather, user, recentSearches, localRecentSearches, setTrendingDestinations, isDiscoverMode]);

  useEffect(() => {
    if (activeMode === 'profile') {
      getOfflineAreas().then(setOfflineAreas).catch(console.error);
    }
  }, [activeMode]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('idle', () => {
      const center = map.getCenter()?.toJSON();
      if (center) {
        const b = map.getBounds();
        const bJSON = b ? {
          north: b.getNorthEast().lat(),
          south: b.getSouthWest().lat(),
          east: b.getNorthEast().lng(),
          west: b.getSouthWest().lng()
        } : null;
        setMapViewport({
          center,
          bounds: bJSON,
          zoom: map.getZoom() || 12
        });

        // Only trigger side effects that aren't handling internal map sync
        setPopularSearches([
          `Trending in ${Math.round(center.lat * 1000) / 1000}, ${Math.round(center.lng * 1000) / 1000}`,
          'Top rated nearby',
          'Hidden gems in viewport'
        ]);
      }
    });

    const clickListener = map.addListener('click', (event: any) => {
      if (event && event.placeId) {
        event.stop(); // Stops standard Google Maps popup card and external web redirect
        if (handlePoiClickRef.current) {
          handlePoiClickRef.current(event); // Natively opens details on this map
        }
      }
    });

    const contextListener = map.addListener('contextmenu', (event: any) => {
      if (event && event.latLng) {
        if (handleQuickSaveBookmarkRef.current) {
          handleQuickSaveBookmarkRef.current(event.latLng.lat(), event.latLng.lng());
        }
      }
    });

    return () => {
      listener.remove();
      clickListener.remove();
      contextListener.remove();
    };
  }, [map]);

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Sync / Load preferences from Firestore on login
  useEffect(() => {
    if (!user) return;
    const loadPreferences = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.units) setUnits(data.units);
          if (data.mapStyle) {
            setMapStyle(data.mapStyle);
            setMapType(data.mapStyle === 'satellite' ? 'satellite' : 'roadmap');
          }
          if (data.mapAesthetic) setMapAesthetic(data.mapAesthetic);
          if (data.language) setLanguage(data.language);
        }
      } catch (err) {
        console.warn("Could not load user's preferences from Firestore", err);
      }
    };
    loadPreferences();
  }, [user, setUnits, setMapStyle, setMapAesthetic, setLanguage]);

  // Listen to recent location searches for dynamically logged-in user
  useEffect(() => {
    if (!user) {
      setRecentSearches([]);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'recentSearches'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const rs: any[] = [];
      snapshot.forEach(doc => rs.push({ id: doc.id, ...doc.data() }));
      setRecentSearches(rs);
    }, (err) => {
      console.warn("Could not load recent searches", err);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSavedPlaces([]);
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'savedPlaces'), orderBy('savedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const sp: any[] = [];
      snapshot.forEach(doc => sp.push({ id: doc.id, ...doc.data() }));
      setSavedPlaces(sp);
    }, (err) => {
      console.warn("Could not load saved places", err);
    });
    return () => unsub();
  }, [user]);

  // Synchronize travel snapshots count & details for persistent custom visited pins
  useEffect(() => {
    if (!user) {
      setDiaryCount(0);
      setUserSnapshots([]);
      return;
    }
    const q = query(collection(db, 'travelSnapshots'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      let count = 0;
      const snaps: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === user.uid) {
          count++;
          snaps.push({ id: doc.id, ...data });
        }
      });
      setDiaryCount(count);
      setUserSnapshots(snaps);
    }, (err) => {
      console.warn("Could not load snapshots count & list", err);
    });
    return () => unsub();
  }, [user]);

  // Synchronize Trip Planner Itinerary with Firestore (Cloud Sync)
  const itinerary = useVantiStore((state) => state.itinerary);
  const setItinerary = useVantiStore((state) => state.setItinerary);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid, 'planner', 'active');
    
    // Remote -> Local sync (Subscribe to Cloud Changes)
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Prevent infinite sync loops by comparing stringified snapshots
        if (data.stops && JSON.stringify(data.stops) !== JSON.stringify(useVantiStore.getState().itinerary)) {
          setItinerary(data.stops);
        }
      }
    }, (err) => {
      console.warn("Could not sync planner from cloud", err);
    });

    return () => unsub();
  }, [user, setItinerary]);

  useEffect(() => {
    if (!user) return;
    
    const pushItinerary = async () => {
      const docRef = doc(db, 'users', user.uid, 'planner', 'active');
      try {
        await setDoc(docRef, {
          stops: itinerary,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to sync itinerary to cloud", err);
      }
    };

    const timeoutId = setTimeout(pushItinerary, 3000); // Debounced cloud push
    return () => clearTimeout(timeoutId);
  }, [user, itinerary]);

  // Request browser location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
        },
        (err) => console.log("Geolocation permission denied, using default center.")
      );
    }
  }, []);

  // Automated Geofencing Welcome Banner Evaluator
  useEffect(() => {
    if (userLocation) {
      const { lat, lng } = userLocation;
      const isSeoul = lat > 36.5 && lat < 38.5 && lng > 126.0 && lng < 128.0;
      const isCanada = lat > 40.0 && lat < 60.0 && lng > -140.0 && lng < -50.0;

      if (isSeoul) {
        setGeofenceWelcome('Seoul');
        setShowWelcomeBanner(true);
      } else if (isCanada) {
        setGeofenceWelcome('Canada');
        setShowWelcomeBanner(true);
      } else {
        setGeofenceWelcome(null);
        setShowWelcomeBanner(false);
      }
    }
  }, [userLocation]);

  // Explicit Map Lifecycle Cleanup
  useEffect(() => {
    return () => {
      console.log("[Vanti Map Lifecycle] Nullifying Google Map references and clearing clusterers...");
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current = null;
      }
      // Note: we don't nullify the map from @vis.gl as it handles its own unmount,
      // but we ensure all our custom references are released.
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(window);
      }
    };
  }, []);

  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const filteredMockPlaces = useMemo(() => {
    // Spatial Indexing / Virtualization Layer: Only process points within a generous buffer of the current viewport
    let rawList = SEOUL_MOCK_PLACES;
    if (activeCollection) {
      if (activeCollection === 'canada_working_holiday') {
        rawList = CANADA_MOCK_PLACES;
      } else {
        rawList = SEOUL_MOCK_PLACES.filter(p => 
          (activeCollection === 'night_vision' && (p.types?.includes('night') || p.mode === 'perks')) ||
          (activeCollection === 'dua_lipa_seoul' && (p.rating > 4.2 || p.matchScore > 90))
        );
      }
    }

    // Apply Viewport Virtualization
    if (mapViewport?.bounds) {
      const { north, south, east, west } = mapViewport.bounds;
      // Add a 20% spatial padding to prevent markers popping at edges
      const paddingLat = (north - south) * 0.2;
      const paddingLng = (east - west) * 0.2;
      
      rawList = rawList.filter(p => 
        p.lat >= (south - paddingLat) && 
        p.lat <= (north + paddingLat) && 
        p.lng >= (west - paddingLng) && 
        p.lng <= (east + paddingLng)
      );
    }

    // Apply Active Marker Category Filters
    if (!activeMarkerFilters.includes('all')) {
      rawList = rawList.filter(p => {
         const types = (p.types || []).map(t => t.toLowerCase());
         return activeMarkerFilters.some(filter => {
            if (filter === 'restaurant') return types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('cafe'));
            if (filter === 'landmark') return types.some(t => t.includes('landmark') || t.includes('museum') || t.includes('attraction'));
            if (filter === 'hotel') return types.some(t => t.includes('hotel') || t.includes('lodging') || t.includes('accommodation'));
            return false;
         });
      });
    }

    // Apply Travel Mood Filters
    if (travelMood !== 'normal') {
      rawList = rawList.filter(p => {
        const types = (p.types || []).map(t => t.toLowerCase());
        if (travelMood === 'adventure') return types.some(t => t.includes('park') || t.includes('nature') || t.includes('hiking') || t.includes('attraction'));
        if (travelMood === 'relaxation') return types.some(t => t.includes('cafe') || t.includes('spa') || t.includes('museum') || t.includes('library'));
        if (travelMood === 'culinary') return types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('bakery') || t.includes('bar'));
        return true;
      });
    }

    // Priority 2: Mode + Category Filter
    return rawList.filter(p => {
      const matchesMode = activeMode === 'all' || p.mode === activeMode;
      const matchesCategory = selectedCategory === 'All' || (p.types && p.types.some(t => t.toLowerCase() === selectedCategory.toLowerCase()));
      return matchesMode && matchesCategory;
    });
  }, [activeMode, selectedCategory, activeCollection, activeMarkerFilters, travelMood, mapViewport]);

  const filteredPlaces = useMemo(() => {
    let list = places;
    
    // Apply Viewport Virtualization
    if (mapViewport?.bounds) {
      const { north, south, east, west } = mapViewport.bounds;
      const paddingLat = (north - south) * 0.15;
      const paddingLng = (east - west) * 0.15;
      
      list = list.filter(p => {
        if (!p.location) return false;
        const lat = typeof (p.location as any).lat === 'function' ? (p.location as any).lat() : (p.location as any).lat;
        const lng = typeof (p.location as any).lng === 'function' ? (p.location as any).lng() : (p.location as any).lng;
        
        return lat >= (south - paddingLat) && 
               lat <= (north + paddingLat) && 
               lng >= (west - paddingLng) && 
               lng <= (east + paddingLng);
      });
    }

    list = list.filter(place => matchesCategoryFilter(place.types, selectedCategory));

    // Apply Active Marker Category Filters
    if (!activeMarkerFilters.includes('all')) {
      list = list.filter(place => {
         const types = (place.types || []).map(t => t.toLowerCase());
         return activeMarkerFilters.some(filter => {
            if (filter === 'restaurant') return types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('cafe'));
            if (filter === 'landmark') return types.some(t => t.includes('landmark') || t.includes('museum') || t.includes('attraction'));
            if (filter === 'hotel') return types.some(t => t.includes('hotel') || t.includes('lodging') || t.includes('accommodation'));
            return false;
         });
      });
    }

    // Apply Travel Mood Filters
    if (travelMood !== 'normal') {
      list = list.filter(p => {
        const types = (p.types || []).map(t => t.toLowerCase());
        if (travelMood === 'adventure') return types.some(t => t.includes('park') || t.includes('nature') || t.includes('hiking') || t.includes('attraction'));
        if (travelMood === 'relaxation') return types.some(t => t.includes('cafe') || t.includes('spa') || t.includes('museum') || t.includes('library'));
        if (travelMood === 'culinary') return types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('bakery') || t.includes('bar'));
        return true;
      });
    }

    if (travelMood !== 'normal') {
      list = list.filter(p => {
        const types = (p.types || []).map(t => t.toLowerCase());
        if (travelMood === 'adventure') return types.some(t => t.includes('park') || t.includes('nature') || t.includes('hiking') || t.includes('attraction'));
        if (travelMood === 'relaxation') return types.some(t => t.includes('cafe') || t.includes('spa') || t.includes('museum') || t.includes('library'));
        if (travelMood === 'culinary') return types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('bakery') || t.includes('bar'));
        return true;
      });
    }

    if (searchFilter === 'nearby') {
      const origin = userLocation || DEFAULT_CENTER;
      list = list.filter(place => {
        const pLoc = place.location as any;
        const lat = typeof pLoc?.lat === 'function' ? pLoc.lat() : (pLoc?.lat || 0);
        const lng = typeof pLoc?.lng === 'function' ? pLoc.lng() : (pLoc?.lng || 0);
        if (!lat || !lng) return false;
        
        // Haversine distance
        const dLat = ((Number(lat) - origin.lat) * Math.PI) / 180;
        const dLng = ((Number(lng) - origin.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((origin.lat * Math.PI) / 180) *
            Math.cos((Number(lat) * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = 6371000 * c;
        return dist < 3000; // 3km threshold
      });
    } else if (searchFilter === 'high_rated') {
      list = list.filter(place => (place.rating || 0) >= 4.5);
    } else if (searchFilter === 'open_now') {
      list = list.filter(place => {
        if (!place.regularOpeningHours) return true;
        const roh = place.regularOpeningHours as any;
        if (typeof roh.isOpen === 'function') {
          return roh.isOpen();
        }
        return true;
      });
    }

    return list;
  }, [places, selectedCategory, searchFilter, userLocation, activeMarkerFilters, travelMood]);

  // Fetch Suggestions
  const handleInputChange = async (value: string) => {
    setQueryText(value);
    if (!placesLib) return;

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!sessionToken) {
      setSessionToken(new placesLib.AutocompleteSessionToken());
    }

    setIsLoadingSuggestions(true);
    setShowSuggestions(true);

    try {
      const { suggestions: resultSuggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value,
        sessionToken: sessionToken || undefined,
        locationBias: map?.getCenter() || userLocation || DEFAULT_CENTER,
      });
      setSuggestions(resultSuggestions);
    } catch (err) {
      console.error("Autocomplete failed:", err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!suggestion.placePrediction) return;
    
    triggerHaptic('switch');
    setQueryText(suggestion.placePrediction.text.text);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearching(true);

    saveSearchQuery(suggestion.placePrediction.text.text);

    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'photos', 'rating', 'userRatingCount', 'types', 'regularOpeningHours']
      });
      
      // Reset session after a selection
      setSessionToken(new (placesLib as any).AutocompleteSessionToken());
      
      handlePlaceClick(place);
    } catch (err) {
      console.error("Failed to load place details:", err);
    } finally {
      setIsSearching(false);
    }
  };



  const handlePoiClick = async (event: any) => {
    if (!event) return;
    if (typeof event.stop === 'function') {
      event.stop();
    } else if (event.domEvent && typeof event.domEvent.preventDefault === 'function') {
      event.domEvent.preventDefault();
    }
    
    const placeId = event.detail?.placeId || event.placeId;
    if (!placeId || !placesLib) return;

    triggerHaptic('switch');
    setIsSearching(true);
    
    try {
      const place = new placesLib.Place({ id: placeId });
      await place.fetchFields({
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'photos', 'rating', 'userRatingCount', 'types', 'regularOpeningHours']
      });
      handlePlaceClick(place);
    } catch (err) {
      console.error("Failed to load POI details:", err);
    } finally {
      setIsSearching(false);
    }
  };
  
  handlePoiClickRef.current = handlePoiClick;
  handleQuickSaveBookmarkRef.current = handleQuickSaveBookmark;

  const clearSearch = () => {
    triggerHaptic('close');
    setQueryText('');
    setPlaces([]);
    setSelectedPlace(null);
    setShowList(false);
    setShowingSaved(false);
  };

  const handleShowRoute = (place: any) => {
    triggerHaptic('switch');
    if (!map) return;
    
    const lat = typeof place.location?.lat === 'function' ? place.location.lat() : (place.location?.lat || place.lat);
    const lng = typeof place.location?.lng === 'function' ? place.location.lng() : (place.location?.lng || place.lng);
    
    if (!lat || !lng) return;

    if (userLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation);
      bounds.extend({ lat, lng });
      map.fitBounds(bounds, 100);
    } else {
      map.moveCamera({
        center: { lat, lng },
        zoom: 17,
        tilt: (map.getMapTypeId() === 'satellite' || map.getMapTypeId() === 'hybrid') ? 0 : 45
      });
    }
  };

  const filterDispatch = useCallback(
    (mode: VantiMode, category: string, collection: string | null = null, extraAction?: () => void) => {
      triggerHaptic('switch');
      setActiveMode(mode);
      setSelectedCategory(category);
      setActiveCollection(collection);
      setSelectedPlace(null);
      if (extraAction) extraAction();
    },
    [setActiveMode, setSelectedCategory, setActiveCollection, setSelectedPlace, triggerHaptic]
  );

  const handlePlaceClick = useCallback(async (place: any) => {
    // [ZERO-BUG CAMERA LOCK]: Prevent jumping to origin or forced centering
    triggerHaptic('tap');
    
    let finalPlace = place;
    const placeId = place.id || place.placeId;
    if (placeId && !place.fetchFields && placesLib && !place.isMock && !place.isVisitedJournal) {
      try {
        const fullPlace = new placesLib.Place({ id: placeId });
        await fullPlace.fetchFields({
          fields: ['id', 'displayName', 'location', 'formattedAddress', 'photos', 'rating', 'userRatingCount', 'types', 'regularOpeningHours']
        });
        finalPlace = fullPlace;
      } catch (err) {
        console.warn("Failed to enrich place details via Places API, falling back to original", err);
      }
    }

    setSelectedPlace(finalPlace);
    setShowList(true);

    // Track analytics for Travel Insights
    if (finalPlace) {
      const landmarkTypes = ['landmark', 'tourist_attraction', 'museum', 'monument', 'point_of_interest'];
      const pTypes = finalPlace.types || [];
      if (pTypes.some((t: string) => landmarkTypes.includes(t))) {
        addVisitedLandmark();
        triggerHaptic('success');
      }
      if (currentWeatherData?.weather?.[0]?.main) {
        recordWeatherPreference(currentWeatherData.weather[0].main);
      }
    }
    
    // Extract coordinates robustly from various Place object formats
    const lat = typeof finalPlace.location?.lat === 'function' ? finalPlace.location.lat() : (finalPlace.location?.lat || finalPlace.lat);
    const lng = typeof finalPlace.location?.lng === 'function' ? finalPlace.location.lng() : (finalPlace.location?.lng || finalPlace.lng);
    
    if (!lat || !lng) return;
    const targetLoc = { lat, lng };

    if (map && geometryLib) {
      const currentCenter = map.getCenter();
      if (currentCenter) {
        const dist = google.maps.geometry.spherical.computeDistanceBetween(currentCenter, targetLoc);
        const bounds = map.getBounds();
        const isInView = bounds?.contains(targetLoc);

        // [ZERO-BUG CAMERA LOCK]: Only move camera if point is out of view or too far for context
        if (!isInView || dist > 800) {
          if (is3DActive && map3dRef.current) {
            // Photorealistic 3D Cinematic Fly-to with isometric projection params
            const isHighRated = (finalPlace.rating > 4.5) || (finalPlace.matchScore && finalPlace.matchScore > 95);
            const m3d = map3dRef.current as any;
            m3d.flyCameraTo({
              endCamera: {
                center: { lat: targetLoc.lat, lng: targetLoc.lng, altitude: isHighRated ? 150 : 0 },
                tilt: isHighRated ? 75 : 65,
                range: isHighRated ? 400 : 650,
                heading: (mapHeading || 0) + (isHighRated ? 90 : 45)
              },
              durationMillis: isHighRated ? 3500 : 2200
            });
          } else {
            // Smooth Vector Map Camera Movement with cinematic fly-to effect
            animateFlyTo(map, targetLoc, 18.8, 67.5, 35, 1400);
          }
        }
      }
    }
    
    // Sync state for UI context
    setMapCenter(targetLoc);
  }, [map, geometryLib, is3DActive, setSelectedPlace, setShowList, mapHeading, placesLib]);

  // Handle Search using Google Places API
  const handleSearch = async (text?: string) => {
    const searchText = text || queryText;
    if (!placesLib || !searchText.trim()) return;
    
    setIsSearching(true);
    setShowingSaved(false);
    setSelectedPlace(null);
    try {
      const { places: resultPlaces } = await placesLib.Place.searchByText({
        textQuery: searchText,
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'types', 'photos', 'regularOpeningHours'],
        locationBias: map?.getCenter() || userLocation || DEFAULT_CENTER,
        maxResultCount: 15,
      });
      
      setPlaces(resultPlaces);
      
      // Save search query to history
      saveSearchQuery(searchText);
      
      if (resultPlaces.length > 0) {
        // Automatically navigate to the first relevant result for instant feedback
        handlePlaceClick(resultPlaces[0]);
        setShowList(true);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadArea = async () => {
    if (!map) return;
    triggerHaptic('tap');
    setIsDownloading(true);
    setDownloadSuccess(false);
    setDownloadProgress(0);
    setDownloadStage('Initializing boundary cache...');
    
    try {
      const bounds = map.getBounds();
      if (!bounds) throw new Error('Bounds not loaded');
      
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const stages = [
        { progress: 15, msg: 'Fencing coordinate nodes...' },
        { progress: 35, msg: 'Rasterizing viewport matrix grids...' },
        { progress: 60, msg: 'Indexing POI place metadata cache...' },
        { progress: 85, msg: 'Re-routing ambient traffic overlay maps...' },
        { progress: 95, msg: 'Writing payload to IndexedDB database store...' }
      ];

      for (const step of stages) {
        await new Promise(resolve => setTimeout(resolve, 350));
        setDownloadProgress(step.progress);
        setDownloadStage(step.msg);
      }
      
      await saveOfflineArea({
        id: `area-${Date.now()}`,
        bounds: {
          north: ne.lat(),
          east: ne.lng(),
          south: sw.lat(),
          west: sw.lng()
        },
        name: `Downloaded Area - ${new Date().toLocaleDateString()}`,
        savedAt: Date.now(),
        places: places // Cache current visible POIs/results
      });
      
      setDownloadProgress(100);
      setDownloadStage('Offline synchronization complete.');
      setDownloadSuccess(true);
      triggerHaptic('save');
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to save area:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const triggerFlyoverSimulation = async () => {
    setGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    try {
      const currentCenter = map?.getCenter()?.toJSON() || DEFAULT_CENTER;
      const prompt = `A cinematic high altitude drone flyover of latitude ${currentCenter.lat} longitude ${currentCenter.lng} with glowing magenta grid elements, VANTi tech theme, hyperlapse, majestic lighting`;
      
      const videoReq = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const { operationName } = await videoReq.json();
      
      if (!operationName) {
         setGeneratingVideo(false);
         alert("Could not start flyover generation.");
         return;
      }

      // Track generation
      const interval = setInterval(async () => {
        try {
          const statusReq = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName })
          });
          const { done } = await statusReq.json();
          if (done) {
            clearInterval(interval);
            setGeneratedVideoUrl(`/api/video-download?op=${encodeURIComponent(operationName)}`);
            setGeneratingVideo(false);
          }
        } catch (err) {
          console.error("Polling video failed:", err);
        }
      }, 8000);
    } catch (e) {
      console.error(e);
      setGeneratingVideo(false);
    }
  };

  const [isRecentering, setIsRecentering] = useState(false);

  const triggerRecenter = () => {
    if (map && userLocation) {
      setIsRecentering(true);
      // Modern smooth camera movement
      map.moveCamera({
        center: userLocation,
        zoom: 16,
        tilt: is3DActive ? 67.5 : 0,
        // Heading is maintained unless you want to reset it
      });
      setTimeout(() => setIsRecentering(false), 600);
    }
  };

  // Get active color system for mode transitions
  const getModeStyles = (mode: VantiMode) => {
    switch(mode) {
      case 'social':
        return {
          accent: 'text-rose-500',
          bgAccent: 'bg-rose-500',
          gradient: 'from-rose-500 to-pink-600',
          glow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]',
          border: 'border-rose-500/30'
        };
      case 'genius':
        return {
          accent: 'text-amber-500',
          bgAccent: 'bg-amber-500',
          gradient: 'from-amber-400 to-amber-600',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
          border: 'border-amber-500/30'
        };
      case 'perks':
        return {
          accent: 'text-emerald-500',
          bgAccent: 'bg-emerald-500',
          gradient: 'from-emerald-400 to-teal-600',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
          border: 'border-emerald-500/30'
        };
      case 'profile':
        return {
          accent: 'text-violet-500',
          bgAccent: 'bg-violet-500',
          gradient: 'from-violet-500 to-indigo-600',
          glow: 'shadow-[0_0_15px_rgba(139,92,246,0.4)]',
          border: 'border-violet-500/30'
        };

      default:
        return {
          accent: 'text-blue-500',
          bgAccent: 'bg-blue-500',
          gradient: 'from-blue-500 to-cyan-600',
          glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
          border: 'border-blue-500/30'
        };
    }
  };

  const modeStyles = getModeStyles(activeMode);
  const dynamicScale = Math.max(0.7, Math.min(1.4, 1 + (mapZoom - 14) * 0.15));

  const getMarkerStyles = (theme: 'minimalist' | 'glow' | 'classic', isSelected: boolean, mode?: string) => {
    switch (theme) {
        case 'minimalist':
            return cn(
                "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border border-white/20 bg-slate-900/80 backdrop-blur-sm",
                isSelected ? "border-white/80" : "hover:border-white/40"
            );
        case 'glow':
            return cn(
                "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.6)] border border-rose-500/50 bg-slate-950",
                isSelected ? "border-rose-400" : "hover:shadow-[0_0_20px_rgba(244,63,94,0.8)]"
            );
        case 'classic': default:
            return cn(
                "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white bg-rose-500 shadow-lg",
                isSelected ? "shadow-xl border-rose-200" : "hover:shadow-xl"
            );
    }
  };

  useEffect(() => {
    if (isFlightMode && map) {
      const interval = setInterval(() => {
        setMapHeading(prev => (prev + 0.1) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isFlightMode, map]);

  // Maintain a MarkerClusterer ref to prevent memory leaks and duplicated nodes
  const markerClustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;

    // Safely instantiate MarkerClusterer if not already existing
    if (!markerClustererRef.current) {
      try {
        markerClustererRef.current = new MarkerClusterer({
          map,
          markers: [],
        });
      } catch (err) {
        console.warn('MarkerClusterer initialization shield:', err);
      }
    }

    // Explicit cleanup before re-clustering on state changes
    return () => {
      if (markerClustererRef.current) {
        try {
          markerClustererRef.current.clearMarkers();
        } catch (err) {
          console.warn('MarkerClusterer explicit cleanup of nodes:', err);
        }
      }
    };
  }, [map, mapZoom, mapCenter, mapBounds, isPowerEfficiencyEnabled]);

  // Marker Clustering System for viewport clarity when zoomed out
  const clusteredMockPlaces = useMemo(() => {
    return processSpatialGrid(
      filteredMockPlaces,
      mapZoom,
      mapCenter,
      mapBounds,
      isPowerEfficiencyEnabled
    );
  }, [filteredMockPlaces, mapZoom, mapCenter, mapBounds, isPowerEfficiencyEnabled]);

  // Normalize search places for spatial calculations
  const normalizedSearchPlaces = useMemo(() => {
    return filteredPlaces.map(place => {
      const pLoc = place.location as any;
      const lat = typeof pLoc?.lat === 'function' ? pLoc.lat() : (pLoc?.lat || 0);
      const lng = typeof pLoc?.lng === 'function' ? pLoc.lng() : (pLoc?.lng || 0);
      return {
        ...place,
        id: place.id,
        lat: Number(lat),
        lng: Number(lng)
      };
    }).filter(p => p.lat !== 0 && p.lng !== 0);
  }, [filteredPlaces]);

  // High performance spatial grid clustering for search places
  const clusteredSearchPlaces = useMemo(() => {
    return processSpatialGrid(
      normalizedSearchPlaces,
      mapZoom,
      mapCenter,
      mapBounds,
      isPowerEfficiencyEnabled
    );
  }, [normalizedSearchPlaces, mapZoom, mapCenter, mapBounds, isPowerEfficiencyEnabled]);

  // Normalize saved places from Firestore for spatial clustering calculations
  const normalizedSavedPlaces = useMemo(() => {
    return savedPlaces
      .map((savedDoc, idx) => {
        const pinLat = Number(savedDoc.lat);
        const pinLng = Number(savedDoc.lng);
        
        // Dynamic status logic (simulated for current UX)
        let status = undefined;
        if (idx % 5 === 0) status = { type: 'closing' as const, label: 'Closing Soon', timeLeft: '10m' };
        else if (idx % 8 === 0) status = { type: 'event' as const, label: 'Live Show', timeLeft: '19:30' };

        return {
          ...savedDoc,
          id: savedDoc.id || savedDoc.placeId || Math.random().toString(),
          lat: isNaN(pinLat) ? 0 : pinLat,
          lng: isNaN(pinLng) ? 0 : pinLng,
          displayName: savedDoc.displayName || savedDoc.name || 'Saved Location',
          status
        };
      })
      .filter(p => {
        if (p.lat === 0 || p.lng === 0) return false;
        
        if (activeFilter === 'all') return true;
        if (activeFilter === 'recent') {
          return true; // Simplified
        }
        if (activeFilter === 'budget') {
          return (p.priceLevel && p.priceLevel <= 1) || p.types?.includes('park') || p.types?.includes('museum');
        }
        if (activeFilter === 'landmarks') return false;
        return true;
      });
  }, [savedPlaces, activeFilter]);

  const moodFilter = useVantiStore((state) => state.moodFilter);

  // Derive filtered landmarks based on mood
  const moodFilteredLandmarks = useMemo(() => {
    if (!moodFilter) return viewportLandmarks;
    return viewportLandmarks.filter(m => {
      const types = m.types || [];
      const typesStr = types.join(' ').toLowerCase();
      if (moodFilter === 'Energizing') {
        return typesStr.includes('gym') || typesStr.includes('cafe') || typesStr.includes('night_club') || typesStr.includes('amusement');
      } else if (moodFilter === 'Peaceful') {
        return typesStr.includes('park') || typesStr.includes('spa') || typesStr.includes('library') || typesStr.includes('museum') || typesStr.includes('art');
      } else if (moodFilter === 'Social') {
        return typesStr.includes('bar') || typesStr.includes('restaurant') || typesStr.includes('cafe') || typesStr.includes('event');
      }
      return true;
    });
  }, [viewportLandmarks, moodFilter]);

  const filteredLandmarks = (activeFilter === 'all' || activeFilter === 'landmarks') ? moodFilteredLandmarks : [];

  // High performance spatial grid clustering for saved places
  const clusteredSavedPlaces = useMemo(() => {
    return processSpatialGrid(
      normalizedSavedPlaces,
      mapZoom,
      mapCenter,
      mapBounds,
      isPowerEfficiencyEnabled
    );
  }, [normalizedSavedPlaces, mapZoom, mapCenter, mapBounds, isPowerEfficiencyEnabled]);

  const realTimePeers = useSocialLocation(activeMode === 'social');

  // Viewport-bounds clipping for active friends list to improve visual density & DOM performance
  const visibleFriends = useMemo(() => {
    // Merge baseline mock friends with live Firestore synchronized peers
    const allPeers: UserFriend[] = [...MOCK_FRIENDS, ...realTimePeers.map(p => ({
      id: p.uid,
      name: p.displayName,
      avatar: p.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`,
      lat: p.lat,
      lng: p.lng,
      activeLocation: 'Live Session',
      lastActive: 'Just now',
    }))];

    return allPeers.filter(friend => {
      let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
      const hasValidBounds = mapBounds && typeof mapBounds.contains === 'function';
      if (!hasValidBounds) {
        const latSpan = 180 / Math.pow(2, Math.max(1, mapZoom - 2));
        const lngSpan = 360 / Math.pow(2, Math.max(1, mapZoom - 2));
        minLat = mapCenter.lat - latSpan;
        maxLat = mapCenter.lat + latSpan;
        minLng = mapCenter.lng - lngSpan;
        maxLng = mapCenter.lng + lngSpan;
      } else {
        try {
          return mapBounds.contains({ lat: friend.lat, lng: friend.lng });
        } catch (e) {}
      }
      return friend.lat >= minLat && friend.lat <= maxLat && friend.lng >= minLng && friend.lng <= maxLng;
    });
  }, [MOCK_FRIENDS, realTimePeers, mapBounds, mapZoom, mapCenter]);

  // Viewport-bounds clipping for agent markers
  const visibleAgentMarkers = useMemo(() => {
    return agentMarkers.filter(m => {
      let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
      const hasValidBounds = mapBounds && typeof mapBounds.contains === 'function';
      if (!hasValidBounds) {
        const latSpan = 180 / Math.pow(2, Math.max(1, mapZoom - 2));
        const lngSpan = 360 / Math.pow(2, Math.max(1, mapZoom - 2));
        minLat = mapCenter.lat - latSpan;
        maxLat = mapCenter.lat + latSpan;
        minLng = mapCenter.lng - lngSpan;
        maxLng = mapCenter.lng + lngSpan;
      } else {
        try {
          return mapBounds.contains({ lat: m.lat, lng: m.lng });
        } catch (e) {}
      }
      return m.lat >= minLat && m.lat <= maxLat && m.lng >= minLng && m.lng <= maxLng;
    });
  }, [agentMarkers, mapBounds, mapZoom, mapCenter]);

  const throttledHandleCameraChange = useMemo(
    () => throttle((e: any) => {
      setIsMapTilesLoading(true);
      const newCenter = e.detail.center;
      
      // Calculate active map panning velocity
      const now = Date.now();
      const dt = now - lastCameraChangeTimeRef.current;
      if (lastCameraCenterRef.current && dt > 0) {
        const dLat = newCenter.lat - lastCameraCenterRef.current.lat;
        const dLng = newCenter.lng - lastCameraCenterRef.current.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        const velocity = dist / dt; // deg/ms
        
        if (velocity > 0.00018) {
          setIsLODMoving(true);
          // Zero haptic noise - only a single crisp tick on rapid pan trigger
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(2); } catch (err) {}
          }
          clearTimeout(lodTimeoutRef.current);
          lodTimeoutRef.current = setTimeout(() => {
            setIsLODMoving(false);
          }, 450); // Fluid ease out transition delay
        }
      }
      lastCameraChangeTimeRef.current = now;
      lastCameraCenterRef.current = newCenter;

      setMapCenter(prev => {
        if (Math.abs(prev.lat - newCenter.lat) < 1e-7 && Math.abs(prev.lng - newCenter.lng) < 1e-7) return prev;
        return newCenter;
      });
      setMapZoom(prev => Math.abs(prev - e.detail.zoom) < 0.001 ? prev : e.detail.zoom);
      setMapTilt(prev => prev === e.detail.tilt ? prev : e.detail.tilt);
      setMapHeading(prev => prev === e.detail.heading ? prev : e.detail.heading);
      handleZoomChangeHaptic(e.detail.zoom);
      if (map) {
        try {
          const newBounds = map.getBounds() || null;
          setMapBounds(prev => (prev && newBounds && prev.equals(newBounds)) ? prev : newBounds);
        } catch (err) {
          console.warn(err);
        }
      }
    }, 200),
    [map, handleZoomChangeHaptic]
  );

  useEffect(() => {
    return () => throttledHandleCameraChange.cancel();
  }, [throttledHandleCameraChange]);


  return (
    <div 
      className="relative w-full bg-[#0a0c10] overflow-hidden select-none text-slate-100 font-sans"
      style={{ 
        fontSize: `${16 * accessibilityScale}px`,
        height: 'calc(var(--vh, 1vh) * 100)',
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        width: '100%'
      } as React.CSSProperties}
    >
      <OnboardingTour />
       {/* Toast Notification Engine */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full max-w-sm z-[1000] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={cn(
                "px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-3xl border flex items-center gap-3 pointer-events-auto",
                toast.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white" :
                toast.type === 'error' ? "bg-rose-500/90 border-rose-400 text-white" :
                "bg-[#0f1117]/95 border-white/10 text-white"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em]">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Travel Analytics Drawer */}
      <TravelHistoryDrawer 
        isOpen={showTravelInsights}
        onClose={() => setShowTravelInsights(false)}
        stats={{
          totalDistance: 12450,
          countriesVisited: 8,
          citiesVisited: 24,
          topDestinations: [
            { name: 'Seoul', visits: 12, color: '#f43f5e' },
            { name: 'Vancouver', visits: 8, color: '#3b82f6' },
            { name: 'Tokyo', visits: 5, color: '#f59e0b' },
            { name: 'Berlin', visits: 3, color: '#10b981' }
          ]
        }}
      />

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed z-[300] w-64 bg-[#0f1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="px-3 py-2 mb-1 border-b border-white/5">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Map Interactions</span>
              <div className="text-[10px] text-white/40 font-mono mt-0.5 truncate">
                {contextMenu.lat.toFixed(5)}, {contextMenu.lng.toFixed(5)}
              </div>
            </div>
            
            <button 
              onClick={() => {
                addToItinerary({ 
                  id: `context-${Date.now()}`, 
                  displayName: 'Custom Stop', 
                  lat: contextMenu.lat, 
                  lng: contextMenu.lng,
                  types: ['point_of_interest'] 
                });
                addToast("Added to itinerary", "success");
                setContextMenu(null);
                triggerHaptic('tap');
              }}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Add to Itinerary</span>
            </button>

            <button 
              onClick={() => {
                setBookmarkingLat(contextMenu.lat);
                setBookmarkingLng(contextMenu.lng);
                setBookmarkingName('Saved Spot');
                addToast("Prepared bookmark", "info");
                setContextMenu(null);
                triggerHaptic('tap');
              }}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Star className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Save to Bookmarks</span>
            </button>

            <button 
              onClick={() => {
                setMapCenter({ lat: contextMenu.lat, lng: contextMenu.lng });
                setMapZoom(17);
                addToast("Recalibrating view...", "info");
                setContextMenu(null);
                triggerHaptic('impact');
              }}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">View Nearby Info</span>
            </button>

            <div className="h-px bg-white/5 my-1" />
            
            <button 
              onClick={() => setContextMenu(null)}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-left text-slate-500"
            >
              <X className="w-3.5 h-3.5 translate-x-1" />
              <span className="text-[10px] font-black uppercase tracking-widest pl-1">Dismiss</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSmartPlanner && (
          <SmartPlanner 
            bookmarks={savedPlaces} 
            travelHistory={userSnapshots}
            onClose={() => setShowSmartPlanner(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeRouteInfo && (
          <FinancialTelemetry routeInfo={activeRouteInfo} />
        )}
      </AnimatePresence>
      
      <motion.div
        animate={
          isTransitioningStyle 
            ? { scale: 0.98, filter: 'blur(0px)', opacity: 0.7 }
            : isTransitioning3D || isRecentering 
            ? { scale: 1.02, filter: 'blur(0px)', opacity: 0.9 } 
            : { scale: 1, filter: 'blur(0px)', opacity: 1 }
        }
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute inset-0 w-full h-full"
        style={{ height: '100%', width: '100%', top: 0, left: 0 }}
      >
      <div 
        className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out"
        style={{ filter: getAestheticFilter(mapAesthetic) }}
      >
      {is3DActive ? (
        <>
        <MapRadialMenu 
          isOpen={!!radialMenu?.isOpen}
          position={radialMenu?.position || { x: 0, y: 0 }}
          placeName={radialMenu?.place?.displayName || radialMenu?.place?.name}
          onClose={() => setRadialMenu(null)}
          onAction={(action) => {
            console.log(`Action ${action} triggered for ${radialMenu?.place?.name}`);
            if (action === 'save' && radialMenu?.place) {
              // TODO: Implement save location
              triggerHaptic('success');
            } else if (action === 'directions' && radialMenu?.place) {
              // TODO: Implement get directions
              triggerHaptic('success');
            } else if (action === 'share' && radialMenu?.place) {
              // TODO: Implement share
              triggerHaptic('success');
            }
          }}
        />

        <MapErrorBoundary>
          <Map3D
            ref={map3dRef}
          defaultCenter={{ ...mapCenter, altitude: 0 }}
          defaultHeading={mapHeading}
          defaultTilt={mapTilt}
          defaultRange={Math.pow(2, 21 - mapZoom) * 150} 
          mode={MapMode.SATELLITE}
          gestureHandling={GestureHandling.GREEDY}
          maxTilt={90}
          minTilt={0}
          onCameraChanged={handleMap3DCameraChange}
          className="absolute inset-0 w-full h-full"
          {...{
            // Injecting specific 3D terrain and shadow simulation properties
            lightingMode: isBatterySaverEnabled ? 'FLAT' : 'DYNAMIC',
            daylightSimulation: !isBatterySaverEnabled
          } as any}
        >
          {/* Immersive 3D Terrain & Dynamic Shadows (Mocked via Lighting Simulation) */}
          <div className="hidden" data-shadow-intensity="dynamic" data-local-time={new Date().toLocaleTimeString()} />
          
          {filteredMockPlaces.map(p => (
            <Marker3D 
              key={`3d-mock-${p.id}`} 
              position={{ lat: p.lat, lng: p.lng, altitude: 0 }} 
              label={`${p.displayName} (${p.matchScore}% Match)`} 
              onClick={() => handlePlaceClick(p)}
              {...({
                onContextMenu: (e: any) => {
                  e.preventDefault();
                  handleMarkerLongPress(e, p);
                }
              } as any)}
            />
          ))}
          {agentMarkers.map((p, idx) => (
            <Marker3D 
              key={`3d-agent-${idx}`} 
              position={{ lat: p.lat, lng: p.lng, altitude: 0 }} 
              label={p.name} 
              onClick={() => handlePlaceClick({
                 id: `agent-${idx}`,
                 displayName: p.name,
                 formattedAddress: p.description,
                 lat: p.lat,
                 lng: p.lng,
                 types: [p.type || 'point_of_interest']
              })}
            />
          ))}
          {userLocation && (
            <Marker3D 
              position={{ ...userLocation, altitude: 20 }} 
              label="YOU" 
            />
          )}
        </Map3D>
       </MapErrorBoundary>
       </>
      ) : (
        <>
        <MapRadialMenu 
          isOpen={!!radialMenu?.isOpen}
          position={radialMenu?.position || { x: 0, y: 0 }}
          placeName={radialMenu?.place?.displayName || radialMenu?.place?.name}
          onClose={() => setRadialMenu(null)}
          onAction={(action) => {
            if (action === 'itinerary' && radialMenu?.place) {
              addToItinerary(radialMenu.place);
              triggerHaptic('success');
            }
          }}
        />

        <MapErrorBoundary>
          <Map
            {...longPressHandlers}
            defaultCenter={mapCenter}
          defaultZoom={mapZoom}
          defaultTilt={(['satellite', 'hybrid'].includes(mapType)) ? 0 : mapTilt}
          defaultHeading={mapHeading}
          mapId={MAP_ID}
          renderingType="VECTOR"
          colorScheme={['Night', 'Simulation', 'Genie', 'Cosmic', 'Neo-Tokyo', 'Midnight', 'High-Contrast'].includes(mapTheme) ? "DARK" : "LIGHT"}
          mapTypeId={isTerrainActive ? 'terrain' : mapType}
          disableDefaultUI={true}
          gestureHandling="greedy"
          tiltInteractionEnabled={!perspectiveLock}
          headingInteractionEnabled={!perspectiveLock}
          onCameraChanged={throttledHandleCameraChange}
          onDragStart={() => {
            setIsMapDragging(true);
            triggerHaptic('tap');
          }}
          onDragEnd={() => {
            setIsMapDragging(false);
            triggerHaptic('switch');
          }}
          onTilesloaded={() => setIsMapTilesLoading(false)}
          onIdle={() => {
            setIsMapTilesLoading(false);
            setIsMapDragging(false);
          }}
          onClick={() => setContextMenu(null)}
          onContextmenu={(e: any) => {
            const latLng = e.detail.latLng;
            // Use e.domEvent if available, or try to find it on the event object
            const domEvent = e.domEvent || e.detail.domEvent;
            if (latLng && domEvent) {
              setContextMenu({ 
                x: domEvent.clientX, 
                y: domEvent.clientY,
                lat: latLng.lat,
                lng: latLng.lng
              });
              triggerHaptic('impact');
            }
          }}
          {...({ onPoiClick: (e: any) => { handlePoiClick(e); setContextMenu(null); } } as any)}
          options={{
            isFractionalZoomEnabled: true,
            scaleControl: false,
            disableDefaultUI: true,
            gestureHandling: 'greedy',
            clickableIcons: true,
            scrollwheel: true,
            restriction: null,
            maxZoom: 22,
            minZoom: 2,
            tiltInteractionEnabled: true,
            headingInteractionEnabled: true,
            maxTilt: 85,
            minTilt: 0,
            rotateControl: true,
            tiltControl: true,
            keyboardShortcuts: true
          }}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="absolute inset-0 w-full h-full"
        >
          <WeatherMapLayer />
          <DeckGlOverlay data={filteredLandmarks.map(l => ({ lat: l.position.lat, lng: l.position.lng, name: l.name }))} mapTheme={mapTheme} showTrafficLayer={showTrafficLayer} />

          {/* Viewport Landmarks Layer */}
          {filteredLandmarks.map((l) => {
             const place = {
               id: l.id,
               displayName: l.name,
               lat: l.position.lat,
               lng: l.position.lng,
               types: l.types
             };
             return (
              <SafeAdvancedMarker
                key={`viewport-landmark-${l.id}`}
                position={l.position}
                title={l.name}
                onClick={() => handlePlaceClick(place)}
              >
                <motion.div 
                  initial={{ scale: 0.15, opacity: 0 }}
                  animate={{ 
                    scale: isLODMoving ? 0.3 : (mapZoom < 11.8 ? 0 : 1), 
                    opacity: isLODMoving ? 0.2 : (mapZoom < 11.8 ? 0 : 1),
                    y: isLODMoving ? 12 : 0
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 155, 
                    damping: 16, 
                    mass: 0.85 
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleMarkerLongPress(e, place);
                  }}
                  className="cursor-pointer"
                >
                  <LandmarkMarker id={l.id} name={l.name} type={l.types?.[0]} isSelected={selectedPlace?.id === l.id} />
                </motion.div>
              </SafeAdvancedMarker>
             );
          })}

          {/* Persistent Visited Journal Pins Layer */}
          {isMapIdle && map && markerLib && userSnapshots.map((snap) => {
            const place = {
                id: snap.id,
                displayName: snap.locationName,
                formattedAddress: `Journal Check-In Memory`,
                lat: Number(snap.lat),
                lng: Number(snap.lng),
                isVisitedJournal: true,
                visitedJournalData: snap,
                types: ['point_of_interest']
            };
            return (
              <SafeAdvancedMarker
                key={`journal-pin-${snap.id}`}
                position={{ lat: Number(snap.lat), lng: Number(snap.lng) }}
                title={snap.locationName}
                onClick={() => handlePlaceClick(place)}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.15 }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleMarkerLongPress(e, place);
                  }}
                  className="relative flex flex-col items-center cursor-pointer group"
                >
                  <MapMarkerIcon theme="emerald" showEmoji types={['diary']} name={snap.locationName} />

                  {/* Pin hover tooltip */}
                  <div className="absolute bottom-10 bg-slate-950/95 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold text-slate-100 scale-0 group-hover:scale-100 transition-all origin-bottom shadow-xl whitespace-nowrap z-20 pointer-events-none flex flex-col items-center gap-0.5">
                    <span className="text-emerald-400 text-[8px] tracking-widest font-mono uppercase">VISITED MEMORY</span>
                    <span>{snap.locationName}</span>
                  </div>
                </motion.div>
              </SafeAdvancedMarker>
            );
          })}

          {/* Peer Locations Layer */}
          {Object.entries(useVantiStore.getState().peerLocations).map(([uid, loc]) => (
            <SafeAdvancedMarker
              key={`peer-${uid}`}
              position={{ lat: loc.lat, lng: loc.lng }}
              title={loc.displayName}
            >
              <div className="relative flex flex-col items-center group">
                <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">
                  {loc.displayName.charAt(0)}
                </div>
                <div className="absolute top-10 bg-slate-950/95 border border-indigo-500/30 px-2 py-1 rounded text-[10px] text-white">
                  {loc.displayName}
                </div>
              </div>
            </SafeAdvancedMarker>
          ))}

          {/* Custom Saved Places Pins Layer from Firestore with Spatial Grid Clustering */}
          {isMapIdle && map && markerLib && clusteredSavedPlaces.map((savedDoc, idx) => {
            const savedClusterId = `saved-cluster-${savedDoc.lat?.toFixed(5)}-${savedDoc.lng?.toFixed(5)}`;
            const isSavedClusterExpanded = expandedClusterId === savedClusterId || hoveredClusterId === savedClusterId;

            const key = savedDoc.isCluster 
              ? `saved-cluster-${savedDoc.id || idx}-${savedDoc.lat}-${savedDoc.lng}`
              : `saved-pin-${savedDoc.id || savedDoc.placeId}`;

            return (
              <SafeAdvancedMarker
                key={key}
                position={{ lat: savedDoc.lat, lng: savedDoc.lng }}
                title={savedDoc.isCluster ? `${savedDoc.clusterCount} Saved Places` : savedDoc.displayName}
                onClick={() => {
                  if (savedDoc.isCluster) {
                    setExpandedClusterId(expandedClusterId === savedClusterId ? null : savedClusterId);
                    triggerHaptic('tap');
                  } else {
                    handlePlaceClick({
                      id: savedDoc.placeId,
                      displayName: savedDoc.displayName,
                      formattedAddress: savedDoc.address,
                      lat: savedDoc.lat,
                      lng: savedDoc.lng,
                      isSavedPlace: true,
                      types: ['point_of_interest']
                    });
                  }
                }}
              >
                <motion.div
                  initial={{ scale: 0, scaleY: 0 }}
                  animate={{ scale: 1, scaleY: 1 }}
                  whileHover={{ scale: 1.08 }}
                  className="relative flex flex-col items-center"
                  onMouseEnter={() => {
                    if (savedDoc.isCluster) {
                      setHoveredClusterId(savedClusterId);
                    }
                  }}
                  onMouseLeave={() => {
                    if (savedDoc.isCluster) {
                      setHoveredClusterId(null);
                    }
                  }}
                >
                  {savedDoc.isCluster ? (
                    <div className="relative flex items-center justify-center">
                      {/* Main gold/amber master cluster badge */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-500 to-orange-500 p-[2px] shadow-[0_5px_20px_rgba(245,158,11,0.5)] z-20 relative flex items-center justify-center border border-white/20 hover:scale-110 transition-transform">
                        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400 text-[10px] font-black">
                          {isSavedClusterExpanded ? '✕' : savedDoc.clusterCount}
                        </div>
                      </div>

                      {/* Ripple pulse effects when not expanded */}
                      {!isSavedClusterExpanded && (
                        <div className="absolute w-12 h-12 rounded-full border border-amber-500/30 animate-pulse z-0" />
                      )}

                      {/* Fan out saved places */}
                      <AnimatePresence>
                        {isSavedClusterExpanded && savedDoc.members?.map((m: any, j: number) => {
                          const count = savedDoc.members?.length || 1;
                          const angle = (j / count) * 2 * Math.PI;
                          const R = 64; // Fan out radius
                          const x = Math.cos(angle) * R;
                          const y = Math.sin(angle) * R;

                          return (
                            <motion.div
                              key={`fan-saved-${m.id || j}`}
                              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                              animate={{ x, y, scale: 1, opacity: 1 }}
                              exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                              transition={{ type: "spring", damping: 15, stiffness: 180, delay: j * 0.03 }}
                              className="absolute z-10"
                              style={{ originX: 0.5, originY: 0.5 }}
                            >
                              {/* connecting dashed lines */}
                              <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible pointer-events-none z-0" style={{ width: 0, height: 0 }}>
                                <line
                                  x1={0}
                                  y1={0}
                                  x2={-x}
                                  y2={-y}
                                  stroke="#f59e0b"
                                  strokeWidth="1.5"
                                  strokeDasharray="3 3"
                                  className="opacity-75"
                                />
                              </svg>

                              {/* Fanout saved marker spot */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handlePlaceClick({
                                    id: m.placeId,
                                    displayName: m.displayName,
                                    formattedAddress: m.address,
                                    lat: m.lat,
                                    lng: m.lng,
                                    isSavedPlace: true,
                                    types: ['point_of_interest']
                                  });
                                  triggerHaptic('open_panel');
                                }}
                                className="cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.4)] relative flex flex-col items-center group/item hover:scale-120 transition-transform w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 p-[1px] border border-white/20 justify-center bg-slate-950"
                              >
                                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400">
                                  {m.customEmoji ? (
                                    <span className="text-sm">{m.customEmoji}</span>
                                  ) : (
                                    <Star className="w-3 h-3 fill-amber-400" />
                                  )}
                                </div>

                                {/* Hover tooltip for details */}
                                <div className="absolute bottom-full mb-1.5 bg-slate-950/95 border border-amber-500/35 text-[9px] font-bold text-white px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity z-50 flex flex-col items-center">
                                  <span className="text-[7px] text-amber-400 uppercase tracking-widest font-mono">SAVED SPOT</span>
                                  <span>{m.displayName}</span>
                                </div>
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center group">
                      <MapMarkerIcon theme="amber" types={savedDoc.types} name={savedDoc.displayName} customEmoji={savedDoc.customEmoji} status={savedDoc.status} />

                      {/* Pin hover tooltip */}
                      <div className="absolute bottom-10 bg-slate-950/95 border border-amber-500/35 px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold text-slate-100 scale-0 group-hover:scale-100 transition-all origin-bottom shadow-xl whitespace-nowrap z-20 pointer-events-none flex flex-col items-center gap-0.5">
                        <span className="text-amber-400 text-[8px] tracking-widest font-mono uppercase">SAVED LOCATION</span>
                        <span>{savedDoc.displayName}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </SafeAdvancedMarker>
            );
          })}
          {/* Live Traffic Flow Layer using D3.js */}
          {showTrafficLayer && <D3TrafficLayer mapTheme={mapTheme} activeMode={activeMode} isPowerEfficiencyEnabled={isPowerEfficiencyEnabled} />}

          {/* OpenWeatherMap Precipitation Layer Overlay */}
          <WeatherMapLayer />
          
          <BookmarksLayer />
          {showActivityLayer && <ActivityStreamLayer />}
          <CrowdPulseLayer />

          {/* Render Live Curation Mock Places with Clustering - Only when map and marker library are ready */}
       {showPinsLayer && isMapIdle && map && markerLib && clusteredMockPlaces.map((p, idx) => {
         const clusterId = `mock-cluster-${p.lat?.toFixed(5)}-${p.lng?.toFixed(5)}`;
         const isClusterExpanded = expandedClusterId === clusterId || hoveredClusterId === clusterId;

         return (
          <SafeAdvancedMarker 
            key={p.isCluster ? `cluster-mock-${p.id}-${idx}-${p.lat}` : `node-v4-${p.id}-${activeMode}-${selectedCategory}-${activeCollection}-${p.lat}`} 
            position={{ lat: p.lat, lng: p.lng }}
            title={p.isCluster ? `${p.clusterCount} Spots` : p.displayName}
            onClick={() => {
              if (p.isCluster) {
                setExpandedClusterId(expandedClusterId === clusterId ? null : clusterId);
                triggerHaptic('tap');
              } else {
                handlePlaceClick(p);
              }
            }}
            className="group cursor-pointer"
          >
            <motion.div 
              variants={markerVariants}
              initial="hidden"
              animate="visible"
              custom={{ idx, scale: dynamicScale }}
              className="relative flex flex-col items-center"
              onMouseEnter={() => {
                if (p.isCluster) {
                  setHoveredClusterId(clusterId);
                }
              }}
              onMouseLeave={() => {
                if (p.isCluster) {
                  setHoveredClusterId(null);
                }
              }}
            >
              {p.isCluster ? (
                <div className="relative flex items-center justify-center">
                  {/* AI Discovery Node Badge with Dynamic Solar Shadow */}
                  <div 
                    className="w-14 h-14 rounded-full bg-indigo-600 border border-indigo-400/50 shadow-[0_0_20px_rgba(79,70,229,0.6)] flex flex-col items-center justify-center text-white text-[10px] hover:scale-105 transition-all z-20 relative group/node overflow-hidden"
                    style={{
                      boxShadow: `calc(15px * cos(var(--sun-azimuth, 0deg))) calc(15px * sin(var(--sun-azimuth, 0deg))) 20px rgba(0,0,0,calc(0.5 * var(--sun-intensity, 1)))`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-blue-400/30 animate-pulse mix-blend-overlay pointer-events-none" />
                    {isClusterExpanded ? (
                      <span className="font-black text-sm">✕</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mb-0.5 text-indigo-200" />
                        <span className="font-black leading-none">{p.clusterCount}</span>
                      </>
                    )}
                  </div>

                  {/* Fanned out Members */}
                  <AnimatePresence>
                    {isClusterExpanded && p.members?.map((m: any, j: number) => {
                      const count = p.members?.length || 1;
                      const angle = (j / count) * 2 * Math.PI;
                      const R = 64; // Fan-out radius in pixels
                      const x = Math.cos(angle) * R;
                      const y = Math.sin(angle) * R;

                      return (
                        <motion.div
                          key={`fan-mock-${m.id || j}`}
                          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                          animate={{ x, y, scale: 1, opacity: 1 }}
                          exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                          transition={{ type: "spring", damping: 15, stiffness: 180, delay: j * 0.03 }}
                          className="absolute z-10"
                          style={{ originX: 0.5, originY: 0.5 }}
                        >
                          {/* Connecting Line to central cluster */}
                          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible pointer-events-none z-0" style={{ width: 0, height: 0 }}>
                            <line 
                              x1={0} 
                              y1={0} 
                              x2={-x} 
                              y2={-y} 
                              stroke="#6366f1" 
                              strokeWidth="1.5" 
                              strokeDasharray="4 4"
                              className="opacity-60"
                            />
                          </svg>

                          {/* Sub-item Buzz Marker */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handlePlaceClick(m);
                              triggerHaptic('open_panel');
                            }}
                            className="cursor-pointer shadow-lg relative flex flex-col items-center group/item hover:scale-115 transition-transform"
                          >
                            <BuzzMarker 
                              userRatingCount={m.userRatingCount} 
                              isSelected={selectedPlace?.id === m.id}
                              activeWeather={activeWeather}
                              mode={m.mode}
                              types={m.types}
                              name={m.displayName || (m as any).name}
                            />
                            
                            {/* Hover Tooltip displaying Spot Name */}
                            <div className="absolute bottom-full mb-1 bg-slate-950/90 border border-slate-800 text-[9px] font-bold text-white px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity z-50">
                              {m.displayName}
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div 
                  className="relative cursor-pointer"
                  initial={{ scale: 0, opacity: 0, y: 20 }}
                  animate={p.matchScore && p.matchScore > 90 ? { 
                    scale: [1, 1.05, 1],
                    opacity: 1,
                    y: 0
                  } : { scale: 1, opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.15, y: -5 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    duration: p.matchScore && p.matchScore > 90 ? 1.5 : undefined,
                    repeat: p.matchScore && p.matchScore > 90 ? Infinity : undefined,
                    ease: p.matchScore && p.matchScore > 90 ? "easeInOut" : undefined 
                  }}
                >
                  <BuzzMarker 
                    userRatingCount={p.userRatingCount} 
                    isSelected={selectedPlace?.id === p.id}
                    activeWeather={activeWeather}
                    mode={p.mode}
                    types={p.types}
                    name={p.displayName || (p as any).name}
                  />
                </motion.div>
              )}
              {selectedPlace?.id === p.id && (
                  <InfoBubble 
                      crowdDensity={Math.floor(Math.random() * 100)} 
                      noiseLevel={Math.floor(Math.random() * 100)} 
                      mode={p.mode || 'default'}
                      onExpand={() => handlePlaceClick(p)}
                      crowdTrend={Math.random() > 0.5 ? 'up' : 'down'}
                      noiseTrend={Math.random() > 0.5 ? 'stable' : 'up'}
                  />
              )}

              {/* Match Curation Box for Genius Mode */}
              {!p.isCluster && p.mode === 'genius' && (
                <div className="absolute top-11 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 font-mono text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider font-extrabold shadow-md transform pointer-events-none">
                  98% Match
                </div>
              )}

              {/* Vouchers Badge for Perks Mode */}
              {!p.isCluster && p.mode === 'perks' && (
                <div className="absolute top-11 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-300 font-mono text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider font-extrabold shadow-md transform pointer-events-none flex items-center gap-0.5">
                  <Ticket className="w-2.5 h-2.5" /> BOGO
                </div>
              )}
            </motion.div>
          </SafeAdvancedMarker>
        )})}

        {/* Floating Active Friends' Avatars list in Social Mode */}
        {showPinsLayer && isMapIdle && map && markerLib && activeMode === 'social' && visibleFriends.map((f, idx) => (
          <SafeAdvancedMarker 
            key={`friend-v2-${f.id}-${f.lat}`} 
            position={{ lat: f.lat, lng: f.lng }}
            title={f.name}
            onClick={() => {
              setSelectedPlace({
                id: f.id,
                displayName: f.name,
                formattedAddress: `Active near ${f.activeLocation}`,
                lat: f.lat,
                lng: f.lng,
                types: ['friend_marker'],
                imageUrl: f.avatar,
                socialActivity: `Status: Checked-in at ${f.activeLocation} (${f.lastActive})`,
                mode: 'social'
              });
              setShowList(true);
            }}
          >
            <motion.div 
              variants={markerVariants}
              initial="hidden"
              animate="visible"
              custom={{ idx: idx + 5, scale: dynamicScale }}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className={cn(
                "relative w-10 h-10 rounded-full border-2 border-rose-500 p-0.5 shadow-xl bg-slate-950 transition-transform overflow-hidden",
                selectedPlace?.id === f.id ? "animate-pulse scale-110" : "scale-100 group-hover:scale-110"
              )}>
                <img src={f.avatar} alt={f.name} className="w-full h-full rounded-full object-cover" />
                <WeatherOverlay weather={activeWeather} />
              </div>
              <div className="mt-1 px-1.5 py-0.5 bg-rose-500 text-white font-display text-[9px] font-bold rounded shadow-lg opacity-90">
                ● {f.name.split(' ')[0]}
              </div>
            </motion.div>
          </SafeAdvancedMarker>
        ))}

        {/* Dynamic Calculated Rendezvous Point (GNB 2: Social Core) */}
        {showPinsLayer && isMapIdle && map && markerLib && activeMode === 'social' && socialMeetpoint && (
          <SafeAdvancedMarker 
            key={`meetup-core-${socialMeetpoint.lat}`}
            position={{ lat: socialMeetpoint.lat, lng: socialMeetpoint.lng }}
            title={socialMeetpoint.name}
            onClick={() => {
              setSelectedPlace({
                id: 'rendezvous_meetpoint',
                displayName: socialMeetpoint.name,
                formattedAddress: 'Optimal meetup centerpoint generated by AI proximity balancing.',
                lat: socialMeetpoint.lat,
                lng: socialMeetpoint.lng,
                types: ['rendezvous_meetpoint'],
                imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
                socialActivity: 'Optimized coordinate. Click to details for route maps and host options.',
                mode: 'social'
              });
              setShowList(true);
            }}
          >
            <motion.div 
              variants={markerVariants}
              initial="hidden"
              animate="visible"
              custom={{ idx: 5, scale: dynamicScale }}
              className="flex flex-col items-center cursor-pointer relative z-50"
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-mono text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase tracking-wider whitespace-nowrap animate-bounce border border-slate-950">
                ⚡ Optimal Rendezvous
              </span>
              <div className="relative w-10 h-10 rounded-xl border-2 border-amber-400 bg-slate-950/95 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.8)]">
                <span className="text-xl">🎯</span>
                <WeatherOverlay weather={activeWeather} />
              </div>
              <div className="absolute inset-0 rounded-xl bg-amber-400/20 animate-ping -z-10" />
            </motion.div>
          </SafeAdvancedMarker>
        )}

        {/* Regular Search Places */}
        {/* Markers from Gemini Agent */}
        {showPinsLayer && isMapIdle && map && markerLib && visibleAgentMarkers.map((p, idx) => (
          <SafeAdvancedMarker
            key={`agent-marker-${p.id || idx}-${p.lat}`}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => {
              handlePlaceClick({
                id: `agent-${idx}`,
                displayName: p.name,
                formattedAddress: p.description,
                lat: p.lat,
                lng: p.lng,
                types: [p.type || 'point_of_interest']
              });
            }}
          >
            <motion.div 
              variants={markerVariants}
              initial="hidden"
              animate="visible"
              custom={{ idx: idx + 10, scale: dynamicScale }}
              className="group relative flex flex-col items-center"
            >
              <div className="relative">
                <MapMarkerIcon theme="indigo" types={[p.type]} name={p.name} showEmoji={false} />
                <WeatherOverlay weather={activeWeather} />
              </div>
              <div className="shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 border border-slate-700 p-2 rounded-lg pointer-events-none min-w-[120px] z-50">
                <p className="text-[10px] font-bold text-white leading-tight">{p.name}</p>
                {p.type && <p className="text-[8px] text-indigo-400 uppercase tracking-tighter mt-0.5">{p.type}</p>}
              </div>
            </motion.div>
          </SafeAdvancedMarker>
        ))}

        {showPinsLayer && isMapIdle && map && markerLib && clusteredSearchPlaces.map((place: any, idx) => {
          const searchClusterId = `search-cluster-${place.lat?.toFixed(5)}-${place.lng?.toFixed(5)}`;
          const isSearchClusterExpanded = expandedClusterId === searchClusterId || hoveredClusterId === searchClusterId;

          const key = place.isCluster 
            ? `search-cluster-${place.id || idx}-${place.lat}-${place.lng}` 
            : `search-v3-${place.id}-${selectedCategory}-${place.lat}-${place.lng}`;
          
          return (
            <SafeAdvancedMarker 
              key={key} 
              position={{ lat: place.lat, lng: place.lng }} 
              title={place.isCluster ? `${place.clusterCount} Results` : (place.displayName || 'Location')}
              onClick={() => {
                if (place.isCluster) {
                  setExpandedClusterId(expandedClusterId === searchClusterId ? null : searchClusterId);
                  triggerHaptic('tap');
                } else {
                  handlePlaceClick(place);
                }
              }}
              className="group cursor-pointer"
            >
              <motion.div 
                variants={markerVariants}
                initial="hidden"
                animate="visible"
                custom={{ idx, scale: dynamicScale }}
                className="relative flex flex-col items-center"
                onMouseEnter={() => {
                  if (place.isCluster) {
                    setHoveredClusterId(searchClusterId);
                  }
                }}
                onMouseLeave={() => {
                  if (place.isCluster) {
                    setHoveredClusterId(null);
                  }
                }}
              >
                {place.isCluster ? (
                  <div className="relative flex items-center justify-center">
                    {/* Main Cluster Circle Badge */}
                    <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white shadow-2xl flex items-center justify-center text-white text-[10px] font-black hover:scale-105 transition-all z-20 relative">
                      {isSearchClusterExpanded ? '✕' : place.clusterCount}
                    </div>

                    {/* Fanned out Search Members */}
                    <AnimatePresence>
                      {isSearchClusterExpanded && place.members?.map((m: any, j: number) => {
                        const count = place.members?.length || 1;
                        const angle = (j / count) * 2 * Math.PI;
                        const R = 64; // Fan-out radius in pixels
                        const x = Math.cos(angle) * R;
                        const y = Math.sin(angle) * R;

                        return (
                          <motion.div
                            key={`fan-search-${m.id || j}`}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                            animate={{ x, y, scale: 1, opacity: 1 }}
                            exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                            transition={{ type: "spring", damping: 15, stiffness: 180, delay: j * 0.03 }}
                            className="absolute z-10"
                            style={{ originX: 0.5, originY: 0.5 }}
                          >
                            {/* Connecting Line to central cluster */}
                            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible pointer-events-none z-0" style={{ width: 0, height: 0 }}>
                              <line 
                                x1={0} 
                                y1={0} 
                                x2={-x} 
                                y2={-y} 
                                stroke="#6366f1" 
                                strokeWidth="1.5" 
                                strokeDasharray="3 3"
                                className="opacity-75"
                              />
                            </svg>

                            {/* Sub-item Pin Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handlePlaceClick(m);
                                triggerHaptic('open_panel');
                              }}
                              className="cursor-pointer relative flex flex-col items-center group/item"
                            >
                              <MapMarkerIcon theme={markerTheme} types={m.types} name={m.displayName || (m as any).name} isSelected={selectedPlace?.id === m.id} status={(m as any).status} />
                              
                              {/* Hover Tooltip displaying Spot Name */}
                              <div className="absolute bottom-full mb-1 bg-slate-950/90 border border-slate-800 text-[9px] font-bold text-white px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity z-50">
                                {m.displayName || (m as any).name}
                              </div>
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Photo Thumbnail */}
                    {place.photos && place.photos.length > 0 && (
                      <img
                        src={place.photos[0].getURI({ maxWidth: 100 })}
                        alt={place.displayName || 'Location'}
                        referrerPolicy="no-referrer"
                        className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-white object-cover shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                    {/* Custom Buzz Marker */}
                    <motion.div 
                      className="relative cursor-pointer"
                      initial={{ scale: 0, opacity: 0, y: 20 }}
                      animate={selectedPlace?.id === place.id ? { 
                        scale: [1, 1.05, 1],
                        opacity: 1,
                        y: 0
                      } : { scale: 1, opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.15, y: -5 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        duration: selectedPlace?.id === place.id ? 2 : undefined,
                        repeat: selectedPlace?.id === place.id ? Infinity : undefined,
                        ease: selectedPlace?.id === place.id ? "easeInOut" : undefined 
                      }}
                    >
                      <BuzzMarker 
                        userRatingCount={place.userRatingCount} 
                        isSelected={selectedPlace?.id === place.id}
                        activeWeather={activeWeather}
                        types={place.types}
                        name={place.displayName || (place as any).name}
                      />
                    </motion.div>
                  </div>
                )}
                {!place.isCluster && selectedPlace?.id === place.id && (
                    <InfoBubble 
                        crowdDensity={Math.floor(Math.random() * 100)} 
                        noiseLevel={Math.floor(Math.random() * 100)} 
                        mode={'default'}
                        onExpand={() => handlePlaceClick(place)}
                        crowdTrend={Math.random() > 0.5 ? 'up' : 'down'}
                        noiseTrend={Math.random() > 0.5 ? 'stable' : 'up'}
                    />
                )}
              </motion.div>
            </SafeAdvancedMarker>
          );
        })}

        {isMapIdle && map && markerLib && userLocation && (
          <SafeAdvancedMarker 
            key="user-location-marker"
            position={userLocation} 
            title="You are here"
          >
            <div className="relative flex items-center justify-center">
              {/* Radiating Sonar Ping matched every 5 seconds */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={pingKey}
                  initial={{ scale: 0.8, opacity: 0.8, borderWidth: "3px" }}
                  animate={{ scale: 4.8, opacity: 0, borderWidth: "1.5px" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 3.5, ease: [0.1, 0.8, 0.25, 1] }}
                  className="absolute w-12 h-12 rounded-full border-blue-400 bg-blue-500/10 pointer-events-none -z-10"
                />
              </AnimatePresence>

              <div className="w-9 h-9 rounded-full overflow-hidden border-[2.5px] border-white shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center justify-center z-10 bg-[#090b15]">
                {(auth.currentUser?.photoURL || userProfile?.avatarUrl) ? (
                  <img src={auth.currentUser?.photoURL || userProfile?.avatarUrl} alt="You" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-500 shadow-inner" />
                )}
              </div>
            </div>
          </SafeAdvancedMarker>
        )}

        <ItineraryLayer map={map} markerLib={markerLib} isMapIdle={isMapIdle} />

        {/* Custom User Markers Layer */}
        {isMapIdle && map && markerLib && customMarkers.map((cm: any) => (
          <SafeAdvancedMarker
            key={`custom-marker-${cm.id}`}
            position={{ lat: cm.lat, lng: cm.lng }}
            onClick={() => handlePlaceClick({
              id: cm.id,
              lat: cm.lat,
              lng: cm.lng,
              displayName: cm.nickname,
              name: cm.nickname,
              types: ['custom_marker'],
              editorialSummary: cm.note,
              address: cm.note,
            })}
          >
            <motion.div 
               initial={{ opacity: 0, y: -50, scale: 0.8 }} 
               animate={{ opacity: 1, y: 0, scale: 1 }} 
               transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
               className="relative group cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-xl">
                 <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full -ml-[40px] left-1/2 mb-2 bg-slate-900 border border-slate-700 p-2 rounded-lg pointer-events-none min-w-[120px] z-50 flex flex-col items-center">
                  <p className="text-[10px] font-bold text-white leading-tight text-center">{cm.nickname}</p>
                  <p className="text-[8px] text-indigo-400 uppercase tracking-tighter mt-0.5 whitespace-nowrap text-center">{cm.category || 'My Marker'}</p>
              </div>
            </motion.div>
          </SafeAdvancedMarker>
        ))}

        {/* Custom Animated Trending Pins Layer */}
        {showTrendingPins && isMapIdle && map && markerLib && trendingPlaces.filter((m: any) => {
          if (!moodFilter) return true;
          const cat = (m.category || '').toLowerCase();
          if (moodFilter === 'Energizing') {
            return cat.includes('gym') || cat.includes('cafe') || cat.includes('club') || cat.includes('amusement') || cat.includes('shopping') || cat.includes('active');
          } else if (moodFilter === 'Peaceful') {
            return cat.includes('park') || cat.includes('spa') || cat.includes('library') || cat.includes('museum') || cat.includes('art') || cat.includes('nature') || cat.includes('landmark');
          } else if (moodFilter === 'Social') {
            return cat.includes('bar') || cat.includes('restaurant') || cat.includes('cafe') || cat.includes('event') || cat.includes('culture');
          }
          return true;
        }).map((place: any, idx: number) => {
          return (
            <SafeAdvancedMarker
              key={`trending-pin-${place.id}`}
              position={{ lat: place.lat, lng: place.lng }}
              title={place.displayName}
              onClick={() => handlePlaceClick(place)}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 180, damping: 14 }}
                className="relative flex flex-col items-center cursor-pointer group"
              >
                {/* Rippling outer radar ring/pulse */}
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping scale-150 opacity-60" style={{ animationDuration: '2.5s' }} />
                
                {/* Custom Glowing Neon Core */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-[2px] shadow-[0_4px_15px_rgba(244,63,94,0.4)] relative z-10 hover:scale-115 active:scale-95 transition-all duration-300 flex items-center justify-center border-t border-white/45">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-sm">
                    {getEmojiForPlace(place.types, place.displayName)}
                  </div>
                </div>

                {/* Floating Tag Overlay on Marker Hover */}
                <div className="absolute bottom-12 bg-slate-950/95 backdrop-blur-md border border-rose-500/35 px-2.5 py-1.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col items-start min-w-[150px] scale-0 group-hover:scale-100 transition-all duration-300 pointer-events-none z-30 origin-bottom shadow-rose-950/30">
                  <span className="text-[7px] font-black tracking-widest text-rose-400 uppercase leading-none">{place.badgeText}</span>
                  <span className="text-[9.5px] font-black text-white mt-1 truncate max-w-[135px] leading-tight">{place.displayName}</span>
                  <p className="text-[8px] text-slate-400 font-medium mt-1 leading-snug max-w-[135px] line-clamp-2">{place.reason}</p>
                  <div className="flex items-center justify-between w-full mt-1.5 pt-1.5 border-t border-white/5 font-mono text-[7px] text-slate-500">
                    <span>TREND INDEX:</span>
                    <span className="text-amber-400 font-bold bg-amber-400/10 px-1 rounded">{place.trendScore}% MATCH</span>
                  </div>
                </div>

                {/* Small indicator pin base pointer */}
                <div className="w-2 h-2 bg-rose-500 rotate-45 -mt-1 relative z-0 border-r border-b border-rose-600/30" />
              </motion.div>
            </SafeAdvancedMarker>
          );
        })}

        {/* Event Places Layer */}
        {showPinsLayer && isMapIdle && map && markerLib && eventPlaces.map((evt: any, idx: number) => {
          if (!evt.location) return null;
          const lat = typeof evt.location.lat === 'function' ? evt.location.lat() : evt.location.lat;
          const lng = typeof evt.location.lng === 'function' ? evt.location.lng() : evt.location.lng;
          return (
            <SafeAdvancedMarker 
              key={`evt-${evt.id || idx}`}
              position={{ lat, lng }}
              onClick={() => handlePlaceClick(evt)}
            >
              <motion.div 
                variants={markerVariants}
                initial="hidden"
                animate="visible"
                custom={{ idx: idx + 10, scale: dynamicScale }}
                className="group relative flex flex-col items-center cursor-pointer"
              >
                <div className="relative">
                  <MapMarkerIcon theme="fuchsia" types={evt.types || []} name={evt.displayName} showEmoji={false} />
                  <WeatherOverlay weather={activeWeather} />
                </div>
                <div className="shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 border border-slate-700 p-2 rounded-lg pointer-events-none min-w-[120px] z-50">
                  <p className="text-[10px] font-bold text-white leading-tight">{evt.displayName}</p>
                  <p className="text-[8px] text-fuchsia-400 uppercase tracking-tighter mt-0.5 whitespace-nowrap">Local Cultural Event</p>
                </div>
              </motion.div>
            </SafeAdvancedMarker>
          );
        })}

        {/* Route Calculations */}
        {((routingOrigin && selectedPlace && routingOrigin.id !== selectedPlace.id) || (!routingOrigin && userLocation && selectedPlace)) && (
          <RouteDisplay 
            origin={routeOrigin} 
            destination={routeDestination} 
            userLocation={userLocation}
            onDeviate={() => triggerHaptic('impact')}
            onRouteInfoUpdate={setActiveRouteInfo}
          />
        )}

        {/* Custom Dynamic Itinerary Connectors */}
        <ItineraryLegsDisplay />
        
        {/* Memory Trail Layer */}
        <MemoryTrailLayer />
        
        {/* Cinematic Replay Viewer */}
        <MemoryReplayViewer />

        {/* Atmosphere Pulse Visualization */}
        {isAtmosphereOpen && <AtmosphereD3Overlay />}
      </Map>
      </MapErrorBoundary>
      </>
      )}

      {/* Real-time Atmospheric Dynamic Overlay (Clouds, Rain, Storm, Sun flares or Sno drift) */}
      {showWeatherOverlay && currentWeatherData && (
        <AtmosphericOverlay weather={currentWeatherData} />
      )}
      </div>

      {/* Omnia Geospatial AI Radar Overlay */}
      <AnimatePresence>
        {isOmniaScanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center justify-center"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-[800px] h-[800px] rounded-full border border-amber-500/20 absolute" />
              <div className="w-[600px] h-[600px] rounded-full border border-amber-500/30 absolute" />
              <div className="w-[400px] h-[400px] rounded-full border border-amber-500/40 absolute" />
              <div className="w-1 h-[400px] bg-gradient-to-t from-transparent via-amber-400 to-transparent absolute origin-bottom bottom-1/2 animate-[spin_2s_linear_infinite] opacity-70" />
              <div className="w-32 h-32 bg-amber-500/20 backdrop-blur-3xl border border-amber-400 rounded-2xl flex flex-col items-center justify-center text-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] z-20 pulse-animation">
                <RadarIcon className="w-8 h-8 animate-[spin_3s_linear_infinite]" />
                <span className="text-[10px] font-black uppercase tracking-widest mt-2 bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">Omnia</span>
              </div>
            </div>
            
            <div className="mt-4 bg-black/60 backdrop-blur-sm border border-amber-500/30 text-amber-400 font-mono text-xs px-4 py-2 rounded-full uppercase tracking-wider font-bold">
               Analyzing Spatial Intent...
            </div>
          </motion.div>
        )}
        {isCinematicMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] pointer-events-none flex flex-col justify-between"
          >
            {/* Top Letterbox */}
            <div className="h-[12vh] bg-black/95 border-b border-white/5 flex items-end px-8 pb-4">
              <div className="flex gap-4 opacity-50">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-[10px] text-white tracking-widest uppercase">REC • VANTi Cine-Core</span>
              </div>
            </div>
            
            {/* Side UI elements (reticles) */}
            <div className="absolute inset-x-8 inset-y-32 border-x border-white/5 pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-0 w-2 h-px bg-white -translate-x-1/2" />
              <div className="absolute top-1/2 right-0 w-2 h-px bg-white translate-x-1/2" />
              <div className="absolute top-0 left-1/2 w-px h-2 bg-white -translate-y-1/2" />
              <div className="absolute bottom-0 left-1/2 w-px h-2 bg-white translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/30 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/50 rounded-full" />
            </div>

            {/* Bottom Letterbox */}
            <div className="h-[12vh] bg-black/95 border-t border-white/5 flex flex-col items-start justify-start px-8 pt-4">
               <div className="flex justify-between w-full opacity-50">
                 <span className="font-mono text-[10px] text-white tracking-widest uppercase">ISO 800 • F/2.8 • 1/50</span>
                 <span className="font-mono text-[10px] text-white tracking-widest uppercase">{new Date().toISOString()}</span>
               </div>
            </div>
          </motion.div>
        )}

        {isCinematicMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] pointer-events-auto"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCinematicMode(false)}
                className="px-6 py-3 bg-red-600/90 backdrop-blur-md border border-white/20 rounded-full text-white font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:bg-red-500 transition-all group"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm" />
                Rec Recording... Stop
              </motion.button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Primary UI Layer */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col p-3 md:p-6 pb-24 md:pb-6">
        {/* Top Floating Widgets */}
        <div className="hidden md:flex absolute top-8 left-8 flex-col gap-4">
          <WeatherCenterOverlay lat={mapCenter.lat} lng={mapCenter.lng} />
        </div>

        {/* Top: Branding & Search removed, only search relative z-[100] */}
        <div className="absolute top-[env(safe-area-inset-top,0px)] inset-x-0 w-full flex justify-end p-4 md:p-6 mt-16 md:mt-2 z-[100] pointer-events-none">
          <div className="relative flex items-center gap-2.5 p-1.5 bg-[#0b0d19]/80 backdrop-blur-3xl border border-white/35 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.25)] pointer-events-auto">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const searchDiv = document.getElementById('vanti-search-nav-container');
                  if (searchDiv) {
                    searchDiv.classList.toggle('hidden');
                  } else {
                    setIsSearching(true);
                  }
                }}
                className="w-10 h-10 bg-transparent hover:bg-white/10 active:bg-white/15 rounded-full flex items-center justify-center text-white transition-all group relative"
              >
                <div className="absolute inset-0 rounded-full opacity-20 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(0,0,0,0) 70%)' }} />
                <Search className="w-4.5 h-4.5 opacity-90 group-hover:opacity-100 transition-opacity relative z-10" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLayersMenu(!showLayersMenu)}
                className="w-10 h-10 bg-transparent hover:bg-white/10 active:bg-white/15 rounded-full flex items-center justify-center text-white transition-all group relative"
              >
                <div className="absolute inset-0 rounded-full opacity-20 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(0,0,0,0) 70%)' }} />
                <LayoutGrid className="w-4.5 h-4.5 opacity-90 group-hover:opacity-100 transition-opacity relative z-10" />
              </motion.button>

              {/* Layers Menu Panel (Width and items size 20% reduced for proper map alignment) */}
              <AnimatePresence>
                {showLayersMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.95 }}
                    className="absolute right-0 top-13 w-[190px] bg-[#070913]/95 backdrop-blur-3xl border border-white/35 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-3 z-[220] flex flex-col gap-2 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                      <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase font-mono">Map Layers</span>
                      <button 
                        onClick={() => setShowLayersMenu(false)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'traffic', label: 'Traffic Flow', icon: Route, active: showTrafficLayer, toggle: () => setShowTrafficLayer(!showTrafficLayer) },
                        { id: 'pins', label: 'POI Markers', icon: MapPin, active: showPinsLayer, toggle: () => setShowPinsLayer(!showPinsLayer) },
                        { id: 'activity', label: 'Activity Sync', icon: Radio, active: showActivityLayer, toggle: () => setShowActivityLayer(!showActivityLayer) },
                        { id: 'weather', label: 'Weather Radar', icon: CloudRain, active: showWeatherLayer, toggle: () => setShowWeatherLayer(!showWeatherLayer) },
                        { id: 'crowd-pulse', label: 'Crowd Pulse', icon: Flame, active: isCrowdPulseActive || false, toggle: () => setIsCrowdPulseActive?.(!isCrowdPulseActive) },
                      ].map((layer) => {
                        const Icon = layer.icon;
                        return (
                          <button
                            key={layer.id}
                            onClick={() => {
                              layer.toggle();
                              triggerHaptic('switch');
                            }}
                            className={cn(
                              "flex items-center justify-between px-2 py-1 rounded-lg border text-left transition-all duration-200 h-[34px]",
                              layer.active 
                                ? "bg-white/10 border-white/20 text-white font-bold" 
                                : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-[10px] truncate leading-none">{layer.label}</span>
                            </div>
                            <div className={cn(
                              "w-5 h-2.5 rounded-full flex items-center p-0.5 transition-colors shrink-0", 
                              layer.active ? "bg-rose-500" : "bg-slate-700"
                            )}>
                              <div className={cn(
                                "w-1.5 h-1.5 bg-white rounded-full transition-transform", 
                                layer.active ? "translate-x-2.5" : "translate-x-0"
                              )} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>


        {/* Bottom Navigation Bar Space Spacer */}
        <div className="absolute inset-x-0 bottom-0 p-4 h-1 flex flex-col items-center gap-4 pointer-events-none z-50">
        </div>
      </div>

      {/* Style Switcher Modal */}
      <AnimatePresence>
        {showStyleSwitcher && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md pointer-events-auto">
            <FocusLock returnFocus className="contents">
              <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setShowStyleSwitcher(false);
                }
              }}
              className="w-full max-w-lg glass-dark border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Map Environment</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Select visual skin generator</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowStyleSwitcher(false);
                  }} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.keys(MAP_STYLES).map((style) => (
                  <button
                    key={style}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setMapTheme(style);
                      triggerHaptic('switch');
                    }}
                    className={cn(
                      "group relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                      mapTheme === style 
                        ? "bg-rose-500/20 border-rose-500/40 text-white shadow-lg" 
                        : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform",
                      mapTheme === style ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-500"
                    )}>
                      {style === 'Default' && <MapIcon className="w-6 h-6" />}
                      {style === 'Night' && <Eye className="w-6 h-6" />}
                      {style === 'Silver' && <Box className="w-6 h-6" />}
                      {style === 'Retro' && <Mountain className="w-6 h-6" />}
                      {style === 'Simulation' && <RadarIcon className="w-6 h-6" />}
                      {style === 'Genie' && <Sparkles className="w-6 h-6" />}
                      {style === 'Cosmic' && <LogIn className="w-6 h-6" />}
                      {style === 'Neo-Tokyo' && <Navigation className="w-6 h-6" />}
                      {style === 'Midnight' && <EyeOff className="w-6 h-6" />}
                      {style === 'Sketch' && <MapPin className="w-6 h-6" />}
                      {style === 'Minimalist' && <LayoutGrid className="w-6 h-6" />}
                      {style === 'Terrain-Focused' && <Mountain className="w-6 h-6" />}
                      {style === 'High-Contrast' && <Activity className="w-6 h-6" />}
                      {style === 'Night-Shift' && <Eye className="w-6 h-6" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{style.replace('-', ' ')}</span>
                    {mapTheme === style && <motion.div layoutId="active-style" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowStyleSwitcher(false);
                  }}
                  className="px-8 h-12 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-transform active:scale-95 shadow-xl hover:bg-slate-200"
                >
                  Apply Config
                </button>
              </div>
            </motion.div>
            </FocusLock>
          </div>
        )}
      </AnimatePresence>

      {/* AI Suite Pop-up Overlay (Replaces the messy HUD pop-up) */}
      <AnimatePresence>
        {aiSuiteOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm pointer-events-auto">
            <FocusLock returnFocus className="contents">
              <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setAiSuiteOpen(false);
                }
              }}
              className="w-full max-w-sm glass-dark border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
              
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">System Utility</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Environment & AI Config</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setAiSuiteOpen(false);
                  }} 
                  className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-8">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOmniaScanning(true);
                    setTimeout(() => setIsOmniaScanning(false), 3000);
                    setAiSuiteOpen(false);
                  }}
                  className="w-full group relative p-6 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 overflow-hidden shadow-2xl text-left"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col gap-1">
                    <RadarIcon className="w-8 h-8 text-white mb-2" />
                    <span className="text-lg font-black text-white uppercase italic leading-none">Initiate Omnia</span>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-wide">Topology & Intent Analysis</span>
                  </div>
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsCinematicMode(!isCinematicMode);
                    triggerHaptic('mode3d');
                    setAiSuiteOpen(false);
                  }}
                  className={cn(
                    "w-full group relative p-6 rounded-2xl overflow-hidden shadow-2xl text-left transition-all",
                    isCinematicMode 
                      ? "bg-rose-500 border-2 border-white/30" 
                      : "bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-700"
                  )}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col gap-1">
                    <Video className={cn("w-8 h-8 text-white mb-2", isCinematicMode && "animate-pulse")} />
                    <span className="text-lg font-black text-white uppercase italic leading-none">
                      {isCinematicMode ? 'Stop Cinematic' : 'Cinematic Mode'}
                    </span>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-wide">Immersive Camera Sequence</span>
                  </div>
                  {isCinematicMode && (
                    <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  )}
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Haptic Engine</label>
                    <div className="h-10 bg-white/5 rounded-xl flex items-center px-4"><div className="w-full h-1 bg-slate-800 rounded-full"><div className="h-full bg-rose-500 w-1/2 rounded-full" /></div></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Visual Sim</label>
                    <div className="h-10 bg-white/5 rounded-xl flex items-center px-4"><div className="w-full h-1 bg-slate-800 rounded-full"><div className="h-full bg-blue-500 w-3/4 rounded-full" /></div></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3">
                   {['minimalist', 'glow', 'classic'].map(t => (
                     <button 
                      key={t} 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setMarkerTheme(t as any);
                      }} 
                      className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", markerTheme === t ? "bg-white text-black" : "bg-white/5 text-slate-500 hover:text-white")}
                    >
                      {t}
                    </button>
                   ))}
                </div>
              </div>
            </motion.div>
            </FocusLock>
          </div>
        )}
      </AnimatePresence>
      
      {/* Multimodal Gemini Smart chatbot companion */}
      <Chatbot onMapCommand={handleMapCommand} isVisible={!showList && !isCinematicMode} />

      {/* Route Planner Panel */}
      {(showRoutePlanner || activeMode === 'planner') && (
        <RoutePlannerPanel onClose={() => {
          setShowRoutePlanner(false);
          if (activeMode === 'planner') {
            setActiveMode('all');
          }
        }} />
      )}

      <QuickPhrasesOverlay />

      {/* Pinch to Zoom gesture helper indicator */}
      <NavigationFlyout />
      <MoodFilterWidget />
      <ARPreviewWidget />
      <AtmosphericEngineOverlay weather={activeWeather} lat={userLocation?.lat || mapCenter.lat || 0} />
      <AnimatePresence>
        {showPinchHelper && (
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed left-6 top-[20%] md:top-[25%] z-[220] max-w-[280px] p-4 bg-[#090b15]/90 border border-[#a5b4fc]/30 text-white rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-3 backdrop-blur-3xl pointer-events-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-[#a5b4fc] flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#a5b4fc]">Gesture Guide</span>
              </div>
              <button 
                onClick={() => { triggerHaptic('tap'); setShowPinchHelper(false); }}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="relative w-12 h-12 shrink-0 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center overflow-hidden">
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="absolute w-8 h-8 rounded-full border border-dashed border-indigo-400"
                />
                <motion.div 
                  animate={{ y: [-3, 3, -3], rotate: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="text-white relative z-10 font-bold text-center leading-none text-xl"
                >
                  ✌️
                </motion.div>
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-white mb-0.5">Two-Finger Navigation</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-normal">
                  Pinch with two fingers to zoom smoothly, or drag with two fingers to tilt the active 3D layout context.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input for Photo Route */}
      <input 
        type="file" 
        accept="image/*" 
        id="location-scanner-input" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            triggerHaptic('success');
            setShowToast(true);
            setTimeout(() => {
              if (map) {
                // Mock EXIF/Computer Vision coordinate extraction
                const mockLat = userLocation ? userLocation.lat + 0.015 : DEFAULT_CENTER.lat + 0.015;
                const mockLng = userLocation ? userLocation.lng + 0.015 : DEFAULT_CENTER.lng + 0.015;
                
                // Construct a mock feature representing the scanned location
                const scannedPlace = {
                  id: `scanned-${Date.now()}`,
                  displayName: { text: "Photo Location Scan" },
                  formattedAddress: "Extracted from Image Metadata",
                  location: { lat: mockLat, lng: mockLng },
                  types: ['tourist_attraction'],
                  rating: 4.8,
                  userRatingCount: 124,
                  photos: [{ getURI: () => {
                    const fileInput = document.getElementById('location-scanner-input') as HTMLInputElement;
                    return fileInput?.files?.[0] ? URL.createObjectURL(fileInput.files[0]) : '';
                  }}]
                };
                
                setSelectedPlace(scannedPlace);
                map.panTo({ lat: mockLat, lng: mockLng });
                map.setZoom(15);
              }
            }, 1200);
            e.target.value = '';
          }
        }} 
      />

      {/* Add Marker Mini Modal */}
      <AnimatePresence>
        {addingMarkerLat !== null && addingMarkerLng !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setAddingMarkerLat(null);
                setAddingMarkerLng(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-indigo-400">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">Drop Custom Pin</h3>
                    <p className="text-xs text-slate-400">Label this exact coordinate</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nickname (e.g. Hidden Cafe)"
                    value={addingMarkerNick}
                    onChange={(e) => setAddingMarkerNick(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-600"
                  />
                  <select
                    value={addingMarkerCategory}
                    onChange={(e) => setAddingMarkerCategory(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Scenic">Scenic</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Event">Event</option>
                    <option value="Hidden Gem">Hidden Gem</option>
                    <option value="Other">Other</option>
                  </select>
                  <textarea
                    placeholder="Short Note (Optional)"
                    value={addingMarkerNote}
                    onChange={(e) => setAddingMarkerNote(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-600 resize-none"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setAddingMarkerLat(null);
                      setAddingMarkerLng(null);
                      setAddingMarkerNick('');
                      setAddingMarkerNote('');
                      setAddingMarkerCategory('Restaurant');
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!addingMarkerNick.trim()) return;
                      addCustomMarker({
                        id: `cm-${Date.now()}`,
                        lat: addingMarkerLat,
                        lng: addingMarkerLng,
                        nickname: addingMarkerNick.trim(),
                        note: addingMarkerNote.trim(),
                        category: addingMarkerCategory
                      });
                      setAddingMarkerLat(null);
                      setAddingMarkerLng(null);
                      setAddingMarkerNick('');
                      setAddingMarkerNote('');
                      setAddingMarkerCategory('Restaurant');
                      triggerHaptic('success');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    disabled={!addingMarkerNick.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Pin
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250] bg-emerald-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-emerald-400"
          >
            <CheckIcon className="w-5 h-5" />
            <span className="font-medium text-sm">Location saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coordinate Bookmarking Modal */}
      <AnimatePresence>
        {bookmarkingLat !== null && bookmarkingLng !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setBookmarkingLat(null);
                setBookmarkingLng(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <Bookmark className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">Bookmark Current View</h3>
                    <p className="text-xs text-slate-400">Save coordinate to cloud bookmarks</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-500 pl-1">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. My Favorite Scenic Outlook"
                      value={bookmarkingName}
                      onChange={(e) => setBookmarkingName(e.target.value)}
                      autoFocus
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-slate-600"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-500 pl-1">Category</label>
                    <select
                      value={bookmarkingCategory}
                      onChange={(e) => setBookmarkingCategory(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                      <option value="scenic">Scenic Lookout</option>
                      <option value="restaurant">Restaurant / Bistro</option>
                      <option value="hotel">Hotel / Lodging</option>
                      <option value="destination">Key Destination</option>
                      <option value="point_of_interest">Point of Interest</option>
                      <option value="secret">Hidden Spot</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded-xl border border-white/[0.02]">
                    <div className="text-[8px] uppercase font-mono font-bold text-slate-500">Geospatial Coordinates</div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      LAT: {bookmarkingLat.toFixed(6)} • LNG: {bookmarkingLng.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setBookmarkingLat(null);
                      setBookmarkingLng(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCoordinateBookmark}
                    disabled={!bookmarkingName.trim() || isSavingBookmark}
                    className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingBookmark ? 'Saving...' : 'Save Cloud Bookmark'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <SoundEngine 
        theme={mapTheme} 
        selectedPlace={selectedPlace} 
        mapCenter={mapCenter} 
        mapHeading={mapHeading} 
        nearbyHighlights={nearbyHighlights}
      />

      {/* Nearby Highlights Summary Card (appears when zoomed in, showList is false, and no place is selected) */}
      <AnimatePresence>
        {isDiscoverMode && !showList && !selectedPlace && nearbyHighlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              scale: 1,
              height: isHighlightsExpanded ? '50vh' : 'auto'
            }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              setIsHighlightsExpanded(!isHighlightsExpanded);
              triggerHaptic('tap');
            }}
            className={cn(
              "absolute left-4 right-4 md:right-auto md:left-6 w-[calc(100vw-2rem)] md:w-[360px] max-w-[360px] bg-slate-950/90 hover:bg-slate-950/95 backdrop-blur-3xl border border-indigo-500/10 hover:border-indigo-500/25 rounded-[2.25rem] p-5 shadow-2xl z-40 pointer-events-auto flex flex-col gap-3 transition-colors duration-300 cursor-pointer overflow-hidden max-h-[90vh]",
              isHighlightsExpanded ? "bottom-[110px]" : "top-[28%] md:top-24"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Compass className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">NEARBY HIGHLIGHTS</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">
                      {isHighlightsExpanded ? 'Expanded Matrix' : 'Interactive Viewport'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('close');
                    setNearbyHighlights([]);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors z-50 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className={cn(
              "flex flex-col gap-2 overflow-y-auto scrollbar-none",
              isHighlightsExpanded ? "flex-1" : "max-h-[280px]"
            )}>
              {loadingHighlights ? (
                <div className="space-y-3 p-1">
                  {[1, 2, 3].map(i => (
                    <div key={`skeleton-highlights-${i}`} className="flex gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <SkeletonText className="w-2/3 h-3" />
                        <SkeletonText className="w-1/2 h-2" />
                        <div className="flex gap-2">
                          <Skeleton className="w-8 h-3 rounded" />
                          <Skeleton className="w-12 h-3 rounded" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <SkeletonCircle size="w-8 h-8" />
                        <SkeletonCircle size="w-8 h-8" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                nearbyHighlights.map((spot, idx) => (
                  <motion.div
                    key={`nearby-spot-${spot.id || idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "group relative flex flex-col p-3 rounded-2xl bg-white/5 hover:bg-white/10 border transition-all duration-200 cursor-pointer",
                      isHighlightsExpanded ? "border-indigo-500/20" : "border-white/5 hover:border-indigo-500/20"
                    )}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      handlePlaceClick(spot);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail Image */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                        <img 
                          src={spot.imageUrl || (spot.photos && spot.photos.length > 0 ? spot.photos[0].getURI({ maxWidth: 200 }) : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&q=80")}
                          alt={spot.displayName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e: any) => {
                            e.target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&q=80";
                          }}
                        />
                      </div>

                      {/* Meta */}
                      <div className="flex-1 min-w-0 pr-1 select-none">
                        <h4 className="text-[11.5px] font-extrabold text-white truncate group-hover:text-indigo-300 transition-colors leading-tight">{spot.displayName}</h4>
                        <p className="text-[8.5px] text-slate-400 truncate uppercase mt-0.5">{spot.types?.[0]?.replace(/_/g, ' ') || "point of interest"}</p>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-0.5 text-[10px] text-amber-400 font-bold font-mono">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{spot.rating?.toFixed(1) || "4.5"}</span>
                          </div>
                          {spot.userRatingCount && (
                            <span className="text-[9px] font-mono text-slate-500 font-medium">({spot.userRatingCount})</span>
                          )}
                        </div>
                      </div>

                      {/* Actions Cluster */}
                      <div className="flex flex-col gap-1.5 shrink-0 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('success');
                            const isAdded = bookmarkedSpotIds.has(spot.id);
                            
                            const nextIds = new Set(bookmarkedSpotIds);
                            if (isAdded) {
                              nextIds.delete(spot.id);
                              setBookmarkedSpotIds(nextIds);
                            } else {
                              nextIds.add(spot.id);
                              setBookmarkedSpotIds(nextIds);
                              const lat = typeof spot.location?.lat === 'function' ? spot.location.lat() : (spot.location?.lat || spot.lat);
                              const lng = typeof spot.location?.lng === 'function' ? spot.location.lng() : (spot.location?.lng || spot.lng);
                              handleQuickSaveBookmark(lat, lng, spot.displayName);
                            }
                          }}
                          className={cn(
                            "p-2 rounded-xl transition-all flex items-center justify-center w-8 h-8 active:scale-95",
                            bookmarkedSpotIds.has(spot.id) 
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                              : "bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5"
                          )}
                          title="Save to Travel Diary"
                        >
                          <Heart className={cn("w-4 h-4", bookmarkedSpotIds.has(spot.id) && "fill-current")} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('switch');
                            const lat = typeof spot.location?.lat === 'function' ? spot.location.lat() : (spot.location?.lat || spot.lat);
                            const lng = typeof spot.location?.lng === 'function' ? spot.location.lng() : (spot.location?.lng || spot.lng);
                            if (lat && lng) {
                              animateFlyTo(map, { lat, lng }, 18.2, 55, 35, 1400);
                              setMapCenter({ lat, lng });
                              setSelectedPlace(spot);
                              setShowList(true);
                            }
                          }}
                          className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 transition-all flex items-center justify-center w-8 h-8 active:scale-95"
                          title="Cinematic Fly-To"
                        >
                          <Navigation className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Details Section */}
                    <AnimatePresence>
                      {isHighlightsExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-3 pt-3 border-t border-white/5 space-y-3"
                        >
                          {/* Rich Galleries Grid */}
                          {spot.photos && spot.photos.length > 0 && (
                            <div>
                              <span className="text-[8px] font-black tracking-widest uppercase text-slate-500 font-mono mb-1.5 block">Photo Gallery</span>
                              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1">
                                {spot.photos.slice(0, 5).map((photo: any, pid: number) => (
                                  <img 
                                    key={pid}
                                    src={photo.getURI({ maxWidth: 200 })}
                                    alt="Place"
                                    className="w-16 h-16 rounded-xl object-cover shrink-0 snap-start border border-white/10"
                                    referrerPolicy="no-referrer"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Hours */}
                          {spot.regularOpeningHours?.weekdayDescriptions && spot.regularOpeningHours.weekdayDescriptions.length > 0 && (
                            <div>
                              <span className="text-[8px] font-black tracking-widest uppercase text-slate-500 font-mono mb-1.5 block">Operating Hours</span>
                              <p className="text-[10px] text-slate-300 font-medium leading-relaxed bg-[#0b0d12]/50 p-2 rounded-lg border border-white/5">
                                {spot.regularOpeningHours.weekdayDescriptions[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}
                              </p>
                            </div>
                          )}

                          {/* Top Review */}
                          {spot.reviews && spot.reviews.length > 0 && (
                            <div>
                              <span className="text-[8px] font-black tracking-widest uppercase text-slate-500 font-mono mb-1.5 block">Top Intel Report</span>
                              <div className="bg-[#0b0d12]/50 p-2.5 rounded-lg border border-white/5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: spot.reviews[0].rating || 5 }).map((_, rid) => (
                                      <Star key={rid} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    ))}
                                  </div>
                                  <span className="text-[8px] text-slate-400 truncate">{spot.reviews[0].authorAttribution?.displayName}</span>
                                </div>
                                <p className="text-[9.5px] italic text-slate-300 font-sans leading-snug line-clamp-3">
                                  "{spot.reviews[0].text}"
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                ))
              )}
            </div>

            {/* Note */}
            <div className="text-center pt-2 border-t border-white/5 shrink-0 select-none">
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">
                {isHighlightsExpanded ? 'Tap To Collapse' : 'Tap To Expand Feed Matrices'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slidiable Left / Outer Overlay Panel containing search details or mode statistics (Z-index: 15) */}
      {!isCinematicMode && <LiveSocialFeed />}

      <WeatherEffects 
        mapTheme={mapTheme}
        activeWeather={activeWeather}
        weather={currentWeatherData}
      />

      <CommunityActivityLayer isIdle={isMapIdle} />

      <AnimatePresence>
        {['Simulation', 'Genie', 'Cosmic', 'Neo-Tokyo'].includes(mapTheme) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
          >
            {/* Scanline overlay for cyber themes */}
            {(mapTheme === 'Simulation' || mapTheme === 'Neo-Tokyo') && (
              <div className="absolute inset-0 scanline opacity-20" />
            )}
            
            {/* Context-aware HUD Overlays */}
            {mapTheme === 'Simulation' && (
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[#00ff41]/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_100%)] opacity-30" />
                <div className="absolute top-24 left-10 font-mono text-[9px] text-[#00ff41]/40 uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-1.5 mb-2 font-bold">
                    <div className="w-1.5 h-1.5 bg-[#00ff41] animate-pulse rounded-full" />
                    <span>Live Rendering V2.4</span>
                  </div>
                  Spatial: {mapCenter.lat.toFixed(4)}N / {mapCenter.lng.toFixed(4)}E
                </div>
              </div>
            )}
            {mapTheme === 'Genie' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 right-10 flex flex-col items-end gap-1 opacity-40">
                  <span className="text-[10px] font-bold text-purple-400 border-r border-purple-500 pr-2">Genie Intuition Active</span>
                  <span className="text-[8px] text-purple-400/50">Semantic Context Layer</span>
                </div>
              </div>
            )}
            {mapTheme === 'Neo-Tokyo' && (
              <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-20 left-10 opacity-60">
                    <div className="px-2 py-0.5 bg-pink-500 text-white text-[9px] font-black uppercase tracking-widest mb-1 italic">Tokyo Protocol</div>
                    <div className="px-2 py-0.5 bg-cyan-500 text-black text-[9px] font-black uppercase tracking-widest italic">Sync 0.1.4</div>
                 </div>
              </div>
            )}
            {mapTheme === 'Cosmic' && (
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute bottom-24 right-10 font-sans text-[10px] text-slate-500 tracking-[0.3em] uppercase">Sector Alpha Scanned</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute top-[env(safe-area-inset-top,5rem)] left-0 bottom-0 w-full md:top-24 md:left-6 md:bottom-24 md:w-[380px] md:h-auto bg-slate-900/90 backdrop-blur-3xl border border-white/10 md:rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] z-50 overflow-hidden flex flex-col pointer-events-auto transition-shadow duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,1)]"
          >
            <div className="absolute top-4 right-4 z-[60]">
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowList(false);
                }}
                className="p-1.5 rounded-full bg-slate-800/40 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white transition-all shadow-xl hover:scale-110 active:scale-95 pointer-events-auto"
               >
                <X className="w-4 h-4" />
               </button>
            </div>
            <AnimatePresence mode="wait">
              {selectedPlace ? (
                <motion.div 
                  key="details-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="fixed inset-0 z-[100] pointer-events-none flex items-end md:items-start justify-end p-0 md:p-6 pb-[env(safe-area-inset-bottom,0px)]"
                >
                  <motion.div 
                    initial={isMobile ? { y: "100%", opacity: 1 } : { x: 300, opacity: 0 }}
                    animate={{ y: 0, x: 0, opacity: 1 }}
                    exit={isMobile ? { y: "100%", opacity: 1 } : { x: 300, opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="w-full md:w-[420px] h-[92vh] md:h-[80vh] bg-[#0f1115]/95 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto rounded-t-[2.5rem] md:rounded-[2.5rem] border border-white/10"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`details-content-${selectedPlace.id || selectedPlace.displayName}`}
                        initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                        className="w-full h-full"
                      >
                        <PlaceDetailsPanel 
                          place={selectedPlace} 
                          onBack={() => setSelectedPlace(null)} 
                          onClose={() => { triggerHaptic('close'); setSelectedPlace(null); setShowList(false); }} 
                          onShowRoute={() => handleShowRoute(selectedPlace)}
                          onSetRoutingOrigin={() => {
                            if (routingOrigin?.id === selectedPlace.id) {
                              setRoutingOrigin(null);
                            } else {
                              setRoutingOrigin(selectedPlace);
                            }
                          }}
                          isRoutingOrigin={routingOrigin?.id === selectedPlace?.id}
                          user={user} 
                          weather={activeWeather}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div 
                  key="list" 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex flex-col h-full bg-transparent"
                >
                  {/* Back / Panel Header */}
                  <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-2 h-2 rounded-full animate-ping", modeStyles.bgAccent)} />
                      <h3 className="font-display font-bold text-base text-white tracking-tight capitalize">
                        {showingSaved ? "Saved OS Vault" : `${activeMode} Mode Hub`}
                      </h3>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        e.preventDefault(); 
                        triggerHaptic('close'); 
                        setShowList(false); 
                      }} 
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90 pointer-events-auto"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                {/* Main scrollable body container: Persistent View Stack with CSS Toggling */}
                <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-4 scrollbar-thin scrollbar-thumb-slate-800 relative">
                  
                  {/* EXPLORE & DISCOVERY LAYER (Active for all, social, genius) */}
                  <motion.div 
                    initial={false}
                    animate={{ 
                      opacity: (activeMode === 'all' || activeMode === 'social' || activeMode === 'genius' || activeCollection) ? 1 : 0, 
                      y: (activeMode === 'all' || activeMode === 'social' || activeMode === 'genius' || activeCollection) ? 0 : 20,
                      pointerEvents: (activeMode === 'all' || activeMode === 'social' || activeMode === 'genius' || activeCollection) ? 'auto' : 'none'
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={cn(
                      "space-y-5",
                      !(activeMode === 'all' || activeMode === 'social' || activeMode === 'genius' || activeCollection) && "absolute inset-x-4 top-4"
                    )}
                  >
                    {/* MODE CUSTOM INSIGHTS HEADER CARD */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 relative overflow-hidden shadow-xl">
                      <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <MapIcon className="w-24 h-24" />
                      </div>

                      <div className="space-y-1 relative z-10">
                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Active Map Mode</span>
                        <h4 className={cn("text-lg font-display font-extrabold capitalize leading-tight flex items-center gap-1.5", modeStyles.accent)}>
                          {activeCollection ? 'List Discovery' : `${activeMode} Explorer`}
                        </h4>
                        <div className="pt-1.5 flex flex-wrap gap-1">
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                            {activeMode === 'all' ? 'LIVE' : activeMode === 'social' ? 'SYNC' : activeMode === 'genius' ? 'CORE' : activeMode === 'perks' ? 'EARN' : 'OS'}
                          </span>
                          <p className="text-xs text-slate-400 leading-tight">
                            {activeMode === 'all' && "Certified local hotspots."}
                            {activeMode === 'social' && "Real-time friend coordinates."}
                            {activeMode === 'genius' && "AI-curated spatial engine."}
                            {activeMode === 'perks' && "Instant merchant cashback."}
                            {activeMode === 'profile' && "Managed wallet telemetry."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CATEGORY FILTER - Horizontal Scrollable */}
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                      {['All', 'Coffee', 'Dining', 'Parks', 'Cultural', 'Shopping'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border",
                            selectedCategory === cat 
                              ? "bg-rose-500 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
                              : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* SPOTS DISCOVERY LIST - Unified Mock + Search results */}
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="flex justify-between items-center px-1">
                        <h5 className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                          {activeCollection ? 'Collection Nodes' : (activeMode === 'all' ? 'Certified OS Nodes' : `${activeMode} Discovery`)}
                        </h5>
                        <span className="text-[9px] font-mono text-slate-600">{(filteredMockPlaces.length + filteredPlaces.length)} NODES</span>
                      </div>
                      
                      {(filteredMockPlaces.length === 0 && filteredPlaces.length === 0) ? (
                        <div className="py-8 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                          <MapPin className="w-6 h-6 text-slate-700 mx-auto mb-2 opacity-20" />
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">No indexed nodes in this mode</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Search Results Filter Chips */}
                          {places.length > 0 && (
                            <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-none">
                              {[
                                { id: 'all', label: 'All' },
                                { id: 'nearby', label: 'Nearby (<3km)' },
                                { id: 'high_rated', label: '★ 4.5+ Rated' },
                                { id: 'open_now', label: 'Open Now' }
                              ].map((f) => (
                                <button
                                  key={f.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHaptic('switch');
                                    setSearchFilter(f.id as any);
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0",
                                    searchFilter === f.id 
                                      ? "bg-rose-500 border-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                                  )}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Search Results First (High Intent) */}
                          {isSearching ? (
                            <div className="space-y-3 p-1">
                              {[1, 2, 3].map(i => (
                                <div key={`skeleton-search-${i}`} className="flex gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                  <div className="flex-1 space-y-2">
                                    <Skeleton className="w-2/3 h-4 rounded-full" />
                                    <Skeleton className="w-1/2 h-3 rounded-full" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            filteredPlaces.map((p, idx) => (
                              <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: idx * 0.04, duration: 0.3 }}
                                 key={`search-list-${p.id}`}
                                 onClick={() => {
                                   triggerHaptic('open_panel');
                                   handlePlaceClick(p);
                                 }}
                                 className="bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 rounded-2xl p-3 flex gap-3 cursor-pointer group transition-all"
                              >
                                 <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                                   <Search className="w-5 h-5" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                 <h6 className="text-[11px] font-black text-white uppercase tracking-tight truncate group-hover:text-rose-400 transition-colors">{p.displayName}</h6>
                                 <p className="text-[9px] text-slate-500 truncate mt-0.5">{p.formattedAddress}</p>
                               </div>
                            </motion.div>
                          )))}

                          {/* Mock Curation (Atmospheric) */}
                          {filteredMockPlaces.slice(0, 10).map((p, idx) => (
                            <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: (filteredPlaces.length + idx) * 0.04, duration: 0.3 }}
                               key={`curr-list-spot-${p.id}`}
                               onClick={() => {
                                 triggerHaptic('open_panel');
                                 handlePlaceClick(p);
                               }}
                               className="bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 rounded-2xl p-3 flex gap-3 cursor-pointer group transition-all"
                            >
                              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                <img src={p.imageUrl} alt="" className="w-full h-full object-cover grayscale-[0.2] transition-all" />
                              </div>
                              <div className="flex-1 min-w-0 py-0.5">
                                <h6 className="text-[11px] font-black text-white uppercase tracking-tight truncate group-hover:text-rose-400 transition-colors">{p.displayName}</h6>
                                <p className="text-[9px] text-slate-500 truncate mt-0.5 font-medium">{p.formattedAddress}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex items-center gap-1 text-[9px] text-amber-400/80 font-bold">
                                    ★ {p.rating}
                                  </div>
                                  {p.matchScore && <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">{p.matchScore}%</span>}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* PROFILE / OS HUB LAYER */}
                  <motion.div 
                    initial={false}
                    animate={{ 
                      opacity: activeMode === 'profile' ? 1 : 0, 
                      y: activeMode === 'profile' ? 0 : 20,
                      pointerEvents: activeMode === 'profile' ? 'auto' : 'none'
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={cn(
                      "space-y-6",
                      activeMode !== 'profile' && "absolute inset-x-4 top-4"
                    )}
                  >
                    <div className="space-y-6">

                      {/* OS Hub High-Fidelity Tab Selector Navigation */}
                      <div className="flex bg-[#07090d]/90 p-1 rounded-2xl border border-slate-800 gap-1 backdrop-blur-md overflow-x-auto scrollbar-hide">
                        {[
                          { id: 'hub', label: 'Nodes & Core', icon: Layers },
                          { id: 'summary', label: 'AI Log', icon: Sparkles },
                          { id: 'diary', label: 'Diary', icon: BookOpen },
                          { id: 'planner', label: 'Trip Planner', icon: Compass },
                          { id: 'recommended', label: 'Recommended', icon: Sparkles },
                          { id: 'events', label: 'Events', icon: Calendar },
                          { id: 'offline', label: 'Cache Control', icon: Download }
                        ].map(tab => {
                          const IconComp = tab.icon;
                          const active = activeHubTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic('switch');
                                setActiveHubTab(tab.id as any);
                              }}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all border",
                                active 
                                  ? "bg-rose-500 border-rose-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)]"
                                  : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
                              )}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeHubTab}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        >
                          {activeHubTab === 'hub' && (
                            <div className="space-y-6">
                              {/* Visual Fidelity & Accessibility */}
                              <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Visual Fidelity & Accessibility</h3>
                                <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    onClick={() => setAccessibilityScale(accessibilityScale === 1 ? 1.25 : 1)}
                                    className={cn(
                                      "p-4 rounded-3xl border transition-all text-left space-y-2",
                                      accessibilityScale > 1 ? "bg-indigo-500/20 border-indigo-500/50" : "bg-[#111319]/80 border-slate-800"
                                    )}
                                  >
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center translate-y-0 shadow-lg", accessibilityScale > 1 ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400")}>
                                      <span className="text-sm font-black text-[10px]">A+</span>
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Legibility</div>
                                    <p className="text-[8px] text-slate-500 font-medium leading-tight">Scales interface text for optimal accessibility.</p>
                                  </button>
                                  <button 
                                    onClick={() => setIsPrefetchingEnabled(!isPrefetchingEnabled)}
                                    className={cn(
                                      "p-4 rounded-3xl border transition-all text-left space-y-2",
                                      isPrefetchingEnabled ? "bg-emerald-500/20 border-emerald-500/50" : "bg-[#111319]/80 border-slate-800"
                                    )}
                                  >
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center translate-y-0 shadow-lg", isPrefetchingEnabled ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400")}>
                                      <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Prefetch</div>
                                    <p className="text-[8px] text-slate-500 font-medium leading-tight">Predictive data caching for lag-free exploration.</p>
                                  </button>
                                </div>
                              </div>

                              {/* Traveler Rewards & Identity */}
                              <TravelerBadges />

                              {/* CURATED COLLECTIONS - Moved to OS HUB Library */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                              <Layers className="w-4 h-4 text-rose-500" />
                              <h5 className="text-[10px] uppercase font-black tracking-widest text-slate-400">Discovery Library</h5>
                            </div>
                            {CURATED_LISTS.map((list, idx) => (
                              <motion.div 
                                key={list.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => {
                                  triggerHaptic('tap');
                                  setActiveCollection(list.id);
                                  if (list.id === 'canada_working_holiday') {
                                    setActiveMode('canada');
                                    setMapCenter(CANADA_CENTER);
                                    setMapZoom(13.5);
                                  } else if (list.id === 'night_vision') {
                                    setMapTheme('Night');
                                    triggerFlyover(SEOUL_MOCK_PLACES[1]);
                                  } else {
                                    triggerFlyover(SEOUL_MOCK_PLACES[0]);
                                  }
                                  setShowList(true); // Open panel to show filtered spots
                                }}
                                className={cn(
                                  "p-4 rounded-2xl bg-[#111319]/80 border cursor-pointer group transition-all active:scale-95",
                                  activeCollection === list.id ? "border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : "border-slate-800 hover:border-slate-700"
                                )}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h6 className={cn(
                                      "text-[11px] font-black uppercase tracking-tight transition-colors",
                                      activeCollection === list.id ? "text-rose-400" : "text-white group-hover:text-rose-400"
                                    )}>{list.title}</h6>
                                    <p className="text-[9px] text-slate-500 mt-1 font-medium leading-relaxed">{list.description}</p>
                                  </div>
                                  <ChevronRight className={cn(
                                    "w-4 h-4 transition-all",
                                    activeCollection === list.id ? "text-rose-500" : "text-slate-700 group-hover:text-rose-500"
                                  )} />
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* OS HUB: SAVED PLACES & VOUCHERS INTEGRATION */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                               <div className="flex items-center gap-2">
                                 <Bookmark className="w-4 h-4 text-amber-500" />
                                 <span className="text-[10px] font-black uppercase text-slate-400">Bookmarks</span>
                               </div>
                               <div className="space-y-2 overflow-y-auto max-h-[160px] scrollbar-thin">
                                 {savedPlaces.length === 0 ? (
                                   <p className="text-[9px] text-slate-600 italic">No bookmarks indexed.</p>
                                 ) : (
                                   savedPlaces.map(p => (
                                     <button 
                                       key={p.id}
                                       onClick={() => {
                                         triggerHaptic('open_panel');
                                         handlePlaceClick(p);
                                       }}
                                       className="w-full p-2 text-left bg-slate-800/40 rounded-xl hover:bg-slate-700/40 transition-colors group"
                                     >
                                      <p className="text-[10px] font-bold text-white truncate group-hover:text-rose-400">{p.displayName || (p as any).name || 'Untitled Spot'}</p>
                                       <p className="text-[8px] text-slate-500 truncate mt-0.5">{p.formattedAddress || 'Global Coordinate'}</p>
                                     </button>
                                   ))
                                 )}
                               </div>
                            </div>

                            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                               <div className="flex items-center gap-2">
                                 <Ticket className="w-4 h-4 text-emerald-500" />
                                 <span className="text-[10px] font-black uppercase text-slate-400">Tokens</span>
                               </div>
                               <div className="space-y-2 overflow-y-auto max-h-[160px] scrollbar-thin">
                                 {MOCK_COUPONS.map(c => (
                                   <button 
                                     key={c.id}
                                     onClick={() => {
                                       triggerHaptic('open_panel');
                                       // Coupons usually link to specific partners or categories
                                       setSelectedCategory('Coffee');
                                       setActiveMode('perks');
                                       triggerFlyover(SEOUL_MOCK_PLACES[4]);
                                     }}
                                     className="w-full p-2 text-left bg-slate-800/40 rounded-xl hover:bg-emerald-500/10 transition-colors group"
                                   >
                                     <p className="text-[10px] font-bold text-emerald-400">{c.benefit}</p>
                                     <p className="text-[8px] text-slate-500 mt-0.5">{c.shopName}</p>
                                   </button>
                                 ))}
                               </div>
                            </div>
                          </div>

                          {/* VANTI TELEMETRY ANALYTICS DASHBOARD */}
                          <AnalyticsDashboard savedPlaces={savedPlaces} trajectoryLength={trajectory.length} />

                          {/* [PETPY DNA]: PlaceMe Background Records & EOD Movie */}
                          <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-950/20 to-slate-950 border border-violet-500/20 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Activity className="w-4 h-4 text-violet-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">PlaceMe Records</h3>
                              </div>
                              <button 
                                onClick={() => {
                                    setIsRecording(!isRecording);
                                    triggerHaptic('switch');
                                }}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                    isRecording ? "bg-rose-500 text-white animate-pulse" : "bg-slate-800 text-slate-400"
                                )}
                              >
                                {isRecording ? "● RECORDING" : "DISABLED"}
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                               <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                  <span>SENSORY LOGS</span>
                                  <span>{trajectory.length} NODES</span>
                               </div>
                               <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-violet-500" 
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${Math.min(100, trajectory.length * 5)}%` }}
                                  />
                               </div>
                            </div>

                            <button 
                              onClick={simulateEodMovie}
                              disabled={trajectory.length < 2}
                              className="w-full py-3 bg-white text-black font-display text-xs font-black uppercase tracking-[0.1em] rounded-2xl hover:bg-violet-400 hover:text-white transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-2 shadow-xl shadow-violet-500/10 active:scale-95"
                            >
                              <Video className="w-4 h-4" /> Generate EOD Cinematic Movie
                            </button>
                            <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                              펫피 산책 루프를 이식한 앰비언트 센싱 모드입니다. <br/>
                              저녁 8시가 되면 오늘의 궤적을 3D 시네마틱 무비로 복개합니다.
                            </p>
                          </div>
                          </div>
                          )}

                          {activeHubTab === 'offline' && (
                            <div className="p-4 rounded-xl bg-gray-900/50 border border-slate-800 space-y-4">
                              <div className="flex justify-between items-center">
                                <h6 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 font-sans">
                                  <Download className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Area Cache Node
                                </h6>
                                {isDownloading ? (
                                  <span className="text-[9px] font-mono font-bold text-rose-400 animate-pulse">
                                    SYNCING...
                                  </span>
                                ) : downloadSuccess ? (
                                  <span className="text-[9px] font-mono font-bold text-emerald-400">
                                    CACHED
                                  </span>
                                ) : null}
                              </div>
                              
                              <button
                                type="button"
                                onClick={handleDownloadArea}
                                disabled={isDownloading}
                                className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                              >
                                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <Download className="w-4 h-4" />}
                                {isDownloading ? 'Capturing Area...' : 'Download Current Bounds'}
                              </button>

                              {isDownloading ? (
                                <div className="space-y-2 pt-2">
                                  <div className="flex justify-between items-center text-[9px] font-mono">
                                    <span className="text-slate-400 font-medium uppercase">{downloadStage}</span>
                                    <span className="text-rose-400 font-extrabold">{downloadProgress}%</span>
                                  </div>
                                  <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-rose-500" 
                                      initial={{ width: "0%" }}
                                      animate={{ width: `${downloadProgress}%` }}
                                      transition={{ ease: "easeInOut" }}
                                    />
                                  </div>
                                </div>
                              ) : null}

                              {offlineAreas.length > 0 && (
                                <div className="space-y-2 pt-4">
                                  <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cached Regions</h5>
                                  {offlineAreas.map(area => (
                                    <div key={area.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-slate-200">{area.name}</span>
                                      <button onClick={() => deleteOfflineArea(area.id)} className="text-rose-400 hover:text-rose-300">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {activeHubTab === 'planner' && (
                            <TripPlannerTab 
                              map={map}
                              savedPlaces={savedPlaces}
                              userLocation={userLocation}
                              triggerHaptic={(ty: any) => triggerHaptic(ty === 'heavy' ? 'impact' : ty)}
                              onFocusCoordinates={(lat, lng) => {
                                if (map) {
                                  map.panTo({ lat, lng });
                                  map.setZoom(16.5);
                                }
                              }}
                            />
                          )}

                          {activeHubTab === 'summary' && (
                            <AILogPanel onClose={() => setActiveHubTab('hub')} />
                          )}

                          {activeHubTab === 'diary' && (
                            <TravelDiary
                              user={user}
                              selectedPlace={selectedPlace}
                              userLocation={userLocation}
                              language={language}
                              onClose={() => {
                                 setActiveMode('all');
                                 triggerHaptic('close');
                              }}
                              onRecenter={(lat, lng) => {
                                if (map) {
                                  map.panTo({ lat, lng });
                                  map.setZoom(14.5);
                                }
                              }}
                            />
                          )}

                          {activeHubTab === 'recommended' && (
                            <RecommendedTab 
                              savedPlaces={savedPlaces}
                              onFocusPlace={(place) => {
                                if (map && place.lat && place.lng) {
                                  map.panTo({ lat: place.lat, lng: place.lng });
                                  map.setZoom(15);
                                }
                              }}
                            />
                          )}

                          {activeHubTab === 'events' && (
                            <CulturalEventsTab 
                              placesLib={placesLib}
                              mapCenter={debouncedCenter}
                              setEventPlaces={setEventPlaces}
                              onFocusPlace={(place) => {
                                if (map && place.location) {
                                  map.panTo({ lat: place.location.lat(), lng: place.location.lng() });
                                  map.setZoom(16);
                                  handlePlaceClick(place);
                                }
                              }}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* SOCIAL ACTIVITY LAYER */}
                  <motion.div 
                    initial={false}
                    animate={{ 
                      opacity: activeMode === 'social' ? 1 : 0, 
                      y: activeMode === 'social' ? 0 : 20,
                      pointerEvents: activeMode === 'social' ? 'auto' : 'none'
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={cn(
                      "space-y-4",
                      activeMode !== 'social' && "absolute inset-x-4 top-4"
                    )}
                  >
                    <div className="space-y-4">
                      {/* Active friends scrolling */}
                      <div>
                        <h5 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2.5">Live Local Friends</h5>
                        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                          {MOCK_FRIENDS.map((f) => (
                            <div 
                              key={f.id}
                              onClick={() => {
                                triggerHaptic('open_panel');
                                setSelectedPlace({
                                  id: f.id,
                                  displayName: f.name,
                                  formattedAddress: `Active near ${f.activeLocation}`,
                                  lat: f.lat,
                                  lng: f.lng,
                                  types: ['friend_marker'],
                                  imageUrl: f.avatar,
                                  socialActivity: `Status: Checked-in at ${f.activeLocation} (${f.lastActive})`,
                                  mode: 'social'
                                });
                              }}
                              className="flex flex-col items-center shrink-0 w-20 text-center cursor-pointer"
                            >
                              <div className="w-12 h-12 rounded-full border-2 border-rose-500 p-0.5 bg-slate-900 hover:scale-105 transition-transform">
                                <img src={f.avatar} alt={f.name} className="w-full h-full rounded-full object-cover" />
                              </div>
                              <span className="text-[10px] text-slate-200 mt-1.5 truncate w-16 leading-tight">{f.name.split(' ')[0]}</span>
                              <span className="text-[8px] text-rose-400 tracking-tight font-extrabold mt-0.5 uppercase">{f.lastActive}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Rendezvous Centerpoint Widget */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 to-slate-950 border border-rose-500/10 space-y-3.5 shadow-md">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 tracking-wider">
                            ⚡ AI Rendezvous
                          </span>
                        </div>
                        <h6 className="text-[13px] font-bold text-white leading-tight">Optimal Social Hub Solver</h6>
                        <button
                          onClick={() => {
                            if (MOCK_FRIENDS.length > 0) {
                              triggerHaptic('mode3d');
                              let totalLat = 0, totalLng = 0;
                              MOCK_FRIENDS.forEach(f => { totalLat += f.lat; totalLng += f.lng; });
                              const avgLat = totalLat / MOCK_FRIENDS.length;
                              const avgLng = totalLng / MOCK_FRIENDS.length;
                              if (map) { map.panTo({ lat: avgLat, lng: avgLng }); map.setZoom(15); }
                              setSocialMeetpoint({ lat: avgLat, lng: avgLng, name: "AI Rendezvous Midpoint" });
                            }
                          }}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Balance Locations
                        </button>
                        {socialMeetpoint && (
                          <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl">
                            <p className="text-[10px] text-white font-bold">{socialMeetpoint.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* GENIUS / AI LAYER */}
                  <motion.div 
                    initial={false}
                    animate={{ 
                      opacity: activeMode === 'genius' ? 1 : 0, 
                      y: activeMode === 'genius' ? 0 : 20,
                      pointerEvents: activeMode === 'genius' ? 'auto' : 'none'
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={cn(
                      "space-y-4",
                      activeMode !== 'genius' && "absolute inset-x-4 top-4"
                    )}
                  >
                    {/* WEATHER-AWARE ROUTE OPTIMIZATION MODULE */}
                    <WeatherRouteOptimizer
                      userLocation={userLocation}
                      selectedPlace={selectedPlace}
                      activeWeather={activeWeather}
                      triggerHaptic={triggerHaptic}
                      onFocusCoordinates={(lat, lng) => {
                        if (map) {
                          map.panTo({ lat, lng });
                          map.setZoom(16);
                        }
                      }}
                    />

                    <div className="p-4.5 rounded-2xl bg-gradient-to-br from-amber-950/20 to-slate-950 border border-amber-500/15 space-y-4 shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded tracking-wider">Omnia AI Curation</span>
                      </div>
                      <button
                        onClick={() => {
                          triggerHaptic('switch');
                          setIsQuantumScanning(true);
                          setQuantumScannerLogs(["[SYS] ANALYZING SPATIAL INTENT..."]);
                          setTimeout(() => { setIsQuantumScanning(false); triggerFlyover(CANADA_MOCK_PLACES[0]); }, 1500);
                        }}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase rounded-xl shadow-md flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> Start Quantum Scan
                      </button>
                    </div>
                  </motion.div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {isAROpen && (
        <ARView 
          places={filteredMockPlaces}
          friends={visibleFriends}
          userLocation={userLocation}
          onClose={() => setIsAROpen(false)}
          onSelectPlace={handlePlaceClick}
        />
      )}
    </AnimatePresence>

    <MobileControlDrawer 
        isOpen={showControls}
        onClose={() => setShowControls(false)}
        onDownload={handleDownloadArea}
        isDownloading={isDownloading}
        isPowerEfficiencyEnabled={isPowerEfficiencyEnabled}
        onTogglePowerEfficiency={() => setIsPowerEfficiencyEnabled(!isPowerEfficiencyEnabled)}
        onToggleMapType={() => {
            setMapType(prev => {
              if (prev === 'roadmap') return 'satellite';
              if (prev === 'satellite') return 'hybrid';
              return 'roadmap';
            });
        }}
        setMapTheme={setMapTheme}
        onTogglePois={() => {
            triggerHaptic('switch');
            setShowPois(!showPois);
        }}
        onToggle3D={() => {
            triggerHaptic('switch');
            const newState = !is3DActive;
            setIs3DActive(newState);
            if (map) {
                map.moveCamera({
                    tilt: newState ? 67.5 : 0,
                    heading: (map.getHeading() || 0) + (newState ? 25 : -25),
                    zoom: Math.max(map.getZoom() || 17, newState ? 17.5 : 15),
                });
            }
        }}
        onToggleTerrain={() => {
            triggerHaptic('switch');
            setIsTerrainActive(!isTerrainActive);
        }}
        onToggleFlightMode={() => {
            triggerHaptic('mode3d');
            const newState = !isFlightMode;
            setIsFlightMode(newState);
            if (newState && map) {
                map.setTilt(65);
                map.setZoom(17);
            }
        }}
        showPois={showPois}
        is3DActive={is3DActive}
        isTerrainActive={isTerrainActive}
        isFlightMode={isFlightMode}
        currentMapType={mapType}
        currentTheme={mapTheme}
        themeOverride={themeOverride}
        onThemeOverrideChange={setThemeOverride}
        onOpenSettings={() => setShowSettingsModal(true)}
        recentSearches={recentSearches}
    />

    <SettingsModal
      isOpen={showSettingsModal || !!isSettingsOpen}
      onClose={() => {
        setShowSettingsModal(false);
        setIsSettingsOpen?.(false);
      }}
      user={user}
      setMapType={setMapType}
      onOpenDeveloperInsights={() => {
        triggerHaptic('switch');
        setIsDeveloperInsightsOpen(true);
      }}
    />

    <DeveloperInsights
      isOpen={isDeveloperInsightsOpen}
      onClose={() => setIsDeveloperInsightsOpen(false)}
      stats={{
        diaryEntryCount: diaryCount,
        savedPlaceCount: savedPlaces.length,
        offlineRegionCount: offlineAreas.length,
        searchHistoryCount: user ? recentSearches.length : localRecentSearches.length
      }}
      perfStats={prefStats}
    />

    {/* Quick-Save Bookmark Status Toast */}
    <AnimatePresence>
      {quickSaveStatus.status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-11/12 bg-slate-950/95 backdrop-blur-md border border-indigo-500/30 p-4 rounded-3xl shadow-2xl shadow-indigo-950/40 flex items-center gap-3 pointer-events-auto"
        >
          {quickSaveStatus.status === 'saving' && (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
          )}
          {quickSaveStatus.status === 'success' && (
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
          )}
          {quickSaveStatus.status === 'error' && (
            <div className="w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500 text-rose-450 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase font-black block leading-none">
              {quickSaveStatus.status === 'saving' ? 'GEOLOCATING & PINNING' : quickSaveStatus.status === 'success' ? 'BOOKMARKED SUCCESSFULLY' : 'PIN ERROR'}
            </span>
            <p className="text-[10px] text-slate-300 font-extrabold mt-1 break-words leading-snug">
              {quickSaveStatus.message}
            </p>
            {quickSaveStatus.locationName && (
              <p className="text-[8px] text-indigo-400 font-black font-mono mt-0.5 truncate uppercase">
                📍 {quickSaveStatus.locationName}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Immersive Sci-Fi Map-Style HUD Transition Overlay - REMOVED AS PER USER REQUEST */}
    <AtmosphericOverlay weather={currentWeatherData} />
    <SocialVibeOverlay />
    
    <GestureOnboarding />

    {showDestinationPicker && (
      <DestinationPickerModal 
        onClose={() => setShowDestinationPicker(false)}
        onSelect={(city) => {
          setShowDestinationPicker(false);
          setSelectedCityForBriefing(city);
        }}
      />
    )}
    {selectedCityForBriefing && (
      <DestinationBriefingModal 
        city={selectedCityForBriefing}
        onClose={() => setSelectedCityForBriefing(null)}
      />
    )}

    {userLocation && (
      <QuickViewBottomSheet 
        lat={userLocation.lat} 
        lng={userLocation.lng} 
        triggerHaptic={triggerHaptic}
      />
    )}
    
    </motion.div>
    </div>
  );
});

// --- HUD Components for Global Shell ---

export function SpatialTelemetry() {
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const [isOpen, setIsOpen] = useState(false);
  
  if (!mapViewport?.center) return null;

  const { lat, lng } = mapViewport.center;

  return (
    <motion.div 
      onClick={() => setIsOpen(!isOpen)}
      className="vanti-glass px-4 py-2 rounded-2xl flex items-center gap-4 border-white/5 shadow-none backdrop-blur-3xl group cursor-pointer"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest font-mono">
          {isOpen ? 'PRECISION METRICS' : 'GEOLOCATION'}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-bold text-white/40 font-mono">LAT</span>
            <span className="text-[12px] font-black text-white font-mono tracking-tighter">
              {lat.toFixed(isOpen ? 6 : 4)}
            </span>
          </div>
          {isOpen && (
            <>
              <div className="w-[1px] h-3 bg-white/10" />
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-bold text-white/40 font-mono">LNG</span>
                <span className="text-[12px] font-black text-white font-mono tracking-tighter">
                  {lng.toFixed(6)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="overflow-hidden flex items-center gap-3 border-l border-white/10 pl-3"
          >
             <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest font-mono">ALT</span>
                <span className="text-[12px] font-black text-white font-mono">124M</span>
             </div>
             <div className="flex flex-col gap-0.5">
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest font-mono">HDG</span>
                <span className="text-[12px] font-black text-white font-mono">352°</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isOpen && (
        <span className="text-[10px] text-white/20 font-bold ml-1">...</span>
      )}
    </motion.div>
  );
}

export default VantiMap;
