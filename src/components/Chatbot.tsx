import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Loader2, Video, Bot, Image as ImageIcon, MapPin, Check, Mic, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useMap } from '@vis.gl/react-google-maps';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { useVantiStore } from '../store/vantiStore';

const TaskListItem = ({ loc, key }: { loc: string; key?: any }) => {
  const [done, setDone] = useState(false);
  return (
    <label className={cn("flex items-start gap-2.5 cursor-pointer p-2 rounded-lg transition-colors border select-none group", done ? "bg-indigo-500/10 border-indigo-500/20" : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80")}>
      <div className={cn("mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all", done ? "bg-indigo-500 border-indigo-500 text-white" : "bg-slate-900 border-slate-600 group-hover:border-indigo-500")}>
        {done && <Check className="w-3 h-3" strokeWidth={3} />}
      </div>
      <span className={cn("text-[11px] font-sans leading-relaxed", done ? "line-through text-slate-500" : "text-slate-200")}>{loc}</span>
    </label>
  );
};

export default function Chatbot({ onMapCommand, isVisible = true }: { onMapCommand?: (name: string, args: any) => void; isVisible?: boolean }) {
  const isOpen = useVantiStore(state => state.isChatbotOpen);
  const setIsOpen = useVantiStore(state => state.setIsChatbotOpen);
  const [messages, setMessages] = useState<{ 
    role: 'user' | 'assistant'; 
    text: string; 
    isVideo?: boolean; 
    videoUrl?: string; 
    imageUrl?: string;
    grounding?: any[];
    itinerary?: any[];
    places?: any[];
  }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const map = useMap();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, startListening, stopListening } = useVoiceNavigation((command) => {
    setInput(command);
    // For hands-free: trigger submit if we have a strong match
    if (command.trim().length > 2) {
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as any;
        handleSubmit(fakeEvent, command);
      }, 500);
    }
  });

  const triggerHaptic = (type: 'tap' | 'success' | 'close') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (type === 'tap') navigator.vibrate(12);
        else if (type === 'success') navigator.vibrate([15, 30, 15]);
        else if (type === 'close') navigator.vibrate([10, 25]);
      } catch (e) {
        // Safe failover
      }
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImageBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    if ((!finalInput.trim() && !imageBase64) || isLoading) return;

    triggerHaptic('tap');
    const userMessage = finalInput.trim();
    if (!overrideInput) setInput('');
    const currentBase64 = imageBase64;
    clearImage();

    setMessages(prev => [...prev, { role: 'user', text: userMessage, imageUrl: currentBase64 || undefined }]);
    setIsLoading(true);

    const context = map ? {
      center: map.getCenter()?.toJSON(),
      zoom: map.getZoom(),
      bounds: map.getBounds()?.toJSON()
    } : null;

    try {
      // Check if it's a video generation request
      if (userMessage.toLowerCase().includes('generate video') || userMessage.toLowerCase().includes('create video')) {
         setMessages(prev => [...prev, { role: 'assistant', text: 'Generating a video simulation for you using Veo... This might take a few minutes.', isVideo: true }]);
         
         const videoReq = await fetch('/api/generate-video', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ prompt: userMessage })
         });
         const { operationName } = await videoReq.json();
         
         if (!operationName) {
             setMessages(prev => [...prev, { role: 'assistant', text: 'Failed to start video generation.' }]);
             setIsLoading(false);
             return;
         }

         const poll = setInterval(async () => {
             try {
               const statusReq = await fetch('/api/video-status', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ operationName })
               });
               const { done } = await statusReq.json();
               
               if (done) {
                   clearInterval(poll);
                   setMessages(prev => {
                       const newMsgs = [...prev];
                       newMsgs[newMsgs.length - 1] = { 
                          role: 'assistant', 
                          text: 'Here is the generated map video simulation:', 
                          isVideo: true,
                          videoUrl: `/api/video-download?op=${encodeURIComponent(operationName)}`
                       };
                       return newMsgs;
                   });
                   setIsLoading(false);
               }
             } catch (err) {
                 console.error("Polling error", err);
             }
         }, 10000); // 10s poll
         return;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context, imageBase64: currentBase64 })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let errMsg = data.error || 'An error occurred while connecting to VANTi core.';
        if (res.status === 429) {
          errMsg = data.error || 'VANTi intelligence quota has been exceeded or is currently processing a high volume of requests. Please try again in a few moments.';
        }
        setMessages(prev => [...prev, { role: 'assistant', text: errMsg }]);
        setIsLoading(false);
        return;
      }
      
      const data = await res.json();
      
      // Handle Function Calls
      let currentItinerary = null;
      let currentPlaces = null;
      if (data.functionCalls && onMapCommand) {
        data.functionCalls.forEach((fc: any) => {
          onMapCommand(fc.name, fc.args);
          if (fc.name === 'planTrip') {
            currentItinerary = fc.args.itinerary;
          }
          if (fc.name === 'showPlaces') {
            currentPlaces = fc.args.places;
          }
        });
      }

      const groundingSources = data.groundingMetadata?.groundingChunks?.map((c: any) => c.web || c.maps).filter(Boolean);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.text,
        grounding: groundingSources,
        itinerary: currentItinerary || undefined,
        places: currentPlaces || undefined
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: 'An error occurred while connecting to VANTi core.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const PlaceCard = ({ place, ...props }: { place: any, [key: string]: any }) => (
    <div 
      onClick={() => {
        triggerHaptic('tap');
        onMapCommand?.('recenterMap', { lat: place.lat, lng: place.lng, zoom: 17, tilt: 45 });
      }}
      className="mt-2 p-3 glass border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all cursor-pointer group rounded-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors font-sans tracking-tight">{place.name}</h4>
          <p className="text-[10px] text-slate-400 line-clamp-1 font-sans">{place.description || 'View on Map'}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
          <MapPin className="w-4 h-4 text-indigo-400" />
        </div>
      </div>
      {place.type && (
        <span className="mt-2 inline-block px-1.5 py-0.5 bg-slate-800 rounded text-[8px] text-slate-500 font-bold uppercase tracking-widest">{place.type}</span>
      )}
    </div>
  );

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-24 left-4 right-4 md:right-auto md:left-auto md:right-6 z-50 md:w-96 bg-[#14171d]/95 backdrop-blur-3xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto h-[500px] max-h-[60vh] md:max-h-[70vh]"
          >
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-medium text-white text-sm">VANTi Core</h3>
                  <p className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Active</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  triggerHaptic('close');
                  setIsOpen(false);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90 bg-black/20"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-3 opacity-60">
                  <Sparkles className="w-8 h-8 text-indigo-400 mb-2" />
                  <p className="text-sm text-slate-300">I am VANTi Core. Ask me anything about the world, search for places, or ask for a video simulation.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto" : "mr-auto")}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-sm" 
                      : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                  )}>
                    {msg.imageUrl && (
                      <div className="mb-2 w-full max-w-sm rounded-lg overflow-hidden border border-white/20">
                        <img src={msg.imageUrl} alt="User attachment" className="w-full h-auto object-cover" />
                      </div>
                    )}
                    {msg.text && <div>{msg.text}</div>}
                    {msg.places && (
                      <div className="mt-2 space-y-2">
                        {msg.places.map((place, pIdx) => (
                          <PlaceCard key={pIdx} place={place} />
                        ))}
                      </div>
                    )}
                    {msg.itinerary && (
                      <div className="mt-3 space-y-4">
                        <span className="text-[10px] text-amber-500 uppercase font-black tracking-[0.15em] flex items-center gap-1.5 border-b border-amber-500/20 pb-1.5">
                           <Sparkles className="w-3 h-3 text-amber-400" /> VANTi Trip Planner
                        </span>
                        {msg.itinerary.map((day: any, d: number) => (
                          <div key={d} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/50 shadow-inner">
                            <h4 className="text-[11px] font-black text-white bg-slate-800 inline-block px-2 py-1 rounded-md mb-3 border border-slate-700 uppercase tracking-widest">Day {day.day}</h4>
                            <div className="flex flex-col gap-2 mb-3">
                              {day.locations?.map((loc: string, l: number) => (
                                <TaskListItem key={l} loc={loc} />
                              ))}
                            </div>
                            {day.notes && <p className="text-[10px] text-slate-400 font-sans leading-relaxed pl-1 italic border-l-2 border-slate-700">"{day.notes}"</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.grounding && msg.grounding.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Grounding Sources</span>
                        <div className="flex flex-wrap gap-2">
                          {msg.grounding.map((g: any, j: number) => (
                            <a 
                              key={j} 
                              href={g.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline truncate max-w-[150px]"
                            >
                              {g.title || 'Source'}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.isVideo && (
                     <div className="mt-2 w-full h-auto min-h-32 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden">
                        {msg.videoUrl ? (
                           <video src={msg.videoUrl} autoPlay loop muted controls className="w-full h-full object-cover" />
                        ) : isLoading && i === messages.length - 1 ? (
                           <div className="flex flex-col items-center gap-2 py-8">
                             <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                             <span className="text-xs text-indigo-400 animate-pulse text-center px-4">Generating Veo Video...<br/>This may take several minutes.</span>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center gap-2 py-8">
                             <Video className="w-8 h-8 text-indigo-500" />
                             <span className="text-xs text-slate-400">Video Simulation Ready</span>
                           </div>
                        )}
                     </div>
                  )}
                </div>
              ))}
              {isLoading && !messages[messages.length - 1]?.isVideo && (
                <div className="mr-auto px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800 border border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/40">
              {imageBase64 && (
                <div className="mb-3 relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700">
                  <img src={imageBase64} alt="Upload preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={clearImage} className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 rounded-full text-white hover:bg-black">
                     <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="relative flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask VANTi..."
                    className="w-full bg-[#0a0c10] border border-slate-700/50 focus:border-indigo-500/50 text-white text-sm rounded-xl py-3 pl-4 pr-20 outline-none transition-all placeholder:text-slate-500"
                  />
                  <div className="absolute right-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => isListening ? stopListening() : startListening()}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                        isListening ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button 
                      type="submit"
                      disabled={(!input.trim() && !imageBase64) || isLoading}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white disabled:opacity-50 disabled:hover:bg-indigo-500/20 disabled:hover:text-indigo-400 transition-colors"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
