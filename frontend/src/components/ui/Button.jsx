import React from 'react';

const variants = {
  primary: 'bg-cyan-600 text-white shadow-sm hover:bg-cyan-700 focus-visible:ring-cyan-500/40',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300',
  subtle: 'bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500/40',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500/40',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
};

const sizes = {
  sm: 'min-h-8 px-2.5 text-[11px]',
  md: 'min-h-9 px-3.5 text-xs',
  lg: 'min-h-10 px-4 text-sm',
};

export default function Button({ variant = 'secondary', size = 'md', icon: Icon, children, className = '', as: Component = 'button', ...props }) {
  return (
    <Component
      {...(Component === 'button' ? { type: 'button' } : {})}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </Component>
  );
}
