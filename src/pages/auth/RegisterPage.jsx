import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  UserPlus,
  AlertCircle,
  CheckCircle2,
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
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] relative">
      <div className="max-w-xl w-full space-y-6 bg-white border border-slate-200 p-7 sm:p-10 rounded-2xl shadow-sm relative z-10 text-slate-900">
        
        {/* Top Status Strip */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Student Enrollment Portal</span>
          </div>
          <span>Session 2026–27</span>
        </div>

        {/* Brand Header */}
        <div className="text-left pt-1">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-tight">
            Create Student Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Begin your structured academic journey across school courses and competitive exams.
          </p>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Registration Error</p>
              <p className="mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Full Name *
            </label>
            <input
              id="register-input-fullname"
              type="text"
              value={formData.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
              required
              autoComplete="name"
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email Address *
              </label>
              <input
                id="register-input-email"
                type="email"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                required
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mobile Number
              </label>
              <input
                id="register-input-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="10-digit number"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Primary Academic Goal / Class
            </label>
            <select
              value={formData.studentClass}
              onChange={(e) => update('studentClass', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition-colors"
            >
              {classOrExamOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password *
              </label>
              <input
                id="register-input-password"
                type="password"
                value={formData.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                required
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Confirm Password *
              </label>
              <input
                id="register-input-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
                required
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) => update('agreeTerms', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs text-slate-600 leading-normal">
                I agree to the Terms of Service and Privacy Policy for Brainstorm Academy.
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-xs text-red-600 mt-1">{errors.agreeTerms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl text-white font-sans text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {loading ? 'Creating Student Account...' : 'Complete Student Registration'}
            </span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign In →
          </Link>
        </div>

      </div>
    </div>
  );
}
