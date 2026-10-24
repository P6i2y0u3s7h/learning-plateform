import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, LogIn, AlertCircle, ArrowRight, Briefcase, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
import { fetchUserRoleRecord, getDashboardRoute } from '../../firebase/rtdb';
import { ROUTES } from '../../constants/routes';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function LoginPage() {
  useDocumentTitle('Sign In — Brainstorm Academy');
  const [activePortal, setActivePortal] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnPath = location.state?.from?.pathname;

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please provide a valid email format';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * Navigate strictly using the RTDB verified role.
   * Never rely on activePortal tab selection or client form input.
   */
  const redirectUserByRole = (verifiedRole) => {
    const normalizedRole = String(verifiedRole || 'student').trim().toLowerCase();
    const targetDashboard = getDashboardRoute(normalizedRole);

    if (returnPath) {
      const isTeacherPath = returnPath.startsWith('/dashboard/teacher') || returnPath.startsWith('/teacher');
      const isStudentPath = returnPath.startsWith('/dashboard/student') || returnPath.startsWith('/student');
      const isAdminPath = returnPath.startsWith('/dashboard/admin') || returnPath.startsWith('/admin');

      if (normalizedRole === 'admin') {
        navigate(returnPath, { replace: true });
        return;
      }
      if (normalizedRole === 'teacher' && (isTeacherPath || isStudentPath)) {
        navigate(returnPath, { replace: true });
        return;
      }
      if (normalizedRole === 'student' && isStudentPath) {
        navigate(returnPath, { replace: true });
        return;
      }
    }

    navigate(targetDashboard, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);

      // Verify the role directly from Firebase Realtime Database
      const currentAuthUser = auth?.currentUser;
      if (!currentAuthUser) {
        throw new Error('Authentication succeeded but session could not be established.');
      }

      const rtdbResult = await fetchUserRoleRecord(currentAuthUser.uid);
      if (!rtdbResult.verified || !rtdbResult.record) {
        if (rtdbResult.status === 'disabled') {
          throw new Error('Your account is currently deactivated. Please contact an administrator.');
        } else if (rtdbResult.status === 'missing') {
          throw new Error('No role record found for this account in Realtime Database. Please contact support.');
        } else if (rtdbResult.status === 'invalid_role') {
          throw new Error('Invalid account role assigned. Access denied.');
        } else {
          throw new Error(rtdbResult.error || 'Failed to verify account permissions from Realtime Database.');
        }
      }

      redirectUserByRole(rtdbResult.record.role);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] relative">
      <div className="max-w-md w-full space-y-6 bg-white border border-slate-200 p-7 sm:p-9 rounded-2xl shadow-sm relative z-10 text-slate-900">
        
        {/* Top Status Strip */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-1.5 text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>
              {activePortal === 'admin'
                ? 'Administrator Portal'
                : activePortal === 'teacher'
                ? 'Faculty Portal'
                : 'Student Portal'}
            </span>
          </div>
          <span className="text-emerald-600 font-medium">Secure Login</span>
        </div>

        {/* Portal Switcher Tabs: Student vs Teacher vs Admin */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActivePortal('student');
              setEmail('');
              setPassword('');
              setAuthError('');
              setErrors({});
            }}
            className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activePortal === 'student'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('teacher');
              setEmail('');
              setPassword('');
              setAuthError('');
              setErrors({});
            }}
            className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activePortal === 'teacher'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('admin');
              setEmail('');
              setPassword('');
              setAuthError('');
              setErrors({});
            }}
            className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activePortal === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-left pt-1">
          <h2 className="font-display font-bold text-2xl text-slate-900 tracking-tight leading-tight">
            {activePortal === 'admin'
              ? 'Administrator Sign In'
              : activePortal === 'teacher'
              ? 'Teacher Sign In'
              : 'Student Sign In'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activePortal === 'admin'
              ? 'Manage users, courses, reports & platform settings'
              : activePortal === 'teacher'
              ? 'Access curriculum, student batches & testing'
              : 'Access your courses, mock tests & learning analytics'}
          </p>
        </div>

        {/* Error Banner */}
        {authError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Authentication Error</p>
              <p className="mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {activePortal === 'admin'
                ? 'Administrator Email'
                : activePortal === 'teacher'
                ? 'Faculty Email Address'
                : 'Student Email Address'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder={
                activePortal === 'admin'
                  ? 'admin@example.com'
                  : activePortal === 'teacher'
                  ? 'teacher@example.com'
                  : 'student@example.com'
              }
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
              required
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors"
              required
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 shadow-sm ${
              activePortal === 'admin'
                ? 'bg-slate-900 hover:bg-slate-800'
                : activePortal === 'teacher'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>
              {loading
                ? 'Authenticating...'
                : `Sign In as ${activePortal.charAt(0).toUpperCase() + activePortal.slice(1)}`}
            </span>
          </button>
        </form>

        {/* Footer Link */}
        {activePortal === 'student' ? (
          <div className="pt-2 text-center text-xs text-slate-500">
            New to Brainstorm Academy?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="font-semibold text-blue-600 hover:underline"
            >
              Create Student Account →
            </Link>
          </div>
        ) : (
          <div className="pt-2 text-center text-[11px] text-slate-500">
            Restricted Portal • Faculty & Admin accounts are managed by administrators.
          </div>
        )}
      </div>
    </div>
  );
}
