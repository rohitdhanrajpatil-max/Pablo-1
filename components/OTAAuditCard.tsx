
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
      case OTAStatus.PASS: return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getPlatformBranding = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('treebo.com') || n.includes('treebo')) {
      return { 
        name: 'treebo.com', 
        accent: 'border-treebo-orange', 
        iconColor: 'text-white bg-treebo-orange',
        icon: 'TH'
      };
    }
    if (n.includes('makemytrip') || n.includes('mmt')) {
      return { 
        name: 'MakeMyTrip', 
        accent: 'border-pink-500', 
        iconColor: 'text-white bg-pink-600',
        icon: 'MT'
      };
    }
    if (n.includes('booking.com') || n.includes('booking')) {
      return { 
        name: 'Booking.com', 
        accent: 'border-blue-700', 
        iconColor: 'text-white bg-blue-800',
        icon: 'B.'
      };
    }
    if (n.includes('agoda')) {
      return { 
        name: 'Agoda', 
        accent: 'border-blue-400', 
        iconColor: 'text-white bg-blue-500',
        icon: 'Ag'
      };
    }
    if (n.includes('goibibo')) {
      return { 
        name: 'Goibibo', 
        accent: 'border-orange-500', 
        iconColor: 'text-white bg-orange-600',
        icon: 'go'
      };
    }
    if (n.includes('google')) {
      return { 
        name: 'Google Maps', 
        accent: 'border-emerald-500', 
        iconColor: 'text-white bg-emerald-600',
        icon: 'G'
      };
    }
    return { name: name || 'Platform', accent: 'border-slate-300', iconColor: 'text-slate-400 bg-slate-100', icon: '?' };
  };

  const branding = getPlatformBranding(audit.platform);
  const blockers = audit.channelBlockers || [];
  const recovery = audit.recoveryPlan || [];

  return (
    <div className={`bg-white rounded-3xl border ${branding.accent} shadow-lg shadow-slate-200/50 p-6 flex flex-col h-full hover:shadow-xl transition-all duration-300`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${branding.iconColor} shadow-sm`}>
            {branding.icon}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none">{branding.name}</h4>
            {audit.currentRating && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 tabular-nums">{audit.currentRating}</span>
                <svg className="w-2.5 h-2.5 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              </div>
            )}
          </div>
        </div>
        <div className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getStatusStyle(audit.status)}`}>
          {audit.status}
        </div>
      </div>

      <div className="space-y-6 flex-grow">
        <div className="space-y-2">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Integrity Issues</p>
          <ul className="space-y-1.5">
            {blockers.length > 0 ? blockers.map((blocker, i) => (
              <li key={i} className="flex gap-2 text-[10px] font-bold text-slate-600 leading-tight">
                <span className="text-red-500">•</span>
                {blocker}
              </li>
            )) : (
              <li className="text-[9px] text-slate-300 font-bold uppercase italic">Clear</li>
            )}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-50 space-y-2">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recovery Directive</p>
          <ul className="space-y-1.5">
            {recovery.length > 0 ? recovery.map((step, i) => (
              <li key={i} className="flex gap-2 text-[10px] font-black text-treebo-brown leading-tight italic">
                <span className="text-treebo-orange">↳</span>
                {step}
              </li>
            )) : (
              <li className="text-[9px] text-emerald-600 font-bold uppercase italic">Verified</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OTAAuditCard;
