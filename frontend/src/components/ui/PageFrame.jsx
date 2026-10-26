import React from 'react';

export default function PageFrame({ description, actions, children, className = '' }) {
  return (
    <div className={`mx-auto min-w-0 w-full max-w-[1800px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 2xl:px-10 ${className}`}>
      {(description || actions) && (
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-5">
          <div className="min-w-0 flex-1">
            {description && <p className="max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
