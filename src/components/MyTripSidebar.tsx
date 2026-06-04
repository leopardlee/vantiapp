import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { 
  Trash2, 
  GripVertical, 
  MapPin, 
  Calendar, 
  Navigation, 
  Clock, 
  X, 
  Sparkles,
  ChevronRight,
  Route,
  Plus,
  Check,
  Edit2,
  Save,
  Compass
} from 'lucide-react';
import { cn } from '../lib/utils';

export function MyTripSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const itinerary = useVantiStore((state) => state.itinerary);
  const removeFromItinerary = useVantiStore((state) => state.removeFromItinerary);
  const reorderItinerary = useVantiStore((state) => state.reorderItinerary);
  const setItinerary = useVantiStore((state) => state.setItinerary);
  const t = useVantiStore((state) => state.t);
  
  // Interactive Navigations
  const recenterToUser = useVantiStore((state) => state.recenterToUser);
  const setSelectedPlace = useVantiStore((state) => state.setSelectedPlace);
  const selectedPlace = useVantiStore((state) => state.selectedPlace);

  // Time slots & Stop adding states
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [linkToSelection, setLinkToSelection] = useState(true);

  // Inline time Slot editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTimeText, setEditingTimeText] = useState('');

  const handleReorder = (newOrder: any[]) => {
    const currentIds = itinerary.map(p => p.id).join(',');
    const newIds = newOrder.map(p => p.id).join(',');
    if (currentIds !== newIds) {
      setItinerary(newOrder);
    }
  };

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    // Default coordinates (San Francisco) or current selections
    let latVal = 37.7749;
    let lngVal = -122.4194;

    if (linkToSelection && selectedPlace) {
      latVal = Number(selectedPlace.lat || selectedPlace.location?.lat || 37.7749);
      lngVal = Number(selectedPlace.lng || selectedPlace.location?.lng || -122.4194);
    }

    const newStop = {
      id: `custom-stop-${Date.now()}`,
      displayName: customName,
      name: customName,
      lat: latVal,
      lng: lngVal,
      types: ['custom_stop'],
      timeSlot: customTime.trim() || undefined,
      formattedAddress: linkToSelection && selectedPlace ? (selectedPlace.formattedAddress || 'Selected Map Coordinates') : 'Custom Map Milestone'
    };

    setItinerary([...itinerary, newStop]);
    setCustomName('');
    setCustomTime('');
    setShowAddForm(false);
  };

  const handleUpdateTimeSlot = (id: string, newTime: string) => {
    const updated = itinerary.map(item => {
      if (item.id === id) {
        return { ...item, timeSlot: newTime.trim() || undefined };
      }
      return item;
    });
    setItinerary(updated);
    setEditingItemId(null);
    setEditingTimeText('');
  };

  const calculateTotalDistance = () => {
    return (itinerary.length * 2.4).toFixed(1);
  };

  const calculateTotalDuration = () => {
    return itinerary.length * 15;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[180] md:hidden pointer-events-auto"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 210 }}
            className="fixed top-0 right-0 h-full w-full md:w-[390px] bg-[#0c0e12]/95 backdrop-blur-2xl border-l border-white/10 z-[190] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
                  {t('planner.title')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{t('planner.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all active:scale-95 flex items-center gap-1 text-xs font-bold uppercase tracking-wider",
                    showAddForm 
                      ? "bg-slate-800 text-white border-slate-700" 
                      : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20"
                  )}
                  title="Add Custom Stop"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all border border-transparent hover:border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Drawer (Collapsible) */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden border-b border-white/5 bg-[#12151c]/60"
                >
                  <form onSubmit={handleAddStop} className="p-5 space-y-4 font-sans">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                        Stop Title / Activity
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        required
                        placeholder="e.g. Waterfront Lunch, Team Meetup"
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                        Time Slot (optional)
                      </label>
                      <input
                        type="text"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        placeholder="e.g. 12:00 PM - 01:30 PM, Evening"
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                      />
                    </div>

                    {selectedPlace && (
                      <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800 select-none group">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={linkToSelection} 
                          onChange={() => setLinkToSelection(!linkToSelection)} 
                        />
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                          linkToSelection ? "bg-rose-500 border-rose-500 text-white" : "bg-slate-950 border-slate-700"
                        )}>
                          {linkToSelection && <Check className="w-3 h-3 stroke-[3px]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-white leading-none">Link to Current Map Selection</div>
                          <div className="text-[9px] text-rose-400 font-mono truncate mt-1">*{selectedPlace.displayName || selectedPlace.name}</div>
                        </div>
                      </label>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20"
                      >
                        Add to Itinerary
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-800">
              {itinerary.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-slate-600 animate-bounce" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">
                    {t('planner.empty')}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-[200px] mt-2">
                    Click places on the map or tap the plus icon above to plan your journey!
                  </p>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={itinerary}
                  onReorder={handleReorder}
                  className="space-y-3.5"
                >
                  {itinerary.map((place, index) => {
                    const isEditing = editingItemId === place.id;
                    const stopLat = place.lat || place.location?.lat;
                    const stopLng = place.lng || place.location?.lng;

                    return (
                      <Reorder.Item
                        key={place.id}
                        value={place}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: index * 0.04 }}
                        className={cn(
                          "group relative bg-white/[0.03] hover:bg-white/[0.06] border transition-all duration-200 rounded-2xl p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing",
                          selectedPlace?.id === place.id ? "border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)] bg-white/[0.08]" : "border-white/5"
                        )}
                        onClick={() => {
                          if (stopLat && stopLng) {
                            recenterToUser(Number(stopLat), Number(stopLng));
                            setSelectedPlace(place);
                          }
                        }}
                      >
                        {/* Chronological Indicator */}
                        <div className="absolute -left-2.5 top-5 w-7 h-7 rounded-full bg-[#0c0e12] border border-white/20 flex items-center justify-center text-[10px] font-black font-mono text-rose-400 z-10 shadow-lg">
                          {index + 1}
                        </div>

                        {/* Top Line (Title & Actions) */}
                        <div className="flex items-start justify-between gap-2 pl-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                              {place.displayName || place.name}
                            </h4>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block mt-0.5 truncate">
                              {place.types?.[0]?.replace(/_/g, ' ') || 'Point of Interest'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all pointer-events-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditing) {
                                  setEditingItemId(null);
                                } else {
                                  setEditingItemId(place.id);
                                  setEditingTimeText(place.timeSlot || '');
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Edit Time Slot"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromItinerary(place.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Stop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="p-1.5 text-slate-600">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>

                        {/* Middle Info Row (Schedule Time & coordinates locator indicator) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pl-4 pt-1 border-t border-white/[0.03]">
                          {/* Schedule block */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {place.timeSlot ? (
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 font-mono font-bold animate-fade-in truncate">
                                <Clock className="w-3 h-3 text-rose-400" />
                                {place.timeSlot}
                              </div>
                            ) : (
                              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                                Unscheduled Spot
                              </div>
                            )}
                          </div>

                          {/* Coordinates linkage button */}
                          {stopLat && stopLng && (
                            <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                              <Navigation className="w-2.5 h-2.5 rotate-45" />
                              {Number(stopLat).toFixed(3)}, {Number(stopLng).toFixed(3)}
                            </div>
                          )}
                        </div>

                        {/* Inline Time Editor Form */}
                        {isEditing && (
                          <div 
                            className="pl-4 mt-2 pt-2 border-t border-dashed border-white/5 space-y-2 pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingTimeText}
                                onChange={(e) => setEditingTimeText(e.target.value)}
                                placeholder="e.g. 10:00 AM - 11:30 AM"
                                className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateTimeSlot(place.id, editingTimeText)}
                                className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                              >
                                Save
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['9am - 10am', '12pm - 1pm', '3pm - 4pm', '7pm - 8pm'].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setEditingTimeText(preset)}
                                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-slate-400 hover:text-white transition-all font-mono"
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </div>

            {/* Summary / Footer */}
            {itinerary.length > 0 && (
              <div className="p-6 bg-white/[0.01] border-t border-white/5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 font-mono">Total Distance</div>
                    <div className="text-lg font-black font-mono text-white">
                      {calculateTotalDistance()}
                      <span className="text-[10px] ml-1 text-slate-500 uppercase font-sans">km</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 font-mono">Travel Time</div>
                    <div className="text-lg font-black font-mono text-white">
                      {calculateTotalDuration()}
                      <span className="text-[10px] ml-1 text-slate-500 uppercase font-sans font-black">min</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    const setActiveMode = useVantiStore.getState().setActiveMode;
                    if (setActiveMode) {
                      setActiveMode('planner');
                    }
                  }}
                  className="w-full bg-rose-500 hover:bg-rose-450 text-white h-13 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_30px_rgba(244,63,94,0.25)] transition-all active:scale-95 flex items-center justify-center gap-3 group border border-transparent"
                >
                  <Route className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Generate Optimized Path
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
