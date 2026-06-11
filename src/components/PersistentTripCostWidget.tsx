import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVantiStore } from '../store/vantiStore';
import { Wallet, Utensils, Ticket, Train, Info, X, Sparkles, Upload, FileText, Loader2, Trash2, Hotel, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

export function PersistentTripCostWidget() {
  const itinerary = useVantiStore((state) => state.itinerary || []);
  const mapViewport = useVantiStore((state) => state.mapViewport);
  const isVisible = useVantiStore((state) => state.isFinanceTrackerVisible);
  const setIsFinanceTrackerVisible = useVantiStore((state) => state.setIsFinanceTrackerVisible);
  const parsedReceipts = useVantiStore((state) => state.parsedReceipts || []);
  const addParsedReceipt = useVantiStore((state) => state.addParsedReceipt);
  const removeParsedReceipt = useVantiStore((state) => state.removeParsedReceipt);

  const [isParserOpen, setIsParserOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'text' | 'file'>('text');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive local currency from longitude (very rough approximation for immersion)
  const currency = useMemo(() => {
    if (!mapViewport) return { symbol: '$', code: 'USD', rate: 1 };
    const lng = mapViewport.center.lng;
    if (lng > 120 && lng < 150) return { symbol: '¥', code: 'JPY', rate: 155 }; // Japan
    if (lng > 120 && lng < 130) return { symbol: '₩', code: 'KRW', rate: 1350 }; // Korea
    if (lng > -10 && lng < 30) return { symbol: '€', code: 'EUR', rate: 0.92 }; // Europe
    if (lng > -5 && lng < 2) return { symbol: '£', code: 'GBP', rate: 0.79 }; // UK
    return { symbol: '$', code: 'USD', rate: 1 };
  }, [mapViewport]);

  const stats = useMemo(() => {
    let dining = 0;
    let attractions = 0;
    let transit = 0;
    let stay = 0;

    itinerary.forEach((stop: any) => {
      const types = stop.types || [];
      const typesStr = types.join(',').toLowerCase();
      
      // Predict cost tier from Google map price level or historical averages
      let multiplier = 1;
      if (stop.priceLevel) multiplier = stop.priceLevel;

      if (typesStr.includes('restaurant') || typesStr.includes('food') || typesStr.includes('cafe')) {
        dining += 25 * multiplier;
      } else if (typesStr.includes('museum') || typesStr.includes('attraction') || typesStr.includes('landmark')) {
        attractions += 18 * multiplier;
      } else if (typesStr.includes('transit') || typesStr.includes('station')) {
        transit += 4 * multiplier;
      } else {
        // Generic browsing
        dining += 5; 
      }
    });

    // Baseline transit cost for moving between places
    if (itinerary.length > 1) {
       transit += (itinerary.length - 1) * 3.5;
    }

    // Accumulate parsed receipts in base USD equivalents
    parsedReceipts.forEach((receipt: any) => {
      let amountInUSD = receipt.amount;
      const recCurrency = (receipt.currency || 'USD').toUpperCase();
      const rates: Record<string, number> = { USD: 1.0, EUR: 0.92, KRW: 1350, JPY: 155, GBP: 0.79, CNY: 7.25 };
      if (recCurrency !== 'USD') {
        const rate = rates[recCurrency] || 1.0;
        amountInUSD = receipt.amount / rate;
      }

      const cat = (receipt.category || 'dining').toLowerCase();
      if (cat.includes('food') || cat.includes('dining') || cat.includes('cafe')) {
        dining += amountInUSD;
      } else if (cat.includes('attraction') || cat.includes('landmark') || cat.includes('museum') || cat.includes('ticket')) {
        attractions += amountInUSD;
      } else if (cat.includes('transit') || cat.includes('train') || cat.includes('taxi') || cat.includes('bus') || cat.includes('flight') || cat.includes('transport')) {
        transit += amountInUSD;
      } else if (cat.includes('stay') || cat.includes('lodging') || cat.includes('hotel') || cat.includes('accommodation')) {
        stay += amountInUSD;
      } else {
        dining += amountInUSD;
      }
    });

    return {
      dining: dining * currency.rate,
      attractions: attractions * currency.rate,
      transit: transit * currency.rate,
      stay: stay * currency.rate,
      total: (dining + attractions + transit + stay) * currency.rate
    };
  }, [itinerary, currency, parsedReceipts]);

  const handleTextParse = async () => {
    if (!pasteText.trim()) return;
    setIsParsing(true);
    setUploadError(null);
    try {
      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText })
      });
      if (!response.ok) throw new Error('Parsing failed');
      const data = await response.json();
      if (addParsedReceipt) addParsedReceipt(data);
      setPasteText('');
      setIsParserOpen(false);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to parse text. Please ensure valid receipt details.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (PNG, JPG, JPEG) are supported.');
      return;
    }
    setIsParsing(true);
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await fetch('/api/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data })
        });
        if (!response.ok) throw new Error('Scan failed');
        const data = await response.json();
        if (addParsedReceipt) addParsedReceipt(data);
        setIsParserOpen(false);
      } catch (err) {
        console.error(err);
        setUploadError('Failed to scan receipt image. Please try again.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  if (!isVisible || (itinerary.length === 0 && parsedReceipts.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute bottom-28 right-4 z-[70] w-72 bg-slate-950/90 border border-slate-700/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md pointer-events-auto"
    >
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
          <Wallet className="w-4 h-4 text-emerald-400" />
          Trip Estimate
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-slate-400">{currency.code}</span>
          {setIsFinanceTrackerVisible && (
            <button 
              onClick={() => setIsFinanceTrackerVisible(false)}
              className="p-1 hover:bg-white/5 rounded-md transition-colors text-slate-400 hover:text-white"
              title="Close Estimate"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Expense categories breakdown */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Utensils className="w-3.5 h-3.5 text-orange-400" />
            <span>Dining</span>
          </div>
          <span className="font-mono">{currency.symbol}{Math.round(stats.dining).toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Ticket className="w-3.5 h-3.5 text-purple-400" />
            <span>Attractions</span>
          </div>
          <span className="font-mono">{currency.symbol}{Math.round(stats.attractions).toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Train className="w-3.5 h-3.5 text-blue-400" />
            <span>Transit</span>
          </div>
          <span className="font-mono">{currency.symbol}{Math.round(stats.transit).toLocaleString()}</span>
        </div>

        {stats.stay > 0 && (
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Hotel className="w-3.5 h-3.5 text-pink-400" />
              <span>Lodging</span>
            </div>
            <span className="font-mono">{currency.symbol}{Math.round(stats.stay).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* AI Receipt Parsing Section */}
      <div className="border-t border-white/5 pt-2.5 mt-2.5 mb-3.5">
        <button
          onClick={() => setIsParserOpen(!isParserOpen)}
          className="flex items-center justify-between w-full text-[10px] font-black uppercase text-purple-400 hover:text-purple-300 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 shrink-0" />
            AI Receipt & Email Scraper
          </span>
          {isParserOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <AnimatePresence>
          {isParserOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2 space-y-2 bg-slate-900/60 p-2 border border-purple-500/10 rounded-xl"
            >
              {/* Type Switcher */}
              <div className="flex gap-1 border-b border-white/5 pb-1.5 text-[9px] font-bold font-mono">
                <button
                  onClick={() => setSelectedTab('text')}
                  className={cn("px-2 py-0.5 rounded-md", selectedTab === 'text' ? "bg-purple-500/20 text-purple-300" : "text-slate-400 hover:text-slate-200")}
                >
                  Confirm Email Paste
                </button>
                <button
                  onClick={() => setSelectedTab('file')}
                  className={cn("px-2 py-0.5 rounded-md", selectedTab === 'file' ? "bg-purple-500/20 text-purple-300" : "text-slate-400 hover:text-slate-200")}
                >
                  Upload Receipt Image
                </button>
              </div>

              {selectedTab === 'text' ? (
                <div className="space-y-1.5">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste the confirmation email text body here (Flight, Hotel stay, dinner, tickets) to auto-extract expenses..."
                    className="w-full h-16 bg-slate-950/80 text-[10px] text-slate-100 placeholder-slate-500 border border-slate-800 rounded-lg p-1.5 focus:outline-none focus:border-purple-500/50 resize-none font-sans"
                    disabled={isParsing}
                  />
                  <button
                    onClick={handleTextParse}
                    disabled={isParsing || !pasteText.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 font-bold font-mono text-[9px] py-1.5 rounded-lg transition-all shadow-lg flex items-center justify-center gap-1.5 text-white disabled:opacity-40"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Scraping Email...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Analyze confirmation text
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-700 hover:border-purple-500/50 rounded-lg p-3 text-center cursor-pointer transition-colors bg-slate-950/40 relative group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 mx-auto text-slate-500 group-hover:text-purple-400 mb-1 pointer-events-none" />
                    <span className="text-[9px] font-medium text-slate-400 font-mono pointer-events-none">
                      Drag & Drop Receipt Image or Click to Browse
                    </span>
                  </div>
                  {isParsing && (
                    <div className="text-[10px] text-purple-300 font-mono flex items-center justify-center gap-1.5 p-1 bg-purple-950/20 border border-purple-500/20 rounded-lg">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                      Gemini OCR Scanning receipt...
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <div className="text-[9px] font-mono text-red-400 bg-red-950/20 border border-red-500/20 p-1.5 rounded-lg flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List of active parsed expenses */}
      {parsedReceipts.length > 0 && (
        <div className="mt-1 pt-2.5 border-t border-white/5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Parsed Expenses ({parsedReceipts.length})</span>
            <button
              onClick={() => { if (useVantiStore.getState().clearParsedReceipts) useVantiStore.getState().clearParsedReceipts(); }}
              className="text-[8px] font-mono text-red-400 hover:text-red-300 border-none bg-none cursor-pointer"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-none pr-1">
            {parsedReceipts.map((receipt: any) => (
              <div key={receipt.id} className="flex justify-between items-center bg-slate-900/50 hover:bg-slate-900/80 transition-colors p-1.5 border border-white/5 rounded-lg text-[10px] text-white">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {receipt.category === 'stay' ? (
                    <Hotel className="w-3 h-3 text-pink-400 shrink-0" />
                  ) : receipt.category === 'transit' ? (
                    <Train className="w-3 h-3 text-blue-400 shrink-0" />
                  ) : receipt.category === 'attraction' ? (
                    <Ticket className="w-3 h-3 text-purple-400 shrink-0" />
                  ) : (
                    <Utensils className="w-3 h-3 text-orange-400 shrink-0" />
                  )}
                  <div className="truncate flex flex-col leading-none">
                    <span className="font-medium text-slate-200 truncate">{receipt.description}</span>
                    <span className="text-[7.5px] uppercase font-mono text-slate-500 mt-0.5">{receipt.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="font-mono font-bold text-slate-100">
                    {receipt.currency === 'USD' ? '$' : receipt.currency === 'KRW' ? '₩' : receipt.currency === 'EUR' ? '€' : receipt.currency === 'JPY' ? '¥' : receipt.currency === 'GBP' ? '£' : receipt.currency === 'CNY' ? '¥' : receipt.currency}
                    {receipt.amount.toLocaleString()}
                  </span>
                  <button 
                    onClick={() => removeParsedReceipt?.(receipt.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors shrink-0 p-0.5"
                    title="Delete Receipt"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals Section */}
      <div className="border-t border-white/10 pt-3 flex justify-between items-end mt-1">
        <div className="text-[10px] text-slate-500 max-w-[110px] leading-tight flex items-start gap-1">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          Average itinerary + parsed receipts
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-black block">Total</span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            {currency.symbol}{Math.round(stats.total).toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
