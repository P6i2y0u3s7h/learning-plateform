import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  UserPlus,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function RegisterPage() {
  useDocumentTitle('Student Registration — Brainstorm Academy');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentClass: 'Class 10',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const classOrExamOptions = [
    { value: 'Class 6', label: 'Class 6 (NCERT Foundation)' },
    { value: 'Class 7', label: 'Class 7 (NCERT Foundation)' },
    { value: 'Class 8', label: 'Class 8 (NCERT Foundation)' },
    { value: 'Class 9', label: 'Class 9 (NCERT / Entrance Prep)' },
    { value: 'Class 10', label: 'Class 10 (Board Exam Focus)' },
    { value: 'Class 11', label: 'Class 11 (Science / Commerce)' },
    { value: 'Class 12', label: 'Class 12 (Board & Entrances)' },
    { value: 'BPSC TRE', label: 'BPSC TRE (Teacher Recruitment)' },
    { value: 'UP Super TET', label: 'UP Super TET' },
    { value: 'BSSC', label: 'BSSC (CGL & Inter Level)' },
    { value: 'Bihar SI', label: 'Bihar SI (Daroga Exam)' },
    { value: 'AMU Entrance', label: 'AMU Entrance (Class 6/9/11/Diploma)' },
    { value: 'Jamia Entrance', label: 'Jamia Entrance (Class 6/9/11)' },
  ];

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please provide a valid email format';
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must agree to the Terms of Service';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await registerStudent({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        classOrExamPreference: formData.studentClass,
        phone: formData.phone.trim(),
      });
      navigate(ROUTES.STUDENT.ROOT, { replace: true });
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please review your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-14 px-4 sm:px-6 lg:px-8 bg-[#070E1A] scrub-grid-bg relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(36,87,167,0.15),transparent_70%)] pointer-events-none" />

      <div className="max-w-xl w-full space-y-6 bg-[#0A1324] border border-white/10 p-8 sm:p-10 rounded-xs shadow-2xl relative z-10 text-white">
        {/* Top Architectural Metadata Strip */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase">
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>ENROLLMENT PORTAL</span>
          </div>
          <span>SESSION 2026-27</span>
        </div>

        {/* Brand Header */}
        <div className="text-left pt-2">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-9 h-9 rounded-xs bg-[#17365D] border border-white/15 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#F4B942]" />
            </div>
            <span className="font-display font-black text-white text-base tracking-wider uppercase">
              BRAINSTORM ACADEMY.
            </span>
          </Link>

          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-tight">
            CREATE STUDENT ACCOUNT.
            <span className="block font-editorial font-normal italic lowercase tracking-normal text-slate-400 text-xl mt-1">
              begin your structured academic journey.
            </span>
          </h2>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xs text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-300 uppercase tracking-wider">Registration Error</p>
              <p className="font-sans text-slate-300 mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-mono text-[10px] text-slate-400 tracking-[0.16em] uppercase font-semibold">
              FULL NAME
            </label>
            <input
              id="register-input-fullname"
              type="text"
              value={formData.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-3.5 py-2.5 bg-[#060C17] border border-white/15 focus:border-amber-400 rounded-xs text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
              required
              autoComplete="name"
            />
            {errors.fullName && (
              <p className="font-mono text-[11px] text-rose-400 mt-1">{errors.fullName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] text-slate-400 tracking-[0.16em] uppercase font-semibold">
                EMAIL ADDRESS
              </label>
              <input
                id="register-input-email"
                type="email"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-[#060C17] border border-white/15 focus:border-amber-400 rounded-xs text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
                required
                autoComplete="email"
              />
              {errors.email && (
                <p className="font-mono text-[11px] text-rose-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] text-slate-400 tracking-[0.16em] uppercase font-semibold">
                MOBILE NUMBER
              </label>
              <input
                id="register-input-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="10-digit number"
                className="w-full px-3.5 py-2.5 bg-[#060C17] border border-white/15 focus:border-amber-400 rounded-xs text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="font-mono text-[11px] text-rose-400 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[10px] text-slate-400 tracking-[0.16em] uppercase font-semibold">
              CLASS OR TARGET EXAM
            </label>
            <select
              id="register-select-class"
              value={formData.studentClass}
              onChange={(e) => update('studentClass', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#060C17] border border-white/15 focus:border-amber-400 rounded-xs text-xs sm:text-sm text-white outline-none transition-colors"
            >
              {classOrExamOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0A1324] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-mono text-[10px] text-slate-400 tracking-[0.16em] uppercase font-semibold">
                PASSWORD
              </label>
              <input
                id="register-input-password"
                type="password"
                value={formData.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#060C17] border border-white/15 focus:border-amber-400 rounded-xs text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                required
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="font-mono text-[11px] text-rose-400 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] text-slate-400 tracking-[0.16em] uppercase font-semibold">
                CONFIRM PASSWORD
              </label>
              <input
                id="register-input-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#060C17] border border-white/15 focus:border-amber-400 rounded-xs text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                required
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="font-mono text-[11px] text-rose-400 mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
            <input
              id="agreeTerms"
              type="checkbox"
              checked={formData.agreeTerms}
              onChange={(e) => update('agreeTerms', e.target.checked)}
              className="rounded-xs border-white/20 text-[#2457A7] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="text-slate-400 cursor-pointer">
              I agree to the Terms of Service & Privacy Policy
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="font-mono text-[11px] text-rose-400">{errors.agreeTerms}</p>
          )}

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xs bg-[#F4B942] hover:bg-amber-400 text-[#070E1A] font-mono text-xs font-bold uppercase tracking-[0.16em] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>
              {loading ? 'REGISTERING...' : 'CREATE STUDENT ACCOUNT'}
            </span>
          </button>
        </form>

        {/* Existing account link */}
        <div className="pt-2 text-center font-mono text-[11px] text-slate-400 tracking-wider">
          ALREADY ENROLLED?{' '}
          <Link to={ROUTES.LOGIN} className="font-bold text-amber-400 hover:underline uppercase">
            Sign In here →
          </Link>
        </div>
      </div>
    </div>
  );
}
