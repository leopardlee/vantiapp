import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { 
  ShieldAlert, 
  X, 
  MapPin, 
  RefreshCw, 
  Check, 
  Clock, 
  Train, 
  CloudRain, 
  AlertTriangle,
  Lightbulb,
  BellRing
} from 'lucide-react';
import { cn } from '../lib/utils';

export function TransitAlertSystem() {
  const itinerary = useVantiStore(state => state.itinerary || []);
  const setItinerary = useVantiStore(state => state.setItinerary);
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isMitigating, setIsMitigating] = useState(false);
  const [hasResolved, setHasResolved] = useState(false);

  // Monitor itinerary changes to generate route-specific disruptions & delays dynamically
  useEffect(() => {
    if (itinerary.length === 0) {
      setActiveAlerts([]);
      return;
    }

    // Capture first and second stop names
    const stop1 = itinerary[0]?.displayName || itinerary[0]?.name || 'Stop 1';
    const stop2 = itinerary[1]?.displayName || itinerary[1]?.name || 'Stop 2';

    // Generate highly relevant simulated delays based on actual stops in the itinerary!
    const mockAlerts = [
      {
        id: 'alert-1',
        type: 'transit',
        severity: 'critical',
        title: 'Signaling Delay: Metro Line 4',
        message: `A signal malfunction near transit corridors leading to *${stop1}* has suspended line service. Expect +18 mins delays.`,
        minutes: 18,
        affectedStop: stop1,
        icon: Train,
        color: '#f43f5e'
      },
      {
        id: 'alert-2',
        type: 'weather',
        severity: 'warning',
        title: 'Heavy Rainfall Warning',
        message: `Localized downpours detected around *${stop2}*. Ground surfaces are slippery, causing pedestrian speeds to drop by 30%.`,
        minutes: 12,
        affectedStop: stop2,
        icon: CloudRain,
        color: '#eab308'
      }
    ];

    setActiveAlerts(mockAlerts);

    // Trigger transient HUD notification toast if a new alert comes in
    setToastMessage(`Safety Corridor Sync: 2 active delay vectors identified targeting your itinerary!`);
    setShowToast(true);
    const timer = setTimeout(() => setShowToast(false), 6000);
    return () => clearTimeout(timer);
  }, [itinerary.length]);

  // AI Active Mitigation: reorders itinerary or swaps elements to minimize travel delay
  const handleAutoMitigate = () => {
    if (itinerary.length < 2) return;
    setIsMitigating(true);

    setTimeout(() => {
      // Reorder route to put less delayed stops first
      const nextSequence = [...itinerary];
      // Simple swap of the first two elements to reverse travel vectors away from Line 4 congestion
      if (nextSequence.length >= 2) {
         const temp = nextSequence[0];
         nextSequence[0] = nextSequence[1];
         nextSequence[1] = temp;
      }

      setItinerary(nextSequence);
      setIsMitigating(false);
      setHasResolved(true);
      
      // Clear or resolve the critical warning
      const mitigated = activeAlerts.map(a => {
        if (a.id === 'alert-1') {
          return {
            ...a,
            severity: 'resolved',
            title: 'Resolved: Subway Diverted Transit Route Active',
            message: 'AI successfully bypassed Subway Line 4 signaling bottlenecks using taxi route synchronization.',
            color: '#10b981'
          };
        }
        return a;
      });
      setActiveAlerts(mitigated);

      // Play alert resolve sound or vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 80]);
      }
    }, 1200);
  };

  const isTransitAlertsActive = useVantiStore((state) => state.isTransitAlertsActive);

  if (!isTransitAlertsActive) return null;

  return (
    <>
      {/* Persistent Transient HUD Toast Overlay */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            onClick={() => {
              setIsOpen(true);
              setShowToast(false);
            }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[250] bg-[#0c0e12]/95 border border-rose-500/30 shadow-[0_15px_30px_rgba(244,63,94,0.15)] rounded-2xl p-4 flex items-center gap-3.5 max-w-sm w-11/12 pointer-events-auto cursor-pointer"
          >
             <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
             </div>
             <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-rose-400 uppercase font-black tracking-widest block leading-none">
                   ROUTING WARNING
                </span>
                <p className="text-xs font-semibold text-slate-100 mt-1 line-clamp-2 leading-relaxed">
                   {toastMessage}
                </p>
             </div>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 setShowToast(false);
               }}
               className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white"
             >
                <X className="w-3.5 h-3.5" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISRUPTION CONTROL PANEL MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.65 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsOpen(false)}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
             />

             {/* Modal Board */}
             <motion.div
               initial={{ scale: 0.9, y: 20, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.9, y: 20, opacity: 0 }}
               className="relative bg-[#0d1016]/95 border border-rose-500/20 rounded-3xl p-5 md:p-6 shadow-2xl w-full max-w-lg overflow-hidden font-sans z-10 pointer-events-auto text-left"
             >
                {/* Visual red/amber danger glow filter at top */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${hasResolved ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-yellow-500'}`} />

                <div className="flex justify-between items-start gap-4 mb-4">
                   <div>
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] tracking-widest font-black uppercase">
                         TELEMETRY DISRUPTION MATRIX
                      </span>
                      <h3 className="text-lg font-black text-white mt-1.5 flex items-center gap-2">
                         <ShieldAlert className="w-5 h-5 text-rose-500" />
                         Real-Time Delay & Weather Feeds
                      </h3>
                   </div>
                   <button 
                     onClick={() => setIsOpen(false)}
                     className="p-1.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors"
                   >
                     <X className="w-4 h-4" />
                   </button>
                </div>

                {/* Main Body content */}
                <div className="space-y-4 mb-6 max-h-[280px] overflow-y-auto pr-1 select-none scrollbar-thin">
                   {activeAlerts.length === 0 ? (
                      <div className="text-center py-10 bg-white/[0.01] border border-white/5 rounded-3xl flex flex-col items-center justify-center p-6">
                         <Clock className="w-8 h-8 text-slate-600 mb-2" />
                         <p className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">No Active Disruption Feeds</p>
                         <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                            Add locations or select transit route vectors on your map to synchronize live delay indexes.
                         </p>
                      </div>
                   ) : (
                      activeAlerts.map((alert) => {
                         const AlertIcon = alert.icon;
                         return (
                            <div 
                              key={alert.id}
                              style={{ borderColor: `${alert.color}25` }}
                              className="bg-[#121620]/60 rounded-2xl p-4 border flex items-start gap-3.5 transition-all"
                            >
                               <div 
                                 className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                                 style={{ backgroundColor: `${alert.color}10`, borderColor: `${alert.color}30`, color: alert.color }}
                               >
                                  <AlertIcon className="w-5 h-5" />
                               </div>

                               <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                     <h4 className="text-xs font-black text-slate-200">{alert.title}</h4>
                                     {alert.severity !== 'resolved' && (
                                       <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold text-white uppercase shrink-0" style={{ backgroundColor: alert.color }}>
                                          +{alert.minutes}m Delay
                                       </span>
                                     )}
                                  </div>

                                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                                     {alert.message}
                                  </p>

                                  <div className="flex items-center gap-1.5 mt-3 text-[9px] font-mono text-slate-500 font-bold bg-white/[0.01] w-fit px-2 py-0.5 rounded border border-white/5">
                                     <MapPin className="w-3 h-3 text-slate-500" />
                                     <span>Sector Target: {alert.affectedStop}</span>
                                  </div>
                               </div>
                            </div>
                         );
                      })
                   )}
                </div>

                {/* AI REROUTE ADVICE CTA */}
                {activeAlerts.length > 0 && (
                   <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                         <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                         <div>
                            <span className="text-[10px] font-mono text-indigo-400 uppercase font-black tracking-widest block">
                               AI NAVIGATION RECOMMENDATION
                            </span>
                            <p className="text-[11px] text-indigo-200/90 leading-relaxed mt-1">
                               Reordering your saved stop sequence avoids Subway Line 4 bottlenecks entirely and optimizes walking speeds against the active rain zone.
                            </p>
                         </div>
                      </div>

                      <button
                        onClick={handleAutoMitigate}
                        disabled={isMitigating || hasResolved}
                        className={cn(
                           "py-3 w-full rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md mt-1 outline-none",
                           hasResolved
                             ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold"
                             : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40"
                        )}
                      >
                         {isMitigating ? (
                            <>
                               <RefreshCw className="w-4 h-4 animate-spin" />
                               Calculating Deviation Paths...
                            </>
                         ) : hasResolved ? (
                            <>
                               <Check className="w-4 h-4 text-emerald-400" />
                               Disruptions Mitigated Successfully!
                            </>
                         ) : (
                            <>
                               <RefreshCw className="w-4 h-4" />
                               Auto-Reroute to Bypass Delays
                            </>
                         )}
                      </button>
                   </div>
                )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
