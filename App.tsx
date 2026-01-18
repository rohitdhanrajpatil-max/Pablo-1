
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import { EvaluationResult, EvaluationType } from './types';
import { evaluateHotel } from './services/geminiService';
import ScoreCard from './components/ScoreCard';
import DecisionBadge from './components/DecisionBadge';
import OTAAuditCard from './components/OTAAuditCard';
import RoomTypeAuditSection from './components/RoomTypeAuditSection';
import TreeboPresenceSection from './components/TreeboPresenceSection';
import ProtocolStatusCard from './components/ProtocolStatusCard';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

const App: React.FC = () => {
  const [hotelName, setHotelName] = useState('');
  const [city, setCity] = useState('');
  const [reportType, setReportType] = useState<EvaluationType>('New Onboarding');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ hotelName?: boolean; city?: boolean }>({});
  const [comparisonMetric, setComparisonMetric] = useState<'adr' | 'rating'>('rating');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Attempt to get location for more accurate radius grounding
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.log("Geolocation skip:", err.message),
        { timeout: 5000 }
      );
    }

    const params = new URLSearchParams(window.location.search);
    const h = params.get('hotel');
    const c = params.get('city');
    const t = params.get('type') as EvaluationType;

    if (h && c) {
      setHotelName(h);
      setCity(c);
      if (t) setReportType(t);
      
      const autoEvaluate = async () => {
        setLoading(true);
        try {
          const evaluation = await evaluateHotel(h, c, t || 'New Onboarding', userLocation);
          setResult(evaluation);
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to auto-load shared report.");
        } finally {
          setLoading(false);
        }
      };
      autoEvaluate();
    }
  }, []);

  const validateInputs = () => {
    const errors: { hotelName?: boolean; city?: boolean } = {};
    let isValid = true;
    if (!hotelName.trim() || hotelName.trim().length < 3) { errors.hotelName = true; isValid = false; }
    if (!city.trim() || city.trim().length < 2) { errors.city = true; isValid = false; }
    setFieldErrors(errors);
    return isValid;
  };

  const handleEvaluate = async () => {
    if (!validateInputs()) {
      setError("Strategic inputs required: Hotel Name and City node mapping.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const evaluation = await evaluateHotel(hotelName, city, reportType, userLocation);
      setResult(evaluation);
      setSelectedCategories(['All']); 
      
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('hotel', hotelName);
        url.searchParams.set('city', city);
        url.searchParams.set('type', reportType);
        window.history.pushState({}, '', url.toString());
      } catch (historyError) {
        console.warn("Could not update history state:", historyError);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The audit request failed. Strategic node connection lost.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setHotelName('');
    setCity('');
    setError(null);
    setFieldErrors({});
    setSelectedCategories(['All']);
    try {
      window.history.pushState({}, '', window.location.pathname);
    } catch (historyError) {
      console.warn("Could not reset history state:", historyError);
    }
  };

  const handleShare = async () => {
    if (!result?.executiveSummary) return;
    const url = new URL(window.location.href);
    url.searchParams.set('hotel', result.executiveSummary.hotelName);
    url.searchParams.set('city', result.executiveSummary.city);
    url.searchParams.set('type', result.executiveSummary.evaluationType);
    
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const handleExportPDF = () => {
    if (!reportRef.current || !result?.executiveSummary) return;
    setExporting(true);
    const element = reportRef.current;
    const filename = `Treebo_Audit_${result.executiveSummary.hotelName.replace(/\s+/g, '_')}_${result.executiveSummary.city}.pdf`;
    const opt = {
      margin: [8, 8, 8, 8],
      filename: filename,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => setExporting(false));
  };

  const availableCategories = useMemo(() => {
    if (!result?.competitors || !Array.isArray(result.competitors)) return ['All'];
    const categories = Array.from(new Set(result.competitors.map(c => c.category)));
    return ['All', ...categories];
  }, [result]);

  const toggleCategory = (category: string) => {
    if (category === 'All') {
      setSelectedCategories(['All']);
      return;
    }

    let next = selectedCategories.filter(c => c !== 'All');
    if (next.includes(category)) {
      next = next.filter(c => c !== category);
    } else {
      next = [...next, category];
    }

    if (next.length === 0) {
      setSelectedCategories(['All']);
    } else {
      setSelectedCategories(next);
    }
  };

  const filteredCompetitors = useMemo(() => {
    if (!result?.competitors || !Array.isArray(result.competitors)) return [];
    if (selectedCategories.includes('All')) return result.competitors;
    return result.competitors.filter(c => selectedCategories.includes(c.category));
  }, [result, selectedCategories]);

  const chartData = useMemo(() => {
    if (!result || !result.executiveSummary) return [];
    const target = {
      name: `[TARGET] ${result.executiveSummary.hotelName}`,
      rating: result.targetHotelMetrics?.averageOTARating || 0,
      adr: result.targetHotelMetrics?.estimatedADR || 0,
      isTarget: true
    };
    const others = filteredCompetitors.map(c => ({
      name: c.name,
      rating: c.otaRating,
      adr: parseFloat(String(c.estimatedADR).replace(/[^0-9.]/g, '')) || 0,
      isTarget: false
    }));
    return [target, ...others];
  }, [result, filteredCompetitors]);

  const sortedOtaAudit = useMemo(() => {
    if (!result?.otaAudit || !Array.isArray(result.otaAudit)) return [];
    // MANDATORY CHANNEL SORT ORDER
    const order = ['treebo', 'makemytrip', 'mmt', 'booking', 'agoda', 'goibibo', 'google'];
    return [...result.otaAudit].sort((a, b) => {
      const aName = (a.platform || '').toLowerCase();
      const bName = (b.platform || '').toLowerCase();
      const aIndex = order.findIndex(o => aName.includes(o));
      const bIndex = order.findIndex(o => bName.includes(o));
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [result]);

  const maxVal = useMemo(() => {
    if (comparisonMetric === 'rating') return 5;
    return Math.max(...chartData.map(d => d.adr), 1);
  }, [chartData, comparisonMetric]);

  if (result) {
    const isHealthReport = result.executiveSummary.evaluationType === 'Existing Hotel Health Report';
    return (
      <Layout fullWidth={true}>
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 px-6 md:px-12 pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
            <button onClick={handleReset} className="inline-flex items-center text-slate-400 hover:text-treebo-brown font-black text-[9px] uppercase tracking-[0.3em] gap-3 group transition-all py-2 pr-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-treebo-brown group-hover:text-white transition-all shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              Archive Current Audit
            </button>
            <div className="flex items-center gap-4">
               <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm backdrop-blur-md ${isHealthReport ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-treebo-orange/5 text-treebo-orange border-treebo-orange/20'}`}>
                 {result.executiveSummary.evaluationType}
               </span>
               <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">ID: STRAT-{Math.floor(Math.random() * 10000)}</div>
            </div>
          </div>

          <div ref={reportRef} className="pdf-export-container space-y-12 bg-transparent">
            {/* Executive Summary Master Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden relative avoid-page-break shadow-2xl shadow-slate-200/40">
              <div className={`h-2.5 w-full ${isHealthReport ? 'bg-emerald-500' : 'bg-treebo-orange'}`}></div>
              <div className="p-10 md:p-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  <div className="lg:col-span-7 space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Validated Node</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Asset Node</p>
                      <h2 className="text-4xl md:text-5xl font-black text-treebo-brown leading-none tracking-tighter mb-4">{result.executiveSummary.hotelName}</h2>
                      <div className="flex items-center gap-2 text-treebo-orange uppercase font-black text-sm tracking-[0.2em] bg-treebo-orange/5 px-6 py-2 rounded-full inline-flex border border-treebo-orange/10">
                        {result.executiveSummary.city}
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-5 grid grid-cols-2 gap-8 lg:pl-12 lg:border-l border-slate-100">
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Verdict</p>
                      <DecisionBadge decision={result.executiveSummary.finalDecision} />
                    </div>
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Node Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-6xl font-black tracking-tighter ${result.executiveSummary.averageScore >= 7 ? 'text-emerald-600' : result.executiveSummary.averageScore >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                          {result.executiveSummary.averageScore.toFixed(1)}
                        </span>
                        <span className="text-slate-300 text-xl font-black">/10</span>
                      </div>
                    </div>
                    <div className="col-span-2 pt-6 border-t border-slate-50 flex gap-3 no-print">
                      <button onClick={handleShare} className="flex-1 px-6 py-4 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.1em] hover:bg-treebo-brown transition-all shadow-lg group">
                        {shareFeedback ? 'URL COPIED' : 'SHARE LEDGER'}
                      </button>
                      <button onClick={handleExportPDF} disabled={exporting} className="flex-1 px-6 py-4 rounded-2xl bg-treebo-orange text-white text-[9px] font-black uppercase tracking-[0.1em] hover:bg-treebo-brown transition-all shadow-lg disabled:opacity-50">
                        {exporting ? 'EXPORTING...' : 'PDF DOSSIER'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 avoid-page-break">
                {result.treeboPresence && (
                  <div className="lg:col-span-2">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4 mb-4">
                      Local Node Synergy Matrix
                      <div className="h-px bg-slate-200 flex-grow"></div>
                    </h3>
                    <TreeboPresenceSection presence={result.treeboPresence} />
                  </div>
                )}
                <div className="lg:col-span-1">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4 mb-4">
                    Security Protocols
                    <div className="h-px bg-slate-200 flex-grow"></div>
                  </h3>
                  <ProtocolStatusCard status={result.protocolStatus} />
                </div>
            </div>

            {/* OTA Channel Integrity Audit */}
            <section className="space-y-8 avoid-page-break">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                OTA Channel Logic Verification (6 Mandatory Channels)
                <div className="h-px bg-slate-200 flex-grow"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
                {sortedOtaAudit.map((audit, idx) => (
                  <OTAAuditCard key={idx} audit={audit} />
                ))}
              </div>
            </section>

            {/* Inventory Detail */}
            {result.roomTypeAudit && Array.isArray(result.roomTypeAudit) && result.roomTypeAudit.length > 0 && (
              <section className="space-y-8 page-break-before">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                  Unit Inventory Integrity Audit
                  <div className="h-px bg-slate-200 flex-grow"></div>
                </h3>
                <RoomTypeAuditSection rooms={result.roomTypeAudit} />
              </section>
            )}

            {/* Competitive Index */}
            {result.competitors && Array.isArray(result.competitors) && result.competitors.length > 0 && (
              <section className="space-y-8 page-break-before">
                <div className="flex items-center justify-between gap-6">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4 flex-grow">
                    Competitive Index (2KM Cluster) & Recurring Sentiment
                    <div className="h-px bg-slate-200 flex-grow"></div>
                  </h3>
                  <div className="no-print bg-white border border-slate-200 p-1 rounded-xl shadow-sm flex items-center gap-1">
                    {availableCategories.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => toggleCategory(cat)} 
                        className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${selectedCategories.includes(cat) ? 'bg-treebo-brown text-white shadow-md' : 'text-slate-400 hover:text-treebo-brown hover:bg-slate-50'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-10 avoid-page-break shadow-xl shadow-slate-200/30">
                    <div className="flex justify-between items-center mb-10">
                      <div className="space-y-1">
                        <h4 className="text-treebo-brown font-black uppercase text-[10px] tracking-[0.3em]">Strategy Plotting</h4>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Market Equilibrium</p>
                      </div>
                      <div className="inline-flex bg-slate-50 p-1 rounded-xl border border-slate-100 no-print">
                        <button onClick={() => setComparisonMetric('rating')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${comparisonMetric === 'rating' ? 'bg-treebo-brown text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Rating</button>
                        <button onClick={() => setComparisonMetric('adr')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${comparisonMetric === 'adr' ? 'bg-treebo-orange text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>ADR</button>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {chartData.length > 1 ? (chartData.map((data, idx) => {
                        const val = comparisonMetric === 'rating' ? data.rating : data.adr;
                        const percentage = (val / maxVal) * 100;
                        return (
                          <div key={idx} className="space-y-2.5">
                            <div className="flex justify-between items-end px-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${data.isTarget ? 'text-treebo-orange' : 'text-slate-500'}`}>
                                {data.name}
                              </span>
                              <span className="text-[11px] font-black text-treebo-brown tabular-nums">
                                {comparisonMetric === 'adr' ? `${result.targetHotelMetrics?.adrCurrency || 'INR'} ${val.toLocaleString()}` : `${val.toFixed(1)}/5`}
                              </span>
                            </div>
                            <div className="h-3.5 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner p-0.5">
                              <div className={`h-full transition-all duration-1000 ease-out rounded-full ${data.isTarget ? (comparisonMetric === 'adr' ? 'bg-treebo-orange' : 'bg-treebo-brown') : 'bg-slate-300'}`} style={{ width: `${Math.max(percentage, 5)}%` }}></div>
                            </div>
                          </div>
                        );
                      })) : (
                        <div className="py-12 text-center">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">No filtered data available for this selection.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden avoid-page-break shadow-xl shadow-slate-200/30 flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <p className="text-[9px] font-black text-treebo-brown uppercase tracking-[0.4em]">Market Nodes & Recurring Review Themes</p>
                      <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{filteredCompetitors.length} NODES (2KM RADIUS)</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] custom-scrollbar">
                      {filteredCompetitors.length > 0 ? filteredCompetitors.map((comp, idx) => (
                        <div key={idx} className="p-8 hover:bg-slate-50 transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-black text-treebo-brown uppercase tracking-tight group-hover:text-treebo-orange transition-colors">{comp.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[7px] font-black uppercase tracking-widest">{comp.category}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{comp.distance} From Asset</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black text-treebo-orange tabular-nums block">{comp.estimatedADR}</span>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-xs font-black text-slate-700 tabular-nums">{comp.otaRating.toFixed(1)}</span>
                                    <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-all">
                             <div className="space-y-2">
                                <p className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Top Recurring Positives</p>
                                <ul className="space-y-1">
                                    {comp.topPositives && Array.isArray(comp.topPositives) ? comp.topPositives.slice(0, 3).map((p, i) => (
                                        <li key={i} className="text-[9px] font-bold text-slate-600 flex items-start gap-1.5 leading-tight">
                                            <span className="text-emerald-500">•</span> {p}
                                        </li>
                                    )) : null}
                                </ul>
                             </div>
                             <div className="space-y-2">
                                <p className="text-[7px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Top Recurring Negatives</p>
                                <ul className="space-y-1">
                                    {comp.topNegatives && Array.isArray(comp.topNegatives) ? comp.topNegatives.slice(0, 3).map((n, i) => (
                                        <li key={i} className="text-[9px] font-bold text-slate-600 flex items-start gap-1.5 leading-tight">
                                            <span className="text-red-400">•</span> {n}
                                        </li>
                                    )) : null}
                                </ul>
                             </div>
                          </div>
                        </div>
                      )) : (
                        <div className="p-12 text-center">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">No peers recovered for this filter.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Final Strategy */}
            <section className="page-break-before space-y-12 pb-20">
              <ScoreCard data={result.scorecard || []} />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 avoid-page-break items-stretch">
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 p-10 md:p-12 shadow-xl shadow-slate-200/30">
                  <h4 className="text-treebo-brown font-black uppercase text-[10px] tracking-[0.4em] mb-8 flex items-center gap-4">
                    <span className="w-2 h-8 bg-red-600 rounded-full"></span> Strategy Risk Ledger
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {Array.isArray(result.keyRisks) && result.keyRisks.map((risk, i) => (
                      <div key={i} className="text-xs font-black text-slate-600 leading-relaxed flex gap-4 pb-4 border-b border-slate-50 last:border-0 hover:border-red-600 transition-all">
                        <span className="text-red-600 font-black">!</span> {risk}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-4 bg-treebo-brown text-white rounded-[3rem] p-10 flex flex-col justify-center border-l-[15px] border-treebo-orange shadow-2xl relative overflow-hidden group">
                  <h4 className="text-white/30 font-black text-[9px] uppercase tracking-[0.4em] mb-8">Executive Directive</h4>
                  <p className="text-white font-black text-xl italic leading-tight tracking-tight relative z-10 group-hover:text-treebo-orange transition-colors duration-500">"{result.finalRecommendation}"</p>
                  <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[9px] font-black text-treebo-orange uppercase tracking-widest">ALPHA-NODE VERIFIED</span>
                    <div className="w-10 h-10 bg-treebo-orange rounded-xl flex items-center justify-center">
                       <div className="w-5 h-5 border-2 border-white/20 rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grounding Sources Ledger */}
              {result.groundingSources && Array.isArray(result.groundingSources) && result.groundingSources.length > 0 && (
                <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm no-print">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Grounding Sources & Integrity Links</p>
                  <div className="flex flex-wrap gap-4">
                    {result.groundingSources.map((source, i) => (
                      <a 
                        key={i} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-all truncate max-w-[200px]"
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth={false}>
      <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in zoom-in-95 duration-1000 py-20">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-xl">
            <span className="px-5 py-2 rounded-xl bg-treebo-brown text-white text-[9px] font-black uppercase tracking-[0.3em] shadow-lg">STRATOS v3.4</span>
            <div className="h-6 w-px bg-slate-200"></div>
            <span className="px-5 py-2 rounded-xl bg-treebo-orange/5 text-treebo-orange text-[9px] font-black uppercase tracking-[0.3em]">Commercial Logic Active</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-treebo-brown tracking-tighter leading-[0.85] flex flex-col items-center">
            STRATEGY
            <span className="text-treebo-orange block">AUDIT ENGINE</span>
          </h2>
          <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed tracking-tight px-6">
            Execute professional commercial audits for the Treebo portfolio. Strategic node mapping, micro-market indexing, and demand cluster logic within a precise 2KM radius.
          </p>
        </div>

        <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-slate-200/50">
          <div className="p-12 md:p-20 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <label className="text-[10px] font-black text-treebo-brown uppercase tracking-[0.4em] px-4 block">Asset Node</label>
                <input type="text" className={`w-full px-8 py-6 rounded-3xl border-2 transition-all text-treebo-brown font-black text-xl bg-slate-50 focus:ring-0 placeholder:text-slate-200 ${fieldErrors.hotelName ? 'border-red-100 bg-red-50' : 'border-slate-50 focus:border-treebo-orange focus:bg-white'}`} placeholder="Hotel Name..." value={hotelName} onChange={(e) => setHotelName(e.target.value)} />
              </div>
              <div className="space-y-6">
                <label className="text-[10px] font-black text-treebo-brown uppercase tracking-[0.4em] px-4 block">Market Node</label>
                <input type="text" className={`w-full px-8 py-6 rounded-3xl border-2 transition-all text-treebo-brown font-black text-xl bg-slate-50 focus:ring-0 placeholder:text-slate-200 ${fieldErrors.city ? 'border-red-100 bg-red-50' : 'border-slate-50 focus:border-treebo-orange focus:bg-white'}`} placeholder="City..." value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>

            <div className="space-y-8">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] block text-center">Protocol Mode</label>
              <div className="flex flex-wrap justify-center gap-6">
                {(['New Onboarding', 'Existing Hotel Health Report'] as EvaluationType[]).map((type) => (
                  <button key={type} onClick={() => setReportType(type)} className={`px-10 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all transform active:scale-95 ${reportType === type ? 'border-treebo-brown bg-treebo-brown text-white shadow-xl scale-105' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}>{type}</button>
                ))}
              </div>
            </div>
            
            <div className="pt-8">
              <button disabled={loading || !hotelName.trim() || !city.trim()} onClick={handleEvaluate} className={`w-full py-8 rounded-[3rem] font-black text-2xl text-white transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-6 shadow-xl ${loading ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-treebo-orange hover:bg-treebo-brown'}`}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    EXECUTING...
                  </>
                ) : (
                  <>INITIATE STRATEGIC AUDIT</>
                )}
              </button>
            </div>
          </div>
          <div className="bg-treebo-brown px-12 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.6em]">ENGINE ONLINE • STRAT-NODE SECURE</p>
            <div className="flex gap-6 items-center">
              <span className="w-3 h-3 rounded-full bg-treebo-orange animate-pulse"></span>
              <span className="text-[10px] text-white font-black uppercase tracking-widest">GEMINI-2.5 FLASH CLUSTER</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
