import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface CustomInAppViewerProps {
  url: string;
  onClose: () => void;
  title?: string;
}

export function CustomInAppViewer({ url, onClose, title = 'Discovery' }: CustomInAppViewerProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col h-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 w-full h-full">
          <iframe 
            src={url} 
            className="w-full h-full"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
