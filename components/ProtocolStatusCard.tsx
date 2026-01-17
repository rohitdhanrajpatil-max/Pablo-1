
import React from 'react';
import { ProtocolStatus, OTAStatus } from '../types';

interface Props {
  status: ProtocolStatus;
}

const ProtocolStatusCard: React.FC<Props> = ({ status }) => {
  const renderItem = (label: string, value: any) => {
    // Normalize value to handle potential AI inconsistencies
    const normalizedValue = (value || '').toString().toUpperCase().trim();
    
    let iconColor = "text-green-500 bg-green-50";
    let statusTextColor = "text-teal-600";
    let displayValue = normalizedValue || 'PENDING';
    
    let icon = (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    );

    if (normalizedValue === 'FAIL') {
      iconColor = "text-red-500 bg-red-50";
      statusTextColor = "text-red-600";
      icon = (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    } else if (normalizedValue === 'WARNING') {
      iconColor = "text-amber-500 bg-amber-50";
      statusTextColor = "text-amber-600";
      icon = (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    } else if (normalizedValue !== 'PASS') {
      // Handle cases where AI returns something else
      iconColor = "text-slate-400 bg-slate-50";
      statusTextColor = "text-slate-500";
      displayValue = normalizedValue || 'NOT AUDITED';
      icon = <span className="text-[10px] font-bold">?</span>;
    }

    return (
      <div className="flex items-center justify-between py-4 group transition-colors hover:bg-slate-50/50 rounded-xl px-2 -mx-2">
        <div className="flex items-center gap-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor} border border-current/10 shadow-sm transition-transform group-hover:scale-110`}>
            {icon}
          </div>
          <span className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">{label}</span>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border border-current/10 ${statusTextColor}`}>
          {displayValue}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10 h-full flex flex-col">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Audit Protocols</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Integrity Verification</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 flex-grow">
        {renderItem("Duplication Audit", status.duplicationAudit)}
        {renderItem("Geo-Verification", status.geoVerification)}
        {renderItem("Compliance Audit", status.complianceAudit)}
      </div>

      {status.notes && (
        <div className="mt-8 pt-6 border-t border-slate-50">
          <div className="flex gap-3">
             <div className="w-1 h-auto bg-slate-200 rounded-full"></div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
               <span className="text-treebo-orange mr-1">Note:</span> {status.notes}
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolStatusCard;
