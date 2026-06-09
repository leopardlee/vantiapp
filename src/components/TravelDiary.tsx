import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton, SkeletonCircle, SkeletonText } from './common/Skeleton';
import ReactMarkdown from 'react-markdown';
import { 
  BookOpen, Camera, MapPin, Send, Trash2, Sparkles, X,
  Heart, Calendar, LogIn, AlertCircle, Plus, Image, Loader2, Navigation,
  Users, UserPlus, ChevronLeft, Mail, CheckCircle2, Volume2, Vote, PlusCircle, BarChart3
} from 'lucide-react';
import { db, auth, loginWithGoogle } from '../lib/firebase';
import { formatDate, formatDistance } from '../lib/formatters';
import { useVantiStore } from '../store/vantiStore';
import { 
  collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot, where
} from 'firebase/firestore';

// Standard 3 Error types for compliant logging
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error logging: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const IMAGE_PRESETS = [
  {
    name: 'Neon Kyoto',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Icelandic Aurora',
    url: 'https://images.unsplash.com/photo-1483168527879-c66136b56105?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Santorini Sunset',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Swiss Alps',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Sahara Dunes',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'New York Skyline',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&q=80'
  }
];

export default function TravelDiary({
  user,
  selectedPlace,
  userLocation,
  language = 'en',
  onRecenter,
  onClose
}: {
  user: any;
  selectedPlace: any | null;
  userLocation: { lat: number, lng: number } | null;
  language?: 'en' | 'ko';
  onRecenter: (lat: number, lng: number) => void;
  onClose?: () => void;
}) {
  const units = useVantiStore(state => state.units);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [locationName, setLocationName] = useState('');
  const [selectedImage, setSelectedImage] = useState(IMAGE_PRESETS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');

  const [activeTab, setActiveTab] = useState<'public' | 'groups'>('public');
  const [groupTrips, setGroupTrips] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Group trip specific state
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [isGeneratingRecap, setIsGeneratingRecap] = useState(false);
  const [tripRecap, setTripRecap] = useState('');
  const [sortBy, setSortBy] = useState<'chrono' | 'geo'>('chrono');
  const [isSuggestingHiddenGems, setIsSuggestingHiddenGems] = useState(false);
  const [suggestedGems, setSuggestedGems] = useState<any[]>([]);

  // Poll state
  const [polls, setPolls] = useState<any[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Live Collaboration WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    if (user && activeTab === 'groups' && selectedGroupId) {
      const loc = window.location;
      const wsUrl = `${loc.protocol === 'https:' ? 'wss:' : 'ws:'}//${loc.host}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws?.send(JSON.stringify({
          type: 'join',
          tripId: selectedGroupId,
          user: { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL }
        }));
      };

      ws.onerror = (e) => {
        // Suppress benign connection errors
        console.warn("WebSocket connection error (handled):", e);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'presence') {
            setActiveUsers(data.users);
          }
        } catch (e) {}
      };
    }
    return () => {
      if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          try { ws.close(); } catch (e) {}
        }
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
      }
      setActiveUsers([]);
    };
  }, [user, activeTab, selectedGroupId]);

  // Distance helper
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Auto-fill location details if selectedPlace changes
  useEffect(() => {
    if (selectedPlace) {
      setLocationName(selectedPlace.displayName || selectedPlace.name || '');
    }
  }, [selectedPlace]);

  // Read feed snapshot subscriptions
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubFeed: any = null;
    let unsubGroups: any = null;
    let unsubPolls: any = null;

    setLoading(true);

    if (activeTab === 'public') {
      const path = 'travelSnapshots';
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      unsubFeed = onSnapshot(q, (snapshot) => {
        const sn: any[] = [];
        snapshot.forEach(doc => {
          sn.push({ id: doc.id, ...doc.data() });
        });
        setFeed(sn);
        setLoading(false);
      }, (error) => {
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (err: any) {
          setErrorStatus('Failed to load feed snapshots due to permission constraints.');
        }
      });
    } else if (activeTab === 'groups') {
      // Load groups first
      if (!selectedGroupId) {
        const qGroups = query(
          collection(db, 'groupTrips'),
          where('participantEmails', 'array-contains', user.email || ''),
          orderBy('createdAt', 'desc')
        );
        unsubGroups = onSnapshot(qGroups, (snapshot) => {
          const grps: any[] = [];
          snapshot.forEach(d => grps.push({ id: d.id, ...d.data() }));
          setGroupTrips(grps);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'groupTrips');
          setLoading(false);
        });
      } else {
        // Load polls
        const pollsPath = `groupTrips/${selectedGroupId}/polls`;
        const qPolls = query(collection(db, pollsPath), orderBy('createdAt', 'desc'));
        unsubPolls = onSnapshot(qPolls, (snapshot) => {
          const p: any[] = [];
          snapshot.forEach(d => p.push({ id: d.id, ...d.data() }));
          setPolls(p);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, pollsPath);
        });

        // Load feed for specific group
        const snapshotsPath = `groupTrips/${selectedGroupId}/snapshots`;
        const qSnapshot = query(collection(db, snapshotsPath), orderBy('createdAt', 'desc'));
        unsubFeed = onSnapshot(qSnapshot, (snapshot) => {
          const sn: any[] = [];
          snapshot.forEach(doc => {
            sn.push({ id: doc.id, ...doc.data() });
          });
          setFeed(sn);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, snapshotsPath);
          setLoading(false);
        });
      }
    }

    return () => {
      if (unsubFeed) unsubFeed();
      if (unsubGroups) unsubGroups();
      if (unsubPolls) unsubPolls();
    };
  }, [user, activeTab, selectedGroupId]);

  // Publish snapshot to feed
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!text.trim()) return;
    if (!locationName.trim()) {
      setErrorStatus('Please provide a Location Name.');
      return;
    }

    setIsPublishing(true);
    setErrorStatus('');

    const imageUrl = customImageUrl.trim() || selectedImage;
    const finalLat = selectedPlace?.location?.lat || selectedPlace?.lat || userLocation?.lat || 35.6812;
    const finalLng = selectedPlace?.location?.lng || selectedPlace?.lng || userLocation?.lng || 139.7671;

    const path = activeTab === 'groups' && selectedGroupId 
      ? `groupTrips/${selectedGroupId}/snapshots` 
      : 'travelSnapshots';
      
    try {
      const snapshotRef = doc(collection(db, path));
      const payload = {
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous Explorer',
        userPhotoURL: user.photoURL || '',
        text: text.substring(0, 1500),
        imageUrl: imageUrl,
        locationName: locationName.substring(0, 150),
        lat: Number(finalLat),
        lng: Number(finalLng),
        createdAt: Date.now()
      };

      await setDoc(snapshotRef, payload);

      // Reset state
      setText('');
      setCustomImageUrl('');
      setShowCreator(false);
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch (logErr: any) {
        setErrorStatus('Write denied or rules validation failed.');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete snapshot
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this trip memory?")) return;
    const path = activeTab === 'groups' && selectedGroupId 
      ? `groupTrips/${selectedGroupId}/snapshots/${id}` 
      : `travelSnapshots/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (logErr) {
        alert("Firestore error: deletion restricted to owner.");
      }
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupName.trim()) return;

    setIsCreatingGroup(true);
    setErrorStatus('');

    try {
      const groupRef = doc(collection(db, 'groupTrips'));
      const emails = inviteEmails.split(',')
        .map(mail => mail.trim().toLowerCase())
        .filter(mail => mail && mail.includes('@'));
      
      // Ensure owner is always in the participant list
      if (user.email && !emails.includes(user.email.toLowerCase())) {
        emails.push(user.email.toLowerCase());
      }

      await setDoc(groupRef, {
        ownerId: user.uid,
        name: newGroupName.trim(),
        participantEmails: emails,
        createdAt: Date.now()
      });

      setNewGroupName('');
      setInviteEmails('');
      setShowNewGroupForm(false);
      setSelectedGroupId(groupRef.id);
    } catch (err: any) {
      console.error(err);
      setErrorStatus('Failed to create group trip.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleGenerateRecap = async () => {
    if (feed.length === 0) return;
    setIsGeneratingRecap(true);
    setTripRecap('');
    try {
      const res = await fetch('/api/trip-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: selectedGroupId ? groupTrips.find(g => g.id === selectedGroupId)?.name : 'Solo Trip',
          snapshots: feed
        })
      });
      const data = await res.json();
      setTripRecap(data.recap || 'Recap failed.');
    } catch (e) {
      console.error(e);
      setTripRecap('Failed to generate summary.');
    } finally {
      setIsGeneratingRecap(false);
    }
  };

  const handleSuggestHiddenGems = async () => {
    if (!feed.length) {
      alert("Pin some locations first so I can analyze your style!");
      return;
    }
    
    setIsSuggestingHiddenGems(true);
    setSuggestedGems([]);
    try {
      const res = await fetch('/api/suggest-hidden-gems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPins: feed.slice(0, 5),
          userLocation: userLocation || { lat: 37.5665, lng: 126.9780 }
        })
      });
      const data = await res.json();
      setSuggestedGems(data.suggestions || []);
    } catch (err) {
      console.error("Gem suggestion failed:", err);
    } finally {
      setIsSuggestingHiddenGems(false);
    }
  };

  const handleTTS = (text: string, locationName: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Try to isolate the description if it's long
    const utterance = new SpeechSynthesisUtterance(`${locationName}. ${text.substring(0, 200)}`);
    utterance.rate = 0.95;
    if (language === 'ko') {
      utterance.lang = 'ko-KR';
    } else {
      utterance.lang = 'en-US';
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGroupId || !pollQuestion.trim()) return;
    const validOptions = pollOptions.filter(o => o.trim() !== '');
    if (validOptions.length < 2) return;

    try {
      const pollRef = doc(collection(db, `groupTrips/${selectedGroupId}/polls`));
      await setDoc(pollRef, {
        question: pollQuestion.trim(),
        options: validOptions,
        votes: {},
        createdBy: user.uid,
        createdAt: Date.now()
      });
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollCreator(false);
    } catch (err) {
      console.error('Failed to create poll:', err);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user || !selectedGroupId) return;
    const pollRef = doc(db, `groupTrips/${selectedGroupId}/polls`, pollId);
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    const newVotes = { ...poll.votes };
    if (newVotes[user.uid] === optionIndex) {
      delete newVotes[user.uid];
    } else {
      newVotes[user.uid] = optionIndex;
    }
    try {
      await setDoc(pollRef, { votes: newVotes }, { merge: true });
    } catch (e) {
      console.error('Voting failed:', e);
    }
  };

  const handleReaction = async (snapId: string, emoji: string) => {
    if (!user) return;
    const path = activeTab === 'groups' && selectedGroupId 
        ? `groupTrips/${selectedGroupId}/snapshots/${snapId}` 
        : `travelSnapshots/${snapId}`;
    
    const snap = feed.find(s => s.id === snapId);
    if (!snap) return;

    const currentReactions = snap.reactions || {};
    const updateData = { ...currentReactions };
    
    if (updateData[user.uid] === emoji) {
      delete updateData[user.uid];
    } else {
      updateData[user.uid] = emoji;
    }

    try {
      await setDoc(doc(db, path), { reactions: updateData }, { merge: true });
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  const sortedFeed = [...feed].sort((a, b) => {
    if (sortBy === 'geo' && userLocation) {
      const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    }
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-3 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-rose-500 animate-pulse" />
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400">Atmosphere Diary Feed</h4>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <div className="flex items-center bg-slate-900/50 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('public');
                setSelectedGroupId(null);
                setShowNewGroupForm(false);
              }}
              className={`flex-1 py-1.5 text-[9px] font-mono tracking-widest uppercase font-black rounded-lg transition-colors ${
                activeTab === 'public' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Public Feed
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-mono tracking-widest uppercase font-black rounded-lg transition-colors ${
                activeTab === 'groups' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Group Trips</span>
            </button>
          </div>
        )}
      </div>

      {/* Creator Actions Row */}
      <div className="flex justify-between items-center px-1">
        {activeTab === 'groups' && selectedGroupId ? (
           <button
             onClick={() => setSelectedGroupId(null)}
             className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors"
           >
             <ChevronLeft className="w-3 h-3" /> Back
           </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          {user && !showCreator && ((activeTab === 'public') || (activeTab === 'groups' && selectedGroupId)) && (
            <button
              onClick={() => setShowCreator(true)}
              className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-mono tracking-widest uppercase font-black transition-all active:scale-95 shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>SHARE MOMENT</span>
            </button>
          )}

          {user && activeTab === 'groups' && !selectedGroupId && !showNewGroupForm && (
            <button
              onClick={() => setShowNewGroupForm(true)}
              className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-mono tracking-widest uppercase font-black transition-all active:scale-95 shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>NEW TRIP</span>
            </button>
          )}
        </div>
      </div>

      {/* New Group Trip Form overlay */}
      <AnimatePresence>
        {showNewGroupForm && activeTab === 'groups' && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0b0d13] border border-emerald-500/20 p-4 rounded-3xl space-y-4 overflow-hidden"
          >
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[9px] font-mono tracking-wider text-emerald-500 uppercase font-black">CREATE COLLAB TRIP</span>
                <button
                  type="button"
                  onClick={() => setShowNewGroupForm(false)}
                  className="text-slate-500 hover:text-white text-[9px] uppercase font-bold tracking-widest"
                >
                  Cancel
                </button>
              </div>

               {errorStatus && <p className="text-xs text-rose-500 font-medium">{errorStatus}</p>}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trip Name</label>
                <input
                  type="text"
                  placeholder="E.g. Summer in Tokyo 🌸"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full bg-[#161925] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invite Friends (Comma separated emails)</label>
                 <textarea
                   placeholder="alex@example.com, sam@example.com"
                   value={inviteEmails}
                   onChange={e => setInviteEmails(e.target.value)}
                   className="w-full h-20 bg-[#161925] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder-white/20"
                 />
                 <p className="text-[10px] text-slate-500">
                   Invited users will see this trip in their Group Trips tab if they log in with the specified email.
                 </p>
               </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingGroup || !newGroupName.trim()}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  {isCreatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  CREATE GROUP
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creator Form overlay */}
      <AnimatePresence>
        {showCreator && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0b0d13] border border-white/5 p-4 rounded-3xl space-y-4 overflow-hidden"
          >
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase font-black">LOG TODAY'S EXPEDITION</span>
                <button
                  type="button"
                  onClick={() => setShowCreator(false)}
                  className="text-slate-500 hover:text-white text-[9px] uppercase font-bold tracking-widest"
                >
                  Cancel
                </button>
              </div>

              {/* Text area */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Diary Log</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="The sunset glowing behind Kyoto's neon horizon, coffee aroma mixing with rain..."
                  maxLength={1500}
                  rows={3}
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-900 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium leading-relaxed"
                  required
                />
              </div>

              {/* Location Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                    <span>Target Landmark</span>
                    {selectedPlace && <span className="text-[7.5px] text-rose-400 font-mono">MAP PLACE SYNCED</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Fushimi Inari Shrine, Tokyo"
                      maxLength={150}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-900 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all font-bold"
                      required
                    />
                    <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Custom Image URL (Optional)</label>
                  <div className="relative">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-900 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all font-medium"
                    />
                    <Image className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>
              </div>

              {/* Cover Presets */}
              {!customImageUrl.trim() && (
                <div className="space-y-2 pt-1">
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block">Or select an immersive visual skin:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                    {IMAGE_PRESETS.map((preset) => {
                      const selected = selectedImage === preset.url;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setSelectedImage(preset.url)}
                          className={`flex-none relative w-20 h-12 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                            selected ? 'border-rose-500 scale-95 shadow-md shadow-rose-900/10' : 'border-slate-800 opacity-60 hover:opacity-90'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-center">
                            <span className="text-[7.5px] text-white font-mono tracking-tighter leading-none select-none">{preset.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error Status banner */}
              {errorStatus && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] rounded-xl font-mono flex items-center gap-1.5 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorStatus}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreator(false)}
                  className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-bold transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="flex items-center gap-1.5 py-1.5 px-4 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] uppercase tracking-wider font-black transition-all active:scale-95"
                >
                  {isPublishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isPublishing ? 'PUBLISHING...' : 'PUBLISH'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="space-y-4">
        {!user ? (
          <div className="p-8 text-center bg-[#07090e]/60 rounded-3xl border border-dashed border-slate-900 flex flex-col items-center justify-center gap-3">
            <BookOpen className="w-8 h-8 text-slate-800 opacity-50 animate-pulse" />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Locked Social Feed</p>
              <p className="text-[9px] text-slate-600 mt-1 max-w-[200px] leading-tight">
                Authenticating creates a persistent passport to view other travel snapshot feeds and share your memories.
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[9px] uppercase tracking-widest font-black transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in with Google
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4 px-1">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl space-y-3">
                 <div className="flex items-center gap-3">
                   <SkeletonCircle size="w-8 h-8" />
                   <div className="space-y-1.5 flex-1">
                     <SkeletonText className="w-1/3 h-2" />
                     <SkeletonText className="w-1/4 h-1.5" />
                   </div>
                 </div>
                 <Skeleton className="w-full h-32 rounded-xl" />
                 <div className="space-y-1.5 pt-1">
                   <SkeletonText className="w-full h-2" />
                   <SkeletonText className="w-[80%] h-2" />
                 </div>
               </div>
             ))}
          </div>
        ) : activeTab === 'groups' && !selectedGroupId ? (
          /* GROUP TRIPS LIST DIRECTORY */
          <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1 pb-4">
             {groupTrips.length === 0 ? (
               <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-white/5">
                 <Users className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Group Trips</p>
                 <p className="text-[9px] text-slate-500 mt-1 max-w-[200px] mx-auto">Create a group and invite your friends to start collaborating on a shared travel diary feed.</p>
               </div>
             ) : (
               groupTrips.map(group => (
                 <motion.button
                   key={group.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   onClick={() => setSelectedGroupId(group.id)}
                   className="w-full text-left bg-[#0c0f16] group hover:bg-[#121620] border border-white/5 p-4 rounded-xl transition-colors flex flex-col space-y-3 relative"
                 >
                   <div className="flex justify-between items-start w-full">
                     <h5 className="text-sm font-black text-white">{group.name}</h5>
                   </div>
                   <div className="flex justify-between items-center w-full">
                     <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900 px-2 py-0.5 rounded text-[10px] font-mono">
                       <Mail className="w-3 h-3" />
                       <span className="tracking-widest">{group.participantEmails?.length || 1} Invites</span>
                     </div>
                     <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5 tracking-widest uppercase">
                       <Calendar className="w-3 h-3 text-slate-600" />
                       {formatDate(group.createdAt, language)}
                     </div>
                   </div>
                 </motion.button>
               ))
             )}
          </div>
        ) : feed.length === 0 ? (
          <div className="p-8 text-center bg-[#07090e]/60 rounded-3xl border border-dashed border-slate-900 flex flex-col items-center justify-center gap-1.5">
            <Camera className="w-6 h-6 text-slate-800 opacity-60 mb-1" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Feed is Empty</p>
            <p className="text-[9px] text-slate-600 max-w-[180px] leading-tight mt-1">Be the very first coordinates explorer to share a snapshot!</p>
            <button
              onClick={() => setShowCreator(true)}
              className="mt-3 py-1.5 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-[9px] font-black uppercase text-rose-400 tracking-wider transition-all"
            >
              Log First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin pr-1 pb-4">
            
            {/* Group Trip Controls */}
            {activeTab === 'groups' && selectedGroupId && sortedFeed.length > 0 && (
              <div className="space-y-3">
                {/* Live Collaboration Row */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/50 p-2 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="uppercase tracking-widest font-bold">Live Synced ({activeUsers.length})</span>
                    <div className="flex pl-1">
                      {activeUsers.slice(0, 3).map((u, i) => (
                        <img key={u.uid} src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} alt={u.displayName} className={`w-4 h-4 rounded-full border border-slate-900 ${i > 0 ? '-ml-1.5' : ''}`} />
                      ))}
                      {activeUsers.length > 3 && (
                        <span className="text-[8px] bg-slate-800 rounded-full h-4 px-1 border border-slate-900 flex items-center justify-center -ml-1 text-white font-black">+{activeUsers.length - 3}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Smart Sorting */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button onClick={() => setSortBy('chrono')} className={`px-2 py-1 rounded text-[8px] uppercase tracking-wider font-extrabold transition-all border border-transparent ${sortBy === 'chrono' ? 'bg-slate-800 text-white border-white/10' : 'text-slate-500 hover:text-white'}`}>Time</button>
                    <button onClick={() => setSortBy('geo')} disabled={!userLocation} className={`px-2 py-1 rounded text-[8px] uppercase tracking-wider font-extrabold transition-all border border-transparent ${sortBy === 'geo' ? 'bg-slate-800 text-emerald-400 border-white/10' : 'text-slate-500 hover:text-white disabled:opacity-30'} ${!userLocation ? 'cursor-not-allowed' : ''}`} title={!userLocation ? 'Location access required' : 'Sort by nearby'}>Proximity</button>
                  </div>
                </div>

                {/* AI Trip Insights Section */}
                <div className="flex flex-col gap-2 bg-gradient-to-r from-blue-900/10 to-purple-900/10 border border-indigo-500/20 p-3 rounded-2xl">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                       <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300">AI Trip Insights</span>
                     </div>
                     <div className="flex gap-2">
                        <button
                          onClick={handleSuggestHiddenGems}
                          disabled={isSuggestingHiddenGems}
                          className="py-1 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded-lg text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          {isSuggestingHiddenGems ? <Loader2 className="w-3 h-3 animate-spin"/> : <MapPin className="w-3 h-3"/>}
                          AI Suggest
                        </button>
                        <button
                          onClick={handleGenerateRecap}
                          disabled={isGeneratingRecap}
                          className="py-1 px-3 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 text-indigo-300 rounded-lg text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          {isGeneratingRecap ? <Loader2 className="w-3 h-3 animate-spin"/> : null}
                          Generate Story
                        </button>
                     </div>
                   </div>
                   
                   {tripRecap && (
                     <div className="mt-2 text-[11px] text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed font-serif prose prose-invert prose-p:my-1 prose-headings:text-[13px] prose-headings:text-white prose-headings:font-black prose-headings:font-sans">
                       <ReactMarkdown>{tripRecap}</ReactMarkdown>
                     </div>
                   )}

                   {suggestedGems.length > 0 && (
                     <div className="mt-2 space-y-2 animate-fadeIn">
                       <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Hidden Gems Found</span>
                       <div className="grid grid-cols-1 gap-2">
                         {suggestedGems.map((gem, i) => (
                           <div key={i} className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                             <div className="flex justify-between items-start">
                               <h6 className="text-[10px] font-black text-white">{gem.name}</h6>
                               <button 
                                 onClick={() => onRecenter(gem.lat, gem.lng)}
                                 className="text-amber-400 hover:text-white transition-colors"
                               >
                                 <Navigation className="w-3 h-3 rotate-45" />
                               </button>
                             </div>
                             <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{gem.description}</p>
                             <div className="mt-1 flex items-center gap-1 text-[8px] font-bold text-amber-200/60 uppercase">
                               <CheckCircle2 className="w-2.5 h-2.5" />
                               {gem.whyHiddenGem}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>

                {/* Quick Poll Section */}
                <div className="space-y-3 bg-slate-900/40 p-3 rounded-2xl border border-dashed border-white/5">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <Vote className="w-3.5 h-3.5 text-emerald-400" />
                       <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">Quick Polls</span>
                     </div>
                     <button
                       onClick={() => setShowPollCreator(!showPollCreator)}
                       className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95"
                       title="Create Poll"
                     >
                       <PlusCircle className="w-4 h-4" />
                     </button>
                   </div>

                   <AnimatePresence>
                     {showPollCreator && (
                       <motion.div 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         className="space-y-3 bg-black/40 p-3 rounded-xl border border-white/5 overflow-hidden"
                       >
                         <input 
                           type="text" 
                           placeholder="What should we do tonight?"
                           value={pollQuestion}
                           onChange={e => setPollQuestion(e.target.value)}
                           className="w-full bg-[#161925] border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                         />
                         <div className="space-y-2">
                           {pollOptions.map((opt, i) => (
                             <input 
                               key={i}
                               type="text"
                               placeholder={`Option ${i+1}`}
                               value={opt}
                               onChange={e => {
                                 const next = [...pollOptions];
                                 next[i] = e.target.value;
                                 setPollOptions(next);
                               }}
                               className="w-full bg-[#161925]/50 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-emerald-500"
                             />
                           ))}
                           {pollOptions.length < 5 && (
                             <button 
                               onClick={() => setPollOptions([...pollOptions, ''])}
                               className="text-[9px] text-slate-500 font-bold hover:text-white uppercase tracking-wider pl-1"
                             >
                               + Add Option
                             </button>
                           )}
                         </div>
                         <div className="flex justify-end gap-2">
                           <button onClick={() => setShowPollCreator(false)} className="text-[10px] text-slate-500 font-bold px-2 py-1">Cancel</button>
                           <button 
                             onClick={handleCreatePoll}
                             disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                             className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                           >
                             Launch
                           </button>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>

                   {/* Active Polls List */}
                   <div className="space-y-3">
                     {polls.map(poll => {
                        const totalVotes = Object.keys(poll.votes || {}).length;
                        return (
                          <div key={poll.id} className="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-3">
                             <h6 className="text-[11px] font-black text-white">{poll.question}</h6>
                             <div className="space-y-2">
                               {poll.options.map((opt: string, idx: number) => {
                                  const votesForThis = Object.values(poll.votes || {}).filter(v => v === idx).length;
                                  const percentage = totalVotes > 0 ? (votesForThis / totalVotes) * 100 : 0;
                                  const hasVoted = poll.votes?.[user?.uid] === idx;
                                  return (
                                    <button 
                                      key={idx}
                                      onClick={() => handleVote(poll.id, idx)}
                                      className={`w-full text-left relative overflow-hidden group p-2 rounded-lg border transition-all ${hasVoted ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                    >
                                      <div 
                                        className="absolute inset-y-0 left-0 bg-emerald-500/10 transition-all duration-700" 
                                        style={{ width: `${percentage}%` }}
                                      />
                                      <div className="relative flex justify-between items-center text-[10px]">
                                        <span className={`font-bold transition-colors ${hasVoted ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}>{opt}</span>
                                        <div className="flex items-center gap-1.5 font-mono">
                                          {hasVoted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                          <span className="text-[9px] text-slate-500 tabular-nums">{votesForThis}</span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                               })}
                             </div>
                             <div className="flex justify-between items-center pt-1">
                               <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{totalVotes} Total Votes</span>
                               <BarChart3 className="w-3 h-3 text-slate-700" />
                             </div>
                          </div>
                        );
                     })}
                   </div>
                </div>
              </div>
            )}

            {sortedFeed.map((snap) => (
              <motion.div
                key={snap.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-slate-900 bg-slate-950/40 hover:bg-slate-950/60 transition-all overflow-hidden"
              >
                {/* Visual Cover */}
                {snap.imageUrl && (
                  <div className="relative w-full h-28 bg-[#101217] overflow-hidden border-b border-slate-900/40">
                    <img
                      src={snap.imageUrl}
                      alt={snap.locationName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                    
                    {/* Location Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/5">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span className="text-[9px] text-white font-black uppercase tracking-wider">{snap.locationName}</span>
                    </div>

                    {/* Telemetry flight shortcut */}
                    <div className="absolute right-3 bottom-1.5 flex flex-col gap-2">
                      <button
                        onClick={() => handleTTS(snap.text, snap.locationName)}
                        className="w-7 h-7 rounded-lg bg-black/60 hover:bg-emerald-600 hover:text-white border border-white/5 flex items-center justify-center text-slate-300 transition-all hover:scale-105"
                        title="Read location info (TTS)"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      
                      {snap.lat && snap.lng && (
                        <button
                          onClick={() => onRecenter(snap.lat, snap.lng)}
                          className="w-7 h-7 rounded-lg bg-black/60 hover:bg-indigo-600 hover:text-white border border-white/5 flex items-center justify-center text-slate-300 transition-all hover:scale-105"
                          title="Navigate Camera Here"
                        >
                          <Navigation className="w-3.5 h-3.5 rotate-45" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Subinfo Container */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    {/* User Profile */}
                    <div className="flex items-center gap-2">
                      <img
                        src={snap.userPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80'}
                        alt={snap.userDisplayName}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full border border-white/10"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold text-white truncate leading-none">{snap.userDisplayName}</p>
                        <div className="flex items-center gap-1.5 text-[8px] text-slate-500 uppercase font-mono mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{formatDate(snap.createdAt, language)}</span>
                          {userLocation && snap.lat && snap.lng && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="text-emerald-500/70 font-black">
                                {formatDistance(getDistance(userLocation.lat, userLocation.lng, snap.lat, snap.lng) * 1000, units, language)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete item */}
                    {snap.userId === user.uid && (
                      <button
                        onClick={() => handleDelete(snap.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-500 text-slate-600 p-1 rounded-lg hover:bg-rose-500/10 transition-all active:scale-90"
                        title="Delete diary record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Body Text */}
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed font-sans whitespace-pre-wrap">
                    {snap.text}
                  </p>

                  {/* Reaction Toolbar (Only for Group Trips) */}
                  {activeTab === 'groups' && selectedGroupId && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-slate-800/50">
                      {['✈️', '🔥', '❤️', '👀', '💯'].map((emoji) => {
                         const hasReacted = snap.reactions && snap.reactions[user?.uid] === emoji;
                         const count = Object.values(snap.reactions || {}).filter(v => v === emoji).length;
                         if (count === 0 && !hasReacted) {
                           return (
                             <button
                               key={emoji}
                               onClick={() => handleReaction(snap.id, emoji)}
                               className="px-2 py-0.5 rounded-md bg-slate-900/40 hover:bg-slate-800 transition-colors border border-transparent text-[10px] opacity-40 hover:opacity-100"
                             >
                               {emoji}
                             </button>
                           );
                         }
                         return (
                           <button
                             key={emoji}
                             onClick={() => handleReaction(snap.id, emoji)}
                             className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all text-[10px] font-bold ${
                               hasReacted 
                                 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                 : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                             }`}
                           >
                             <span>{emoji}</span>
                             <span>{count}</span>
                           </button>
                         )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
