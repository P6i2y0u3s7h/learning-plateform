import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { cn } from '../../utils/cn';

export type ButtonVariant =
  | 'primary'
  | 'navy'
  | 'gold'
  | 'outline'
  | 'outlineWhite'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export type ButtonAsButton = BaseButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined;
    href?: undefined;
  };

export type ButtonAsLink = BaseButtonProps &
  LinkProps & {
    to: string;
    href?: undefined;
  };

export type ButtonAsAnchor = BaseButtonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    to?: undefined;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#2457A7] text-white hover:bg-[#1E4A7A] border border-blue-400/20 focus-visible:ring-[#2457A7] shadow-sm hover:shadow-md active:scale-[0.99]',
  navy:
    'bg-[#0A1324] text-white hover:bg-[#17365D] border border-white/10 focus-visible:ring-[#17365D] shadow-sm hover:shadow-md active:scale-[0.99]',
  gold:
    'bg-[#F4B942] text-[#070E1A] font-bold hover:bg-amber-400 focus-visible:ring-[#F4B942] shadow-sm hover:shadow-md active:scale-[0.99]',
  outline:
    'border border-slate-300 text-slate-800 bg-white hover:border-[#17365D] hover:bg-slate-50 focus-visible:ring-[#2457A7] active:scale-[0.99]',
  outlineWhite:
    'border border-white/20 text-white bg-transparent hover:border-white/40 hover:bg-white/5 focus-visible:ring-white active:scale-[0.99]',
  ghost:
    'text-slate-700 bg-transparent hover:bg-slate-100 hover:text-slate-900 active:scale-[0.99]',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-sm active:scale-[0.99]',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600 shadow-sm active:scale-[0.99]',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[11px] font-mono tracking-wider uppercase rounded-xs',
  sm: 'px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase rounded-xs',
  md: 'px-5 py-2.5 text-xs font-mono tracking-wider uppercase rounded-xs font-bold',
  lg: 'px-7 py-3 text-xs sm:text-sm font-mono tracking-[0.14em] uppercase rounded-xs font-bold',
  xl: 'px-8 py-3.5 text-sm font-mono tracking-[0.16em] uppercase rounded-xs font-bold',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-mono transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const combinedClasses = cn(
    baseClasses,
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  const content = (
    <>
      {loading ? (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </>
  );

  if ('to' in props && props.to) {
    const { to, ...rest } = props as ButtonAsLink;
    return (
      <Link to={to} className={combinedClasses} {...rest}>
        {content}
      </Link>
    );
  }

  if ('href' in props && props.href) {
    const { href, ...rest } = props as ButtonAsAnchor;
    return (
      <a href={href} className={combinedClasses} {...rest}>
        {content}
      </a>
    );
  }

  const { type = 'button', ...buttonRest } = props as ButtonAsButton;
  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      {...buttonRest}
    >
      {content}
    </button>
  );
};

export default Button;
