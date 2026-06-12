import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, FileJson, Camera, X, Loader2, Github } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export function ExportItineraryWidget() {
  const isExportModalOpen = useVantiStore((state) => state.isExportModalOpen);
  const setIsExportModalOpen = useVantiStore((state) => state.setIsExportModalOpen!);
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const bookmarkedPlaces = useVantiStore(state => state.bookmarkedPlaces);

  const [isGithubUploading, setIsGithubUploading] = useState(false);
  const [githubRepo, setGithubRepo] = useState('vanti-travels');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // When global state asks us to open, load data!
  React.useEffect(() => {
    if (isExportModalOpen && !exportData && !isExporting) {
      handleExport();
    }
  }, [isExportModalOpen]);

  // Listen for GitHub Auth message
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
            handleGithubUpload();
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [exportData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let trailPins: any[] = [];
      if (auth.currentUser) {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        const q = query(
            collection(db, 'users', auth.currentUser.uid, 'memoryTrail'),
            where('timestamp', '>=', twentyFourHoursAgo),
            orderBy('timestamp', 'asc')
        );
        const snapshot = await getDocs(q);
        trailPins = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                lat: data.lat,
                lng: data.lng,
                time: new Date(data.timestamp).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
            };
        });
      }

      const savedNodes = Object.values(bookmarkedPlaces).map((p: any) => ({
          name: p.name || p.displayName?.text || 'Unknown Place',
          address: p.formattedAddress || 'No address',
          category: p.primaryType || '명소'
      }));

      const data = {
        title: "✨ 나의 여행 기록 (My Travel Memories)",
        date: new Date().toLocaleDateString('ko-KR'),
        hashtag: "#여행스타그램 #VANTi #발자취",
        memoryTrail: trailPins,
        discoveryNodes: savedNodes
      };

      setExportData(data);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJson = () => {
    if (!exportData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `VANTi_Itinerary_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleGithubUpload = async () => {
    if (!exportData) return;
    setIsGithubUploading(true);
    setUploadStatus("Connecting...");
    try {
        const uploadRes = await fetch('/api/github/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: `Itinerary_${Date.now()}.json`,
                content: JSON.stringify(exportData, null, 2),
                repo: githubRepo,
                message: `Exported itinerary from VANTi: ${exportData.date}`
            })
        });

        if (uploadRes.status === 401) {
            // Not authed, trigger logic
            setUploadStatus("Login required...");
            const urlRes = await fetch('/api/auth/github/url');
            const { url } = await urlRes.json();
            window.open(url, 'github_oauth', 'width=600,height=700');
        } else if (uploadRes.ok) {
            const data = await uploadRes.json();
            setUploadStatus("Success!");
            setTimeout(() => setUploadStatus(null), 3000);
            window.open(data.url, '_blank');
        } else {
            const err = await uploadRes.json();
            setUploadStatus(`Error: ${err.error}`);
        }
    } catch (err) {
        console.error(err);
        setUploadStatus("Failed to upload");
    } finally {
        setIsGithubUploading(false);
    }
  };

  return (
    <AnimatePresence>
        {isExportModalOpen && exportData && (
          <motion.div
            key="export-modal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-full max-w-sm"
          >
             <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-rose-100 flex flex-col max-h-[80vh]">
               {/* Korean Social Media Styled Header */}
               <div className="bg-gradient-to-r from-rose-400 to-orange-300 p-6 text-white relative flex-shrink-0">
                  <button onClick={() => setIsExportModalOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-black mb-1 font-sans">{exportData.title}</h2>
                  <p className="text-sm opacity-90 font-medium">{exportData.date}</p>
                  <p className="text-xs mt-2 font-bold bg-white/20 inline-block px-2 py-1 rounded-lg backdrop-blur-sm">
                      {exportData.hashtag}
                  </p>
               </div>

               <div className="p-5 overflow-y-auto bg-slate-50 flex-1 scrollbar-hide space-y-6 text-slate-800">
                  <div>
                      <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                           <Camera className="w-4 h-4" />
                           저장된 발견 노드 (Saved Nodes)
                      </h3>
                      {exportData.discoveryNodes.length > 0 ? (
                          <div className="space-y-3">
                              {exportData.discoveryNodes.map((node: any, i: number) => (
                                  <div key={`node-${node.name}-${i}`} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
                                      <span className="font-bold text-rose-500 text-sm">{node.name}</span>
                                      <span className="text-xs text-slate-500">{node.address}</span>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-100">저장된 장소가 없습니다.</p>
                      )}
                  </div>

                  <div>
                      <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                           <Share2 className="w-4 h-4" />
                           24h 메모리 트레일 (Memory Trail)
                      </h3>
                      {exportData.memoryTrail.length > 0 ? (
                          <div className="relative pl-4 space-y-4 border-l-2 border-rose-200 ml-2">
                              {exportData.memoryTrail.slice(-10).map((pin: any, i: number) => (
                                  <div key={`trail-${pin.time}-${i}`} className="relative">
                                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-white border-2 border-rose-400 rounded-full" />
                                      <div className="text-[10px] font-bold text-rose-400 mb-0.5">{pin.time}</div>
                                      <div className="text-xs text-slate-600 bg-white inline-block px-2 py-1 rounded shadow-sm border border-slate-100">
                                          {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                                      </div>
                                  </div>
                              ))}
                              {exportData.memoryTrail.length > 10 && (
                                  <div className="text-xs text-slate-400 italic">... 및 {exportData.memoryTrail.length - 10}개의 기록 더보기</div>
                              )}
                          </div>
                      ) : (
                          <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-100">트레일 기록이 없습니다.</p>
                      )}
                  </div>
               </div>

               <div className="p-4 bg-white border-t border-slate-100 flex gap-3 flex-shrink-0">
                  <button 
                    onClick={() => {
                        window.print();
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                     <Camera className="w-4 h-4" />
                     PDF 저장
                  </button>
                  <button 
                    onClick={downloadJson}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30"
                  >
                     <FileJson className="w-4 h-4" />
                     JSON 내보내기
                  </button>
                  <button 
                    onClick={handleGithubUpload}
                    disabled={isGithubUploading}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                     {isGithubUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                     {uploadStatus || 'GitHub 업로드'}
                  </button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
