import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Search, Mic, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';

export const PlacesAutocompleteInput = ({ onPlaceSelect }: { onPlaceSelect: (place: any) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const placesLib = useMapsLibrary('places');
  const map = useMap();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const onPlaceSelectRef = useRef(onPlaceSelect);
  const mapRef = useRef(map);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice recognition not supported in this browser.");
        return;
    }

    if (!isListening) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            // Inject into the web component's shadow input if possible
            const acElement = containerRef.current?.querySelector('gmp-place-autocomplete') || 
                             containerRef.current?.querySelector('#gmp-autocomplete-search');
            
            if (acElement) {
                // The web component might not allow direct value setting easily, 
                // so we might need to find its internal input
                const input = acElement.shadowRoot?.querySelector('input');
                if (input) {
                    input.value = transcript;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    // Triggering a search might require more than just the input event
                    // But for now, setting value helps user
                }
            }
        };

        recognition.start();
        recognitionRef.current = recognition;
    } else {
        recognitionRef.current?.stop();
        setIsListening(false);
    }
  };

  useEffect(() => {
    if (!placesLib || !containerRef.current) return;

    // Create the PlaceAutocompleteElement imperatively
    const autocomplete = new (placesLib as any).PlaceAutocompleteElement();
    
    // Style the component via generic CSS classes or attributes, 
    // mostly PlaceAutocompleteElement is styled via shadow DOM css variables
    autocomplete.id = "gmp-autocomplete-search";
    
    // Set the DOM node inside our container
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(autocomplete);

    const handlePlaceSelect = async (e: Event) => {
      const event = e as any;
      if (!event.place) return;
      
      const place = event.place;
      
      // Fetch fields before handling if needed
      if(place.fetchFields) {
          try {
              await place.fetchFields({
                  fields: ['id', 'displayName', 'location', 'formattedAddress', 'photos', 'rating', 'userRatingCount', 'types', 'regularOpeningHours']
              });
          } catch(e) {
              console.warn("Error fetching autocomplete place fields", e);
          }
      }
      onPlaceSelectRef.current(place);
      
      const currentMap = mapRef.current;
      if(currentMap && place.location) {
          const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
          const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
          currentMap.panTo({ lat, lng });
          currentMap.setZoom(15);
      }
    };

    autocomplete.addEventListener('gmp-placeselect', handlePlaceSelect);

    return () => {
      autocomplete.removeEventListener('gmp-placeselect', handlePlaceSelect);
    };
  }, [placesLib]);

  // We add some global styles for the shadow DOM element
  return (
    <div className="w-full relative">
        <style dangerouslySetInnerHTML={{__html: `
            gmp-place-picker, #gmp-autocomplete-search {
                width: 100%;
                --gmp-color-surface: #0f1117;
                --gmp-color-on-surface: #ffffff;
                --gmp-color-on-surface-variant: #94a3b8;
                --gmp-font-family: inherit;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                backdrop-filter: blur(24px);
                overflow: hidden;
            }
            gmp-place-picker::part(input) {
                background: transparent;
                border: none;
                color: #fff;
                padding: 12px 16px;
                height: 48px;
            }
        `}} />
        <div ref={containerRef} className="w-full h-12" />
        <button 
            onClick={startVoiceSearch}
            className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all z-10",
                isListening ? "bg-rose-500 text-white animate-pulse" : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            )}
        >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
    </div>
  );
};
