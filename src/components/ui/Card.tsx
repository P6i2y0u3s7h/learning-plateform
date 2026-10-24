import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  bordered?: boolean;
  dark?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverEffect = false,
  bordered = true,
  dark = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-300',
        dark
          ? 'bg-[#1E3A8A] text-white border border-blue-900'
          : 'bg-white text-slate-900',
        bordered && !dark ? 'border border-slate-200 shadow-xs' : '',
        hoverEffect && !dark && 'hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md',
        hoverEffect && dark && 'hover:border-blue-400 hover:shadow-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-6 pb-3 border-b border-slate-100', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn(
        'text-base sm:text-lg font-bold text-[#0A1324] font-display uppercase tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className, children, ...props }) => {
  return (
    <p className={cn('text-xs text-slate-500 mt-1 font-sans', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-6 pt-4 font-sans', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'p-6 pt-3 border-t border-slate-100 flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
