import React, { useEffect, useState, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import * as d3 from 'd3';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useVantiStore } from '../store/vantiStore';
import { cn } from '../lib/utils';
import { Zap, Sparkles, MessageSquare, Flame, Coffee, Compass, X } from 'lucide-react';
import { CloseButton } from './CloseButton';

export function AtmosphereD3Overlay() {
  const map = useMap();
  const mapViewport = useVantiStore(state => state.mapViewport);
  const containerRef = useRef<HTMLDivElement>(null);
  const setIsAtmosphereOpen = useVantiStore(state => state.setIsAtmosphereOpen);
  
  const [moods, setMoods] = useState<any[]>([]);
  const [activeSegment, setActiveSegment] = useState<'all' | 'hot_spots' | 'hidden_gems'>('all');

  // Fetch Firestore local check-in moods
  useEffect(() => {
    let unsubSnapshot: any;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
            const q = query(collection(db, 'atmosphereMoods'));
            unsubSnapshot = onSnapshot(q, snap => {
                setMoods(snap.docs.map(doc => doc.data()));
            }, error => {
                console.warn("AtmosphereD3Overlay Firestore sync failed:", error);
            });
        } else {
            setMoods([]);
            if (unsubSnapshot) unsubSnapshot();
        }
    });
    return () => {
        unsubAuth();
        if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  // Compute dynamic social media activity hotspots around the current map viewport center
  const currentCenter = mapViewport?.center || { lat: 37.5665, lng: 126.9780 };
  const currentZoom = mapViewport?.zoom || 14;

  const finalHotspots = React.useMemo(() => {
    // Dynamically scale distribution based on zoom level. Lower zoom -> larger number for spread
    const spread = Math.pow(2, 14 - currentZoom) * 0.005;

    // Standardized hot spots generated around current center to showcase social review activity
    const nodes = [
      {
        id: 'hotspot-1',
        title: 'Trending Nightlife District',
        category: 'hot_spots',
        color: '#f43f5e', // deep rose pink
        latOffset: spread * 0.8,
        lngOffset: -spread * 1.2,
        buzzScore: 94,
        reviewCount: 412,
        sentiment: '#trending High-energy club activity peaking right now'
      },
      {
        id: 'hotspot-2',
        title: 'Speakeasy Vinyl Lounge',
        category: 'hidden_gems',
        color: '#8b5cf6', // purple gem
        latOffset: -spread * 1.5,
        lngOffset: spread * 0.5,
        buzzScore: 82,
        reviewCount: 28,
        sentiment: 'Quiet conversations, audiophile checks, exclusive entry'
      },
      {
        id: 'hotspot-3',
        title: 'Heritage Craft Plaza',
        category: 'hot_spots',
        color: '#06b6d4', // cyan digital culture
        latOffset: spread * 1.8,
        lngOffset: spread * 0.6,
        buzzScore: 78,
        reviewCount: 184,
        sentiment: 'Scenic exhibitions, walking loops, massive check-in volume'
      },
      {
        id: 'hotspot-4',
        title: 'Underground Noodle Bar',
        category: 'hidden_gems',
        color: '#10b981', // emerald secret
        latOffset: -spread * 0.6,
        lngOffset: -spread * 0.8,
        buzzScore: 88,
        reviewCount: 17,
        sentiment: 'No sign outside... best local spot, very few reviews.'
      },
      {
        id: 'hotspot-5',
        title: 'Sunset Horizon Walk',
        category: 'hot_spots',
        color: '#f59e0b', // warm amber sunset
        latOffset: spread * 0.2,
        lngOffset: spread * 1.4,
        buzzScore: 81,
        reviewCount: 310,
        sentiment: 'Golden hour photos flooding social feeds from here.'
      }
    ];

    // Align offsets relative to current viewport center coordinates
    const calibrated: any[] = nodes.map(n => ({
      id: n.id,
      title: n.title,
      category: n.category,
      color: n.color,
      lat: currentCenter.lat + n.latOffset,
      lng: currentCenter.lng + n.lngOffset,
      buzzScore: n.buzzScore,
      reviewCount: n.reviewCount,
      sentiment: n.sentiment
    }));

    // Include recent check-ins uploaded through Firestore as "custom client check-ins"
    moods.forEach((m, idx) => {
      calibrated.push({
        id: `firestore-vibe-${idx}`,
        title: m.text || 'User Vibe Dropped',
        category: 'hot_spots',
        color: '#ec4899',
        lat: m.lat,
        lng: m.lng,
        buzzScore: 85,
        reviewCount: 12,
        sentiment: `Active review drop: "${m.text}"`
      });
    });

    // Apply Filter Segment
    if (activeSegment === 'all') return calibrated;
    return calibrated.filter(n => n.category === activeSegment);
  }, [currentCenter, currentZoom, moods, activeSegment]);

  // D3 Rendering Loop over the Google Maps Canvas Layer
  useEffect(() => {
    if (!map || !containerRef.current) return;

    let overlay: google.maps.OverlayView | null = new google.maps.OverlayView();
    let d3Timer: d3.Timer | null = null;
    
    overlay.onAdd = function() {
        const panes = this.getPanes();
        if (panes) {
            panes.overlayLayer.appendChild(containerRef.current!);
        }
    };

    overlay.draw = function() {
        const projection = this.getProjection();
        if (!projection) return;

        const d3Container = d3.select(containerRef.current);
        d3Container.selectAll('*').remove();

        // Establish full dimensions based on map viewport limits
        const bounds = map.getBounds();
        if (!bounds) return;

        const sw = projection.fromLatLngToDivPixel(bounds.getSouthWest());
        const ne = projection.fromLatLngToDivPixel(bounds.getNorthEast());
        if (!sw || !ne) return;

        const svg = d3Container.append('svg')
            .style('position', 'absolute')
            .style('top', 0)
            .style('left', 0)
            .style('width', '100%')
            .style('height', '100%')
            .style('pointer-events', 'none')
            .style('overflow', 'visible');

        // Translate geographical coordinates to 2D screen coordinates
        const projectedNodes = finalHotspots.map((n: any) => {
            const pos = projection.fromLatLngToDivPixel(new google.maps.LatLng(n.lat, n.lng));
            if (!pos) return null;
            return {
                ...n,
                x: pos.x,
                y: pos.y
            };
        }).filter(Boolean) as any[];

        // Generate glowing linear gradients for each category
        const defs = svg.append('defs');
        
        projectedNodes.forEach((node, i) => {
          const radialGrad = defs.append('radialGradient')
            .attr('id', `glow-node-${node.id}-${i}`)
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '50%');
          
          radialGrad.append('stop')
            .attr('offset', '0%')
            .style('stop-color', node.color)
            .style('stop-opacity', 0.6);
          radialGrad.append('stop')
            .attr('offset', '40%')
            .style('stop-color', node.color)
            .style('stop-opacity', 0.25);
          radialGrad.append('stop')
            .attr('offset', '100%')
            .style('stop-color', node.color)
            .style('stop-opacity', 0);
        });

        // 1. Draw glowing background activity heat waves (glowing soft concentric mesh circles)
        svg.selectAll('.heat-blur')
          .data(projectedNodes)
          .enter().append('circle')
          .attr('class', 'heat-blur')
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', d => 50 + d.buzzScore * 1.2)
          .style('fill', (d, i) => `url(#glow-node-${d.id}-${i})`)
          .style('pointer-events', 'none');

        // 2. Draw active concentric rings with D3 pulse timers (recreates radar ripple wave)
        const rippleNodes = svg.selectAll('.ripple-ring')
          .data(projectedNodes)
          .enter().append('g')
          .attr('transform', d => `translate(${d.x}, ${d.y})`);

        rippleNodes.each(function(d: any) {
          const cell = d3.select(this);
          
          // Draw multiple concentric rings fading outwards
          [1, 2, 3].forEach(ringIdx => {
             cell.append('circle')
               .attr('class', `anim-ring-${ringIdx}`)
               .attr('r', 10 + ringIdx * 20)
               .style('fill', 'none')
               .style('stroke', d.color)
               .style('stroke-width', '1.5px')
               .style('stroke-dasharray', ringIdx === 3 ? '4 8' : 'none')
               .style('opacity', 0.7 - ringIdx * 0.2)
               .style('transform-origin', 'center');
          });
        });

        // Continuously animate rings scale and dash lines to suggest flow
        let elapsedFactor = 0;
        if (d3Timer) d3Timer.stop();
        d3Timer = d3.timer((elapsed) => {
          elapsedFactor = (elapsedFactor + 0.4) % 100;
          
          // Animate ring scales
          svg.selectAll('[class^="anim-ring-1"]')
            .style('transform', `scale(${1 + Math.sin(elapsedFactor / 20) * 0.12})`);
          svg.selectAll('[class^="anim-ring-2"]')
            .style('transform', `scale(${1 + Math.cos(elapsedFactor / 20) * 0.15})`);
          svg.selectAll('[class^="anim-ring-3"]')
            .style('transform', `scale(${1 + Math.sin(elapsedFactor / 30) * 0.22})`)
            .style('stroke-dashoffset', elapsed / 15);
        });

        // 3. Draw solid Center Vibe Anchors
        svg.selectAll('.vibe-core')
          .data(projectedNodes)
          .enter().append('circle')
          .attr('class', 'vibe-core')
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', 8)
          .style('fill', '#0a0c10')
          .style('stroke', d => d.color)
          .style('stroke-width', '4px')
          .style('filter', 'drop-shadow(0 0 8px rgba(0,0,0,0.8))');

        // 4. Subtle Interconnection vectors between active social nodes
        const connections: any[] = [];
        for (let i = 0; i < projectedNodes.length; i++) {
          for (let j = i + 1; j < projectedNodes.length; j++) {
            const distance = Math.hypot(projectedNodes[i].x - projectedNodes[j].x, projectedNodes[i].y - projectedNodes[j].y);
            // Connect nodes within physical proximity to mock logical paths
            if (distance < 240) {
              connections.push({
                source: projectedNodes[i],
                target: projectedNodes[j],
                color: projectedNodes[i].color
              });
            }
          }
        }

        svg.selectAll('.node-connection')
          .data(connections)
          .enter().append('line')
          .attr('class', 'node-connection')
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)
          .style('stroke', d => d.color)
          .style('stroke-width', '1px')
          .style('stroke-dasharray', '2 5')
          .style('opacity', 0.22);
    };

    overlay.onRemove = function() {
        if (d3Timer) d3Timer.stop();
        if (containerRef.current?.parentNode) {
            containerRef.current.parentNode.removeChild(containerRef.current);
        }
    };

    overlay.setMap(map);

    return () => {
        if (overlay) {
            overlay.setMap(null);
            overlay = null;
        }
    };
  }, [map, finalHotspots]);

  return (
    <>
      <div ref={containerRef} style={{ position: 'absolute' }} />

      {/* Floating Layer Legend Controls (Bottom-Left Side Panel above navigation) */}
      <div className="absolute left-4 bottom-48 z-[70] bg-[#0c0e12]/95 border border-cyan-500/20 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-[280px] pointer-events-auto font-sans">
         <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div>
               <h4 className="text-xs font-black text-white flex items-center gap-1.5 leading-none">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  Atmosphere Layer
               </h4>
               <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">Review density & checkins</span>
            </div>
            <CloseButton 
              onClick={() => setIsAtmosphereOpen?.(false)} 
              isAbsolute={false} 
              className="scale-75 opacity-70 hover:opacity-100 border-white/10" 
            />
         </div>

         {/* Section Selector */}
         <div className="grid grid-cols-3 gap-1 mb-3.5">
            {(['all', 'hot_spots', 'hidden_gems'] as const).map(seg => (
               <button
                  key={seg}
                  onClick={() => setActiveSegment(seg)}
                  className={cn(
                     "py-1 rounded text-[9px] font-mono font-bold uppercase transition-all",
                     activeSegment === seg
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "bg-white/5 text-slate-400 hover:text-white"
                  )}
               >
                  {seg.replace('_', ' ')}
               </button>
            ))}
         </div>

         {/* Hotspot ticker items inside the viewport */}
         <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
            {finalHotspots.map((node: any, i: number) => {
               const Icon = node.category === 'hot_spots' ? Flame : Compass;
               return (
                  <div 
                    key={node.id} 
                    className="p-2 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 flex flex-col gap-0.5 text-left transition-colors"
                  >
                     <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-100 truncate flex-1">
                           <Icon className="w-3 h-3 shrink-0" style={{ color: node.color }} />
                           <span>{node.title}</span>
                        </div>
                        <span className="text-[9px] font-mono font-black" style={{ color: node.color }}>
                           {node.buzzScore}% Buzz
                        </span>
                     </div>
                     <p className="text-[9px] text-slate-400 leading-snug line-clamp-1">
                        {node.sentiment}
                     </p>
                  </div>
               );
            })}
         </div>

         <div className="flex items-center gap-2 border-t border-white/5 mt-3 pt-2 text-[8px] font-mono text-slate-500 justify-between">
            <span>Red/Amber: Hot Spots</span>
            <span>Purple/Emerald: Hidden Gems</span>
         </div>
      </div>
    </>
  );
}
