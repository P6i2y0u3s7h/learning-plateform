import React from 'react';
import { ShieldAlert, AlertTriangle, RefreshCw, LogOut, Lock, UserX, Loader2 } from 'lucide-react';
import type { RoleVerificationStatus } from '../../firebase/rtdb';

export interface AuthLoadingScreenProps {
  status: RoleVerificationStatus;
  error?: string | null;
  onRetry?: () => void;
  onLogout?: () => void;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  status,
  error,
  onRetry,
  onLogout,
}) => {
  // 1. Verifying / Loading State
  if (status === 'idle' || status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080D] scrub-grid-bg text-white px-4">
        <div className="relative max-w-md w-full bg-[#0E121A]/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl text-center shadow-2xl overflow-hidden">
          {/* Subtle neon glow backdrops */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Spinner with Cyber Badge */}
          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#CCFF00]/20 animate-ping" />
            <div className="w-16 h-16 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/40 flex items-center justify-center text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.2)]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-3 py-1 rounded-full inline-block mb-3">
            Realtime DB Role Verification
          </span>

          <h2 className="text-xl font-bold text-white tracking-tight mb-2">
            Verifying Credentials
          </h2>

          <p className="text-sm text-gray-400 leading-relaxed">
            Securing session and authenticating user role from Firebase Realtime Database...
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-gray-500">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span>Zero-Trust Authorization Active</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Disabled Account State (Case F)
  if (status === 'disabled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080D] scrub-grid-bg text-white px-4">
        <div className="relative max-w-md w-full bg-[#0E121A]/95 border border-red-500/30 rounded-3xl p-8 backdrop-blur-xl text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
            <UserX className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full inline-block mb-3">
            Account Status: Disabled
          </span>

          <h2 className="text-2xl font-bold text-white mb-2">Account Suspended</h2>

          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Your account has been deactivated by an administrator. Access to dashboards and platform resources is restricted.
          </p>

          <div className="space-y-3">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold transition"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Missing Role Record State (Case D)
  if (status === 'missing_record') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080D] scrub-grid-bg text-white px-4">
        <div className="relative max-w-md w-full bg-[#0E121A]/95 border border-amber-500/30 rounded-3xl p-8 backdrop-blur-xl text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-block mb-3">
            Profile Provisioning Needed
          </span>

          <h2 className="text-2xl font-bold text-white mb-2">Role Record Not Found</h2>

          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Authentication succeeded, but no role record was found in Firebase Realtime Database for your account. Privileged access cannot be granted without a verified profile.
          </p>

          <div className="space-y-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black text-sm font-bold shadow-[0_0_20px_rgba(204,255,0,0.3)] transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Verification</span>
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Invalid Role State (Case E)
  if (status === 'invalid_role') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080D] scrub-grid-bg text-white px-4">
        <div className="relative max-w-md w-full bg-[#0E121A]/95 border border-red-500/30 rounded-3xl p-8 backdrop-blur-xl text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full inline-block mb-3">
            Invalid Role Configuration
          </span>

          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>

          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            The database role assigned to your account is not recognized. Valid roles are: <code className="text-[#CCFF00]">admin</code>, <code className="text-[#CCFF00]">teacher</code>, or <code className="text-[#CCFF00]">student</code>.
          </p>

          <div className="space-y-3">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 5. Database Connection / Network Error State (Case G)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07080D] scrub-grid-bg text-white px-4">
      <div className="relative max-w-md w-full bg-[#0E121A]/95 border border-amber-500/30 rounded-3xl p-8 backdrop-blur-xl text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-block mb-3">
          Database Unavailable
        </span>

        <h2 className="text-2xl font-bold text-white mb-2">Connection Problem</h2>

        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          {error || 'Unable to reach Firebase Realtime Database to verify account roles. Please check your internet connection or try again.'}
        </p>

        <div className="space-y-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black text-sm font-bold shadow-[0_0_20px_rgba(204,255,0,0.3)] transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Verification</span>
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
