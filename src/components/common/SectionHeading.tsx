import React from 'react';
import { cn } from '../../utils/cn';

export interface SectionHeadingProps {
  tag?: string;
  tagNumber?: string;
  title: string;
  highlight?: string;
  editorialSubtitle?: string;
  subtitle?: string;
  center?: boolean;
  light?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  tag,
  tagNumber,
  title,
  highlight,
  editorialSubtitle,
  subtitle,
  center = false,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'mb-8 sm:mb-12',
        center
          ? 'text-center max-w-3xl mx-auto'
          : 'flex flex-col md:flex-row md:items-end md:justify-between gap-6',
        className
      )}
    >
      <div className={center ? 'w-full' : 'max-w-3xl'}>
        {(tag || tagNumber) && (
          <div className="inline-flex items-center gap-2 mb-3 text-xs tracking-wider uppercase font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            {tagNumber && <span className="opacity-70">{tagNumber} //</span>}
            <span>{tag}</span>
          </div>
        )}

        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-slate-900">
          {title}{' '}
          {highlight && (
            <span className="text-[#2563EB]">
              {highlight}
            </span>
          )}
          {editorialSubtitle && (
            <span className="block font-sans font-normal normal-case tracking-normal text-slate-500 text-lg sm:text-xl mt-1.5">
              {editorialSubtitle}
            </span>
          )}
        </h2>

        {subtitle && (
          <p className="mt-3 text-sm sm:text-base leading-relaxed max-w-2xl text-slate-600 font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="flex-shrink-0 pt-2 md:pt-0">{action}</div>}
    </div>
  );
};

export default SectionHeading;
