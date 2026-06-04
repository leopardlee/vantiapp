import React, { useEffect, useRef } from 'react';

const THEME_SOUNDS: Record<string, string> = {
  'Simulation': 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Digital hum
  'Genie': 'https://assets.mixkit.co/active_storage/sfx/2544/2544-preview.mp3', // Ethereal
  'Cosmic': 'https://assets.mixkit.co/active_storage/sfx/2566/2566-preview.mp3', // Deep space
  'Neo-Tokyo': 'https://assets.mixkit.co/active_storage/sfx/2581/2581-preview.mp3', // Cyber wind
};

interface SoundEngineProps {
  theme: string;
  selectedPlace?: any | null;
  mapCenter?: { lat: number; lng: number } | null;
  mapHeading?: number;
}

export default function SoundEngine({ theme, selectedPlace, mapCenter, mapHeading = 0 }: SoundEngineProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentThemeRef = useRef(theme);

  // Web Audio refs for procedural 3D spatialization layer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const spatialPannerRef = useRef<PannerNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const spatialSourceGainRef = useRef<GainNode | null>(null);
  const whisperGainRef = useRef<GainNode | null>(null);
  const rumbleGainRef = useRef<GainNode | null>(null);

  const startAudio = () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const dest = ctx.destination;

      // 1. Ambient Background Track Integrator
      let ambientSourceNode;
      if (audioRef.current) {
        try {
          ambientSourceNode = ctx.createMediaElementSource(audioRef.current);
        } catch (e) {
          // In case of multiple connections or HMR loads
        }
      }

      const ambientG = ctx.createGain();
      ambientG.gain.value = 0.12;
      if (ambientSourceNode) {
        ambientSourceNode.connect(ambientG);
      }
      ambientG.connect(dest);
      ambientGainRef.current = ambientG;

      // 2. Spatial Soundscape Generator
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 1000;
      panner.rolloffFactor = 1.2;
      panner.positionX.value = 0;
      panner.positionY.value = 0;
      panner.positionZ.value = 1.5;
      spatialPannerRef.current = panner;

      const spatialG = ctx.createGain();
      spatialG.gain.value = 0.0; // Start muted, fade in when POI is opened
      panner.connect(spatialG);
      spatialG.connect(dest);
      spatialSourceGainRef.current = spatialG;

      // ====== Procedural Generators: Vocal Murmurs / Crowd Whispers ======
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Formant filters creating human vocal peak spectrum acoustics
      const bp1 = ctx.createBiquadFilter();
      bp1.type = 'bandpass';
      bp1.frequency.value = 800; // core larynx peak
      bp1.Q.value = 2.5;

      const bp2 = ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.value = 1550; // tongue formants
      bp2.Q.value = 2.0;

      noiseSource.connect(bp1);
      noiseSource.connect(bp2);

      const whisperG = ctx.createGain();
      whisperG.gain.value = 0.1;
      whisperGainRef.current = whisperG;

      bp1.connect(whisperG);
      bp2.connect(whisperG);
      whisperG.connect(panner);

      // Low frequency oscillator (LFO) creating slow wave dynamics
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.35; // ~3 second period wave

      const lfoAmp = ctx.createGain();
      lfoAmp.gain.value = 0.07;

      lfo.connect(lfoAmp);
      lfoAmp.connect(whisperG.gain);

      noiseSource.start(0);
      lfo.start(0);

      // ====== Procedural Generators: Urban City Rumblings ======
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 54.0; // sub city hum
      osc2.type = 'triangle';
      osc2.frequency.value = 81.0; // traffic rumble

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 130; // filter high frequencies

      const rumbleG = ctx.createGain();
      rumbleG.gain.value = 0.15;
      rumbleGainRef.current = rumbleG;

      osc1.connect(lp);
      osc2.connect(lp);
      lp.connect(rumbleG);
      rumbleG.connect(panner);

      osc1.start(0);
      osc2.start(0);

    } catch (e) {
      console.warn("Web Audio API disabled or blocked in sandbox:", e);
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const soundUrl = THEME_SOUNDS[theme];
    
    if (soundUrl && theme !== currentThemeRef.current) {
        currentThemeRef.current = theme;
        audioRef.current.src = soundUrl;
        audioRef.current.volume = 0;
        audioRef.current.play().catch(() => {});
        
        let vol = 0;
        const fadeIn = setInterval(() => {
            if (vol < 0.15) {
                vol += 0.01;
                if (audioRef.current) audioRef.current.volume = vol;
            } else {
                clearInterval(fadeIn);
            }
        }, 100);
    } else if (!soundUrl) {
        let vol = audioRef.current?.volume || 0;
        const fadeOut = setInterval(() => {
            if (vol > 0.01) {
                vol -= 0.01;
                if (audioRef.current) audioRef.current.volume = vol;
            } else {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.volume = 0;
                }
                clearInterval(fadeOut);
            }
        }, 50);
    }
  }, [theme]);

  // Audio Context trigger by User Gesture
  useEffect(() => {
    const handleGesture = () => {
      startAudio();
    };

    window.addEventListener('click', handleGesture, { passive: true });
    window.addEventListener('keydown', handleGesture, { passive: true });
    window.addEventListener('touchstart', handleGesture, { passive: true });

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  // Update Spatial stereo positioning dynamically based on camera parameters vs POI coordinate
  useEffect(() => {
    if (!audioCtxRef.current || !spatialPannerRef.current || !spatialSourceGainRef.current) return;

    if (selectedPlace && mapCenter) {
      const lat = typeof selectedPlace.location?.lat === 'function' ? selectedPlace.location.lat() : (selectedPlace.location?.lat || selectedPlace.lat);
      const lng = typeof selectedPlace.location?.lng === 'function' ? selectedPlace.location.lng() : (selectedPlace.location?.lng || selectedPlace.lng);

      if (lat && lng) {
        const dLng = lng - mapCenter.lng;
        const dLat = lat - mapCenter.lat;

        // Apply 2D rotation matching viewport coordinate grid
        const rad = -mapHeading * Math.PI / 180;
        const localX = dLng * Math.cos(rad) - dLat * Math.sin(rad);
        const localZ = dLng * Math.sin(rad) + dLat * Math.cos(rad);

        // Map coordinate delta to stereo panning scale
        const scaleFactor = 450;
        const targetX = Math.min(6.0, Math.max(-6.0, localX * scaleFactor));
        const targetZ = Math.min(8.0, Math.max(0.5, 3.0 + (-localZ * scaleFactor)));

        const now = audioCtxRef.current.currentTime;
        try {
          spatialPannerRef.current.positionX.setTargetAtTime(targetX, now, 0.08);
          spatialPannerRef.current.positionZ.setTargetAtTime(targetZ, now, 0.08);

          // Change gains relative to isBusy flag
          if (whisperGainRef.current && rumbleGainRef.current) {
            const isBusyObj = selectedPlace.isBusy || (selectedPlace.displayName && selectedPlace.displayName.length % 2 === 0);
            const wVol = isBusyObj ? 0.35 : 0.08;
            const rVol = isBusyObj ? 0.10 : 0.25;

            whisperGainRef.current.gain.setTargetAtTime(wVol, now, 0.1);
            rumbleGainRef.current.gain.setTargetAtTime(rVol, now, 0.1);
          }

          // Gradual Fade in spatial synthesizer
          spatialSourceGainRef.current.gain.setTargetAtTime(1.0, now, 0.2);
        } catch (e) {
          // Handle old webkit browsers lacking some panner params
        }
      }
    } else {
      // Fade out spatial synthesizer completely
      const now = audioCtxRef.current.currentTime;
      try {
        spatialSourceGainRef.current.gain.setTargetAtTime(0.0, now, 0.25);
      } catch (e) {}
    }
  }, [selectedPlace, mapCenter, mapHeading]);

  return null;
}
