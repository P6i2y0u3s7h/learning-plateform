import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

// ============================================================
// Text Input
// ============================================================
export function FormField({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  icon: Icon,
  className = '',
  helpText,
  ...rest
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-[#060C17] border rounded-xl text-sm text-white placeholder-slate-500 font-mono transition
            focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30
            ${error ? 'border-red-500/80 bg-red-950/20 focus:border-red-400' : 'border-white/15'}`}
          {...rest}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 font-mono">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-xs text-slate-400 font-mono">{helpText}</p>
      )}
    </div>
  );
}

// ============================================================
// Password Field
// ============================================================
export function PasswordField({
  label = 'Password',
  id = 'password',
  value,
  onChange,
  error,
  placeholder = 'Enter your password',
  required = false,
  className = '',
  ...rest
}) {
  const [show, setShow] = useState(false);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full pl-4 pr-11 py-2.5 bg-[#060C17] border rounded-xl text-sm text-white placeholder-slate-500 font-mono transition
            focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30
            ${error ? 'border-red-500/80 bg-red-950/20 focus:border-red-400' : 'border-white/15'}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#CCFF00] transition-colors p-0.5 cursor-pointer"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 font-mono">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Select Field
// ============================================================
export function SelectField({ label, id, options = [], value, onChange, error, required = false, className = '', placeholder }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-2.5 bg-[#060C17] border rounded-xl text-sm text-white font-mono transition
          focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/30
          ${error ? 'border-red-500/80 bg-red-950/20' : 'border-white/15'}`}
      >
        {placeholder && <option value="" className="bg-[#0A0E17] text-slate-400">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt} className="bg-[#0A0E17] text-white">
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 font-mono">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Checkbox Field
// ============================================================
export function CheckboxField({ id, label, checked, onChange, className = '' }) {
  return (
    <label htmlFor={id} className={`flex items-start gap-2.5 cursor-pointer group ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 mt-0.5 rounded border-white/20 bg-[#060C17] text-[#CCFF00] focus:ring-[#CCFF00] accent-[#CCFF00] cursor-pointer"
      />
      <span className="text-sm font-mono text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}
