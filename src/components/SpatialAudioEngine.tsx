import React, { useEffect, useRef, useState } from 'react';
import { useVantiStore } from '../store/vantiStore';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function SpatialAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioEnabled = useVantiStore((state) => state.isSpatialAudioActive);
  const setIsSpatialAudioActive = useVantiStore((state) => state.setIsSpatialAudioActive!);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Audio nodes
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const rainFilterRef = useRef<BiquadFilterNode | null>(null);
  const cityOscillator1Ref = useRef<OscillatorNode | null>(null);
  const cityOscillator2Ref = useRef<OscillatorNode | null>(null);
  const cityGainRef = useRef<GainNode | null>(null);

  const currentWeatherData = useVantiStore((state) => state.currentWeatherData);
  const zoomMode = useVantiStore((state) => state.activeMode); // Just to check 
  
  // Create noise buffer (pink noise approximation)
  const createPinkNoise = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }
    return buffer;
  };

  let lastOut = 0;

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (!hasInteracted && audioEnabled) {
       setIsSpatialAudioActive(false);
       return;
    }
    
    if (audioEnabled && !audioContextRef.current && hasInteracted) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      
      const ctx = new AudioContextCtor();
      audioContextRef.current = ctx;
      
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Noise source
      const noiseBuffer = createPinkNoise(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      // Rain/Wind filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400; // default wind
      filter.connect(masterGain);
      rainFilterRef.current = filter;
      
      noiseSource.connect(filter);
      noiseSource.start();
      noiseNodeRef.current = noiseSource;

      // City bustle
      const cityGain = ctx.createGain();
      cityGain.gain.value = 0;
      cityGain.connect(masterGain);
      cityGainRef.current = cityGain;

      const osc1 = ctx.createOscillator();
      osc1.frequency.value = 50; 
      osc1.type = 'sine';
      osc1.connect(cityGain);
      osc1.start();
      cityOscillator1Ref.current = osc1;

      const osc2 = ctx.createOscillator();
      osc2.frequency.value = 80;
      osc2.type = 'triangle';
      osc2.connect(cityGain);
      osc2.start();
      cityOscillator2Ref.current = osc2;

      setIsPlaying(true);
    } else if (!audioEnabled && audioContextRef.current) {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
        setIsPlaying(false);
      });
    }
  }, [audioEnabled, hasInteracted]);

  // Adjust audio based on weather and environment
  useEffect(() => {
    if (!isPlaying || !audioContextRef.current || !rainFilterRef.current || !cityGainRef.current) return;

    const condition = currentWeatherData?.main?.toLowerCase() || 'clear';
    const ctx = audioContextRef.current;
    
    // Transition settings
    const windFreq = rainFilterRef.current.frequency;
    const masterVol = masterGainRef.current!.gain;
    const cityVol = cityGainRef.current.gain;
    const now = ctx.currentTime;

    // Reset values smoothly
    cityVol.setTargetAtTime(0, now, 1);
    
    if (condition.includes('rain') || condition.includes('drizzle')) {
      // Rain
      windFreq.setTargetAtTime(2000, now, 2);
      masterVol.setTargetAtTime(0.6, now, 1);
    } else if (condition.includes('snow')) {
      // Very muffled
      windFreq.setTargetAtTime(200, now, 2);
      masterVol.setTargetAtTime(0.3, now, 1);
    } else if (condition.includes('clear')) {
      // Gentle breeze
      windFreq.setTargetAtTime(500, now, 2);
      masterVol.setTargetAtTime(0.2, now, 1);
      cityVol.setTargetAtTime(0.3, now, 2); // Subtle city bustle
    } else {
      // Clouds/Wind
      windFreq.setTargetAtTime(800, now, 2);
      masterVol.setTargetAtTime(0.4, now, 1);
      cityVol.setTargetAtTime(0.1, now, 2);
    }
    
  }, [currentWeatherData, isPlaying]);

  return null;
}
