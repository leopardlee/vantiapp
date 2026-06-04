import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SpeakButtonProps {
  text: string;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

export function SpeakButton({ text, className, iconClassName, children }: SpeakButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const speak = () => {
    if (!isSupported || !text) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Attempt to find a good voice (English or Korean depending on content)
    const voices = window.speechSynthesis.getVoices();
    // Simple heuristic: if text has Korean characters, use Korean voice
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
    const targetLang = hasKorean ? 'ko-KR' : 'en-US';
    
    const voice = voices.find(v => v.lang.includes(targetLang)) || voices[0];
    if (voice) utterance.voice = voice;
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speak();
      }}
      className={cn(
        "flex items-center justify-center rounded-lg transition-all active:scale-95",
        isSpeaking ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800",
        className
      )}
      title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
    >
      {children ? children : (
        isSpeaking ? (
          <VolumeX className={cn("w-4 h-4 animate-pulse", iconClassName)} />
        ) : (
          <Volume2 className={cn("w-4 h-4", iconClassName)} />
        )
      )}
    </button>
  );
}
