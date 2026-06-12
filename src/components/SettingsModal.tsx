import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Shield, Globe, Ruler, Map, Check, LogIn, AlertCircle, Cpu, Terminal, Palette, Cloud, Bell, BellOff, Zap, BookOpen, History as HistoryIcon, Github } from 'lucide-react';
import { CloseButton } from './CloseButton';
import FocusLock from 'react-focus-lock';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';
import { auth, db, loginWithGoogle, loginWithGithub, logout } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNotifications } from '../hooks/useNotifications';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  setMapType,
  onOpenDeveloperInsights
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  setMapType: (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => void;
  onOpenDeveloperInsights?: () => void;
}) {
  const { 
    units, setUnits, 
    mapStyle, setMapStyle, 
    mapAesthetic, setMapAesthetic, 
    language, setLanguage,
    showWeatherLayer, setShowWeatherLayer,
    areNotificationsEnabled, setNotificationsEnabled,
    themeOverride, setThemeOverride,
    t 
  } = useVantiStore();
  
  const { requestPermission, permission } = useNotifications();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Handle setting updates and persistence
  const handleUpdatePreferences = async (
    newUnits: 'metric' | 'imperial', 
    newMapStyle: 'streets' | 'satellite',
    newLanguage: 'en' | 'ko',
    newAesthetic: typeof mapAesthetic = mapAesthetic,
    newNotifications: boolean = areNotificationsEnabled
  ) => {
    // 1. Update global zustand state
    setUnits(newUnits);
    setMapStyle(newMapStyle);
    setMapType(newMapStyle === 'satellite' ? 'satellite' : 'roadmap');
    setLanguage(newLanguage);
    setMapAesthetic(newAesthetic);
    setNotificationsEnabled(newNotifications);

    // 2. Persist to Firestore if user is authenticated
    if (user) {
      setSaveStatus('saving');
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          units: newUnits,
          mapStyle: newMapStyle,
          language: newLanguage,
          mapAesthetic: newAesthetic,
          areNotificationsEnabled: newNotifications
        }, { merge: true });
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        console.error("Failed to save settings to Firestore", err);
        setSaveStatus('error');
        setErrorMessage(err.message || 'Firestore write permission error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled && permission === 'default') {
        await requestPermission();
    }
    handleUpdatePreferences(units, mapStyle, language, mapAesthetic, enabled);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock returnFocus>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-x-4 top-[10%] md:top-[15%] md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 w-full max-w-[420px] bg-[#090b11] border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl z-50 overflow-hidden pointer-events-auto border-indigo-500/20 max-h-[85vh] overflow-y-auto"
          >
            {/* Ambient Background glow */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-rose-500/10 rounded-full filter blur-[100px] pointer-none" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-black text-white uppercase tracking-wider font-mono">{t('settings.title')}</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{language === 'en' ? 'Custom Preferences' : '사용자 정의 기본 설정'}</p>
                </div>
              </div>

              <CloseButton onClick={onClose} />
            </div>

            {/* Content info */}
            <div className="space-y-6 relative z-10">
              {/* Unit System Option */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Ruler className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.units')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#0c0f16]/90 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => handleUpdatePreferences('metric', mapStyle, language)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      units === 'metric'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {units === 'metric' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'Metric' : '미터법'}
                  </button>
                  <button
                    onClick={() => handleUpdatePreferences('imperial', mapStyle, language)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      units === 'imperial'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {units === 'imperial' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'Imperial' : '야드파운드법'}
                  </button>
                </div>
              </div>

              {/* Theme Mode Option */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'App Theme' : '앱 테마'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-[#0c0f16]/90 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setThemeOverride('Auto')}
                    className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      themeOverride === 'Auto'
                        ? 'bg-emerald-600 text-white shadow-lg font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {language === 'en' ? 'System' : '시스템'}
                  </button>
                  <button
                    onClick={() => setThemeOverride('Light')}
                    className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      themeOverride === 'Light'
                        ? 'bg-emerald-600 text-white shadow-lg font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {language === 'en' ? 'Light' : '라이트'}
                  </button>
                  <button
                    onClick={() => setThemeOverride('Dark')}
                    className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      themeOverride === 'Dark'
                        ? 'bg-emerald-600 text-white shadow-lg font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {language === 'en' ? 'Dark' : '다크'}
                  </button>
                </div>
              </div>

              {/* Map Style */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Map className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.theme')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#0c0f16]/90 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => handleUpdatePreferences(units, 'streets', language)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      mapStyle === 'streets'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {mapStyle === 'streets' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'Streets' : '일반'}
                  </button>
                  <button
                    onClick={() => handleUpdatePreferences(units, 'satellite', language)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      mapStyle === 'satellite'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {mapStyle === 'satellite' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'Satellite' : '위성'}
                  </button>
                </div>
              </div>

              {/* Map Aesthetic Presets */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.aesthetic')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-[#0c0f16]/90 p-1.5 rounded-2xl border border-white/5">
                  {[
                    { id: 'none', label: 'Classic', icon: Map },
                    { id: 'night', label: 'Night', icon: Cloud },
                    { id: 'retro-blueprint', label: 'Blueprint', icon: Terminal },
                    { id: 'midnight-cyberpunk', label: 'Midnight', icon: Zap },
                    { id: 'minimalist-paper', label: 'Paper', icon: BookOpen },
                    { id: 'sepia', label: 'Vintage', icon: HistoryIcon }
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleUpdatePreferences(units, mapStyle, language, option.id as any)}
                        className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 border border-transparent ${
                          mapAesthetic === option.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                            : 'bg-transparent text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className={cn("w-4 h-4", mapAesthetic === option.id ? "text-white" : "text-slate-500")} />
                        <span className="truncate w-full text-center">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Globe className="w-4 h-4 text-rose-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.language')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#0c0f16]/90 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => handleUpdatePreferences(units, mapStyle, 'en')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      language === 'en'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {language === 'en' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    English
                  </button>
                  <button
                    onClick={() => handleUpdatePreferences(units, mapStyle, 'ko')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      language === 'ko'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {language === 'ko' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    한국어
                  </button>
                </div>
              </div>

              {/* Authentication Status & GitHub Sync */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Account Sync' : '계정 동기화'}</span>
                </div>
                <div className="space-y-2">
                  {!user ? (
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={async () => {
                          try { await loginWithGoogle(); } catch(e) { console.error(e); }
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                         <LogIn className="w-4 h-4" />
                         Login with Google
                      </button>
                      <button
                        onClick={async () => {
                          try { await loginWithGithub(); } catch(e) { console.error(e); }
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-slate-800 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                         <Github className="w-4 h-4" />
                         Login with GitHub
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#0d1017]/80 border border-white/5 space-y-4">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={user.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.uid}`} className="w-8 h-8 rounded-full border border-white/10" alt="avatar" />
                            <div>
                               <p className="text-[11px] font-black text-white truncate max-w-[120px]">{user.displayName || user.email}</p>
                               <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">Secure Session</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => logout()}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 rounded-lg text-[9px] font-black uppercase tracking-widest"
                          >
                            Logout
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Weather Layer Option */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.weather') || 'Weather Layer (OpenWeatherMap)'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#0c0f16]/90 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => {
                        setShowWeatherLayer(true);
                    }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      showWeatherLayer
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {showWeatherLayer && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'Enabled' : '사용'}
                  </button>
                  <button
                    onClick={() => {
                        setShowWeatherLayer(false);
                    }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      showWeatherLayer === false
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {showWeatherLayer === false && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'Disabled' : '사용 안 함'}
                  </button>
                </div>
              </div>

              {/* Battery Saver Option */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.batterySaver')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#0c0f16]/90 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => useVantiStore.getState().setIsBatterySaverEnabled(true)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      useVantiStore.getState().isBatterySaverEnabled
                        ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {useVantiStore.getState().isBatterySaverEnabled && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'On' : '켬'}
                  </button>
                  <button
                    onClick={() => useVantiStore.getState().setIsBatterySaverEnabled(false)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      !useVantiStore.getState().isBatterySaverEnabled
                        ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {!useVantiStore.getState().isBatterySaverEnabled && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'Off' : '끔'}
                  </button>
                </div>
                <p className="px-2 text-[9px] text-slate-500 font-medium">{t('settings.batterySaverDesc')}</p>
              </div>

              {/* Transit Alerts Option */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? 'Transit Alerts (Push)' : '대중교통 알림 (푸시)'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-[#0c0f16]/90 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => handleToggleNotifications(true)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      areNotificationsEnabled
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {areNotificationsEnabled && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'On' : '켬'}
                  </button>
                  <button
                    onClick={() => handleToggleNotifications(false)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      !areNotificationsEnabled
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/40 font-black'
                        : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {!areNotificationsEnabled && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {language === 'en' ? 'Off' : '끔'}
                  </button>
                </div>
                {areNotificationsEnabled && permission === 'denied' && (
                  <p className="px-2 text-[9px] text-rose-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Browser blocked notifications
                  </p>
                )}
              </div>

              {/* Developer Insights HUD Trigger */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Cpu className="w-4 h-4 text-violet-400 font-bold" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">METRICS ENGINE</span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenDeveloperInsights) {
                      onOpenDeveloperInsights();
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-[#121622] border border-violet-500/10 hover:border-violet-500/35 transition-all text-left flex items-center justify-between group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-violet-400" />
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-wider font-mono">DEVELOPER INSIGHTS</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">METRICS & ANALYTICS</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 group-hover:text-violet-400 font-bold transition-all uppercase">LAUNCH →</span>
                </button>
              </div>

              {/* Status Indicator */}
              {user && (
                <div className="p-4 rounded-2xl bg-[#0d1017]/80 border border-white/5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">Cloud Connected</span>
                      </div>
                      {saveStatus === 'saved' && <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Synced</span>}
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
}
