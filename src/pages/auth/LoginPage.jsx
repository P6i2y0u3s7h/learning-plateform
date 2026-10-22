import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, LogIn, AlertCircle, ArrowRight, Briefcase, ShieldCheck, UserCheck } from 'lucide-react';
import { FormField, PasswordField } from '../../components/FormFields';
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
    <div className="min-h-[85vh] flex items-center justify-center py-14 px-4 sm:px-6 lg:px-8 bg-[#07080D] scrub-grid-bg relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#CCFF00]/10 blur-[130px] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 bg-[#0E121A] border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 text-white">
        {/* Top Architectural Metadata Strip */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase">
          <div className="flex items-center gap-1.5 text-[#CCFF00]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
            <span>
              {activePortal === 'admin'
                ? 'ADMINISTRATOR CONSOLE'
                : activePortal === 'teacher'
                ? 'FACULTY PORTAL'
                : 'STUDENT PORTAL'}
            </span>
          </div>
          <span className="text-emerald-400">● SECURE ENGINE</span>
        </div>

        {/* Portal Switcher Tabs: Student vs Teacher vs Admin */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActivePortal('student');
              setEmail('');
              setPassword('');
              setAuthError('');
              setErrors({});
            }}
            className={`py-2 px-2 rounded-xl font-mono text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activePortal === 'student'
                ? 'bg-white text-black font-black shadow-md'
                : 'text-slate-400 hover:text-white'
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
            className={`py-2 px-2 rounded-xl font-mono text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activePortal === 'teacher'
                ? 'bg-[#10B981] text-black font-black shadow-md'
                : 'text-slate-400 hover:text-white'
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
            className={`py-2 px-2 rounded-xl font-mono text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activePortal === 'admin'
                ? 'bg-[#CCFF00] text-black font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-left pt-1">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              {activePortal === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-[#CCFF00]" />
              ) : activePortal === 'teacher' ? (
                <Briefcase className="w-5 h-5 text-emerald-400" />
              ) : (
                <GraduationCap className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="font-display font-black text-white text-base tracking-wider uppercase">
              BRAINSTORM ACADEMY.
            </span>
          </Link>

          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-tight">
            {activePortal === 'admin'
              ? 'ADMIN CONTROL SIGN IN.'
              : activePortal === 'teacher'
              ? 'TEACHER SIGN IN.'
              : 'STUDENT SIGN IN.'}
            <span className="block font-editorial font-normal italic lowercase tracking-normal text-slate-400 text-xl mt-1">
              {activePortal === 'admin'
                ? 'manage users, courses, reports & platform settings'
                : activePortal === 'teacher'
                ? 'access curriculum, student batches & testing'
                : 'access courses, CBT mock tests & analytics'}
            </span>
          </h2>
        </div>

        {/* Error Banner */}
        {authError && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-300 uppercase tracking-wider">Authentication Error</p>
              <p className="font-sans text-slate-300 mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-mono text-[10px] text-slate-400 tracking-[0.16em] uppercase font-semibold">
              {activePortal === 'admin'
                ? 'ADMINISTRATOR EMAIL'
                : activePortal === 'teacher'
                ? 'FACULTY EMAIL ADDRESS'
                : 'STUDENT EMAIL ADDRESS'}
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
              className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-[#CCFF00] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
              required
              autoComplete="email"
            />
            {errors.email && (
              <p className="font-mono text-[11px] text-rose-400 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-[10px] text-slate-400 tracking-[0.16em] uppercase font-semibold">
                PASSWORD
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="font-mono text-[10px] text-[#CCFF00] hover:underline uppercase tracking-wider"
              >
                Forgot?
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
              className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-[#CCFF00] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
              required
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="font-mono text-[11px] text-rose-400 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-full text-black font-mono text-xs font-black uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 shadow-lg ${
              activePortal === 'admin'
                ? 'bg-[#CCFF00] hover:bg-white shadow-[0_0_20px_rgba(204,255,0,0.35)]'
                : activePortal === 'teacher'
                ? 'bg-[#10B981] hover:bg-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                : 'bg-white hover:bg-[#CCFF00] shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>
              {loading
                ? 'AUTHENTICATING...'
                : `SIGN IN AS ${activePortal.toUpperCase()}`}
            </span>
          </button>
        </form>

        {/* Footer Link - Only Students can create accounts publicly. Teacher & Admin accounts are created centrally */}
        {activePortal === 'student' ? (
          <div className="pt-2 text-center font-mono text-[11px] text-slate-400 tracking-wider">
            NEW TO ACADEMY?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="font-bold text-[#CCFF00] hover:underline uppercase"
            >
              Create an Account →
            </Link>
          </div>
        ) : (
          <div className="pt-2 text-center font-mono text-[10px] text-slate-500 uppercase tracking-wider">
            RESTRICTED ACCESS &bull; FACULTY & ADMIN ACCOUNTS ARE PROVISIONED BY ADMINISTRATORS
          </div>
        )}
      </div>
    </div>
  );
}
