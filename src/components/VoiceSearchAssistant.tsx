import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Search, Loader2 } from 'lucide-react';
import { CloseButton } from './CloseButton';
import { useVantiStore } from '../store/vantiStore';

export function VoiceSearchAssistant() {
  const isVoiceSearchVisible = useVantiStore(state => state.isVoiceSearchVisible);
  const setIsVoiceSearchVisible = useVantiStore(state => state.setIsVoiceSearchVisible!);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSpeechResponse, setAiSpeechResponse] = useState('');

  const recognitionRef = useRef<any>(null);
  const setQuery = useVantiStore(state => state.setQuery);
  const addRecentSearch = useVantiStore(state => state.addRecentSearch);
  const recentSearches = useVantiStore(state => state.recentSearches);
  const setSelectedCategory = useVantiStore(state => state.setSelectedCategory);
  const setTravelMood = useVantiStore(state => state.setTravelMood);
  const setSimulatedRoutingCondition = useVantiStore(state => state.setSimulatedRoutingCondition);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onstart = () => {
        setIsListening(true);
        setAiSpeechResponse('');
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (isVoiceSearchVisible && !isListening && recognitionRef.current && !isProcessing && transcript === '') {
        recognitionRef.current.start();
    } else if (!isVoiceSearchVisible && isListening && recognitionRef.current) {
        recognitionRef.current.stop();
    }
  }, [isVoiceSearchVisible]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsVoiceSearchVisible(false);
    } else {
      setTranscript('');
      setAiSpeechResponse('');
      recognitionRef.current?.start();
    }
  };

  const processResponse = async () => {
     if (!transcript) return;
     setIsProcessing(true);
     setAiSpeechResponse('');
     
     try {
       const res = await fetch('/api/voice-understand', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ voiceString: transcript })
       });
       if (res.ok) {
         const data = await res.json();
         
         if (data.query) {
           setQuery(data.query);
           addRecentSearch(data.query);
         }
         if (data.category) {
           setSelectedCategory(data.category);
         }
         if (data.style) {
           setTravelMood(data.style);
         }
         if (data.speakResponse) {
           setAiSpeechResponse(data.speakResponse);
           
           if (typeof window !== 'undefined' && window.speechSynthesis) {
             try {
               window.speechSynthesis.cancel();
               const utterance = new SpeechSynthesisUtterance(data.speakResponse);
               utterance.rate = 1.05;
               window.speechSynthesis.speak(utterance);
             } catch (ttsErr) {
               console.warn("Speech Synthesis output suppressed:", ttsErr);
             }
           }
         }
       } else {
         setQuery(transcript);
       }
     } catch (err) {
         console.warn(err);
         setQuery(transcript);
     } finally {
         setIsProcessing(false);
     }
  };

  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
       processResponse();
    }
  }, [isListening, transcript]);

  return (
    <AnimatePresence>
      {isVoiceSearchVisible && (
        <motion.div
          key="voice-search-modal"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[60]"
        >
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={toggleListening}
             onMouseEnter={() => setShowRecent(true)}
             onMouseLeave={() => setShowRecent(false)}
             className={`h-12 flex items-center justify-center gap-3 px-6 rounded-full shadow-2xl transition-all duration-300 font-medium ${isListening ? 'bg-rose-500 text-white' : 'bg-black/80 backdrop-blur-md text-white border border-white/10'}`}
           >
              {isProcessing ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   <span>Processing AI Logic...</span>
                 </>
              ) : isListening ? (
                 <>
                   <span className="relative flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <Mic className="relative w-5 h-5" />
                   </span>
                   <span className="text-sm font-mono tracking-wide">{transcript || "Listening..."}</span>
                 </>
              ) : (
                 <>
                   <Mic className="w-5 h-5 opacity-70" />
                   <span>Voice Assist Off</span>
                 </>
              )}
           </motion.button>
           
           <CloseButton 
              onClick={() => setIsVoiceSearchVisible(false)} 
              isAbsolute={false}
              className="absolute -right-2 -top-2"
           />

           {/* AI Speech Transcript Feedback Bubble */}
           <AnimatePresence>
             {aiSpeechResponse && (
               <motion.div
                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                 className="mt-3 w-[285px] bg-[#0c0f16]/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 text-center flex flex-col gap-1 items-center mx-auto"
               >
                 <span className="text-[8px] tracking-widest font-mono text-indigo-400 uppercase font-black animate-pulse">AI Voice Response</span>
                 <p className="text-xs text-white leading-relaxed font-sans font-medium">
                   {aiSpeechResponse}
                 </p>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Recent Searches */}
           <AnimatePresence>
             {showRecent && recentSearches.length > 0 && !isListening && (
                <motion.div
                  key="recent-searches"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-14 left-0 w-full bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 z-50 shadow-2xl"
                  onMouseEnter={() => setShowRecent(true)}
                  onMouseLeave={() => setShowRecent(false)}
                >
                  <div className="text-[10px] text-slate-400 font-mono tracking-wider ps-2 mb-1">RECENT</div>
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(term);
                        setShowRecent(false);
                      }}
                      className="w-full text-left text-sm text-white px-2 py-1.5 rounded-lg hover:bg-white/10 truncate font-mono"
                    >
                      {term}
                    </button>
                  ))}
                </motion.div>
             )}
           </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
