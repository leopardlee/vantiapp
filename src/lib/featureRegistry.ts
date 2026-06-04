export type FeatureCategory = 'core' | 'exploration' | 'ai_assistant' | 'utility' | 'system';

export interface FeatureMetadata {
  id: string;
  name: string;
  category: FeatureCategory;
  description: string;
  filePath: string;
  complexity: number; // 1 to 5 scale
  dependencies: string[];
  stateKeys: string[];
  status: 'production' | 'active' | 'beta';
  iconName: string;
}

// Fixed core registry tracking the system's modular architecture
export const FEATURE_REGISTRY: FeatureMetadata[] = [
  {
    id: 'hub',
    name: 'Nodes & Core',
    category: 'core',
    description: 'Central controller database, customizable map themes, curated spots, and discovery libraries.',
    filePath: '/src/components/VantiMap.tsx (OS Hub)',
    complexity: 4,
    dependencies: ['React', 'D3.js', '@googlemaps/markerclusterer'],
    stateKeys: ['activeMode', 'mapTheme', 'themeOverride'],
    status: 'production',
    iconName: 'Layers'
  },
  {
    id: 'diary',
    name: 'Travel Diary',
    category: 'exploration',
    description: 'High-fidelity journal linking spatial coordinates, custom notes, persistent storage, and image galleries.',
    filePath: '/src/components/TravelDiary.tsx',
    complexity: 5,
    dependencies: ['React', 'Firebase Firestore', 'Firebase Storage', 'motion/react'],
    stateKeys: ['activeMode'],
    status: 'production',
    iconName: 'BookOpen'
  },
  {
    id: 'planner',
    name: 'Trip Planner',
    category: 'exploration',
    description: 'Comprehensive route building mechanism using Google Maps geometry, distance evaluation, and target markers.',
    filePath: '/src/components/TripPlannerTab.tsx',
    complexity: 4,
    dependencies: ['React', 'Google Maps API', 'lucide-react'],
    stateKeys: ['units', 'recenterTrigger'],
    status: 'production',
    iconName: 'Compass'
  },
  {
    id: 'offline',
    name: 'Cache Control',
    category: 'utility',
    description: 'Offline boundaries downloading simulator, local state persistence, and index size calculation.',
    filePath: '/src/lib/offline.ts',
    complexity: 3,
    dependencies: ['IndexedDB', 'React', 'LocalStorage'],
    stateKeys: ['mapStyle'],
    status: 'production',
    iconName: 'Download'
  },
  {
    id: 'chatbot',
    name: 'Omnia AI Chat',
    category: 'ai_assistant',
    description: 'Conversational intelligent HUD allowing natural language-based spatial location inquiries and real-time context tips.',
    filePath: '/src/components/Chatbot.tsx',
    complexity: 5,
    dependencies: ['React', 'Gemini API SDK', 'Firebase Firestore'],
    stateKeys: ['isOmniaScanning'],
    status: 'production',
    iconName: 'Sparkles'
  },
  {
    id: 'radar',
    name: 'Spatial Radar',
    category: 'exploration',
    description: 'Radar search and discovery mechanism scanning nearest interest points with full circular sweeps.',
    filePath: '/src/components/Radar.tsx',
    complexity: 4,
    dependencies: ['React', 'D3.js', 'geometryLib'],
    stateKeys: ['activeMode', 'selectedCategory'],
    status: 'active',
    iconName: 'Radio'
  },
  {
    id: 'weather',
    name: 'Weather Dashboard',
    category: 'utility',
    description: 'Localized precipitation & temperature HUD reading from real-time meteorological JSON providers.',
    filePath: '/src/components/WeatherDashboard.tsx',
    complexity: 3,
    dependencies: ['Open-Meteo REST API', 'React'],
    stateKeys: ['units'],
    status: 'production',
    iconName: 'CloudRain'
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    category: 'system',
    description: 'Sophisticated interactive node visualizations using fully integrated multi-axis graphs.',
    filePath: '/src/components/AnalyticsDashboard.tsx',
    complexity: 4,
    dependencies: ['React', 'Recharts', 'd3-shape'],
    stateKeys: ['activeMode'],
    status: 'beta',
    iconName: 'BarChart3'
  },
  {
    id: 'speedometer',
    name: 'Speedometer Telemetry',
    category: 'utility',
    description: 'Dynamic digital speedometer dial mapping unit formats dynamically on active viewport actions.',
    filePath: '/src/components/SpeedometerWidget.tsx',
    complexity: 2,
    dependencies: ['React', 'Tailwind CSS'],
    stateKeys: ['units'],
    status: 'production',
    iconName: 'Gauge'
  }
];

export interface DynamicFeatureStats {
  diaryEntryCount: number;
  savedPlaceCount: number;
  offlineRegionCount: number;
  searchHistoryCount: number;
  currentLanguage: 'en' | 'ko';
  currentUnits: 'metric' | 'imperial';
  activeHubTab: string;
  activeMode: string;
  mapTheme: string;
  mapAesthetic: string;
}

export function calculateComplexityMetrics(stats: DynamicFeatureStats) {
  const totalFeatures = FEATURE_REGISTRY.length;
  
  // Calculate average complexity
  const totalComplexity = FEATURE_REGISTRY.reduce((acc, f) => acc + f.complexity, 0);
  const averageComplexity = Number((totalComplexity / totalFeatures).toFixed(2));
  
  // Group by category
  const categoryCounts = FEATURE_REGISTRY.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<FeatureCategory, number>);

  // Determine current system capacity rating based on dynamic counts
  const totalDynamicRecords = 
    stats.diaryEntryCount + 
    stats.savedPlaceCount + 
    stats.offlineRegionCount + 
    stats.searchHistoryCount;

  // Code complexity estimation (rough LOC rating for developer insight)
  const estimatedTotalLinesOfCode = 4481 + 1400 + 400 + 350 + 200 + 300; // estimated codebase volume
  
  return {
    totalFeatures,
    averageComplexity,
    categoryCounts,
    totalDynamicRecords,
    estimatedTotalLinesOfCode,
    healthIndex: totalDynamicRecords > 20 ? 'Optimal (Active Sync)' : 'Stable (Standard Cache)'
  };
}

export function generateAutomatedReport(stats: DynamicFeatureStats) {
  const metrics = calculateComplexityMetrics(stats);
  const timestamp = new Date().toISOString();

  return `=====================================================
            VANTI AUTOMATED USAGE & METADATA REPORT
=====================================================
Generated At        : ${timestamp}
System Health       : ${metrics.healthIndex}
Estimated Code Volume: ~${metrics.estimatedTotalLinesOfCode} Lines of TSX
Registry Count      : ${metrics.totalFeatures} Loaded Modules
Average Complexity  : ${metrics.averageComplexity} / 5.00 Stars

DYNAMIC RECORDS SYNC STATUS:
- Travel Journal Snapshots : ${stats.diaryEntryCount} entries
- Saved Locations (Pins)   : ${stats.savedPlaceCount} locations
- Offline Geo-Cache Zones  : ${stats.offlineRegionCount} areas
- Search History Records   : ${stats.searchHistoryCount} items

METADATA SYSTEM SETTINGS:
- Interface Accent Language: ${stats.currentLanguage.toUpperCase()}
- Unit Configuration       : ${stats.currentUnits.toUpperCase()}
- Current Active Tab UI    : ${stats.activeHubTab.toUpperCase()}
- Current Core Layout Mode : ${stats.activeMode.toUpperCase()}
- Map Visual Theme Layer   : ${stats.mapTheme}
- Map Aesthetic Filter FX  : ${stats.mapAesthetic.toUpperCase()}

MODULE COMPLEXITY INDEX DISTRIBUTION:
${FEATURE_REGISTRY.map(f => `* ${f.name.padEnd(20)} | [${f.category.toUpperCase()}] | Complexity: ${f.complexity}/5 | ${f.status.toUpperCase()}`).join('\n')}
=====================================================`;
}
