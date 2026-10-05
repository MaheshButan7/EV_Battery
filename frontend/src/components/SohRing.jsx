import React from 'react';

export default function SohRing({ soh = 92 }) {
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (soh / 100) * circumference;

  let healthStatus = 'Excellent';
  let gradientFrom = '#10b981';
  let gradientTo = '#06b6d4';
  let textColor = 'text-emerald-500 dark:text-emerald-400';

  if (soh < 80) {
    healthStatus = 'Attention Needed';
    gradientFrom = '#f43f5e';
    gradientTo = '#fb7185';
    textColor = 'text-rose-500 dark:text-rose-400';
  } else if (soh < 90) {
    healthStatus = 'Good Condition';
    gradientFrom = '#f59e0b';
    gradientTo = '#fbbf24';
    textColor = 'text-amber-500 dark:text-amber-400';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="sohGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
          {/* Background Ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="url(#sohGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {soh}%
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
            State of Health
          </span>
        </div>
      </div>

      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <span className={`w-2 h-2 rounded-full ${soh < 80 ? 'bg-rose-500' : soh < 90 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        <span className={textColor}>{healthStatus}</span>
      </div>
    </div>
  );
}
