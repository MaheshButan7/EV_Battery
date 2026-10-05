import React from 'react';
import { getStatusStyle, getRiskStyle } from '../utils/formatters';

export function StatusBadge({ status }) {
  const { badge, dot, label } = getStatusStyle(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function RiskBadge({ risk }) {
  const { badge, dot, label } = getRiskStyle(risk);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label} Risk
    </span>
  );
}
