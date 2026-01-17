
import React from 'react';
import { ScorecardEntry } from '../types';

interface Props {
  data: ScorecardEntry[];
}

const ScoreCard: React.FC<Props> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600 bg-green-50';
    if (score >= 5) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const safeData = data || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">Commercial Parameter Scorecard</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-3 w-1/3">Parameter</th>
              <th className="px-6 py-3 w-16">Score</th>
              <th className="px-6 py-3">Key Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {safeData.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-sm italic">
                  No scorecard parameters were generated.
                </td>
              </tr>
            ) : (
              safeData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{item.parameter}</td>
                  <td className="px-6 py-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${getScoreColor(item.score)}`}>
                      {item.score?.toFixed(1) || '0.0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 leading-relaxed">{item.reason}</td>
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
