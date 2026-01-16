
import React from 'react';
import { EvaluationDecision } from '../types';

interface Props {
  decision: EvaluationDecision | string;
}

const DecisionBadge: React.FC<Props> = ({ decision }) => {
  let colors = "bg-slate-100 text-slate-800";
  
  if (decision.includes('Approve') || decision.includes('Continue')) {
    colors = "bg-green-100 text-green-800 border-green-200";
  } else if (decision.includes('Conditional') || decision.includes('Improve')) {
    colors = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (decision.includes('Reject') || decision.includes('Exit')) {
    colors = "bg-red-100 text-red-800 border-red-200";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors}`}>
      {decision}
    </span>
  );
};

export default DecisionBadge;
