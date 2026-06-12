import { useState } from 'react';
import { Camera, BookOpen, Loader2 } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';

export function AITravelLog() {
    const [isProcessing, setIsProcessing] = useState(false);
    const userLocation = useVantiStore(state => state.userLocation);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userLocation) return;
        
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                const response = await fetch('/api/analyze-travel-photo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64, location: userLocation })
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }
                
                const { narrative } = await response.json();
                console.log("Narrative generated:", narrative);
                // Store narrative in Firebase: requires Firestore skill, need to implement.
            } catch (e) {
                console.error("Log generation error", e);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="absolute top-4 left-4 z-40 bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-white flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <label className="cursor-pointer flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span className="text-xs">Log Photo</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
            </label>
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
        </div>
    );
}
