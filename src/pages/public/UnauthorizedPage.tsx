import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { getDashboardRoute } from '../../firebase/rtdb';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const UnauthorizedPage: React.FC = () => {
  useDocumentTitle('403 — Unauthorized Access');
  const { userProfile, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const dashboardRoute = getDashboardRoute(role);
  const attemptedPath = (location.state as any)?.attemptedPath;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-[#07080D] scrub-grid-bg text-white">
      <div className="relative max-w-md w-full bg-[#0E121A]/90 p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl text-center backdrop-blur-xl">
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full inline-block mb-3">
          Error 403 — Access Denied
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Unauthorized Access
        </h1>

        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          Your account is verified as a <span className="font-bold text-[#CCFF00] uppercase font-mono">{role}</span> in Firebase Realtime Database, which does not have permission to view {attemptedPath ? <code className="text-white bg-black/40 px-1 py-0.5 rounded text-xs">{attemptedPath}</code> : 'this restricted area'}.
        </p>

        {/* User Card */}
        {userProfile && (
          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-left mb-6 text-xs space-y-1">
            <p className="font-bold text-white">{userProfile.displayName || 'Authenticated User'}</p>
            <p className="text-gray-400 font-mono text-[11px] truncate">{userProfile.email}</p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">Verified Role:</span>
              <span className="bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                {role}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            to={dashboardRoute}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black text-sm font-bold shadow-[0_0_20px_rgba(204,255,0,0.3)] transition cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to My Dashboard</span>
          </Link>

          <Link
            to={ROUTES.HOME}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-medium transition cursor-pointer"
          >
            <Home className="w-4 h-4 text-gray-400" />
            <span>Return to Homepage</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account / Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
