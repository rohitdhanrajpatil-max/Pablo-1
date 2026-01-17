
import React from 'react';
import { ScorecardEntry } from '../types';

interface Props {
  data: ScorecardEntry[];
}

const ScoreCard: React.FC<Props> = ({ data }) => {
  const getScoreStyle = (score: number) => {
    if (score >= 7) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 5) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const safeData = data || [];

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-treebo-brown tracking-tighter uppercase">Commercial Parameter Index</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">Weighted Strategic Audit</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Optimal</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-amber-500"></div>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Monitor</span>
           </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-50">
              <th className="px-8 py-4 w-1/4">Parameter</th>
              <th className="px-8 py-4 w-24 text-center">Score</th>
              <th className="px-8 py-4">Contextual Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {safeData.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-12 text-center">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] italic">No data nodes recovered.</p>
                </td>
              </tr>
            ) : (
              safeData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] font-black text-slate-300 tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                       <span className="text-xs font-black text-treebo-brown uppercase tracking-tight group-hover:text-treebo-orange transition-colors">{item.parameter}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border shadow-sm transition-transform group-hover:scale-105 ${getScoreStyle(item.score)}`}>
                        {item.score?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xl group-hover:text-slate-900 transition-colors">
                      {item.reason}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoreCard;
