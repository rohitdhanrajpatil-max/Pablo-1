
import React from 'react';
import { OTAAuditItem, OTAStatus } from '../types';

interface Props {
  audit: OTAAuditItem;
}

const OTAAuditCard: React.FC<Props> = ({ audit }) => {
  const getStatusStyle = (status: OTAStatus) => {
    switch (status) {
      case OTAStatus.FAIL: return 'bg-red-50 text-red-600 border-red-200';
      case OTAStatus.WARNING: return 'bg-amber-50 text-amber-600 border-amber-200';
      case OTAStatus.PASS: return 'bg-green-50 text-green-600 border-green-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getPlatformBranding = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('treebo.com') || n.includes('treebo')) {
      return { 
        name: 'treebo.com', 
        accent: 'border-t-treebo-orange', 
        iconColor: 'text-treebo-orange',
        icon: 'TH'
      };
    }
    if (n.includes('makemytrip') || n.includes('mmt')) {
      return { 
        name: 'MakeMyTrip', 
        accent: 'border-t-pink-500', 
        iconColor: 'text-pink-600',
        icon: 'MMT'
      };
    }
    if (n.includes('booking.com') || n.includes('booking')) {
      return { 
        name: 'Booking.com', 
        accent: 'border-t-blue-600', 
        iconColor: 'text-blue-700',
        icon: 'B.'
      };
    }
    if (n.includes('agoda')) {
      return { 
        name: 'Agoda', 
        accent: 'border-t-blue-400', 
        iconColor: 'text-blue-500',
        icon: 'Ag'
      };
    }
    if (n.includes('goibibo')) {
      return { 
        name: 'Goibibo', 
        accent: 'border-t-blue-400', 
        iconColor: 'text-blue-500',
        icon: 'go'
      };
    }
    if (n.includes('google')) {
      return { 
        name: 'Google Maps', 
        accent: 'border-t-green-500', 
        iconColor: 'text-green-600',
        icon: 'G'
      };
    }
    return { name: name || 'Platform', accent: 'border-t-slate-300', iconColor: 'text-slate-400', icon: '?' };
  };

  const branding = getPlatformBranding(audit.platform);
  const blockers = audit.channelBlockers || [];
  const recovery = audit.recoveryPlan || [];

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 border-t-4 ${branding.accent} shadow-sm p-6 flex flex-col h-full hover:shadow-lg transition-all transform hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-xs ${branding.iconColor} border border-slate-100 shadow-inner`}>
            {branding.icon}
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none">{branding.name}</h4>
            {audit.currentRating && (
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score:</span>
                <span className={`text-xs font-black px-1.5 py-0.5 rounded bg-slate-900 text-white`}>
                  {audit.currentRating}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full border text-[9px] font-black flex items-center gap-1.5 uppercase tracking-widest ${getStatusStyle(audit.status)}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${audit.status === OTAStatus.FAIL ? 'bg-red-500 animate-pulse' : audit.status === OTAStatus.WARNING ? 'bg-amber-500' : 'bg-green-500'}`}></span>
          {audit.status}
        </div>
      </div>

      <div className="space-y-6 flex-grow">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-orange-400 rounded-full"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Channel Blockers</p>
          </div>
          <ul className="space-y-2.5 ml-1">
            {blockers.length > 0 ? blockers.map((blocker, i) => (
              <li key={i} className="flex gap-2.5 text-xs font-bold text-slate-600 leading-snug">
                <span className="text-orange-500">•</span>
                {blocker}
              </li>
            )) : (
              <li className="text-[10px] text-slate-400 italic font-medium">No major blockers identified.</li>
            )}
          </ul>
        </div>

        <div className="pt-6 border-t border-slate-50 space-y-3 bg-slate-50/30 -mx-6 px-6 -mb-6 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-green-500 rounded-full"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recovery Strategy</p>
          </div>
          <ul className="space-y-2.5 ml-1">
            {recovery.length > 0 ? recovery.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-xs font-black text-treebo-brown italic leading-snug">
                <span className="text-treebo-orange">→</span>
                {step}
              </li>
            )) : (
              <li className="text-[10px] text-slate-400 italic font-medium">Strategy already optimized.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OTAAuditCard;
