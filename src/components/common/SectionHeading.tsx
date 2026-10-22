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
        'mb-10 sm:mb-14',
        center
          ? 'text-center max-w-3xl mx-auto'
          : 'flex flex-col md:flex-row md:items-end md:justify-between gap-6',
        className
      )}
    >
      <div className={center ? 'w-full' : 'max-w-3xl'}>
        {(tag || tagNumber) && (
          <div className="inline-flex items-center gap-2 mb-3.5 font-mono text-[11px] tracking-[0.22em] uppercase font-semibold text-[#CCFF00] bg-[#CCFF00]/10 px-3 py-1 rounded-full border border-[#CCFF00]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
            {tagNumber && <span className="opacity-75">{tagNumber} //</span>}
            <span>{tag}</span>
          </div>
        )}

        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] uppercase text-white">
          {title}{' '}
          {highlight && (
            <span className="text-[#CCFF00]">
              {highlight}
            </span>
          )}
          {editorialSubtitle && (
            <span className="block font-editorial font-normal italic normal-case tracking-normal text-slate-400 text-xl sm:text-2xl md:text-3xl mt-1.5">
              {editorialSubtitle}
            </span>
          )}
        </h2>

        {subtitle && (
          <p className="mt-4 text-sm sm:text-base leading-relaxed max-w-2xl text-slate-400 font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="flex-shrink-0 pt-2 md:pt-0">{action}</div>}
    </div>
  );
};

export default SectionHeading;
