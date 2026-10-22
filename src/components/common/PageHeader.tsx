import React from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  center?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  title,
  description,
  center = false,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'mb-8 sm:mb-10',
        center ? 'text-center' : 'flex flex-col md:flex-row md:items-end md:justify-between gap-4',
        className
      )}
    >
      <div className={center ? 'max-w-2xl mx-auto' : ''}>
        {badge && (
          <span className="inline-flex items-center gap-1.5 bg-[#EEF3FB] text-[#2457A7] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2.5">
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172033] font-display tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm sm:text-base text-[#6B7280] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && !center && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};
