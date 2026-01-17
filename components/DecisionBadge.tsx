
import React from 'react';
import { EvaluationDecision } from '../types';

interface Props {
  decision: EvaluationDecision | string;
}

const DecisionBadge: React.FC<Props> = ({ decision }) => {
  let colors = "bg-slate-100 text-slate-800 border-slate-200";
  let icon = null;
  
  const d = decision.toString();

  if (d.includes('Approve') || d.includes('Continue')) {
    colors = "bg-emerald-500 text-white border-emerald-600 shadow-emerald-200/50";
    icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
  } else if (d.includes('Conditional') || d.includes('Improve')) {
    colors = "bg-amber-500 text-white border-amber-600 shadow-amber-200/50";
    icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
  } else if (d.includes('Reject') || d.includes('Exit')) {
    colors = "bg-red-600 text-white border-red-700 shadow-red-200/50";
    icon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;
  }

  return (
    <span className={`inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-sm font-black uppercase tracking-[0.2em] border-b-4 shadow-2xl transform hover:scale-105 transition-all duration-300 ${colors}`}>
      {icon}
      {decision}
    </span>
  );
};

export default DecisionBadge;
