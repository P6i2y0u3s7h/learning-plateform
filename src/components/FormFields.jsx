import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

// ============================================================
// Text Input (EduCore Theme)
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
        <label htmlFor={id} className="block text-xs font-sans font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
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
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-sans transition-all
            focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20
            ${error ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 hover:border-slate-400'}`}
          {...rest}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 font-sans mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {helpText && !error && (
        <p className="text-xs text-slate-500 font-sans">{helpText}</p>
      )}
    </div>
  );
}

// ============================================================
// Password Field (EduCore Theme)
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
        <label htmlFor={id} className="block text-xs font-sans font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
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
          className={`w-full pl-4 pr-11 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-sans transition-all
            focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20
            ${error ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 hover:border-slate-400'}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 font-sans mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// ============================================================
// Select Field (EduCore Theme)
// ============================================================
export function SelectField({ label, id, options = [], value, onChange, error, required = false, className = '', placeholder }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-sans font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 font-sans transition-all
          focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20
          ${error ? 'border-red-400 bg-red-50/20' : 'border-slate-300 hover:border-slate-400'}`}
      >
        {placeholder && <option value="" className="text-slate-400">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt} className="text-slate-900">
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 font-sans mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// ============================================================
// Checkbox Field (EduCore Theme)
// ============================================================
export function CheckboxField({ id, label, checked, onChange, className = '' }) {
  return (
    <label htmlFor={id} className={`flex items-start gap-2.5 cursor-pointer group ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 mt-0.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-600 accent-blue-600 cursor-pointer"
      />
      <span className="text-xs sm:text-sm font-sans text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
  );
}
