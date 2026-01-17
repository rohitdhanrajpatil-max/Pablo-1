
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
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [shareFeedback, setShareFeedback] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Deep linking: Check for query params on mount
  useEffect(() => {
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
          const evaluation = await evaluateHotel(h, c, t || 'New Onboarding');
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
      setError("Incomplete data: Please ensure both Hotel Name and City are provided.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const evaluation = await evaluateHotel(hotelName, city, reportType);
      setResult(evaluation);
      setCategoryFilter('All'); // Reset filter on new evaluation
      
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
      setError(err.message || "The audit request failed due to a network error. Please try again in a few seconds.");
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
    setCategoryFilter('All');
    
    try {
      window.history.pushState({}, '', window.location.pathname);
    } catch (historyError) {
      console.warn("Could not reset history state:", historyError);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('hotel', result.executiveSummary.hotelName);
    url.searchParams.set('city', result.executiveSummary.city);
    url.searchParams.set('type', result.executiveSummary.evaluationType);
    
    const shareData = {
      title: `Treebo Audit: ${result.executiveSummary.hotelName}`,
      text: `Strategic commercial evaluation for ${result.executiveSummary.hotelName} in ${result.executiveSummary.city}. Verdict: ${result.executiveSummary.finalDecision}`,
      url: url.toString(),
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn("Share failed or cancelled", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url.toString());
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      } catch (err) {
        console.error("Clipboard copy failed", err);
      }
    }
  };

  const handleExportPDF = () => {
    if (!reportRef.current || !result) return;
    
    setExporting(true);
    const element = reportRef.current;
    const filename = `Treebo_Audit_${result.executiveSummary.hotelName.replace(/\s+/g, '_')}_${result.executiveSummary.city}.pdf`;
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        windowWidth: 1200 // Lock width for consistent high-quality capture
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setExporting(false);
    }).catch((err: any) => {
      console.error("PDF Export Error:", err);
      setExporting(false);
    });
  };

  const availableCategories = useMemo(() => {
    if (!result?.competitors) return ['All'];
    const categories = Array.from(new Set(result.competitors.map(c => c.category)));
    return ['All', ...categories];
  }, [result]);

  const filteredCompetitors = useMemo(() => {
    if (!result?.competitors) return [];
    if (categoryFilter === 'All') return result.competitors;
    return result.competitors.filter(c => c.category === categoryFilter);
  }, [result, categoryFilter]);

  const chartData = useMemo(() => {
    if (!result) return [];
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
    if (!result?.otaAudit) return [];
    const order = ['treebo.com', 'treebo', 'makemytrip', 'mmt', 'booking.com', 'booking', 'agoda', 'goibibo', 'google maps', 'google'];
    return [...result.otaAudit].sort((a, b) => {
      const aName = a.platform.toLowerCase();
      const bName = b.platform.toLowerCase();
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
    const maxAdr = Math.max(...chartData.map(d => d.adr), 1);
    return maxAdr;
  }, [chartData, comparisonMetric]);

  if (result) {
    const isHealthReport = result.executiveSummary.evaluationType === 'Existing Hotel Health Report';
    return (
      <Layout fullWidth={true}>
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 px-6 md:px-12 pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
            <button onClick={handleReset} className="inline-flex items-center text-slate-400 hover:text-treebo-brown font-black text-xs uppercase tracking-[0.3em] gap-3 group transition-all py-2 pr-4">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-treebo-brown group-hover:text-white transition-all shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              Research New Asset
            </button>
            <div className="flex items-center gap-4">
               <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] border shadow-sm backdrop-blur-sm ${isHealthReport ? 'bg-teal-50/80 text-teal-700 border-teal-200' : 'bg-treebo-orange/5 text-treebo-orange border-treebo-orange/20'}`}>
                 {result.executiveSummary.evaluationType}
               </span>
               <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-white/80 px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div ref={reportRef} className="pdf-export-container space-y-12 bg-transparent">
            {/* Executive Hero Section */}
            <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden relative avoid-page-break shadow-xl shadow-slate-200/50">
              <div className={`h-2.5 w-full ${isHealthReport ? 'bg-teal-500' : 'bg-treebo-orange'}`}></div>
              <div className="p-10 md:p-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                  <div className="space-y-6 lg:col-span-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg">
                       <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                       <span className="text-[9px] font-black text-white uppercase tracking-widest">Active Audit Report</span>
                    </div>
                    <div>
                      <h2 className="text-5xl md:text-6xl font-black text-treebo-brown leading-none tracking-tighter mb-3">{result.executiveSummary.hotelName}</h2>
                      <div className="flex items-center gap-2 text-treebo-orange uppercase font-black text-sm tracking-[0.2em] bg-treebo-orange/5 px-4 py-1.5 rounded-full inline-flex border border-treebo-orange/10">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {result.executiveSummary.city}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Strategy Verdict</p>
                    <div className="pt-2"><DecisionBadge decision={result.executiveSummary.finalDecision} /></div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Commercial Score</p>
                    <div className="flex items-baseline gap-3">
                      <span className={`text-7xl font-black tracking-tighter ${result.executiveSummary.averageScore >= 7 ? 'text-green-600' : result.executiveSummary.averageScore >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                        {result.executiveSummary.averageScore.toFixed(1)}
                      </span>
                      <span className="text-slate-300 text-3xl font-black">/10</span>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Report Management</p>
                    <div className="flex flex-col gap-3 no-print">
                        <button 
                          onClick={handleShare}
                          className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-treebo-brown transition-all group shadow-lg active:scale-95"
                        >
                          {shareFeedback ? 'VERIFIED URL COPIED' : 'SHARE STRATEGY'}
                        </button>
                        <button 
                          onClick={handleExportPDF}
                          disabled={exporting}
                          className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-treebo-orange text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-treebo-brown transition-all group shadow-lg active:scale-95 disabled:opacity-50"
                        >
                          {exporting ? 'GENERATING ARCHIVE...' : 'EXPORT PDF DOSSIER'}
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Treebo Synergy - High Priority Dashboard Module */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 avoid-page-break">
                {result.treeboPresence && (
                  <div className="lg:col-span-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-5 mb-6">
                      Network Strategy Radar
                      <div className="h-px bg-slate-200 flex-grow"></div>
                    </h3>
                    <TreeboPresenceSection presence={result.treeboPresence} />
                  </div>
                )}
                
                <div className="lg:col-span-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-5 mb-6">
                    Audit Protocols
                    <div className="h-px bg-slate-200 flex-grow"></div>
                  </h3>
                  <ProtocolStatusCard status={result.protocolStatus} />
                </div>
            </div>

            <section className="space-y-8 avoid-page-break">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-5">
                OTA Channel Integrity Audit
                <div className="h-px bg-slate-200 flex-grow"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {(sortedOtaAudit || []).map((audit, idx) => (
                  <OTAAuditCard key={idx} audit={audit} />
                ))}
              </div>
            </section>

            {result.roomTypeAudit && result.roomTypeAudit.length > 0 && (
              <section className="space-y-8 page-break-before">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-5">
                  Inventory Depth & Unit Audit
                  <div className="h-px bg-slate-200 flex-grow"></div>
                </h3>
                <RoomTypeAuditSection rooms={result.roomTypeAudit} />
              </section>
            )}

            {result.competitors && result.competitors.length > 0 && (
              <section className="space-y-10 page-break-before">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-5 flex-grow">
                    Micro-Market Competitive Index
                    <div className="h-px bg-slate-200 flex-grow"></div>
                  </h3>
                  <div className="flex items-center gap-4 no-print overflow-x-auto pb-2 sm:pb-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap bg-white px-3 py-1.5 rounded-lg border border-slate-200">Asset Category:</span>
                    <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-[1.5rem] shadow-sm">
                      {availableCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-treebo-brown text-white shadow-lg' : 'text-slate-400 hover:text-treebo-brown'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 p-10 md:p-14 avoid-page-break shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                      <div className="space-y-1">
                        <h4 className="text-treebo-brown font-black uppercase text-xs tracking-[0.2em]">Strategy Visualization Layer</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Comparison Index (MCI)</p>
                      </div>
                      <div className="inline-flex bg-slate-50 p-1.5 rounded-[2rem] border border-slate-200 no-print">
                        <button onClick={() => setComparisonMetric('rating')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${comparisonMetric === 'rating' ? 'bg-treebo-brown text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>OTA Rating</button>
                        <button onClick={() => setComparisonMetric('adr')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${comparisonMetric === 'adr' ? 'bg-treebo-orange text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Target ADR</button>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {(chartData || []).map((data, idx) => {
                        const val = comparisonMetric === 'rating' ? data.rating : data.adr;
                        const percentage = (val / maxVal) * 100;
                        return (
                          <div key={idx} className="space-y-3 group">
                            <div className="flex justify-between items-end px-1">
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${data.isTarget ? 'text-treebo-orange' : 'text-slate-500'}`}>
                                {data.isTarget && <span className="mr-2 inline-block w-2 h-2 rounded-full bg-treebo-orange animate-pulse"></span>}
                                {data.name}
                              </span>
                              <span className="text-sm font-black text-treebo-brown bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                {comparisonMetric === 'adr' ? `${result.targetHotelMetrics?.adrCurrency || 'INR'} ${val.toLocaleString()}` : `${val.toFixed(1)}/5`}
                              </span>
                            </div>
                            <div className="h-4 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner p-0.5">
                              <div className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${data.isTarget ? (comparisonMetric === 'adr' ? 'bg-treebo-orange' : 'bg-treebo-brown') : 'bg-slate-300'}`} style={{ width: `${Math.max(percentage, 5)}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {chartData.length <= 1 && (
                        <div className="py-16 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                          No direct competitors indexed in this category.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1 bg-white rounded-[3rem] border border-slate-200 overflow-hidden avoid-page-break shadow-xl shadow-slate-200/50 flex flex-col">
                    <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="text-treebo-brown font-black uppercase text-[10px] tracking-[0.3em]">Competitive Radar</h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PROXIMITY MAPPING</p>
                      </div>
                      <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{filteredCompetitors.length} NODES</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] custom-scrollbar">
                      {filteredCompetitors.length > 0 ? filteredCompetitors.map((comp, idx) => (
                        <div key={idx} className="p-8 hover:bg-slate-50 transition-colors group">
                          <div className="flex justify-between items-start mb-3">
                            <p className="text-sm font-black text-treebo-brown uppercase tracking-tight group-hover:text-treebo-orange transition-colors">{comp.name}</p>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">{comp.distance}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-[0.2em]">{comp.category}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-700">{comp.otaRating.toFixed(1)}</span>
                                  <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                             </div>
                             <span className="text-sm font-black text-treebo-orange">{comp.estimatedADR}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="p-16 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] italic">
                          No direct peers found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 avoid-page-break">
                  <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 transition-transform group-hover:rotate-0">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                    <h4 className="text-treebo-brown font-black uppercase text-xs tracking-[0.3em] mb-10 flex items-center gap-4">
                       <div className="w-2 h-8 bg-treebo-brown rounded-full"></div> 
                       Enterprise Demand Drivers
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {(result.topCorporates || []).map((corp, i) => (
                        <li key={i} className="flex items-center gap-4 px-6 py-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-xs font-black text-slate-700 hover:bg-white hover:shadow-xl hover:border-treebo-brown transition-all group/item">
                          <span className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-[10px] font-black text-treebo-brown border border-slate-200 group-hover/item:bg-treebo-brown group-hover/item:text-white transition-colors">{i+1}</span>
                          {corp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 transition-transform group-hover:rotate-0">
                      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                    </div>
                    <h4 className="text-treebo-orange font-black uppercase text-xs tracking-[0.3em] mb-10 flex items-center gap-4">
                       <div className="w-2 h-8 bg-treebo-orange rounded-full"></div> 
                       Strategic Channel Partners
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {(result.topTravelAgents || []).map((agent, i) => (
                        <li key={i} className="flex items-center gap-4 px-6 py-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-xs font-black text-slate-700 hover:bg-white hover:shadow-xl hover:border-treebo-orange transition-all group/item">
                          <span className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-[10px] font-black text-treebo-orange border border-slate-200 group-hover/item:bg-treebo-orange group-hover/item:text-white transition-colors">{i+1}</span>
                          {agent}
                        </li>
                      ))}
                    </ul>
                  </div>
            </div>

            {result.guestReviews && (
                <section className="avoid-page-break space-y-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] flex items-center gap-5">
                    Guest Quality Index & Sentiment Analysis
                    <div className="h-px bg-slate-200 flex-grow"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {(result.guestReviews || []).map((rev, i) => (
                      <div key={i} className="bg-slate-900 text-white rounded-[3rem] p-12 space-y-10 border border-white/5 hover:bg-slate-800 transition-all shadow-2xl relative overflow-hidden group">
                        {/* Sentiment Score indicator */}
                        <div className="absolute top-0 right-0 p-10">
                          <div className={`w-20 h-20 rounded-full border-[6px] flex flex-col items-center justify-center font-black transition-transform group-hover:scale-110 duration-500 ${rev.sentimentScore >= 70 ? 'border-green-500 text-green-400' : rev.sentimentScore >= 40 ? 'border-amber-500 text-amber-400' : 'border-red-500 text-red-400'}`}>
                            <span className="text-xl tracking-tighter">{rev.sentimentScore}%</span>
                            <span className="text-[7px] uppercase tracking-widest leading-none">SCORE</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-treebo-orange uppercase tracking-[0.5em] border-b border-white/10 pb-5">{rev.platform}</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest pt-2">Algorithmic Satisfaction Audit</p>
                        </div>
                        
                        <div className="space-y-10">
                            <div className="space-y-5">
                                <p className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-3">
                                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span> 
                                  Key Satisfiers
                                </p>
                                <div className="space-y-4">
                                  {(rev.positive || []).map((p, j) => (
                                    <p key={j} className="text-xs font-bold text-white/70 leading-snug flex gap-3">
                                      <span className="text-green-500/50 font-black">•</span> {p}
                                    </p>
                                  ))}
                                </div>
                            </div>
                            <div className="space-y-5">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3">
                                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                                  Critical Friction
                                </p>
                                <div className="space-y-4">
                                  {(rev.negative || []).map((n, j) => (
                                    <p key={j} className="text-xs font-bold text-white/70 leading-snug flex gap-3">
                                      <span className="text-red-500/50 font-black">•</span> {n}
                                    </p>
                                  ))}
                                </div>
                            </div>
                        </div>

                        {/* Recurring Themes */}
                        {rev.recurringThemes && rev.recurringThemes.length > 0 && (
                          <div className="pt-10 border-t border-white/10">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">Strategy Themes Identification</p>
                            <div className="flex flex-wrap gap-2.5">
                              {rev.recurringThemes.map((theme, idx) => (
                                <span key={idx} className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105 ${theme.impact === 'positive' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-lg shadow-green-500/5' : theme.impact === 'negative' ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/5' : 'bg-white/5 border-white/10 text-white/60'}`}>
                                  {theme.theme}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
            )}

            <section className="page-break-before space-y-16 pb-20">
              <div className="avoid-page-break">
                <ScoreCard data={result.scorecard || []} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 avoid-page-break items-stretch">
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-200 p-12 md:p-16 space-y-10 shadow-xl shadow-slate-200/50 h-full">
                  <h4 className="text-treebo-brown font-black uppercase text-xs tracking-[0.3em] flex items-center gap-5">
                    <span className="w-2.5 h-10 bg-red-600 rounded-full"></span> Critical Strategy Risk Audit
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                    {(result.keyRisks || []).map((risk, i) => (
                      <div key={i} className="text-xs font-black text-slate-700 leading-relaxed flex gap-4 pb-6 border-b border-slate-100 last:border-0 hover:border-red-600 transition-colors">
                        <span className="text-red-600 font-black text-lg leading-none">!!</span> {risk}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-1 bg-treebo-brown text-white rounded-[3.5rem] p-12 md:p-16 flex flex-col justify-center border-l-[20px] border-treebo-orange shadow-2xl relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 w-full h-2 bg-treebo-orange/30"></div>
                  <h4 className="text-white/40 font-black text-[10px] uppercase tracking-[0.5em] mb-8">Executive Final Directive</h4>
                  <p className="text-white font-black text-2xl italic leading-tight tracking-tight">"{result.finalRecommendation}"</p>
                  <div className="mt-12 pt-12 border-t border-white/10 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block">STRATEGY CLASSIFICATION</span>
                      <span className="text-[10px] font-black text-treebo-orange uppercase tracking-widest">Enterprise Priority Alpha</span>
                    </div>
                    <div className="w-12 h-12 bg-treebo-orange rounded-2xl shadow-inner flex items-center justify-center">
                       <div className="w-6 h-6 border-2 border-white/20 rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth={false}>
      <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in zoom-in-95 duration-1000 py-20">
        <div className="text-center space-y-10">
          <div className="inline-flex items-center gap-4 bg-white p-2 rounded-full border border-slate-200 shadow-sm">
            <span className="px-6 py-2.5 rounded-full bg-treebo-brown text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">Strat-OS v3.4.1</span>
            <div className="h-6 w-px bg-slate-200"></div>
            <span className="px-6 py-2.5 rounded-full bg-treebo-orange/10 text-treebo-orange text-[10px] font-black uppercase tracking-[0.4em]">Proprietary Decision Layer</span>
          </div>
          <h2 className="text-8xl md:text-9xl font-black text-treebo-brown tracking-tighter leading-[0.85] flex flex-col items-center">
            COMMERCIAL
            <span className="text-treebo-orange block">AUDit & STRATegy</span>
          </h2>
          <p className="text-slate-500 text-2xl max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
            High-fidelity strategic research for Treebo portfolio onboarding. Real-time OTA channel mapping, demand cluster auditing, and competitive ADR indexing.
          </p>
        </div>

        <div className="bg-white rounded-[5rem] shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-slate-200/50">
          <div className="p-16 md:p-24 space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[11px] font-black text-treebo-brown uppercase tracking-[0.4em]">Target Asset Identity</label>
                  {fieldErrors.hotelName && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Min 3 Chars required</span>}
                </div>
                <input type="text" className={`w-full px-10 py-8 rounded-[2.5rem] border-4 transition-all text-treebo-brown font-black text-2xl bg-slate-50 focus:ring-0 placeholder:text-slate-300 ${fieldErrors.hotelName ? 'border-red-200 bg-red-50 focus:border-red-500' : 'border-slate-50 focus:border-treebo-orange'}`} placeholder="e.g. Treebo Trend Sapphire" value={hotelName} onChange={(e) => { setHotelName(e.target.value); if (fieldErrors.hotelName) setFieldErrors(prev => ({ ...prev, hotelName: false })); }} />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[11px] font-black text-treebo-brown uppercase tracking-[0.4em]">Micro-Market / City</label>
                  {fieldErrors.city && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Required field</span>}
                </div>
                <input type="text" className={`w-full px-10 py-8 rounded-[2.5rem] border-4 transition-all text-treebo-brown font-black text-2xl bg-slate-50 focus:ring-0 placeholder:text-slate-300 ${fieldErrors.city ? 'border-red-200 bg-red-50 focus:border-red-500' : 'border-slate-50 focus:border-treebo-orange'}`} placeholder="e.g. Bangalore" value={city} onChange={(e) => { setCity(e.target.value); if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: false })); }} />
              </div>
            </div>

            <div className="space-y-8">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] block text-center">Strategic Audit Mode Selection</label>
              <div className="flex flex-wrap justify-center gap-8">
                {(['New Onboarding', 'Existing Hotel Health Report'] as EvaluationType[]).map((type) => (
                  <button key={type} onClick={() => setReportType(type)} className={`px-12 py-7 rounded-[3rem] text-sm font-black uppercase tracking-[0.25em] border-4 transition-all transform active:scale-95 ${reportType === type ? 'border-treebo-brown bg-treebo-brown text-white shadow-2xl scale-110' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}>{type}</button>
                ))}
              </div>
            </div>
            
            <div className="pt-8">
              <button disabled={loading || !hotelName.trim() || !city.trim()} onClick={handleEvaluate} className={`w-full py-10 rounded-[4rem] font-black text-3xl text-white transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-8 shadow-2xl tracking-tighter ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-treebo-orange hover:bg-treebo-brown shadow-orange-200/60'}`}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Synthesizing Strategy Matrix...
                  </>
                ) : (
                  <>INITIATE FULL AUDIT</>
                )}
              </button>
              {error && (
                <div className="mt-12 text-red-600 bg-red-50 p-12 rounded-[3rem] text-sm text-center font-black uppercase tracking-[0.2em] border-2 border-red-100 flex flex-col items-center justify-center gap-6 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                  </div>
                  <button onClick={handleEvaluate} className="px-10 py-3 bg-red-600 text-white rounded-[2rem] hover:bg-red-700 transition-all shadow-xl font-black uppercase text-[10px] tracking-widest">Re-Execute Protocol</button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-treebo-brown px-16 py-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.6em]">Enterprise Strategic Intelligence Active</p>
            <div className="flex gap-8 items-center">
              <span className="w-4 h-4 rounded-full bg-treebo-orange animate-ping shadow-[0_0_15px_rgba(188,77,46,0.8)]"></span>
              <span className="text-[11px] text-white font-black uppercase tracking-widest">Decision Engine: Gemini 3 Flash Optima</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
