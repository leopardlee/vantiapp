import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, X, Compass, Search, Navigation, Users, Layers, Star, Camera, Check, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'vanti-search-nav',
    title: 'Precision Search',
    content: 'Query any global coordinate or point of interest. Our neural engine indexed over 200M nodes for instant retrieval.',
    position: 'bottom',
    icon: <Search className="w-5 h-5 text-indigo-400" />
  },
  {
    targetId: 'vanti-layers-nav',
    title: 'Visual Modalities',
    content: 'Toggle between Neo-Tokyo, Midnight, or Terrain-Focused aesthetics. Real-time atmospheric synthesis available.',
    position: 'left',
    icon: <Layers className="w-5 h-5 text-rose-400" />
  },
  {
    targetId: 'vanti-ai-nav',
    title: 'Gemini 3.5 Core',
    content: 'Direct link to the VANTi intelligence. Ask for travel optimization, local secrets, or itinerary synthesis.',
    position: 'top',
    icon: <Sparkles className="w-5 h-5 text-amber-400" />
  },
  {
    targetId: 'vanti-nodes-nav',
    title: 'Society Network',
    content: 'Sync with the network. Access your profile, travel diary, and active social nodes in your vicinity.',
    position: 'top',
    icon: <Users className="w-5 h-5 text-indigo-400" />
  },
  {
    targetId: 'vanti-explore-nav',
    title: 'OS Hub',
    content: 'Your central command. access curated collections, rewards, and real-time telemetry here.',
    position: 'top',
    icon: <Compass className="w-5 h-5 text-emerald-400" />
  }
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
];

import { loginWithGoogle, loginWithFacebook, loginWithApple, loginWithKakao, db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const OnboardingTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 means welcome/login screen
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  // Profile customization state
  const userProfile = useVantiStore((state) => state.userProfile);
  const setUserProfile = useVantiStore((state) => state.setUserProfile);

  const [nickname, setNickname] = useState(userProfile?.name || 'Vanti Nomad');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatarUrl || PRESET_AVATARS[0]);
  const [snsProvider, setSnsProvider] = useState<string | null>(userProfile?.snsProvider || null);
  const [tempSnsSyncing, setTempSnsSyncing] = useState<string | null>(null);
  
  // Questionnaire state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const INTEREST_OPTIONS = [
    { id: 'adventure', label: 'Adventure & Outdoors' },
    { id: 'foodie', label: 'Culinary & Foodie' },
    { id: 'relaxing', label: 'Relaxing & Wellness' },
    { id: 'culture', label: 'Art & Culture' },
    { id: 'nightlife', label: 'Nightlife & Events' }
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('vanti_tour_seen');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateCoords = useCallback(() => {
    if (currentStep < 0 || currentStep >= TOUR_STEPS.length) return;
    
    const element = document.getElementById(TOUR_STEPS[currentStep].targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      
      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep]);

  useEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [updateCoords]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (setUserProfile) {
      setUserProfile({
        name: nickname,
        avatarUrl: selectedAvatar,
        snsProvider: snsProvider || 'None'
      });
    }

    // Save to Firestore if user is authenticated
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          displayName: nickname,
          photoURL: selectedAvatar,
          interests: selectedInterests,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Failed to save user profile to Firestore", e);
      }
    }

    setIsVisible(false);
    localStorage.setItem('vanti_tour_seen', 'true');
  };

  const handleSkip = () => {
    if (setUserProfile) {
      setUserProfile({
        name: nickname,
        avatarUrl: selectedAvatar,
        snsProvider: snsProvider || 'None'
      });
    }
    setIsVisible(false);
    localStorage.setItem('vanti_tour_seen', 'true');
  };

  const triggerSnsLogin = async (provider: string) => {
    setTempSnsSyncing(provider);
    
    try {
      let user;
      if (provider === 'Google') {
        user = await loginWithGoogle();
      } else if (provider === 'Facebook') {
        user = await loginWithFacebook();
      } else if (provider === 'Apple') {
        user = await loginWithApple();
      } else if (provider === 'KakaoTalk') {
        user = await loginWithKakao();
      }
      
      if (user) {
        setSnsProvider(provider);
        setNickname(user.displayName || user.email?.split('@')[0] || 'Vanti Nomad');
        if (user.photoURL) {
          setSelectedAvatar(user.photoURL);
        }
        setTempSnsSyncing(null);
        return;
      }
    } catch (e) {
      console.warn("Real OAuth failed, falling back to mock UI to avoid blocking onboarding...", e);
    }

    // Fallback Mock Behavior if actual Firebase Auth fails or is not perfectly configured for the provider
    setTimeout(() => {
      setSnsProvider(provider);
      setTempSnsSyncing(null);
      // Auto-extract mock profile info for immersion
      if (provider === 'Google') {
        setNickname('Alex Jordan (Demo)');
        setSelectedAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
      } else if (provider === 'Apple') {
        setNickname('Chris Evans (Demo)');
        setSelectedAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80');
      } else if (provider === 'KakaoTalk') {
        setNickname('은우 (Kakao Demo)');
        setSelectedAvatar('https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80');
      } else if (provider === 'Facebook') {
        setNickname('Jessie Miller (Demo)');
        setSelectedAvatar('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80');
      }
    }, 1200);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[500] pointer-events-none overflow-hidden">
      <AnimatePresence mode="wait">
        {currentStep === -1 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#060810]/90 backdrop-blur-md flex items-center justify-center pointer-events-auto p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.94, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-lg w-full p-6 md:p-8 bg-[#090b15]/90 border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.9)] space-y-6 backdrop-blur-2xl"
            >
              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)] shrink-0">
                  <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Welcome to VANTi</h2>
                  <p className="text-slate-400 text-xs">Configure your biometric gateway & travel passport</p>
                </div>
              </div>

              {/* SNS Login Grid */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">1. Connect Identity Node (SNS SSO Link)</label>
                
                {snsProvider ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-400 font-mono">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      Linked with {snsProvider} Node
                    </span>
                    <button 
                      onClick={() => setSnsProvider(null)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-bold"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Google */}
                    <button
                      onClick={() => triggerSnsLogin('Google')}
                      disabled={!!tempSnsSyncing}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-left text-xs font-mono font-bold text-white transition-all disabled:opacity-45"
                    >
                      {tempSnsSyncing === 'Google' ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5 text-white shrink-0 fill-current" viewBox="0 0 24 24">
                          <path d="M12.24 10.285V13.4h6.887C18.2 15.414 15.56 18.1 12.24 18.1c-3.414 0-6.19-2.776-6.19-6.19 0-3.414 2.776-6.19 6.19-6.19 1.465 0 2.812.513 3.844 1.5l2.42-2.42C16.947 3.524 14.717 2.5 12.24 2.5 7.15 2.5 3 6.65 3 11.74s4.15 9.24 9.24 9.24c5.15 0 8.74-3.52 8.74-8.74 0-.62-.054-1.21-.154-1.785H12.24z"/>
                        </svg>
                      )}
                      <span>Google</span>
                    </button>

                    {/* Apple */}
                    <button
                      onClick={() => triggerSnsLogin('Apple')}
                      disabled={!!tempSnsSyncing}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-mono font-bold text-white transition-all disabled:opacity-45"
                    >
                      {tempSnsSyncing === 'Apple' ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5 text-white shrink-0 fill-current" viewBox="0 0 24 24">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.5 1.29-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
                        </svg>
                      )}
                      <span>Apple</span>
                    </button>

                    {/* KakaoTalk */}
                    <button
                      onClick={() => triggerSnsLogin('KakaoTalk')}
                      disabled={!!tempSnsSyncing}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#fee500] hover:bg-[#ebcf00] rounded-xl text-xs font-mono font-bold text-slate-900 transition-all disabled:opacity-45"
                    >
                      {tempSnsSyncing === 'KakaoTalk' ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3c-5.52 0-10 3.48-10 7.78 0 2.78 1.88 5.21 4.7 6.62l-1.18 4.34c-.09.34.1.68.43.58l4.98-3.32c.35.05.71.08 1.07.08 5.52 0 10-3.48 10-7.78-.01-4.29-4.49-7.77-10-7.77z"/>
                        </svg>
                      )}
                      <span>KakaoTalk</span>
                    </button>

                    {/* Facebook */}
                    <button
                      onClick={() => triggerSnsLogin('Facebook')}
                      disabled={!!tempSnsSyncing}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1877f2] hover:bg-[#1565cf] rounded-xl text-xs font-mono font-bold text-white transition-all disabled:opacity-45"
                    >
                      {tempSnsSyncing === 'Facebook' ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                        </svg>
                      )}
                      <span>Facebook</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Config Details */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">2. Personalize Profile & Location avatar</label>
                
                <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/40 p-4 border border-white/5 rounded-2xl">
                  {/* Avatar Picker & Uploader */}
                  <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                    <img 
                      src={selectedAvatar} 
                      alt="Selected Profile" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50 shadow-md group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {/* Preset Selector + Nickname */}
                  <div className="flex-1 space-y-2 w-full">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 block mb-1">TRAVELER NICKNAME</span>
                      <input 
                        type="text" 
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Enter Traveler Name..."
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg py-1 px-2.5 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 block mb-1">QUICK CHOOSE AVATAR PRESET</span>
                      <div className="flex gap-2">
                        {PRESET_AVATARS.map((avatar, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAvatar(avatar)}
                            className={cn(
                              "w-7 h-7 rounded-full overflow-hidden border-2 transition-all",
                              selectedAvatar === avatar ? "border-indigo-400 scale-110" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <img src={avatar} alt={`Preset ${index}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-7 h-7 rounded-full bg-white/5 border border-dashed border-white/20 hover:border-white/50 flex items-center justify-center transition-all text-slate-400 hover:text-white"
                          title="Upload image"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleSkip}
                  className="flex-1 py-3 px-6 rounded-2xl bg-white/5 text-slate-500 text-xs font-black uppercase tracking-widest hover:text-slate-300 transition-colors pointer-events-auto"
                >
                  Skip Nodes
                </button>
                <button 
                  onClick={() => setCurrentStep(-2)}
                  className="flex-[2] py-3 px-6 rounded-2xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all pointer-events-auto flex items-center justify-center gap-1"
                >
                  Configure Interests
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : currentStep === -2 ? (
          <motion.div
            key="interests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 bg-[#060810]/90 backdrop-blur-md flex items-center justify-center pointer-events-auto p-4"
          >
             <motion.div 
              initial={{ scale: 0.94, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-lg w-full p-6 md:p-8 bg-[#090b15]/90 border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.9)] space-y-6 backdrop-blur-2xl"
            >
              <div className="flex flex-col items-center gap-4 border-b border-white/5 pb-4 text-center">
                <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.2)] shrink-0">
                  <Star className="w-7 h-7 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Travel Preferences</h2>
                  <p className="text-slate-400 text-xs">Select your core interests to prime the Gemini-powered AI Assistant</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-4">
                {INTEREST_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedInterests(prev => 
                        prev.includes(opt.id) ? prev.filter(id => id !== opt.id) : [...prev, opt.id]
                      );
                    }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border transition-all pointer-events-auto",
                      selectedInterests.includes(opt.id)
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                      selectedInterests.includes(opt.id) ? "bg-rose-500 border-rose-400 text-white" : "border-slate-600"
                    )}>
                      {selectedInterests.includes(opt.id) && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-bold leading-tight text-left">{opt.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setCurrentStep(-1)}
                  className="flex-1 py-3 px-6 rounded-2xl bg-white/5 text-slate-500 text-xs font-black uppercase tracking-widest hover:text-slate-300 transition-colors pointer-events-auto"
                >
                  Back
                </button>
                <button 
                  onClick={() => setCurrentStep(0)}
                  disabled={selectedInterests.length === 0}
                  className="flex-[2] py-3 px-6 rounded-2xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all pointer-events-auto flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  Start Agent Training
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <>
            {/* Darkened overlay with spotlight effect */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 pointer-events-auto bg-black/40"
               style={{
                 maskImage: `radial-gradient(circle ${Math.max(coords.width, coords.height) * 0.8}px at ${coords.left + coords.width / 2}px ${coords.top + coords.height / 2}px, transparent, black)`,
                 WebkitMaskImage: `radial-gradient(circle ${Math.max(coords.width, coords.height) * 0.8}px at ${coords.left + coords.width / 2}px ${coords.top + coords.height / 2}px, transparent, black)`
               }}
            />

            {/* Tooltip */}
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                x: TOUR_STEPS[currentStep].position === 'left' ? coords.left - 280 : 
                   TOUR_STEPS[currentStep].position === 'right' ? coords.left + coords.width + 20 : 
                   coords.left + coords.width / 2 - 130,
                top: TOUR_STEPS[currentStep].position === 'top' ? coords.top - 180 : 
                     TOUR_STEPS[currentStep].position === 'bottom' ? coords.top + coords.height + 20 : 
                     coords.top + coords.height / 2 - 80
              }}
              className="absolute w-[260px] p-5 bg-[#0f1117] border border-white/10 rounded-3xl shadow-2xl pointer-events-auto z-[510]"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  {TOUR_STEPS[currentStep].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">{TOUR_STEPS[currentStep].title}</h4>
                  <div className="flex gap-0.5 mt-1">
                    {TOUR_STEPS.map((_, i) => (
                      <div key={i} className={cn("h-1 flex-1 rounded-full", i <= currentStep ? "bg-indigo-500" : "bg-white/10")} />
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-[11px] text-slate-400 leading-relaxed mb-5">
                {TOUR_STEPS[currentStep].content}
              </p>

              <div className="flex items-center justify-between">
                <button 
                  onClick={handleSkip}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  onClick={handleNext}
                  className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 group hover:gap-3 transition-all"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Initiate' : 'Next Node'}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
