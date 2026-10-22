import React from 'react';

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-[50vh] w-full flex flex-col items-center justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Loading module...
      </p>
    </div>
  );
};

export default RouteLoadingFallback;
