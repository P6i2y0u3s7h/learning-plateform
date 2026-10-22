import { Link } from 'react-router-dom';

// ============================================================
// Button Component
// ============================================================
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  as: Tag = 'button',
  to,
  href,
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer disabled:opacity-60 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-[#CCFF00] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] focus-visible:ring-[#CCFF00] shadow-sm active:scale-[0.98]',
    navy: 'bg-[#0E121A] text-white border border-white/15 hover:border-white/30 hover:bg-white/5 active:scale-[0.98]',
    gold: 'bg-amber-400 text-black hover:bg-amber-300 active:scale-[0.98]',
    outline: 'border border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-[#CCFF00]/40 focus-visible:ring-[#CCFF00] active:scale-[0.98]',
    outlineWhite: 'border border-white/30 text-white bg-transparent hover:bg-white/10 focus-visible:ring-white active:scale-[0.98]',
    ghost: 'text-slate-300 bg-transparent hover:bg-white/10 hover:text-white active:scale-[0.98]',
    danger: 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white active:scale-[0.98]',
    success: 'bg-emerald-500 text-black hover:bg-emerald-400 active:scale-[0.98]',
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-[11px]',
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-xs',
    lg: 'px-7 py-3 text-sm',
    xl: 'px-8 py-3.5 text-base',
  };

  const cls = `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  if (to) {
    return <Link to={to} className={cls} {...rest}>{loading ? <Spinner /> : children}</Link>;
  }
  if (href) {
    return <a href={href} className={cls} {...rest}>{loading ? <Spinner /> : children}</a>;
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} onClick={onClick} {...rest}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ============================================================
// Badge Component
// ============================================================
export function Badge({ children, color = '#CCFF00', bg, className = '' }) {
  const bgColor = bg || `${color}18`;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border border-current/30 ${className}`}
      style={{ backgroundColor: bgColor, color }}
    >
      {children}
    </span>
  );
}

// ============================================================
// Section Heading Component
// ============================================================
export function SectionHeading({ tag, title, subtitle, center = false, light = true }) {
  return (
    <div className={`mb-8 ${center ? 'text-center' : ''}`}>
      {tag && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] mb-3">
          {tag}
        </span>
      )}
      <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-2 text-sm sm:text-base font-mono max-w-2xl ${center ? 'mx-auto' : ''} text-slate-400`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Empty State Component
// ============================================================
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#CCFF00]" />
        </div>
      )}
      <h3 className="text-lg font-bold font-mono text-white mb-2">{title}</h3>
      {description && <p className="text-slate-400 font-mono text-xs max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ============================================================
// Loading Skeleton Component
// ============================================================
export function Skeleton({ className = '' }) {
  return <div className={`bg-white/10 animate-pulse rounded-lg ${className}`} />;
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/10">
      <Skeleton className="h-4 w-20 mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-5" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// ============================================================
// Stat Card Component
// ============================================================
export function StatCard({ icon: Icon, label, value, sub, color = '#CCFF00', bgColor = '', className = '' }) {
  const bg = bgColor || `${color}18`;
  return (
    <div className={`bg-[#0E121A]/85 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/10 flex items-start gap-4 hover:border-white/20 transition-all ${className}`}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
        {Icon && <Icon className="w-6 h-6" style={{ color }} />}
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 font-mono text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold font-mono text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 font-mono mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Progress Bar Component
// ============================================================
export function ProgressBar({ value = 0, color = '#CCFF00', height = 8, showLabel = false, className = '' }) {
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
          <span>PROGRESS</span>
          <span className="text-[#CCFF00] font-bold">{value}%</span>
        </div>
      )}
      <div className="w-full bg-white/10 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(204,255,0,0.4)]"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Alert / Info Box Component
// ============================================================
export function InfoBox({ type = 'info', children, className = '' }) {
  const styles = {
    info: 'bg-sky-500/10 border-sky-500/20 text-sky-300 font-mono',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300 font-mono',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 font-mono',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-300 font-mono',
  };
  return (
    <div className={`p-4 rounded-xl border text-xs ${styles[type] || styles.info} ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// Divider
// ============================================================
export function Divider({ className = '' }) {
  return <hr className={`border-t border-white/10 ${className}`} />;
}

// ============================================================
// Avatar
// ============================================================
export function Avatar({ name = '', size = 'md', src, className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]} ${className}`} />;
  }
  return (
    <div className={`rounded-full bg-[#2457A7] text-white font-bold flex items-center justify-center flex-shrink-0 ${sizes[size]} ${className}`}>
      {initials || '?'}
    </div>
  );
}
