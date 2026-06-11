import React, { useMemo } from 'react';
import { ShieldAlert, Phone, Hospital, Building2 } from 'lucide-react';

interface Props {
  lat: number;
  lng: number;
}

export function HealthSafetyDashboard({ lat, lng }: Props) {
  // Simulate fetching data based on lat/lng location
  const data = useMemo(() => ({
    emergencyNumber: '119',
    clinic: 'City Central Clinic, 200m away',
    embassy: 'Embassy of User Nation, 1.2km away'
  }), [lat, lng]);

  return (
    <div className="bg-[#1a1f2e]/80 border border-indigo-500/20 rounded-3xl p-5 space-y-4">
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-rose-400" /> Travel Health & Safety
      </h4>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
            <div className="bg-rose-500/10 p-2 rounded-xl text-rose-400">
                <Phone className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Emergency</p>
                <p className="font-bold text-white">{data.emergencyNumber}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                <Hospital className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Nearby Clinic</p>
                <p className="font-bold text-white">{data.clinic}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                <Building2 className="w-4 h-4" />
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Embassy</p>
                <p className="font-bold text-white">{data.embassy}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
