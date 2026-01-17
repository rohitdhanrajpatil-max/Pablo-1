
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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <button onClick={handleReset} className="inline-flex items-center text-slate-500 hover:text-treebo-brown font-black text-xs uppercase tracking-widest gap-2 group transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
              Research New Asset
            </button>
            <div className="flex items-center gap-3">
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${isHealthReport ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-treebo-orange/5 text-treebo-orange border-treebo-orange/20'}`}>
                 {result.executiveSummary.evaluationType}
               </span>
               <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div ref={reportRef} className="pdf-export-container space-y-10 bg-transparent">
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden relative avoid-page-break shadow-sm">
              <div className={`h-2 w-full ${isHealthReport ? 'bg-teal-500' : 'bg-treebo-orange'}`}></div>
              <div className="p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-4 lg:col-span-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commercial Audit Report</p>
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black text-treebo-brown leading-none tracking-tighter mb-2">{result.executiveSummary.hotelName}</h2>
                      <div className="flex items-center gap-1.5 text-treebo-orange uppercase font-black text-xs tracking-widest">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {result.executiveSummary.city}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy Verdict</p>
                    <div className="pt-1"><DecisionBadge decision={result.executiveSummary.finalDecision} /></div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commercial Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-6xl font-black tracking-tighter ${result.executiveSummary.averageScore >= 7 ? 'text-green-600' : result.executiveSummary.averageScore >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                        {result.executiveSummary.averageScore.toFixed(1)}
                      </span>
                      <span className="text-slate-300 text-2xl font-black">/10</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Controls</p>
                    <div className="flex flex-wrap gap-2 no-print">
                        <button 
                          onClick={handleShare}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-treebo-brown transition-all group shadow-sm"
                        >
                          {shareFeedback ? 'URL COPIED' : 'SHARE STRATEGY'}
                        </button>
                        <button 
                          onClick={handleExportPDF}
                          disabled={exporting}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-treebo-orange/10 border border-treebo-orange/20 text-[10px] font-black text-treebo-orange uppercase tracking-widest hover:bg-treebo-orange hover:text-white transition-all group shadow-sm"
                        >
                          {exporting ? 'GENERATING...' : 'EXPORT PDF'}
                        </button>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-2">
                      Ref: {Math.random().toString(36).substring(7).toUpperCase()} / {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-6 avoid-page-break">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                OTA Performance Audit
                <div className="h-px bg-slate-200 flex-grow"></div>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {(sortedOtaAudit || []).map((audit, idx) => (
                  <OTAAuditCard key={idx} audit={audit} />
                ))}
              </div>
            </section>

            {result.roomTypeAudit && result.roomTypeAudit.length > 0 && (
              <section className="space-y-6 page-break-before">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                  Room Type Detailed Audit
                  <div className="h-px bg-slate-200 flex-grow"></div>
                </h3>
                <RoomTypeAuditSection rooms={result.roomTypeAudit} />
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 avoid-page-break">
                {result.treeboPresence && (
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                      Treebo Network Synergy
                      <div className="h-px bg-slate-200 flex-grow"></div>
                    </h3>
                    <TreeboPresenceSection presence={result.treeboPresence} />
                  </section>
                )}
                
                <section className="space-y-4 avoid-page-break">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                    Validation Protocols
                    <div className="h-px bg-slate-200 flex-grow"></div>
                  </h3>
                  <ProtocolStatusCard status={result.protocolStatus} />
                </section>
            </div>

            {result.competitors && result.competitors.length > 0 && (
              <section className="space-y-8 page-break-before">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4 flex-grow">
                    Micro-Market Competition & Benchmarking
                    <div className="h-px bg-slate-200 flex-grow"></div>
                  </h3>
                  <div className="flex items-center gap-3 no-print overflow-x-auto pb-2 sm:pb-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Filter Category:</span>
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                      {availableCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8 md:p-12 avoid-page-break shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                      <div>
                        <h4 className="text-treebo-brown font-black uppercase text-xs tracking-widest">Benchmarking Data Visualization</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Head-to-Head Comparison</p>
                      </div>
                      <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl no-print">
                        <button onClick={() => setComparisonMetric('rating')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${comparisonMetric === 'rating' ? 'bg-treebo-brown text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>OTA Rating</button>
                        <button onClick={() => setComparisonMetric('adr')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${comparisonMetric === 'adr' ? 'bg-treebo-orange text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Est. ADR</button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {(chartData || []).map((data, idx) => {
                        const val = comparisonMetric === 'rating' ? data.rating : data.adr;
                        const percentage = (val / maxVal) * 100;
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between px-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${data.isTarget ? 'text-treebo-orange' : 'text-slate-500'}`}>{data.name}</span>
                              <span className="text-xs font-black text-treebo-brown">{comparisonMetric === 'adr' ? `${result.targetHotelMetrics?.adrCurrency || 'INR'} ${val}` : `${val}/5`}</span>
                            </div>
                            <div className="h-6 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ease-out ${data.isTarget ? (comparisonMetric === 'adr' ? 'bg-treebo-orange' : 'bg-treebo-brown') : 'bg-slate-200'}`} style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {chartData.length <= 1 && (
                        <div className="py-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-200 rounded-2xl">
                          No competitors found in this category.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-200 overflow-hidden avoid-page-break shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h4 className="text-treebo-brown font-black uppercase text-[10px] tracking-widest">Competitive Mapping</h4>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{filteredCompetitors.length} ASSETS</span>
                    </div>
                    <div className="divide-y divide-slate-50 overflow-y-auto max-h-[600px]">
                      {filteredCompetitors.length > 0 ? filteredCompetitors.map((comp, idx) => (
                        <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black text-treebo-brown uppercase tracking-tight">{comp.name}</p>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{comp.distance}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">{comp.category}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-black text-slate-700">{comp.otaRating}</span>
                                  <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                             </div>
                             <span className="text-xs font-black text-treebo-orange">{comp.estimatedADR}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                          No matching competitors.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 avoid-page-break">
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm">
                    <h4 className="text-treebo-brown font-black uppercase text-xs tracking-widest mb-8 flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-treebo-brown rounded-full"></div> 
                       Market Demand Drivers
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(result.topCorporates || []).map((corp, i) => (
                        <li key={i} className="flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-black text-slate-700 hover:bg-white hover:shadow-md transition-all">
                          <span className="w-6 h-6 flex items-center justify-center bg-white rounded text-[10px] font-black text-treebo-brown border border-slate-200">{i+1}</span>
                          {corp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-sm">
                    <h4 className="text-treebo-orange font-black uppercase text-xs tracking-widest mb-8 flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-treebo-orange rounded-full"></div> 
                       Regional Partnership Hub
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(result.topTravelAgents || []).map((agent, i) => (
                        <li key={i} className="flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-black text-slate-700 hover:bg-white hover:shadow-md transition-all">
                          <span className="w-6 h-6 flex items-center justify-center bg-white rounded text-[10px] font-black text-treebo-orange border border-slate-200">{i+1}</span>
                          {agent}
                        </li>
                      ))}
                    </ul>
                  </div>
            </div>

            {result.guestReviews && (
                <section className="avoid-page-break space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                    Guest Sentiment & Quality Index
                    <div className="h-px bg-slate-200 flex-grow"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(result.guestReviews || []).map((rev, i) => (
                      <div key={i} className="bg-slate-900 text-white rounded-[2.5rem] p-10 space-y-8 border border-white/5 hover:bg-slate-800 transition-colors shadow-2xl relative overflow-hidden group">
                        {/* Sentiment Score indicator */}
                        <div className="absolute top-0 right-0 p-8">
                          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-sm tracking-tighter ${rev.sentimentScore >= 70 ? 'border-green-500 text-green-400' : rev.sentimentScore >= 40 ? 'border-amber-500 text-amber-400' : 'border-red-500 text-red-400'}`}>
                            {rev.sentimentScore}%
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-treebo-orange uppercase tracking-[0.4em] border-b border-white/10 pb-4">{rev.platform}</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest pt-2">Algorithmic Sentiment Score</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 
                                  Key Satisfiers
                                </p>
                                <div className="space-y-3">
                                  {(rev.positive || []).map((p, j) => (
                                    <p key={j} className="text-xs font-bold text-white/70 leading-snug flex gap-2">
                                      <span className="text-green-500/50">•</span> {p}
                                    </p>
                                  ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                  Friction Points
                                </p>
                                <div className="space-y-3">
                                  {(rev.negative || []).map((n, j) => (
                                    <p key={j} className="text-xs font-bold text-white/70 leading-snug flex gap-2">
                                      <span className="text-red-500/50">•</span> {n}
                                    </p>
                                  ))}
                                </div>
                            </div>
                        </div>

                        {/* Recurring Themes */}
                        {rev.recurringThemes && rev.recurringThemes.length > 0 && (
                          <div className="pt-8 border-t border-white/10">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Recurring Themes Identification</p>
                            <div className="flex flex-wrap gap-2">
                              {rev.recurringThemes.map((theme, idx) => (
                                <span key={idx} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${theme.impact === 'positive' ? 'bg-green-500/10 border-green-500/30 text-green-400' : theme.impact === 'negative' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-white/60'}`}>
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

            <section className="page-break-before space-y-12 pb-20">
              <div className="avoid-page-break">
                <ScoreCard data={result.scorecard || []} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 avoid-page-break">
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-10 space-y-8 shadow-sm">
                  <h4 className="text-treebo-brown font-black uppercase text-xs tracking-widest flex items-center gap-4">
                    <span className="w-2 h-8 bg-red-600 rounded-full"></span> Priority Risk Mitigation Audit
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {(result.keyRisks || []).map((risk, i) => (
                      <div key={i} className="text-xs font-black text-slate-700 leading-relaxed flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                        <span className="text-red-600 font-black">!!</span> {risk}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-1 bg-treebo-brown text-white rounded-[2.5rem] p-10 flex flex-col justify-center border-l-[16px] border-treebo-orange shadow-2xl">
                  <h4 className="text-white/40 font-black text-[10px] uppercase tracking-[0.4em] mb-6">Leadership Final Verdict</h4>
                  <p className="text-white font-black text-xl italic leading-snug tracking-tight">"{result.finalRecommendation}"</p>
                  <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Strategic Asset Evaluation</span>
                    <div className="w-8 h-8 bg-treebo-orange rounded-lg shadow-inner"></div>
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
      <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in zoom-in-95 duration-700 py-16">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-3">
            <span className="px-5 py-2 rounded-full bg-treebo-brown text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">Strategy Nexus 3.4.1</span>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="px-5 py-2 rounded-full bg-treebo-orange/10 text-treebo-orange text-[10px] font-black uppercase tracking-[0.3em]">Resilient Channel Active</span>
          </div>
          <h2 className="text-7xl font-black text-treebo-brown tracking-tighter leading-[0.9] flex flex-col items-center">
            COMMERCIAL ASSET
            <span className="text-treebo-orange block">RESEARCH & AUDIT</span>
          </h2>
          <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            High-fidelity micro-market analysis for Treebo onboarding decisions. Auditing OTA channel blockers, demand drivers, and competitive ADR indexing in real-time.
          </p>
        </div>

        <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-slate-200/50">
          <div className="p-12 md:p-16 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-treebo-brown uppercase tracking-[0.3em]">Asset Identity</label>
                  {fieldErrors.hotelName && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">Minimum 3 characters required</span>}
                </div>
                <input type="text" className={`w-full px-8 py-6 rounded-[2rem] border-4 transition-all text-treebo-brown font-black text-xl bg-slate-50 focus:ring-0 placeholder:text-slate-300 ${fieldErrors.hotelName ? 'border-red-200 bg-red-50 focus:border-red-500' : 'border-slate-50 focus:border-treebo-orange'}`} placeholder="e.g. Treebo Trend Sapphire" value={hotelName} onChange={(e) => { setHotelName(e.target.value); if (fieldErrors.hotelName) setFieldErrors(prev => ({ ...prev, hotelName: false })); }} />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-treebo-brown uppercase tracking-[0.3em]">Primary Location</label>
                  {fieldErrors.city && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">Required</span>}
                </div>
                <input type="text" className={`w-full px-8 py-6 rounded-[2rem] border-4 transition-all text-treebo-brown font-black text-xl bg-slate-50 focus:ring-0 placeholder:text-slate-300 ${fieldErrors.city ? 'border-red-200 bg-red-50 focus:border-red-500' : 'border-slate-50 focus:border-treebo-orange'}`} placeholder="e.g. Gurgaon" value={city} onChange={(e) => { setCity(e.target.value); if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: false })); }} />
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block text-center">Audit Mode Selection</label>
              <div className="flex flex-wrap justify-center gap-6">
                {(['New Onboarding', 'Existing Hotel Health Report'] as EvaluationType[]).map((type) => (
                  <button key={type} onClick={() => setReportType(type)} className={`px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] border-4 transition-all transform active:scale-95 ${reportType === type ? 'border-treebo-brown bg-treebo-brown text-white shadow-2xl scale-110' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}>{type}</button>
                ))}
              </div>
            </div>
            
            <div className="pt-6">
              <button disabled={loading || !hotelName.trim() || !city.trim()} onClick={handleEvaluate} className={`w-full py-8 rounded-[3rem] font-black text-2xl text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-6 shadow-2xl tracking-tighter ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-treebo-orange hover:bg-treebo-brown shadow-orange-200/50'}`}>
                {loading ? (
                  <>
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Executing Strategic Research...
                  </>
                ) : (
                  <>GENERATE AUDIT REPORT</>
                )}
              </button>
              {error && (
                <div className="mt-8 text-red-600 bg-red-50 p-8 rounded-[2rem] text-xs text-center font-black uppercase tracking-widest border border-red-100 flex flex-col items-center justify-center gap-4 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                  </div>
                  <button onClick={handleEvaluate} className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">Retry Search</button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-treebo-brown px-12 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em]">Enterprise Strategic Intelligence Layer Active</p>
            <div className="flex gap-6 items-center">
              <span className="w-3 h-3 rounded-full bg-treebo-orange animate-ping"></span>
              <span className="text-[10px] text-white font-black uppercase tracking-widest">Model: Gemini 3 Flash Optima</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;
