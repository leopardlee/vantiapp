import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, MapPin, Star, Phone, Globe, Clock, Navigation, Sparkles, Bookmark, UserCircle, Share2, Award, Zap, X, Calendar, Compass, Eye, Info, Sliders, ThumbsUp, ThumbsDown, Volume2, Timer, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, Loader2, Plus, BookOpen, Camera, Trash2, Edit, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { cn } from '../lib/utils';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import * as d3 from 'd3';
import { useVantiStore } from '../store/vantiStore';
import { Skeleton, SkeletonCircle, SkeletonText } from './common/Skeleton';
import { SpeakButton } from './common/SpeakButton';
import { RouteComparison } from './RouteComparison';
import TrafficDeparturePredictor from './TrafficDeparturePredictor';
import FinanceTracker from './FinanceTracker';

const TaskListItem = ({ loc, key }: { loc: string; key?: any }) => {
  const [done, setDone] = useState(false);
  return (
    <label className={cn("flex items-start gap-2.5 cursor-pointer p-3 rounded-lg transition-colors border select-none group focus-within:ring-2 focus-within:ring-indigo-500", done ? "bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "bg-slate-900/60 border-slate-700/50 hover:bg-slate-800")}>
      <input type="checkbox" className="sr-only" checked={done} onChange={() => setDone(!done)} />
      <div className={cn("mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all", done ? "bg-indigo-500 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-slate-950 border-slate-600 group-hover:border-indigo-400")}>
        {done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </div>
      <span className={cn("text-xs font-sans leading-relaxed transition-all", done ? "line-through text-slate-500" : "text-slate-200")}>{loc}</span>
    </label>
  );
};

interface PlaceDetailsPanelProps {
  key?: React.Key;
  place: any; // Can be Google Place or MockPlace
  onBack: () => void;
  onClose?: () => void;
  onShowRoute?: () => void;
  onSetRoutingOrigin?: () => void;
  isRoutingOrigin?: boolean;
  user: User | null;
  weather?: string | null;
  userLocation?: { lat: number, lng: number } | null;
}

// Sparkline component that uses D3.js to render a tiny popularity trend over the last 6 hours
function TinySparkline({ seedName, refreshTriggers = 0 }: { seedName: string; refreshTriggers?: number }) {
  const containerRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const svg = d3.select(containerRef.current);
    svg.selectAll('*').remove();

    // Generate 6 repeatable points based on characters, perturbed slightly by manual refreshTriggers count
    const points: number[] = [];
    let seed = seedName.charCodeAt(0) || 7;
    for (let i = 0; i < 6; i++) {
      seed = (seed * 17 + 23) % 100;
      const variance = refreshTriggers > 0 ? (Math.sin(refreshTriggers * 1.5 + i) * 15) : 0;
      points.push(Math.min(95, Math.max(10, 15 + (seed % 65) + variance))); 
    }

    const width = 60;
    const height = 14;
    const margin = { top: 2, right: 2, bottom: 2, left: 2 };

    const xScale = d3.scaleLinear()
      .domain([0, 5])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    const lineGen = d3.line<number>()
      .x((_, idx) => xScale(idx))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    const areaGen = d3.area<number>()
      .x((_, idx) => xScale(idx))
      .y0(height)
      .y1(d => yScale(d))
      .curve(d3.curveMonotoneX);

    // Render gradient fill
    const gradientId = `sparkline-grad-${seedName.replace(/[^\w]/g, '-').toLowerCase()}-${refreshTriggers}`;
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    grad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f43f5e') // rose-500
      .attr('stop-opacity', 0.4);

    grad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f43f5e')
      .attr('stop-opacity', 0.0);

    // Add path area
    svg.append('path')
      .datum(points)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', areaGen as any);

    // Dynamic stroke line path
    svg.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e') // rose-500 line
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('d', lineGen as any);

    // Render tiny pulse circle indicators at the end of the sparkline
    const lastIdx = points.length - 1;
    const endX = xScale(lastIdx);
    const endY = yScale(points[lastIdx]);

    svg.append('circle')
      .attr('cx', endX)
      .attr('cy', endY)
      .attr('r', 2)
      .attr('fill', '#fda4af'); // rose-300
  }, [seedName, refreshTriggers]);

  return (
    <svg 
      ref={containerRef} 
      className="w-[60px] h-3.5 overflow-visible shrink-0 select-none pointer-events-none" 
    />
  );
}

function VantiGeometricLoader({ color = "#f43f5e" }: { color?: string }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <motion.path
          fill="none"
          stroke={color}
          strokeWidth="2"
          animate={{
            d: [
              "M 50,20 L 80,50 L 50,80 L 20,50 Z", // Diamond
              "M 20,20 L 80,20 L 80,80 L 20,80 Z", // Square
              "M 50,15 L 90,85 L 10,85 Z",         // Triangle
              "M 50,20 L 80,50 L 50,80 L 20,50 Z"  // Back to Diamond
            ],
            rotate: [0, 90, 180, 270, 360],
            strokeDasharray: ["0 100", "50 50", "100 0", "0 100"]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
      <motion.div 
        className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 1, 0.3]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

const PlaceDetailsPanel = React.memo(function PlaceDetailsPanel({ place, onBack, onClose, onShowRoute, onSetRoutingOrigin, isRoutingOrigin, user, weather, userLocation }: PlaceDetailsPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Travel Journal State
  const [savedPlaceData, setSavedPlaceData] = useState<any | null>(null);
  const [journalNotesInput, setJournalNotesInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  useEffect(() => {
    if (savedPlaceData?.customEmoji) {
      setSelectedEmoji(savedPlaceData.customEmoji);
    } else {
      setSelectedEmoji(null);
    }
  }, [savedPlaceData]);

  const handleEmojiSave = async (emoji: string) => {
    if (!user || !place?.id) return;
    try {
      setSelectedEmoji(emoji);
      const docRef = doc(db, 'users', user.uid, 'savedPlaces', place.id);
      await setDoc(docRef, { customEmoji: emoji }, { merge: true });
      triggerHaptic('success');
    } catch (e) {
      console.error("Error saving emoji category:", e);
    }
  };
  const [promptInput, setPromptInput] = useState('');
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const handlePlayAudioGuide = async () => {
    if (isGeneratingAudio) return;
    setIsGeneratingAudio(true);
    triggerHaptic('tap');
    
    try {
      const res = await fetch('/api/audio-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          placeName: place.displayName, 
          details: { 
            types: place.types, 
            rating: place.rating, 
            address: place.formattedAddress 
          } 
        })
      });
      
      const data = await res.json();
      if (data.script) {
        const utterance = new SpeechSynthesisUtterance(data.script);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        
        window.speechSynthesis.speak(utterance);
        triggerHaptic('success');
      }
    } catch (e) {
      console.error("Audio guide error:", e);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Gallery Active Photo Index
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Sentiment and Vibe Analysis states
  const [sentimentResult, setSentimentResult] = useState<{
    vibe: string;
    sentimentScore: number;
    crowdLevel: string;
    summary: string;
  } | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  useEffect(() => {
    const fetchSentimentAndVibe = async () => {
      if (!place?.displayName && !place?.name) return;
      setIsAnalyzingSentiment(true);
      setSentimentResult(null);
      try {
        const res = await fetch('/api/poi-sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: place.displayName || place.name,
            reviews: place.reviews || [],
            category: place.types?.[0] || 'point_of_interest'
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSentimentResult(data);
        }
      } catch (err) {
        console.error("Failed to fetch sentiment:", err);
      } finally {
        setIsAnalyzingSentiment(false);
      }
    };

    fetchSentimentAndVibe();
  }, [place?.id, place?.displayName || place?.name]);

  // AI Local Guide State
  const [localGuideData, setLocalGuideData] = useState<any | null>(null);
  const [isLoadingLocalGuide, setIsLoadingLocalGuide] = useState(false);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [place?.id]);

  const loadLocalGuide = async () => {
    if (!place?.name && !place?.displayName) return;
    const locationName = place.displayName || place.name;
    setIsLoadingLocalGuide(true);
    try {
      const response = await fetch('/api/ai-local-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationName })
      });
      const data = await response.json();
      setLocalGuideData(data);
    } catch (e) {
      console.error("Local Guide Error:", e);
    } finally {
      setIsLoadingLocalGuide(false);
    }
  };

  // Visited Journal Log State & Handlers
  const [matchingSnap, setMatchingSnap] = useState<any | null>(null);
  const [visitedNote, setVisitedNote] = useState('');
  const [visitedImage, setVisitedImage] = useState('');
  const [showVisitedForm, setShowVisitedForm] = useState(false);
  const [isSavingVisited, setIsSavingVisited] = useState(false);

  useEffect(() => {
    if (!user || !place) {
      setMatchingSnap(null);
      return;
    }
    
    const spotLat = Number(place.lat || place.location?.lat);
    const spotLng = Number(place.lng || place.location?.lng);
    
    const q = query(collection(db, 'travelSnapshots'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      let found: any = null;
      snapshot.forEach((doc) => {
        const d = doc.data();
        if (d.userId === user.uid) {
          const latDiff = Math.abs(Number(d.lat) - spotLat);
          const lngDiff = Math.abs(Number(d.lng) - spotLng);
          if ((latDiff < 0.001 && lngDiff < 0.001) || (d.locationName === place.displayName)) {
            found = { id: doc.id, ...d };
          }
        }
      });
      setMatchingSnap(found);
      if (found) {
        setVisitedNote(found.text);
        setVisitedImage(found.imageUrl || '');
      }
    }, (error) => {
      console.warn("PlaceDetailsPanel Snapshots error", error);
    });
    return () => unsub();
  }, [user, place]);

  const handleSaveVisitedLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingVisited(true);

    try {
      const finalLat = Number(place.lat || place.location?.lat || 0);
      const finalLng = Number(place.lng || place.location?.lng || 0);
      const finalLocationName = place.displayName || place.name || `Coordinates (${finalLat.toFixed(4)}, ${finalLng.toFixed(4)})`;

      const snapPayload = {
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous Explorer',
        userPhotoURL: user.photoURL || '',
        text: visitedNote.trim() || 'Logged visited memory coordinates. Standard explorer check-in!',
        imageUrl: visitedImage.trim() || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80',
        locationName: finalLocationName,
        lat: finalLat,
        lng: finalLng,
        createdAt: Date.now()
      };

      if (matchingSnap) {
        const docRef = doc(db, 'travelSnapshots', matchingSnap.id);
        await setDoc(docRef, snapPayload, { merge: true });
      } else {
        const snapsCollection = collection(db, 'travelSnapshots');
        const docRef = doc(snapsCollection);
        await setDoc(docRef, snapPayload);
      }

      setShowVisitedForm(false);
      triggerHaptic('success');
    } catch (err) {
      console.error("Failed to save visited log:", err);
    } finally {
      setIsSavingVisited(false);
    }
  };

  const handleDeleteVisitedLog = async () => {
    if (!matchingSnap || !user) return;
    if (!window.confirm("Are you sure you want to delete this visited journal entry?")) return;
    
    try {
      const docRef = doc(db, 'travelSnapshots', matchingSnap.id);
      await deleteDoc(docRef);
      setMatchingSnap(null);
      setVisitedNote('');
      setVisitedImage('');
      triggerHaptic('success');
    } catch (err) {
      console.error("Failed to delete visited log:", err);
    }
  };

  // Interactive Status Badges States
  const [isOpen, setIsOpen] = useState(true);
  const [isBusy, setIsBusy] = useState(() => Math.random() > 0.5);
  const [sparklineRefreshCount, setSparklineRefreshCount] = useState(0);
  const [isSyncingPOI, setIsSyncingPOI] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

  // Tooltip Hover State
  const [showTooltip, setShowTooltip] = useState(false);

  // Accuracy Feedback adjusters & custom weight states
  const [accuracyFeedback, setAccuracyFeedback] = useState<'yes' | 'no' | null>(null);
  const [sliderScenic, setSliderScenic] = useState(75);
  const [sliderTaste, setSliderTaste] = useState(80);
  const [sliderSilence, setSliderSilence] = useState(60);
  const [showSliders, setShowSliders] = useState(false);

  // Expanding matching factors details Accordion
  const [factorsExpanded, setFactorsExpanded] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  // trip planner states
  const [isPlanningTrip, setIsPlanningTrip] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripItinerary, setTripItinerary] = useState<any[] | null>(null);

  // Dynamic Tooltip Match Factors
  const tooltipExplanation = React.useMemo(() => {
    const nameLower = (place.displayName || "").toLowerCase();
    const isCoffeeOrFood = place.types?.includes('cafe') || 
                           place.types?.includes('coffee') || 
                           place.types?.includes('restaurant') || 
                           place.types?.includes('food') ||
                           nameLower.includes('coffee') || 
                           nameLower.includes('cafe') ||
                           nameLower.includes('kitchen') ||
                           nameLower.includes('delight');
    
    if (accuracyFeedback === 'no') {
      return `Custom parameter configuration active. Scenic: ${sliderScenic}%, Taste: ${sliderTaste}%, Quietness: ${sliderSilence}%. Adjusting your weights changes this recommendation live.`;
    }
    if (place.mode === 'canada') {
      return "Matches key transit points, high density local check-ins, and curated environmental scores inside the Canada Zone.";
    }
    if (isCoffeeOrFood) {
      return "Matches your preference for premium dining, taste profile alignment, and highly social morning activity periods.";
    }
    return "Matches selection for scenic visual panoramas, public ratings density, and high local feedback benchmarks.";
  }, [place.mode, place.types, place.displayName, accuracyFeedback, sliderScenic, sliderTaste, sliderSilence]);

  // Dynamic Curation Match Score Calculation
  const curationScore = React.useMemo(() => {
    if (accuracyFeedback === 'no') {
      // Live calculated average of user-input sliders
      return Math.min(100, Math.max(50, Math.round((sliderScenic + sliderTaste + sliderSilence) / 3)));
    }
    // Generate a consistent pseudo-random score between 82% and 99% based on place name length
    const base = 84 + (place.displayName?.length || 0) % 15;
    return Math.min(99, Math.max(82, base));
  }, [place.displayName, accuracyFeedback, sliderScenic, sliderTaste, sliderSilence]);

  const environmentalFactor = React.useMemo(() => {
    if (place.mode === 'canada') {
      return "Temperate Settlement Microclimate";
    }
    return "Optimal Urban Microclimate";
  }, [place.mode]);
  
  const preferenceFactor = React.useMemo(() => {
    if (place.rating && place.rating > 4.5) {
      return "High Elite Rating Sync";
    }
    return "Trend Alignment Dynamic Sync";
  }, [place.rating]);
  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handleAddToCalendar = () => {
    const title = place.displayName || "Visit Location";
    const description = `Visit ${place.displayName} at ${place.formattedAddress}`;
    const location = place.formattedAddress;
    
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");
    
    const blob = new Blob([icsData], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "event.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateTripPlan = async () => {
    if (tripItinerary) {
        setShowTripModal(true);
        return;
    }
    setShowTripModal(true);
    setIsPlanningTrip(true);
    setTripItinerary(null);
    try {
        const res = await fetch('/api/plan-trip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                placeDetails: { 
                    name: place.displayName, 
                    address: place.formattedAddress, 
                    types: place.types 
                } 
            })
        });
        const data = await res.json();
        setTripItinerary(data.itinerary || []);
    } catch(err) {
        console.error(err);
        setTripItinerary([]);
    } finally {
        setIsPlanningTrip(false);
    }
  };

  const isMock = !place.fetchFields && typeof place.mode === 'string';

  // Use a ref for the cache to prevent redundant re-renders just for caching
  const analysisCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // For mock places we already have custom metadata. Otherwise we can analyze.
    if (isMock) {
      if (place.mode === 'social') {
        setAnalysis(place.socialActivity || "Vibrant social hub trending right now!");
      } else if (place.mode === 'genius') {
        setAnalysis(place.aiCurationSummary || "Smart AI matched recommended scenic spot.");
      } else if (place.mode === 'perks') {
        setAnalysis(place.perkDescription || "Claim local cashback with VPay.");
      }
      return;
    }

    // Use cache if available to save quota
    if (place.id && analysisCacheRef.current[place.id]) {
      setAnalysis(analysisCacheRef.current[place.id]);
      return;
    }

    // Don't restart analysis if we already have it for this specific place ID
    if (analysis && !analyzing && place.id) {
        // Double check if the analysis we have matches some keyword or fallback text
        // If it's real content, we can probably skip.
    }

    const abortController = new AbortController();

    async function analyzePlace() {
      if (!place.id) return;
      setAnalyzing(true);
      setAnalysis(null);
      try {
        const res = await fetch('/api/analyze-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placeDetails: { name: place.displayName, address: place.formattedAddress, types: place.types } }),
          signal: abortController.signal
        });
        
        const data = await res.json().catch(() => ({}));
        
        if (!res.ok) {
          setAnalysis(data.analysis || data.error || "Detailed analysis is currently unavailable as Google Gemini API quota limits have been exceeded. Please try again in a few moments.");
          return;
        }
        
        if (data.analysis) {
          setAnalysis(data.analysis);
          // Store in ref to avoid triggering another re-render immediately
          analysisCacheRef.current[place.id] = data.analysis;
        } else {
          setAnalysis("Detailed analysis is temporarily unavailable.");
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Analysis failed:", err);
          setAnalysis("Network error occurred during analysis.");
        }
      } finally {
        setAnalyzing(false);
      }
    }
    analyzePlace();

    return () => abortController.abort();
  }, [place.id, isMock]);

  const getPrimaryType = () => {
    if (!place.types || place.types.length === 0) return 'Place';
    const type = place.types[0];
    return type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getLatLng = () => {
    if (isMock) {
      return { lat: place.lat, lng: place.lng };
    }
    return {
      lat: typeof place.location?.lat === 'function' ? place.location.lat() : place.location?.lat,
      lng: typeof place.location?.lng === 'function' ? place.location.lng() : place.location?.lng
    };
  };

  // Removed Firebase isSaved local state, utilizing useVantiStore + Firestore instead
  const bookmarkedPlaces = useVantiStore((state) => state.bookmarkedPlaces);
  const toggleBookmark = useVantiStore((state) => state.toggleBookmark);
  const isSavedLocally = !!bookmarkedPlaces[place?.id];
  const [isBookmarkedInFirestore, setIsBookmarkedInFirestore] = useState(false);

  useEffect(() => {
    if (!user || !place?.id) {
      setIsBookmarkedInFirestore(false);
      setSavedPlaceData(null);
      return;
    }
    const docRef = doc(db, 'users', user.uid, 'savedPlaces', place.id);
    const unsub = onSnapshot(docRef, (docSnap) => {
      const exists = docSnap.exists();
      setIsBookmarkedInFirestore(exists);
      setSavedPlaceData(exists ? docSnap.data() : null);
    }, (err) => {
      console.warn("Could not fetch bookmark status from Firestore:", err);
    });
    return () => unsub();
  }, [user, place?.id]);

  useEffect(() => {
    if (savedPlaceData) {
      setJournalNotesInput(savedPlaceData.journalNotes || '');
    } else {
      setJournalNotesInput('');
    }
  }, [savedPlaceData, place?.id]);

  const saveJournalNotes = async () => {
    if (!user || !place?.id) return;
    setIsSavingJournal(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'savedPlaces', place.id);
      await setDoc(docRef, {
        journalNotes: journalNotesInput
      }, { merge: true });
    } catch (e) {
      console.error("Error saving journal notes:", e);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const generateJournalImage = async () => {
    if (!promptInput.trim() || !user || !place?.id) return;
    setIsGeneratingCover(true);
    try {
      const response = await fetch('/api/generate-journal-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptInput,
          locationName: place.displayName || place.name || 'this location'
        })
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const newImgUrl = data.imageUrl;
      const existingImages = savedPlaceData?.journalImages || [];
      const updatedImages = [...existingImages, newImgUrl];

      const docRef = doc(db, 'users', user.uid, 'savedPlaces', place.id);
      await setDoc(docRef, {
        journalImages: updatedImages
      }, { merge: true });

      setPromptInput('');
    } catch (e) {
      console.error("Error generating journal cover:", e);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const deleteJournalImage = async (imgToDelete: string) => {
    if (!user || !place?.id) return;
    try {
      const existingImages = savedPlaceData?.journalImages || [];
      const updatedImages = existingImages.filter((img: string) => img !== imgToDelete);
      const docRef = doc(db, 'users', user.uid, 'savedPlaces', place.id);
      await setDoc(docRef, {
        journalImages: updatedImages
      }, { merge: true });
    } catch (e) {
      console.error("Error deleting journal image:", e);
    }
  };

  const isSaved = user ? isBookmarkedInFirestore : isSavedLocally;

  const handleSave = async () => {
    if (!place?.id || isSaving) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (isSaved) {
          navigator.vibrate([20, 50, 20]);
        } else {
          navigator.vibrate([50, 50, 50, 50, 100]);
        }
      } catch (e) {}
    }

    setIsSaving(true);
    
    try {
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'savedPlaces', place.id);
        if (isBookmarkedInFirestore) {
          await deleteDoc(docRef);
        } else {
          const finalLat = Number(place.lat || place.location?.lat || 0);
          const finalLng = Number(place.lng || place.location?.lng || 0);
          const finalDisplayName = place.displayName || place.name || `Coordinates (${finalLat.toFixed(4)}, ${finalLng.toFixed(4)})`;
          const finalAddress = place.formattedAddress || place.address || '';
          
          await setDoc(docRef, {
            placeId: place.id,
            displayName: finalDisplayName,
            address: finalAddress,
            lat: finalLat,
            lng: finalLng,
            savedAt: Date.now()
          });
          setShowSaveToast(true);
          setTimeout(() => setShowSaveToast(false), 3000);
        }
      } else {
        toggleBookmark(place);
        const latestBookmarks = useVantiStore.getState().bookmarkedPlaces;
        const savedLocallyNow = !!latestBookmarks[place.id];
        if (savedLocallyNow) {
          setShowSaveToast(true);
          setTimeout(() => setShowSaveToast(false), 3000);
        }
      }
    } catch (err) {
      console.error("Save error", err);
      if (user) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/savedPlaces/${place.id}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const mapsLib = useMapsLibrary('core');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const coords = getLatLng();

  const [hasStreetView, setHasStreetView] = useState(false);
  const [streetViewPanoId, setStreetViewPanoId] = useState<string | null>(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const panoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasStreetView(false);
    setStreetViewPanoId(null);
    setShowStreetView(false);
    
    if (!coords || !coords.lat || !coords.lng) return;
    
    const gMaps = (window as any).google?.maps;
    if (!gMaps) return;

    try {
      const service = new gMaps.StreetViewService();
      service.getPanorama({
        location: coords,
        radius: 200
      }, (data: any, status: any) => {
        if (status === gMaps.StreetViewStatus.OK && data && data.location && data.location.pano) {
          setHasStreetView(true);
          setStreetViewPanoId(data.location.pano);
        }
      });
    } catch (err) {
      console.error("StreetView check error:", err);
    }
  }, [coords.lat, coords.lng, mapsLib]);

  useEffect(() => {
    const gMaps = (window as any).google?.maps;
    if (showStreetView && panoRef.current && streetViewPanoId && gMaps) {
      try {
        setTimeout(() => {
          if (panoRef.current) {
            new gMaps.StreetViewPanorama(panoRef.current, {
              position: coords,
              visible: true,
              addressControl: false,
              linksControl: true,
              zoomControl: true,
              enableCloseButton: false,
              motionTracking: false,
              motionTrackingControl: false
            });
          }
        }, 100);
      } catch (err) {
        console.error("StreetView init error:", err);
      }
    }
  }, [showStreetView, streetViewPanoId, coords.lat, coords.lng, mapsLib]);

  const variants = {
    initial: isMobile 
      ? { y: "100%", opacity: 1, x: 0 } 
      : { opacity: 0, scale: 0.95, y: 30, x: 24 },
    animate: { y: 0, x: 0, opacity: 1, scale: 1 },
    exit: isMobile 
      ? { y: "100%", opacity: 1, x: 0 } 
      : { opacity: 0, scale: 0.95, y: 30, x: 24 }
  };

  const transition = { type: "spring" as const, damping: 28, stiffness: 210 };

  const headerVariants = {
    default: {
      backgroundColor: "rgba(255, 255, 255, 0.02)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      transition: { duration: 0.3 }
    },
    stormAlert: {
      backgroundColor: ["rgba(255, 255, 255, 0.02)", "rgba(239, 68, 68, 0.15)", "rgba(255, 255, 255, 0.02)"],
      borderColor: ["rgba(255, 255, 255, 0.1)", "rgba(239, 68, 68, 0.5)", "rgba(255, 255, 255, 0.1)"],
      transition: {
        repeat: Infinity,
        duration: 2.2,
        ease: "easeInOut" as const
      }
    }
  };

  const canAddToItinerary = useVantiStore((state) => !state.itinerary.find(p => p.id === place.id));
  const addToItinerary = useVantiStore((state) => state.addToItinerary);
  const showTripSidebar = useVantiStore((state) => state.showTripSidebar);
  const setShowTripSidebar = useVantiStore((state) => state.setShowTripSidebar);

  const triggerHaptic = (type: 'tap' | 'success') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'success' ? [15, 30, 15] : 10);
    }
  };

  const handleAddToItinerary = () => {
    addToItinerary(place);
    triggerHaptic('success');
    if (!showTripSidebar) {
      setShowTripSidebar(true);
    }
  };

  const getPhotos = () => {
    if (isMock) {
      return place?.imageUrl ? [place.imageUrl] : [];
    }
    if (place?.photos && place.photos.length > 0) {
      return place.photos.map((photo: any) => {
        if (typeof photo.getURI === 'function') {
          return photo.getURI({ maxWidth: 800 });
        }
        return photo.url || photo;
      });
    }
    return [];
  };

  const photos = getPhotos();

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
    triggerHaptic('tap');
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    triggerHaptic('tap');
  };

  return (
    <FocusLock returnFocus className="contents">
    <motion.div 
      layout
      layoutId="place-details-panel"
      drag="y"
      dragConstraints={{ top: 0, bottom: 200 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 100) {
          onClose ? onClose() : onBack();
        }
      }}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      className="flex flex-col h-full bg-transparent"
    >
      {/* Header */}
      <motion.div 
        variants={headerVariants}
        animate={weather === 'Storm' ? 'stormAlert' : 'default'}
        className="p-3 md:p-4 border-b flex items-center justify-between backdrop-blur-md"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onBack();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-400 hidden xs:inline">Back to results</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleSave();
            }}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-xl transition-all border active:scale-90",
              isSaved ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-white/5 text-slate-400 hover:text-white border-transparent"
            )}
          >
            <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
          </button>

          {/* AR Street View Trigger */}
          <button 
             onClick={(e) => {
               e.stopPropagation();
               setShowStreetView(true);
             }}
             className="w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 active:scale-90 transition-all"
             title="AR Preview"
          >
             <Camera className="w-5 h-5" />
          </button>
          {onClose && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

        {/* Content */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-y-auto px-6 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] scrollbar-thin scrollbar-thumb-slate-700"
        >
          
          <motion.div variants={item} className="w-full h-52 bg-slate-900 rounded-2xl mb-6 relative overflow-hidden group border border-white/5 shadow-2xl touch-pan-y">
            {photos.length > 0 ? (
              <>
                <div className="absolute inset-0 select-none">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.img 
                      key={activePhotoIndex}
                      src={photos[activePhotoIndex]} 
                      alt={place.displayName || 'Location Photo'}
                      initial={{ opacity: 0, x: 20, scale: 1.02 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                </div>

                {/* Ambient dark gradient overlay to make tags readable */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0e1115] via-black/30 to-transparent z-10 pointer-events-none" />

                {/* Carousel Controls */}
                {photos.length > 1 && (
                  <>
                    {/* Gesture Wipe Overlay Area */}
                    <div 
                      className="absolute inset-0 z-15 cursor-grab active:cursor-grabbing"
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        (e.currentTarget as any).startX = touch.clientX;
                      }}
                      onTouchEnd={(e) => {
                        const startX = (e.currentTarget as any).startX;
                        if (startX === undefined) return;
                        const touch = e.changedTouches[0];
                        const diffX = touch.clientX - startX;
                        if (diffX > 50) {
                          setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
                          triggerHaptic('tap');
                        } else if (diffX < -50) {
                          setActivePhotoIndex((prev) => (prev + 1) % photos.length);
                          triggerHaptic('tap');
                        }
                      }}
                    />

                    {/* Left Chevron Button */}
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-950/75 border border-white/10 text-white/80 hover:text-white hover:bg-slate-950 hover:scale-110 active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-lg pointer-events-auto"
                      aria-label="Previous Photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Right Chevron Button */}
                    <button
                      onClick={handleNextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-950/75 border border-white/10 text-white/80 hover:text-white hover:bg-slate-950 hover:scale-110 active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-lg pointer-events-auto"
                      aria-label="Next Photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Indication Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-slate-950/65 px-2 py-1 rounded-full border border-white/5 backdrop-blur-sm pointer-events-auto">
                      {photos.map((_, idx) => (
                        <button
                          key={`carousel-dot-${idx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setActivePhotoIndex(idx);
                            triggerHaptic('tap');
                          }}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            idx === activePhotoIndex ? "bg-white w-3" : "bg-white/40 hover:bg-white/60"
                          )}
                          aria-label={`Go to photo ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-30 bg-slate-950">
                 <MapPin className="w-16 h-16 text-slate-500" />
              </div>
            )}
            
            <div className="absolute bottom-3 left-4 z-20">
               <span className="inline-block px-2.5 py-1 bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-md backdrop-blur-sm border border-rose-500/30">
                 {getPrimaryType()}
               </span>
            </div>
          </motion.div>

          <motion.h2 variants={item} className="text-2xl font-display font-bold text-white mb-2 leading-tight">
            {place.displayName}
          </motion.h2>

          {/* Audio Guide Primary Action */}
          <motion.div variants={item} className="mb-6">
            <button
               onClick={handlePlayAudioGuide}
               disabled={isGeneratingAudio}
               className={cn(
                 "w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 group relative overflow-hidden",
                 isGeneratingAudio 
                   ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                   : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-[length:200%_auto] hover:bg-[right_center] text-white shadow-xl shadow-indigo-500/20 active:scale-95"
               )}
            >
              <div className="relative z-10 flex items-center gap-3">
                {isGeneratingAudio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Volume2 className={cn("w-5 h-5", !isGeneratingAudio && "animate-pulse")} />
                )}
                <span className="text-xs font-black uppercase tracking-widest">
                  {isGeneratingAudio ? "Calibrating Audio Stream..." : "AI Location Audio Guide"}
                </span>
              </div>
              
              {!isGeneratingAudio && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              )}
            </button>
          </motion.div>

          {/* Visited Journal Memory Section */}
          <motion.div 
            variants={item}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/10 shadow-[0_4px_25px_rgba(99,102,241,0.05)] relative overflow-hidden"
          >
            {/* Absolute accent highlight */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-widest text-[#d5c3aa] font-sans">
                  Coordinate Journal Entry
                </h4>
              </div>
              
              {matchingSnap && (
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">Visited</span>
                </div>
              )}
            </div>

            {/* If NOT visited and Form is NOT open */}
            {!matchingSnap && !showVisitedForm && (
              <div className="space-y-3 py-1">
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  You haven't recorded a journal entry for this spot yet. Logging a visited coordinate locks a custom check-in memory pin on your map.
                </p>
                <button
                  onClick={() => setShowVisitedForm(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600/30 to-indigo-600/30 hover:from-amber-600/40 hover:to-indigo-600/40 border border-amber-500/20 hover:border-amber-500/35 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  Mark as Visited & Add Note
                </button>
              </div>
            )}

            {/* Edit/Create Form */}
            {(!matchingSnap || showVisitedForm) && showVisitedForm && (
              <form onSubmit={handleSaveVisitedLog} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider font-sans">
                    Your Journal Note / Reflection
                  </label>
                  <textarea
                    value={visitedNote}
                    onChange={(e) => setVisitedNote(e.target.value)}
                    required
                    placeholder="Describe your memories, rating, tips or experiences here..."
                    className="w-full h-24 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center justify-between font-sans">
                    <span>Photo / Image URL</span>
                    <span className="text-[9px] text-slate-500 lowercase">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={visitedImage}
                    onChange={(e) => setVisitedImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
                  />
                </div>

                {/* Cover presets */}
                <div className="space-y-1.5 font-sans">
                  <div className="text-[9px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                    Or select a beautiful travel preset cover:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Sunset Scenic', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' },
                      { name: 'Lush Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80' },
                      { name: 'Mountain Ridge', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80' },
                      { name: 'City Cafe', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80' },
                      { name: 'Night Lights', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80' }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setVisitedImage(preset.url)}
                        className={cn(
                          "px-2.5 py-1 rounded-full border text-[9px] font-bold transition-all",
                          visitedImage === preset.url 
                            ? "bg-amber-400/20 border-amber-400 text-amber-300" 
                            : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400"
                        )}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVisitedForm(false);
                      if (!matchingSnap) {
                        setVisitedNote('');
                        setVisitedImage('');
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingVisited}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSavingVisited && <Loader2 className="w-3 h-3 animate-spin" />}
                    {matchingSnap ? 'Update Note' : 'Save Memory'}
                  </button>
                </div>
              </form>
            )}

            {/* If already Visited and Form is NOT open */}
            {matchingSnap && !showVisitedForm && (
              <div className="space-y-4 pt-1">
                {/* Embedded Journal Snapshot details */}
                <div className="flex gap-3 items-start bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  {matchingSnap.imageUrl && (
                    <img 
                      src={matchingSnap.imageUrl} 
                      alt="Journal memory cover" 
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-800 shadow-md animate-fade-in"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 font-sans leading-relaxed italic break-words">
                      "{matchingSnap.text}"
                    </p>
                    <div className="text-[9px] font-mono text-slate-500 mt-2 font-bold uppercase tracking-wider">
                      Logged on {new Date(matchingSnap.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setVisitedNote(matchingSnap.text);
                      setVisitedImage(matchingSnap.imageUrl || '');
                      setShowVisitedForm(true);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-indigo-900/20 to-slate-800 border border-indigo-500/25 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3 h-3 text-indigo-400" />
                    Edit Entry
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteVisitedLog}
                    className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/35 text-rose-450 hover:text-rose-400 rounded-xl transition-all"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Emoji Categorization */}
          {isSaved && (
            <motion.div variants={item} className="mb-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 shadow-inner">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <Tag className="w-4 h-4 text-indigo-400" />
                     <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-300">Marker Customization</h4>
                  </div>
                  {selectedEmoji && (
                    <button 
                      onClick={() => handleEmojiSave('')}
                      className="text-[9px] text-slate-500 hover:text-slate-300 font-bold uppercase transition-colors"
                    >
                      Reset
                    </button>
                  )}
               </div>
               
               <div className="flex flex-wrap gap-2.5">
                  {['🍴', '☕', '🏕️', '🏛️', '🛍️', '🏨', '🏖️', '📸', '🚉', '🌳', '📍'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSave(emoji)}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border",
                        selectedEmoji === emoji 
                          ? "bg-indigo-500/20 border-indigo-500 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                          : "bg-slate-900 border-slate-700 hover:border-slate-500 hover:scale-105"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                  
                  <label className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 border border-dashed border-slate-600 hover:border-indigo-500 transition-all cursor-pointer group overflow-hidden">
                     <span className="text-xl group-hover:scale-110 transition-transform">➕</span>
                     <input 
                        type="text" 
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          if (val) handleEmojiSave(val);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        placeholder="Emoji"
                     />
                  </label>
               </div>
               <p className="mt-3 text-[9px] text-slate-500 font-medium italic">Selecting an emoji will update its representation on the global map for easy identification.</p>
            </motion.div>
          )}

          {/* New Drag to Trip Handle Segment */}
          <motion.div 
            variants={item}
            className="mb-6"
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 300 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x > 150) {
                   handleAddToItinerary();
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between cursor-grab active:cursor-grabbing overflow-hidden group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-[0_5px_15px_rgba(244,63,94,0.4)]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Add to Trip</h4>
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Drag right → to drop into My Trip</p>
                </div>
              </div>
              <motion.div 
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-rose-500/50"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.div>
              
              {/* Drag progress background indicator */}
              <div className="absolute inset-y-0 left-0 bg-rose-500/5 transition-all" style={{ width: 'var(--drag-progress, 0%)' }} />
            </motion.div>
          </motion.div>

          {/* Interactive Simulated Status Badges with Live Trend Gauge */}
          <motion.div variants={item} className="flex flex-wrap gap-2 mb-4 select-none items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsOpen(prev => !prev);
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  try { navigator.vibrate(12); } catch (e) {}
                }
              }}
              className={cn(
                "px-3 py-2.5 text-[10px] min-h-[44px] font-mono font-black uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm",
                isOpen 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20" 
                  : "bg-slate-800/60 text-slate-405 border-slate-700 hover:bg-slate-800"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isOpen ? "bg-emerald-400 animate-pulse" : "bg-slate-400")} />
              {isOpen ? "● Open Now" : "○ Closed"}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsBusy(prev => !prev);
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  try { navigator.vibrate(12); } catch (e) {}
                }
              }}
              className={cn(
                "px-3 py-2.5 text-[10px] min-h-[44px] font-mono font-black uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm",
                isBusy 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20" 
                  : "bg-teal-500/10 text-teal-400 border-teal-500/25 hover:bg-teal-500/20"
              )}
            >
              <span>{isBusy ? "⚡ Busy Axis" : "🍃 Quiet Zone"}</span>
            </button>

            {/* Live Pop Trend Sparkline Gauge (D3.JS) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setSparklineRefreshCount(prev => prev + 1);
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  try { navigator.vibrate(10); } catch (e) {}
                }
              }}
              title="Simulate Real-time Popularity Wave"
              className="px-3 py-2.5 text-[10px] min-h-[44px] font-mono font-black uppercase tracking-wider rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-center justify-center gap-2 shadow-sm hover:bg-rose-500/10 cursor-pointer active:scale-95 transition-all select-none"
            >
              <span className="text-slate-400 text-[9px] font-semibold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-rose-400 animate-ping" />
                6H Trend
              </span>
              <TinySparkline seedName={place.displayName || "spot"} refreshTriggers={sparklineRefreshCount} />
            </button>

            {/* Real-time synchronization & refresh controller */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isSyncingPOI) return;
                setIsSyncingPOI(true);
                
                // Beautiful initial tactile buzz
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  try { navigator.vibrate([10, 45, 12]); } catch (err) {}
                }
                
                // Simulate real-time background schedule & occupancy sync
                await new Promise(resolve => setTimeout(resolve, 1100));
                
                setSparklineRefreshCount(prev => prev + 1);
                setIsBusy(Math.random() > 0.5);
                setIsOpen(Math.random() > 0.15);
                setIsSyncingPOI(false);
                setSyncSuccessToast(true);
                
                // Successful sync clear vibration
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  try { navigator.vibrate([15, 30, 20]); } catch (err) {}
                }
                
                setTimeout(() => {
                  setSyncSuccessToast(false);
                }, 2800);
              }}
              title="Synchronize Live Schedule & occupancy metrics"
              className={cn(
                "px-3 py-2.5 text-[10px] min-h-[44px] font-mono font-black uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm cursor-pointer select-none",
                isSyncingPOI 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse" 
                  : "bg-slate-500/10 text-slate-300 border-white/5 hover:bg-white/5"
              )}
            >
              <Loader2 className={cn("w-3.5 h-3.5 text-slate-400", isSyncingPOI && "animate-spin text-rose-500")} />
              <span>{isSyncingPOI ? "Syncing" : "Sync Live"}</span>
            </button>

            <AnimatePresence>
              {syncSuccessToast && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="col-span-full mt-2 w-full text-center py-2 px-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  POI Occupancy & Schedule Synchronized!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div variants={item} className="flex items-center gap-2 mb-6">
            {(place.rating !== null && place.rating !== undefined) && (
              <div className="flex items-center text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded text-sm">
                <Star className="w-4 h-4 mr-1 fill-amber-400" />
                {place.rating}
                <span className="text-slate-500 ml-1">({place.userRatingCount} reviews)</span>
              </div>
            )}
          </motion.div>

          {/* AI Sentiment Analysis & Vibe Indicator Card */}
          <motion.div 
            variants={item} 
            className="mb-6 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-indigo-400 font-mono text-[10px] font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
                <span>AI Vibe Analytics</span>
              </div>
              {sentimentResult && (
                <div className="bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 rounded-md text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-black animate-pulse">
                  {sentimentResult.crowdLevel} Vibe
                </div>
              )}
            </div>

            {isAnalyzingSentiment ? (
              <div className="flex flex-col items-center justify-center py-4 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-[10px] font-mono uppercase tracking-wide animate-pulse">Decrypting review sentiment logs...</span>
              </div>
            ) : sentimentResult ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Aesthetic vibe</span>
                    <h4 className="text-xs md:text-sm font-black font-sans tracking-tight text-white">{sentimentResult.vibe}</h4>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider block">Local Sentiment</span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="h-2 w-16 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500 rounded-full"
                          style={{ width: `${sentimentResult.sentimentScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-black text-emerald-400">{sentimentResult.sentimentScore}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans italic border-l-2 border-indigo-500/30 pl-3 py-0.5">
                  "{sentimentResult.summary}"
                </p>
              </div>
            ) : (
              <div className="text-[11px] font-sans text-slate-400">
                Awaiting sentiment telemetry feedback. Tap search or sync indicators.
              </div>
            )}
          </motion.div>

          {hasStreetView && (
            <motion.div variants={item} className="mb-6 overflow-hidden rounded-2xl border border-white/5 bg-[#1b1c22]/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-rose-500 animate-[spin_8s_linear_infinite]" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Street View Panorama</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      try { navigator.vibrate(15); } catch {}
                    }
                    setShowStreetView(!showStreetView);
                  }}
                  className={cn(
                    "px-3 py-2 min-h-[44px] flex items-center justify-center text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all active:scale-95",
                    showStreetView 
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  {showStreetView ? "Hide Environment" : "Explore 360°"}
                </button>
              </div>
              
              {showStreetView ? (
                <div 
                  ref={panoRef} 
                  className="w-full h-52 bg-black rounded-xl border border-white/10 shadow-inner overflow-hidden relative"
                />
              ) : (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      try { navigator.vibrate(15); } catch {}
                    }
                    setShowStreetView(true);
                  }}
                  className="w-full h-24 bg-slate-800/20 hover:bg-slate-800/40 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1.5 cursor-pointer group transition-colors"
                >
                  <Compass className="w-6 h-6 text-slate-500 group-hover:text-rose-400 transition-colors animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">Interactive 360° street level view available</span>
                </div>
              )}
            </motion.div>
          )}

          {isMock && place.mode === 'perks' && (
            <motion.div variants={item} className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 items-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                 <Award className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-black uppercase tracking-wider">Active Partner Discount</p>
                <p className="text-sm text-slate-200 mt-0.5">Use VANTi Pay on-site for immediate cashback codes and perks.</p>
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="space-y-5">
            <div className="flex items-start gap-3 text-slate-300">
              <MapPin className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed">{place.formattedAddress}</p>
            </div>

            {/* Weekly Opening Hours Collapsible */}
            {place.regularOpeningHours?.weekdayDescriptions && (
              <div className="border-t border-slate-800 pt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setHoursExpanded(!hoursExpanded);
                    if (typeof navigator !== 'undefined' && navigator.vibrate) { try { navigator.vibrate(8); } catch(e){} }
                  }}
                  className="w-full py-3 min-h-[44px] flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-slate-300 group-hover:text-white transition-colors">
                    <Clock className="w-5 h-5 text-slate-500 group-hover:text-rose-400 shrink-0" />
                    <span className="text-sm font-medium">Weekly Operating Hours</span>
                  </div>
                  {hoursExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                  )}
                </button>

                <AnimatePresence>
                  {hoursExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pl-8 space-y-2">
                        {place.regularOpeningHours.weekdayDescriptions.map((day: string, idx: number) => {
                          const [dayName, ...timeRange] = day.split(': ');
                          const timeString = timeRange.join(': ');
                          // Simple check for today
                          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                          const isToday = dayName.toLowerCase().includes(today.toLowerCase());

                          return (
                            <div key={idx} className={cn(
                              "flex justify-between text-xs font-mono py-1 border-b border-white/5 last:border-0",
                              isToday ? "text-rose-400 font-bold" : "text-slate-400"
                            )}>
                              <span className="uppercase tracking-tight">{dayName}</span>
                              <span>{timeString}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="p-4 rounded-xl bg-gradient-to-br from-[#1b1c22] to-[#121318] border border-slate-800">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-400 mb-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                {isMock ? "VANTi Travel Insights" : "AI Travel Intelligent Match"}
              </h3>

              {/* Curation Match Progress Dashboard */}
              <div className="mb-4 p-3.5 bg-slate-950/45 rounded-xl border border-white/5 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 relative">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-rose-400 animate-pulse animate-[spin_10s_linear_infinite]" /> VANTi Curation Match
                    </span>
                    
                    {/* Hover Tooltip trigger is structured dynamically */}
                    <div 
                      className="relative block"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        aria-label="Curation factors"
                        className="p-1 text-slate-400 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-help"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      <AnimatePresence>
                        {showTooltip && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-2 p-3 w-64 rounded-xl bg-slate-950 border border-rose-500/30 text-[10.5px] text-slate-300 font-sans tracking-tight leading-relaxed shadow-[0_12px_32px_rgba(244,63,94,0.35)] backdrop-blur-md z-[110]"
                          >
                            <span className="text-[9px] font-mono text-rose-400 font-black uppercase tracking-wider block mb-1">✔ MATCH TRACE</span>
                            <p>{tooltipExplanation}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <span className="text-xs font-mono font-black text-rose-400">{curationScore}% Alignment</span>
                </div>
                
                {/* Score Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden p-[1px] border border-slate-800/60">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${curationScore}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                    className="bg-gradient-to-r from-rose-500 via-amber-400 to-rose-400 h-full rounded-full" 
                  />
                </div>

                {/* Simulated Curation Attributes Grid based on place metadata & environmental factor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] font-mono leading-none pt-1">
                  <div className="p-2 rounded bg-[#0f1115] border border-slate-900 flex flex-col gap-1 pointer-events-auto">
                    <span className="text-slate-550 uppercase text-[8px] tracking-wider font-bold">Environment Status</span>
                    <span className="font-extrabold text-[#38bdf8] truncate">{environmentalFactor}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0f1115] border border-slate-900 flex flex-col gap-1 pointer-events-auto">
                    <span className="text-slate-550 uppercase text-[8px] tracking-wider font-bold">User Taste Alignment</span>
                    <span className="font-extrabold text-[#fbbf24] truncate">{preferenceFactor}</span>
                  </div>
                </div>

                {/* Match Accuracy Interaction Indicator */}
                <div className="flex justify-between items-center bg-[#07080c] p-2 rounded-lg border border-slate-900/60 transition-all">
                  <span className="text-[9px] text-slate-400 font-bold uppercase font-mono tracking-wider">Is this match accurate?</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setAccuracyFeedback('yes');
                        setShowSliders(false);
                        if (typeof navigator !== 'undefined' && navigator.vibrate) { try { navigator.vibrate(10); } catch(e){} }
                      }}
                      className={cn(
                        "p-2.5 rounded-lg border transition-all active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer",
                        accuracyFeedback === 'yes'
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      )}
                      title="Accurate recommendation"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setAccuracyFeedback('no');
                        setShowSliders(true);
                        if (typeof navigator !== 'undefined' && navigator.vibrate) { try { navigator.vibrate(10); } catch(e){} }
                      }}
                      className={cn(
                        "p-2.5 rounded-lg border transition-all active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer",
                        accuracyFeedback === 'no'
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      )}
                      title="Need to adjust sliders"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live recalibration sliders slider container */}
                <AnimatePresence>
                  {showSliders && accuracyFeedback === 'no' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-slate-950/70 border border-rose-500/20 rounded-xl space-y-3 overflow-hidden shadow-inner"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-rose-300 font-bold">
                        <span className="flex items-center gap-1"><Sliders className="w-3 h-3" /> Tuning Parameters</span>
                        <span className="text-slate-400">Live Recalibrating Score</span>
                      </div>
                      
                      {/* Slider Scenic */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 leading-none">
                          <span>Scenic Priority</span>
                          <span>{sliderScenic}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={sliderScenic}
                          onChange={(e) => setSliderScenic(Number(e.target.value))}
                          className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer appearance-none"
                        />
                      </div>

                      {/* Slider Taste */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 leading-none">
                          <span>Taste Connection</span>
                          <span>{sliderTaste}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={sliderTaste}
                          onChange={(e) => setSliderTaste(Number(e.target.value))}
                          className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer appearance-none"
                        />
                      </div>

                      {/* Slider Silence */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 leading-none">
                          <span>Quietness preference</span>
                          <span>{sliderSilence}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={sliderSilence}
                          onChange={(e) => setSliderSilence(Number(e.target.value))}
                          className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer appearance-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expandable Matching Metrics Accordion */}
                <div className="border-t border-slate-900 pt-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setFactorsExpanded(prev => !prev);
                      if (typeof navigator !== 'undefined' && navigator.vibrate) { try { navigator.vibrate(8); } catch(e){} }
                    }}
                    className="w-full py-3 min-h-[44px] flex items-center justify-between text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors select-none cursor-pointer"
                  >
                    <span className="font-bold flex items-center gap-1.5 uppercase">
                      <Zap className="w-3 h-3 text-amber-400 animate-pulse" /> Detailed Metrics Check
                    </span>
                    {factorsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  <AnimatePresence>
                    {factorsExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 pt-1.5 overflow-hidden"
                      >
                        <div className="flex justify-between items-center p-2 rounded bg-[#0b0c10] border border-slate-900 text-[9.5px] font-mono leading-none">
                          <span className="text-slate-550 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Ambient Noise Factor</span>
                          <span className="font-extrabold text-teal-400">Low (~38dB)</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-[#0b0c10] border border-slate-900 text-[9.5px] font-mono leading-none">
                          <span className="text-slate-550 flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Ideal Booking Window</span>
                          <span className="font-extrabold text-amber-400">12:00 - 15:00 Zone</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-[#0b0c10] border border-slate-900 text-[9.5px] font-mono leading-none">
                          <span className="text-slate-550 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Expressway Proximity</span>
                          <span className="font-extrabold text-rose-400">Under 10 mins</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {analyzing ? (
                    <div className="space-y-4 my-4 pt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <SkeletonCircle size="w-4 h-4" />
                        <SkeletonText className="w-24 h-2.5" />
                      </div>
                      <div className="space-y-2.5">
                        <SkeletonText className="w-full h-3" />
                        <SkeletonText className="w-[95%] h-3" />
                        <SkeletonText className="w-[90%] h-3" />
                        <SkeletonText className="w-[40%] h-3" />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Skeleton className="w-16 h-6 rounded-full" />
                        <Skeleton className="w-20 h-6 rounded-full" />
                      </div>
                    </div>
                  ) : analysis ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-slate-300 leading-relaxed font-sans flex-1" dangerouslySetInnerHTML={{__html: analysis.replace(/\n/g, '<br/>')}}></p>
                    <SpeakButton text={analysis.replace(/<[^>]*>/g, '')} className="ml-2 mt-1 w-8 h-8 shrink-0" />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Optimizing location details...</p>
              )}
                </div>
              </div>
            </div>

            {/* AI Local Guide Module */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-indigo-500/10 hover:border-indigo-500/20 transition-all space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">Culture & Phrases</h3>
                </div>
                {!localGuideData && !isLoadingLocalGuide && (
                  <button onClick={loadLocalGuide} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded hover:bg-indigo-600/30 transition-colors">
                    Load Guide
                  </button>
                )}
              </div>
              
              {isLoadingLocalGuide ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-indigo-400 font-mono animate-pulse uppercase tracking-widest">Compiling local insights...</p>
                </div>
              ) : localGuideData ? (
                <div className="space-y-4 pt-2">
                  {localGuideData.cultureTips && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest flex items-center gap-1.5 border-b border-indigo-500/20 pb-1">
                        <Sparkles className="w-3 h-3" /> Etiquette & Culture
                      </h4>
                      <ul className="space-y-2">
                        {localGuideData.cultureTips.map((tip: string, idx: number) => (
                          <li key={idx} className="flex gap-2 items-start text-xs text-slate-300 leading-snug">
                            <span className="text-indigo-500 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {localGuideData.phrases && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest flex items-center gap-1.5 border-b border-indigo-500/20 pb-1 pt-2">
                        <Volume2 className="w-3 h-3" /> Quick Phrases
                      </h4>
                      <div className="grid gap-2">
                        {localGuideData.phrases.map((p: any, idx: number) => (
                          <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center group hover:border-indigo-500/30 transition-colors">
                            <div>
                              <p className="text-xs font-bold text-slate-200">{p.translation}</p>
                              <p className="text-[10px] text-slate-500 italic">"{p.pronunciation}"</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider">{p.phrase}</span>
                              <SpeakButton text={p.translation} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Discover essential phrases and culture tips generated by AI.</p>
              )}
            </div>

            {/* Travel Journal Module */}
            {isSaved && (
              <div id="vanti-travel-journal-card" className="p-4 rounded-xl bg-gradient-to-br from-[#1b1c22] to-[#121318] border border-indigo-500/20 shadow-2xl relative space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">Travel Journal</h3>
                      <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mt-0.5">Location Memories</p>
                    </div>
                  </div>
                  {user && (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider font-extrabold shadow-sm">
                      Sync Enabled
                    </span>
                  )}
                </div>

                {/* Journal Note Field */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Personal Notes</label>
                  <textarea
                    value={journalNotesInput}
                    onChange={(e) => setJournalNotesInput(e.target.value)}
                    placeholder="Write down your memories, feelings, landmarks visited or thoughts about this place..."
                    className="w-full h-24 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 outline-none transition-colors resize-none scrollbar-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        saveJournalNotes();
                      }}
                      disabled={isSavingJournal || !user}
                      className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/35 disabled:opacity-50 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      {isSavingJournal ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Save Notes
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Image Generation & Gallery */}
                <div className="space-y-3.5 border-t border-white/5 pt-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Generate AI Travel Cover</label>
                    <p className="text-[9px] text-slate-500 leading-snug">Generate custom journal photos using Gemini API based on your vibe!</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="e.g. Sunset, pastel skies, film grain effect..."
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          e.preventDefault();
                          generateJournalImage();
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        generateJournalImage();
                      }}
                      disabled={isGeneratingCover || !promptInput.trim() || !user}
                      className="px-4 bg-[#6366f1] hover:bg-[#5b5ee0] disabled:bg-slate-850 disabled:text-slate-600 disabled:border-transparent text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-indigo-600/10 min-h-[38px]"
                    >
                      {isGeneratingCover ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Generate
                    </button>
                  </div>

                  {/* Journal Photo Gallery */}
                  {savedPlaceData?.journalImages && savedPlaceData.journalImages.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Journal Snapshots ({savedPlaceData.journalImages.length})</label>
                      <div className="grid grid-cols-2 gap-3">
                        {savedPlaceData.journalImages.map((img: string, idx: number) => (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group bg-slate-950">
                            <img
                              src={img}
                              alt="Generated Travel Memory"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  deleteJournalImage(img);
                                }}
                                className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-500 active:scale-90 transition-all shadow-lg"
                                title="Delete Snapshot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Finance Tracker */}
                <FinanceTracker placeId={place.id} savedPlaceData={savedPlaceData} user={user} />
              </div>
            )}
            
            {/* Route Comparison Section */}
            {userLocation && (
              <div className="pt-2">
                <RouteComparison 
                  origin={{ lat: userLocation.lat, lng: userLocation.lng }} 
                  destination={coords.lat && coords.lng ? { lat: coords.lat, lng: coords.lng } : place} 
                  onSelectRoute={(mode) => {
                     // Optionally implement mode switching for onShowRoute if supported
                     if (onShowRoute) onShowRoute();
                  }}
                />
              </div>
            )}

            {/* Smart Traffic Departure Predictor (Only if saved) */}
            {isSaved && userLocation && coords.lat && coords.lng && (
              <TrafficDeparturePredictor 
                origin={{ lat: userLocation.lat, lng: userLocation.lng }}
                destination={{ lat: coords.lat, lng: coords.lng }}
              />
            )}
          </motion.div>
        </motion.div>
        
        {/* Footer Action */}
         <div className="p-4 md:p-6 border-t border-slate-800 bg-[#14171d] flex gap-2 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
           <button
             onClick={(e) => {
               e.stopPropagation();
               e.preventDefault();
               handleAddToCalendar();
             }}
             className="w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors shrink-0"
             title="Add to Calendar"
           >
             <Calendar className="w-5 h-5" />
           </button>
          <button
            onClick={handleAddToItinerary}
            disabled={!canAddToItinerary}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl transition-all shrink-0 outline-none border",
              canAddToItinerary 
                ? "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border-indigo-500/20" 
                : "bg-emerald-500/80 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
            )}
            title={canAddToItinerary ? "Add to Trip" : "In Trip"}
          >
            {canAddToItinerary ? (
              <Plus className="w-5 h-5" />
            ) : (
              <Check className="w-5 h-5" />
            )}
          </button>
           {onSetRoutingOrigin && (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 e.preventDefault();
                 onSetRoutingOrigin();
               }}
               className={cn(
                 "w-12 h-12 flex items-center justify-center rounded-xl transition-all shrink-0 outline-none border",
                 isRoutingOrigin
                   ? "bg-emerald-500/80 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                   : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border-amber-500/20"
               )}
               title={isRoutingOrigin ? "Origin Set" : "Set as Route Origin"}
             >
               <MapPin className="w-5 h-5" />
             </button>
           )}
           {onShowRoute ? (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 e.preventDefault();
                 if (typeof navigator !== 'undefined' && navigator.vibrate) {
                   try { navigator.vibrate(15); } catch {}
                 }
                 onShowRoute();
               }}
               className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95"
             >
               <Navigation className="w-4 h-4 animate-bounce" />
               이 지도상에서 길찾기
             </button>
           ) : (
             <a 
               href={coords.lat && coords.lng ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName)}`}
               target="_blank"
               rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
             >
               <Navigation className="w-4 h-4" />
               Open in Maps
             </a>
           )}
         </div>

         {/* Trip Planner Modal */}
         <AnimatePresence>
            {showTripModal && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute inset-0 z-50 bg-[#0b0c10]/95 backdrop-blur-xl border-t border-indigo-500/20 flex flex-col pt-16 overflow-hidden"
                >
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setShowTripModal(false);
                        }}
                        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors z-50 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="px-6 flex-1 overflow-y-auto pb-10 scrollbar-none">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                <Compass className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight font-sans">Trip Planner</h2>
                                <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mt-0.5">VANTi Dynamic Itinerary</p>
                            </div>
                        </div>

                        {isPlanningTrip ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-6">
                                <VantiGeometricLoader color="#6366f1" />
                                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest animate-pulse">Syncing Cognitive Itinerary...</span>
                            </div>
                        ) : tripItinerary && tripItinerary.length > 0 ? (
                            <div className="space-y-6">
                                {tripItinerary.map((day, dIdx) => (
                                    <div key={dIdx} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="bg-indigo-500 text-white font-black text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">Day {day.day}</span>
                                            {day.notes && <span className="text-[10px] text-slate-400 font-mono italic truncate">"{day.notes}"</span>}
                                        </div>
                                        <div className="space-y-2.5">
                                            {day.locations?.map((loc: string, lIdx: number) => (
                                                <TaskListItem key={lIdx} loc={loc} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                                <Compass className="w-10 h-10 text-slate-700" />
                                <span className="text-sm font-sans text-slate-500 px-8">No itinerary generated. Please try again.</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
         </AnimatePresence>

         {/* Save Toast */}
         <AnimatePresence>
            {showSaveToast && (
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#090b10] border border-amber-500/30 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3 z-50 pointer-events-none"
                    style={{ minWidth: 'max-content' }}
                >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Check className="w-4 h-4 text-amber-500" strokeWidth={3} />
                    </div>
                    <div>
                        <p className="text-sm font-sans font-medium text-white">Save Successful</p>
                        <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest mt-0.5">Added to OS Hub</p>
                    </div>
                </motion.div>
            )}
         </AnimatePresence>

    </motion.div>
    </FocusLock>
  );
});

export default PlaceDetailsPanel;

