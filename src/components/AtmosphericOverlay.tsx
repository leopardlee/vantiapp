import { useAtmosphericEngine } from '../hooks/useAtmosphericEngine';
import { cn } from '../lib/utils';

export function AtmosphericOverlay() {
  const filter = useAtmosphericEngine();
  
  if (filter === 'default' || filter === 'clear-bright') return null;

  return (
    <div 
      className={cn(
        "pointer-events-none absolute inset-0 z-50 transition-all duration-1000",
        filter === 'foggy' && 'bg-slate-500/30 backdrop-blur-sm',
        filter === 'golden-glow' && 'bg-amber-400/20 mix-blend-overlay',
        filter === 'rainy-dim' && 'bg-slate-900/30 backdrop-blur-[2px]'
      )} 
    />
  );
}
