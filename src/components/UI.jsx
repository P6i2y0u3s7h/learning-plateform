import { Link } from 'react-router-dom';

// ============================================================
// Button Component (EduCore Theme)
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
  const base = 'inline-flex items-center justify-center gap-2 font-sans font-medium text-xs rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none cursor-pointer disabled:opacity-60 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus-visible:ring-[#2563EB] shadow-xs active:scale-[0.98]',
    navy: 'bg-[#1E3A8A] text-white hover:bg-[#1E40AF] focus-visible:ring-[#1E3A8A] shadow-xs active:scale-[0.98]',
    gold: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500 active:scale-[0.98]',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-[#2563EB] active:scale-[0.98]',
    outlineWhite: 'border border-white/60 text-white bg-transparent hover:bg-white/10 focus-visible:ring-white active:scale-[0.98]',
    ghost: 'text-slate-600 bg-transparent hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-xs active:scale-[0.98]',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 shadow-xs active:scale-[0.98]',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-[11px]',
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs font-semibold',
    lg: 'px-6 py-2.5 text-sm font-semibold',
    xl: 'px-8 py-3 text-base font-semibold',
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
// Badge Component (EduCore Theme)
// ============================================================
export function Badge({ children, color = '#2563EB', bg, className = '' }) {
  const isDefaultBlue = color === '#2563EB' || color === '#CCFF00';
  const finalColor = isDefaultBlue ? '#1E40AF' : color;
  const finalBg = bg || (isDefaultBlue ? '#EFF6FF' : `${color}18`);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide border border-blue-200/60 ${className}`}
      style={{ backgroundColor: finalBg, color: finalColor }}
    >
      {children}
    </span>
  );
}

// ============================================================
// Section Heading Component (EduCore Theme)
// ============================================================
export function SectionHeading({ tag, title, subtitle, center = false }) {
  return (
    <div className={`mb-8 ${center ? 'text-center' : ''}`}>
      {tag && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold tracking-wide uppercase bg-blue-50 border border-blue-200 text-blue-700 mb-3">
          {tag}
        </span>
      )}
      <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-slate-900 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-2 text-sm sm:text-base font-sans max-w-2xl ${center ? 'mx-auto' : ''} text-slate-600`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Empty State Component (EduCore Theme)
// ============================================================
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
      {Icon && (
        <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4 text-[#2563EB]">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-xs sm:text-sm max-w-sm mb-5 leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}

// ============================================================
// Loading Skeleton Component (EduCore Theme)
// ============================================================
export function Skeleton({ className = '' }) {
  return <div className={`bg-slate-200 animate-pulse rounded-lg ${className}`} />;
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
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
// Stat Card Component (EduCore Theme)
// ============================================================
export function StatCard({ icon: Icon, label, value, sub, color = '#2563EB', bgColor = '', className = '' }) {
  const isPrimary = color === '#2563EB' || color === '#CCFF00';
  const finalColor = isPrimary ? '#2563EB' : color;
  const finalBg = bgColor || (isPrimary ? '#EFF6FF' : `${color}14`);

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-start gap-4 hover:border-blue-200 hover:shadow-md transition-all ${className}`}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: finalBg }}>
        {Icon && <Icon className="w-6 h-6" style={{ color: finalColor }} />}
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 font-sans text-xs uppercase font-medium tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold font-display text-slate-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 font-sans mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Progress Bar Component (EduCore Theme)
// ============================================================
export function ProgressBar({ value = 0, color = '#2563EB', height = 8, showLabel = false, className = '' }) {
  const barColor = color === '#CCFF00' ? '#2563EB' : color;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs font-sans text-slate-600 mb-1">
          <span className="font-medium">Progress</span>
          <span className="text-[#2563EB] font-bold">{value}%</span>
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Alert / Info Box Component (EduCore Theme)
// ============================================================
export function InfoBox({ type = 'info', children, className = '' }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900 font-sans',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 font-sans',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900 font-sans',
    error: 'bg-red-50 border-red-200 text-red-900 font-sans',
  };
  return (
    <div className={`p-4 rounded-xl border text-xs sm:text-sm ${styles[type] || styles.info} ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// Divider
// ============================================================
export function Divider({ className = '' }) {
  return <hr className={`border-t border-slate-200 ${className}`} />;
}

// ============================================================
// Avatar (EduCore Theme)
// ============================================================
export function Avatar({ name = '', size = 'md', src, className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]} ${className}`} />;
  }
  return (
    <div className={`rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center flex-shrink-0 ${sizes[size]} ${className}`}>
      {initials || '?'}
    </div>
  );
}
