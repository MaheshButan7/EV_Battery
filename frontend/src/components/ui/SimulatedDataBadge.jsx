import React from 'react';
import { Radio } from 'lucide-react';

export default function SimulatedDataBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 ${className}`}
      title="This client demo uses synthetic data and simulated workflows."
    >
      <Radio className="h-3 w-3" aria-hidden="true" />
      Simulated data
    </span>
  );
}
