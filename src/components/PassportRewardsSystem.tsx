import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Check, MapPin, Loader2 } from 'lucide-react';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useVantiStore } from '../store/vantiStore';
import { CloseButton } from './CloseButton';

export function PassportRewardsSystem() {
  const isOpen = useVantiStore(state => state.isPassportOpen);
  const setIsOpen = useVantiStore(state => state.setIsPassportOpen!);
  const addOverlay = useVantiStore(state => state.addOverlay);
  const removeOverlay = useVantiStore(state => state.removeOverlay);
  const [stamps, setStamps] = useState<any[]>([]);
  
  useEffect(() => {
     if (auth.currentUser && isOpen) {
         fetchStamps();
         addOverlay('passport');
     } else if (!isOpen) {
         removeOverlay('passport');
     }
  }, [isOpen]);
  const [isStamping, setIsStamping] = useState(false);
  const userLocation = useVantiStore(state => state.userLocation);
  const bookmarkedPlaces = useVantiStore(state => state.bookmarkedPlaces);
  
  useEffect(() => {
     if (auth.currentUser && isOpen) {
         fetchStamps();
     }
  }, [isOpen]);

  const fetchStamps = async () => {
      if (!auth.currentUser) return;
      try {
          const q = query(collection(db, 'users', auth.currentUser.uid, 'passportStamps'));
          const snap = await getDocs(q);
          setStamps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch(err) {
          console.error(err);
      }
  };

  const handleCollectStamp = async () => {
      if (!auth.currentUser || !userLocation) return;
      setIsStamping(true);
      
      // MOCK check nearest place from bookmarks or just stamp current location
      const nearestPlaces = Object.values(bookmarkedPlaces || {});
      const name = nearestPlaces.length > 0 ? (nearestPlaces[0] as any).name || 'Discovery Node' : 'Local Landmark';
      const landmarkId = nearestPlaces.length > 0 ? (nearestPlaces[0] as any).id || String(Date.now()) : String(Date.now());
      
      try {
          await addDoc(collection(db, 'users', auth.currentUser.uid, 'passportStamps'), {
             landmarkId,
             name,
             timestamp: Date.now()
          });
          await fetchStamps();
      } catch (err) {
          console.error(err);
      } finally {
          setIsStamping(false);
      }
  };

  return (
    <AnimatePresence>
          {isOpen && (
              <motion.div 
                 key="passport-modal"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                 onClick={() => setIsOpen(false)}
              >
                  <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden p-6 relative" onClick={e => e.stopPropagation()}>
                      <CloseButton onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 border-slate-200" />
                      
                      <div className="flex flex-col items-center mb-6">
                          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                              <Award className="w-8 h-8" />
                          </div>
                          <h2 className="text-2xl font-black text-slate-800">Digital Passport</h2>
                          <p className="text-sm text-slate-500">Collect stamps by exploring physical locations.</p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 min-h-[150px] max-h-[300px] overflow-y-auto">
                          {stamps.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                  <MapPin className="w-8 h-8 mb-2 opacity-50" />
                                  <p className="text-sm font-medium">No stamps collected yet.</p>
                              </div>
                          ) : (
                              <div className="grid grid-cols-2 gap-3">
                                  {stamps.map((stamp, i) => (
                                      <div key={i} className="bg-white border-2 border-dashed border-orange-200 rounded-xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                          <div className="absolute inset-0 bg-orange-50 opacity-50" />
                                          <div className="w-10 h-10 border-2 border-orange-500 rounded-full flex items-center justify-center mb-2 z-10 rotate-12 bg-white text-orange-500">
                                              <MapPin className="w-5 h-5" />
                                          </div>
                                          <p className="text-xs font-bold text-slate-800 z-10 leading-tight">{stamp.name}</p>
                                          <p className="text-[9px] text-slate-400 z-10 mt-1">
                                              {new Date(stamp.timestamp).toLocaleDateString()}
                                          </p>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      <button 
                        onClick={handleCollectStamp}
                        disabled={isStamping || !userLocation}
                        className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all font-mono"
                      >
                          {isStamping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
                          CLAIM LOCATION STAMP
                      </button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
  );
}
