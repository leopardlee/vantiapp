import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Headphones, VolumeX, Cpu, BellRing, Radar, Share2, Calendar, Award, Map, Mic, Wallet } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';
import { CloseButton } from './CloseButton';

export function LeftOperationsPanel() {
  const isOperationsHubOpen = useVantiStore(state => state.isOperationsHubOpen);
  const setIsOperationsHubOpen = useVantiStore(state => state.setIsOperationsHubOpen!);
  
  const isSpatialAudioActive = useVantiStore(state => state.isSpatialAudioActive);
  const setIsSpatialAudioActive = useVantiStore(state => state.setIsSpatialAudioActive!);
  
  const isTransitAlertsActive = useVantiStore(state => state.isTransitAlertsActive);
  const setIsTransitAlertsActive = useVantiStore(state => state.setIsTransitAlertsActive!);

  const isRadarActive = useVantiStore(state => state.isRadarActive);
  const setIsRadarActive = useVantiStore(state => state.setIsRadarActive!);

  const isLocalEventVisible = useVantiStore(state => state.isLocalEventVisible);
  const setIsLocalEventVisible = useVantiStore(state => state.setIsLocalEventVisible!);

  const isVoiceSearchVisible = useVantiStore(state => state.isVoiceSearchVisible);
  const setIsVoiceSearchVisible = useVantiStore(state => state.setIsVoiceSearchVisible!);

  const isFinanceTrackerVisible = useVantiStore(state => state.isFinanceTrackerVisible);
  const setIsFinanceTrackerVisible = useVantiStore(state => state.setIsFinanceTrackerVisible!);

  const setIsPassportOpen = useVantiStore(state => state.setIsPassportOpen!);
  const setIsJourneyRecapOpen = useVantiStore(state => state.setIsJourneyRecapOpen!);
  const setIsExportModalOpen = useVantiStore(state => state.setIsExportModalOpen!);

  const ToggleRow = ({ isActive, onClick, icon: Icon, label, activeColor, inactiveColor = "text-slate-400" }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border transition-all",
        isActive ? `bg-${activeColor}-500/10 border-${activeColor}-500/30` : "bg-white/5 border-white/5 hover:bg-white/10"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", isActive ? `text-${activeColor}-400` : inactiveColor)} />
        <span className="text-xs font-bold text-white">{label}</span>
      </div>
      <div className={cn("w-8 h-4 rounded-full flex items-center p-0.5 transition-colors", isActive ? `bg-${activeColor}-500` : "bg-slate-700")}>
        <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", isActive ? "translate-x-4" : "translate-x-0")} />
      </div>
    </button>
  );

  return (
    <AnimatePresence>
      {isOperationsHubOpen && (
        <div className="absolute left-[70px] top-[calc(50%)] -translate-y-1/2 z-[60] flex flex-col gap-3 items-start justify-start pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="bg-[#0f1117]/95 backdrop-blur-3xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl w-64 overflow-hidden relative z-20 flex flex-col max-h-[80vh]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono text-amber-50 font-bold tracking-widest">OPERATIONS HUB</span>
                </div>
                <CloseButton onClick={() => setIsOperationsHubOpen(false)} isAbsolute={false} />
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
               {/* Toggle Settings */}
               <ToggleRow 
                  isActive={isSpatialAudioActive} 
                  onClick={() => setIsSpatialAudioActive(!isSpatialAudioActive)} 
                  icon={isSpatialAudioActive ? Headphones : VolumeX} 
                  label="Spatial Audio" 
                  activeColor="cyan" 
               />
               <ToggleRow 
                  isActive={isTransitAlertsActive} 
                  onClick={() => setIsTransitAlertsActive(!isTransitAlertsActive)} 
                  icon={ShieldAlert} 
                  label="Transit Alerts" 
                  activeColor="rose" 
               />
               <ToggleRow 
                  isActive={isRadarActive} 
                  onClick={() => setIsRadarActive(!isRadarActive)} 
                  icon={Radar} 
                  label="Radar Scanner" 
                  activeColor="emerald" 
               />
               <ToggleRow 
                  isActive={isLocalEventVisible} 
                  onClick={() => setIsLocalEventVisible(!isLocalEventVisible)} 
                  icon={Calendar} 
                  label="Event Notifier" 
                  activeColor="indigo" 
               />
               <ToggleRow 
                  isActive={isVoiceSearchVisible} 
                  onClick={() => setIsVoiceSearchVisible(!isVoiceSearchVisible)} 
                  icon={Mic} 
                  label="Voice Assist" 
                  activeColor="rose" 
               />
               <ToggleRow 
                  isActive={isFinanceTrackerVisible} 
                  onClick={() => setIsFinanceTrackerVisible(!isFinanceTrackerVisible)} 
                  icon={Wallet} 
                  label="Trip Cost Tracker" 
                  activeColor="emerald" 
               />

               {/* Divider */}
               <div className="h-px w-full bg-white/10 my-1 shrink-0" />

               {/* Action Modals */}
               <button
                 onClick={() => setIsPassportOpen(true)}
                 className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 transition-all w-full text-white shrink-0"
               >
                 <Award className="w-4 h-4 text-yellow-400" />
                 <span className="text-xs font-bold">Passport Rewards</span>
               </button>

               <button
                 onClick={() => setIsJourneyRecapOpen(true)}
                 className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 hover:from-fuchsia-500/20 hover:to-purple-500/20 transition-all w-full text-white shrink-0"
               >
                 <Map className="w-4 h-4 text-fuchsia-400" />
                 <span className="text-xs font-bold">Journey Recap</span>
               </button>

               <button
                 onClick={() => setIsExportModalOpen(true)}
                 className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 transition-all w-full text-white shrink-0"
               >
                 <Share2 className="w-4 h-4" />
                 <span className="text-xs font-bold">Export Itinerary</span>
               </button>
            </div>
          </motion.div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}} />
    </AnimatePresence>
  );
}
