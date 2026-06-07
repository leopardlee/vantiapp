import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for hands-free map navigation using the Web Speech API.
 * Maps voice commands to functional actions in the Vanti viewport.
 */
export function useVoiceNavigation(onCommand: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Voice navigation is not supported in this browser environment.');
      return;
    }

    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("[Vanti Voice] Recognized:", transcript);
        onCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("[Vanti Voice] Error:", event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied.');
        } else {
          setError(`Voice error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("[Vanti Voice] Init failed:", err);
      setIsListening(false);
    }
  }, [onCommand, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { 
    isListening, 
    startListening, 
    stopListening,
    error 
  };
}
