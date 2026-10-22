import React from 'react';
import { Skeleton } from '../ui/Loading';

export const DashboardContentLoadingFallback: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0E121A]/85 border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="space-y-3">
          <Skeleton className="h-5 w-48 rounded-full bg-white/5" />
          <Skeleton className="h-8 w-80 rounded-xl bg-white/10" />
          <Skeleton className="h-4 w-96 rounded-lg bg-white/5" />
        </div>
      </div>

      {/* Control Bar Skeleton */}
      <div className="h-16 rounded-2xl bg-[#0E121A]/85 border border-white/10 p-4 flex items-center justify-between">
        <Skeleton className="h-9 w-64 rounded-xl bg-white/5" />
        <Skeleton className="h-8 w-24 rounded-xl bg-white/5" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-3xl bg-[#0E121A]/85 border border-white/10 p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-none">
            <div className="space-y-2 flex-1 max-w-md">
              <Skeleton className="h-4 w-3/4 rounded bg-white/5" />
              <Skeleton className="h-3 w-1/2 rounded bg-white/5" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
            <Skeleton className="h-8 w-16 rounded-xl bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardContentLoadingFallback;
