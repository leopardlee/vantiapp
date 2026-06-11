import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, Volume2, X, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { useMap } from '@vis.gl/react-google-maps';
import { cn } from '../lib/utils';
import { useVantiStore } from '../store/vantiStore';

interface Phrase {
  original: string;
  translated: string;
  phonetic: string;
}

const PHRASE_DATA: Record<string, { name: string; phrases: Phrase[] }> = {
  ko: {
    name: 'Korean',
    phrases: [
      { original: 'Hello', translated: '안녕하세요', phonetic: 'An-nyeong-ha-se-yo' },
      { original: 'Thank you', translated: '감사합니다', phonetic: 'Gam-sa-ham-ni-da' },
      { original: 'How much?', translated: '얼마예요?', phonetic: 'Eol-ma-ye-yo?' },
      { original: 'Where is the bathroom?', translated: '화장실 어디예요?', phonetic: 'Hwa-jang-sil eo-di-ye-yo?' },
      { original: 'Excuse me', translated: '실례합니다', phonetic: 'Sil-lye-ham-ni-da' }
    ]
  },
  ja: {
    name: 'Japanese',
    phrases: [
      { original: 'Hello', translated: 'こんにちは', phonetic: 'Konnichiwa' },
      { original: 'Thank you', translated: 'ありがとうございます', phonetic: 'Arigatou gozaimasu' },
      { original: 'How much?', translated: 'いくらですか？', phonetic: 'Ikura desu ka?' },
      { original: 'Where is the station?', translated: '駅はどこですか？', phonetic: 'Eki wa doko desu ka?' },
      { original: 'I\'m sorry', translated: 'ごめんなさい', phonetic: 'Gomen-nasai' }
    ]
  },
  en: {
    name: 'English',
    phrases: [
      { original: 'Hello', translated: 'Hello', phonetic: 'Hel-lo' },
      { original: 'Thank you', translated: 'Thank you', phonetic: 'Thank you' },
      { original: 'How much?', translated: 'How much?', phonetic: 'How much?' },
      { original: 'Help', translated: 'Help', phonetic: 'Help' },
      { original: 'Where am I?', translated: 'Where am I?', phonetic: 'Where am I?' }
    ]
  }
};

export function QuickPhrasesOverlay() {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const [localLang, setLocalLang] = useState('en');

  const isChatbotOpen = useVantiStore((state) => state.isChatbotOpen);
  const showList = useVantiStore((state) => state.showList);
  const isCinematicMode = useVantiStore((state) => state.isCinematicMode);
  
  useEffect(() => {
    if (!map) return;
    
    const updateLanguage = () => {
      const center = map.getCenter();
      if (!center) return;
      
      const lat = center.lat();
      const lng = center.lng();

      // Heuristic detection for regions (VANTI Logic)
      if (lat > 33 && lat < 39 && lng > 124 && lng < 131) {
        setLocalLang('ko');
      } else if (lat > 30 && lat < 45 && lng > 128 && lng < 146) {
        setLocalLang('ja');
      } else {
        setLocalLang('en');
      }
    };

    const listener = map.addListener('idle', updateLanguage);
    return () => listener.remove();
  }, [map]);

  const activeSet = PHRASE_DATA[localLang] || PHRASE_DATA.en;

  const speak = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (showList || isChatbotOpen || isCinematicMode) {
    return null;
  }

  return (
    <div className="fixed bottom-[400px] md:bottom-28 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-72 bg-[#05060c]/95 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl p-5 pointer-events-auto overflow-hidden text-white z-[300]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#a5b4fc]">Local Phrases</h4>
                  <p className="text-xs font-bold text-white leading-none">{activeSet.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {activeSet.phrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => speak(phrase.translated, localLang)}
                  className="w-full group flex items-start gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all text-left"
                >
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-[#6366f1] uppercase tracking-tight mb-0.5">{phrase.original}</p>
                    <p className="text-sm font-black text-white leading-tight">{phrase.translated}</p>
                    <p className="text-[10px] italic text-[#818cf8] font-medium mt-1">{phrase.phonetic}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#a5b4fc] transition-colors">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <button className="w-full py-2 rounded-xl bg-[#6366f1]/20 hover:bg-[#6366f1]/30 text-[#a5b4fc] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                Open Dictionary <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layout
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-[#0b0c15]/85 backdrop-blur-3xl border border-white/20 text-[#818cf8] hover:text-white hover:bg-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:scale-105 active:scale-95",
          isOpen && "bg-[#512da8] border-[#a5b4fc]/30 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]"
        )}
      >
        <MessageSquareQuote className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
