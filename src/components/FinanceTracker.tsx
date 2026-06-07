import React, { useState, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DollarSign, Plus, Trash2, Receipt, Globe, ArrowRightLeft, PieChart as PieChartIcon, List as ListIcon, Tag } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/formatters';
import { useVantiStore } from '../store/vantiStore';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { cn } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
];

const CATEGORIES = [
  { id: 'food', label: 'Food', color: '#fbbf24', icon: '🍴' },
  { id: 'stay', label: 'Stay', color: '#818cf8', icon: '🏨' },
  { id: 'transport', label: 'Transport', color: '#34d399', icon: '🚗' },
  { id: 'shopping', label: 'Shop', color: '#f472b6', icon: '🛍️' },
  { id: 'etc', label: 'Etc', color: '#94a3b8', icon: '✨' },
];

export default function FinanceTracker({ placeId, savedPlaceData, user }: { placeId: string; savedPlaceData: any; user: any }) {
  const language = useVantiStore(state => state.language);
  const homeCurrency = language === 'ko' ? 'KRW' : 'USD';
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(homeCurrency);
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'analysis'>('list');

  const { convert, loading: ratesLoading } = useCurrencyConverter(homeCurrency);

  const expenses = savedPlaceData?.expenses || [];
  
  const totalExpensesHome = useMemo(() => {
    return expenses.reduce((sum: number, exp: any) => {
      const converted = convert(exp.amount, exp.currency || homeCurrency, homeCurrency);
      return sum + converted;
    }, 0);
  }, [expenses, convert, homeCurrency]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    expenses.forEach((exp: any) => {
      const cat = exp.category || 'etc';
      const value = convert(exp.amount, exp.currency || homeCurrency, homeCurrency);
      dataMap[cat] = (dataMap[cat] || 0) + value;
    });

    return CATEGORIES.map(cat => ({
      name: cat.label,
      value: dataMap[cat.id] || 0,
      color: cat.color
    })).filter(d => d.value > 0);
  }, [expenses, convert, homeCurrency]);

  const dailyData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    expenses.forEach((exp: any) => {
      const date = new Date(exp.date).toLocaleDateString();
      const value = convert(exp.amount, exp.currency || homeCurrency, homeCurrency);
      dailyMap[date] = (dailyMap[date] || 0) + value;
    });

    return Object.entries(dailyMap)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [expenses, convert, homeCurrency]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !placeId || !amount || !description) return;
    
    setIsAdding(true);
    try {
      const docRef = doc(db, 'users', user.uid, 'savedPlaces', placeId);
      const newExpense = {
        id: Math.random().toString(36).substring(2, 9),
        description,
        amount: parseFloat(amount),
        currency: selectedCurrency,
        category: selectedCategory,
        date: new Date().toISOString()
      };
      
      await setDoc(docRef, {
        expenses: [...expenses, newExpense]
      }, { merge: true });
      
      setAmount('');
      setDescription('');
    } catch (err) {
      console.error("Error adding expense:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user || !placeId) return;
    
    try {
      const docRef = doc(db, 'users', user.uid, 'savedPlaces', placeId);
      const updatedExpenses = expenses.filter((exp: any) => exp.id !== expenseId);
      
      await setDoc(docRef, {
        expenses: updatedExpenses
      }, { merge: true });
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/5 bg-[#0a0c10]/30 -mx-4 px-4 pb-4 rounded-b-[2rem]">
      <div className="flex items-center justify-between">
        <label className="text-[10px] items-center flex gap-1.5 font-black uppercase text-slate-500 tracking-[0.2em] pl-1">
          <Receipt className="w-3.5 h-3.5 text-indigo-400" /> {language === 'ko' ? '여행 경비' : 'Trip Expenses'}
        </label>
        
        <div className="flex bg-[#0f1117] rounded-xl p-1 border border-white/5 shadow-inner">
          <button 
            onClick={() => setActiveTab('list')}
            className={cn(
              "p-1.5 rounded-lg transition-all flex items-center justify-center w-8 h-8", 
              activeTab === 'list' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-600 hover:text-slate-400"
            )}
          >
            <ListIcon className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={cn(
              "p-1.5 rounded-lg transition-all flex items-center justify-center w-8 h-8", 
              activeTab === 'analysis' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-600 hover:text-slate-400"
            )}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-emerald-500/10 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
        <div className="relative flex items-center justify-between px-4 py-4 bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
                <Globe className={cn("w-5 h-5 text-emerald-400", ratesLoading && "animate-spin")} />
             </div>
             <div>
                <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest block leading-none mb-1">Global Balance</span>
                <span className="text-xl font-display font-black text-white tracking-tight">
                  {formatCurrency(totalExpensesHome, language)}
                </span>
             </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-tighter">Live Exchange</span>
            <span className="text-[10px] font-mono font-black text-emerald-400">1.00 {homeCurrency}</span>
          </div>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          <form onSubmit={handleAddExpense} className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'ko' ? '예: 점심 식사' : 'e.g. Lunch'}
                className="flex-1 bg-[#0f1117] border border-white/5 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!amount || !description || isAdding}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 text-white w-10.5 h-10.5 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-indigo-600/20 shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative group w-24">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#0f1117] border border-white/5 rounded-2xl px-3 py-2.5 text-[10px] text-slate-400 outline-none appearance-none text-center font-black uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 pointer-events-none" />
              </div>

              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-[#0f1117] border border-white/5 rounded-2xl px-3 py-2.5 text-[10px] text-slate-400 outline-none w-20 appearance-none text-center font-bold font-mono cursor-pointer hover:bg-white/5 transition-colors"
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>

              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">
                  {SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency)?.symbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0f1117] border border-white/5 focus:border-indigo-500/50 rounded-2xl pl-8 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono font-bold"
                />
              </div>
            </div>
          </form>

          {expenses.length > 0 ? (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/5">
              {expenses.map((exp: any) => {
                const isDifferent = exp.currency && exp.currency !== homeCurrency;
                const converted = isDifferent ? convert(exp.amount, exp.currency, homeCurrency) : exp.amount;
                const category = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[4];
                
                return (
                  <div key={exp.id} className="flex items-center justify-between bg-[#121622]/40 backdrop-blur-sm border border-white/5 p-3 rounded-2xl group hover:bg-[#121622]/60 transition-all hover:border-white/10 hover:translate-x-1">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-[#0f1117] border border-white/5 flex items-center justify-center text-sm shadow-inner">
                          {category.icon}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200 leading-none mb-1">{exp.description}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] text-slate-500 font-mono italic">{formatDate(exp.date, language)}</span>
                             <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400 font-black uppercase tracking-widest">{category.label}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-black text-white tracking-tighter">
                          {isDifferent ? (
                            <div className="flex flex-col items-end leading-none">
                              <span className="text-emerald-400 pb-0.5">{formatCurrency(converted, language)}</span>
                              <span className="text-[8px] text-slate-600 line-through decoration-white/10 font-bold">
                                {exp.amount} {exp.currency}
                              </span>
                            </div>
                          ) : (
                            formatCurrency(exp.amount, language)
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-500 transition-all p-1.5 active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-slate-700 bg-[#0f1117]/50 border-2 border-dashed border-white/[0.03] rounded-3xl">
               <Receipt className="w-10 h-10 mb-3 opacity-10" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">No Records Yet</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {/* Pie Chart Section */}
          <div className="bg-[#0f1117]/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 min-h-[260px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full" />
            
            {chartData.length > 0 ? (
              <div className="w-full">
                <div className="w-full h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            className="hover:opacity-80 transition-opacity cursor-pointer shadow-2xl"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl shadow-2xl">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{payload[0].name}</p>
                                <p className="text-sm font-mono font-black text-white">{formatCurrency(payload[0].value as number, language)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Total</span>
                     <span className="text-sm font-display font-black text-white tracking-widest">{formatCurrency(totalExpensesHome, language).split('.')[0]}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
                  {chartData.map((data, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: data.color, boxShadow: `0 0 10px ${data.color}40` }} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{data.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-black text-white/90">{Math.round((data.value / totalExpensesHome) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-700">
                <PieChartIcon className="w-10 h-10 mb-3 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">No category data</p>
              </div>
            )}
          </div>

          {/* Daily Line Chart Section */}
          <div className="bg-[#0f1117]/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Spending History</span>
              <span className="text-[9px] font-mono text-emerald-400">Daily Trend</span>
            </div>
            
            {dailyData.length > 0 ? (
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis 
                      dataKey="date" 
                      hide 
                    />
                    <YAxis hide />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0a0c10]/95 backdrop-blur-2xl border border-white/10 p-2 rounded-xl shadow-2xl">
                              <p className="text-[8px] font-black uppercase text-slate-500 mb-1">{payload[0].payload.date}</p>
                              <p className="text-xs font-mono font-black text-white">{formatCurrency(payload[0].value as number, language)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#818cf8" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} 
                      activeDot={{ r: 6, fill: '#fff', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-slate-700 bg-white/[0.01] rounded-2xl">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Daily trends will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

