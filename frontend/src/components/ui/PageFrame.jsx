import React from 'react';
import SimulatedDataBadge from './SimulatedDataBadge';

export default function PageFrame({ title, description, actions, children, className = '' }) {
  return (
    <div className={`mx-auto max-w-[1600px] space-y-7 p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="flex flex-col justify-between gap-5 border-b border-slate-200/80 pb-5 md:flex-row md:items-end dark:border-slate-800/80">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">BESS COMMAND CENTER</p>
          <h1 className="text-[1.65rem] font-bold tracking-[-0.025em] text-slate-950 dark:text-white">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-[13px] leading-5 text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SimulatedDataBadge />
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}
