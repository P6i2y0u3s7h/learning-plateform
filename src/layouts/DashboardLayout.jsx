import { Suspense } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar';
import { Search, LogOut, ShieldCheck } from 'lucide-react';
import NotificationDropdown from '../components/notification/NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import DashboardContentLoadingFallback from '../components/common/DashboardContentLoadingFallback';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, userProfile, role, logout } = useAuth();

  const currentUser = {
    name: userProfile?.displayName || authUser?.displayName || 'User',
    email: authUser?.email || userProfile?.email || 'user@example.com',
  };

  // Role-aware profile link — each role stays in their own portal
  const profileLink =
    role === 'admin'
      ? '/dashboard/admin/settings'
      : role === 'teacher'
      ? '/dashboard/teacher/settings'
      : '/dashboard/student/profile';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="flex min-h-screen bg-[#07080D] text-slate-100 scrub-grid-bg relative overflow-x-hidden">
      <DashboardSidebar role={role} user={currentUser} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Scrub-inspired Architectural Dashboard Top Bar */}
        <header className="bg-[#090D16]/95 backdrop-blur-xl text-white border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-lg">
          <div className="flex-1 max-w-sm pl-10 lg:pl-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search curriculum, tests, notes..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#060C17] border border-white/15 focus:border-[#CCFF00] rounded-xl text-white placeholder-slate-500 outline-none transition font-sans"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Architectural Role Indicator */}
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
              <span>{role} ACTIVE</span>
            </span>

            {/* Interactive Notifications Dropdown */}
            <NotificationDropdown />

            {/* User Profile Avatar Link */}
            <Link
              to={profileLink}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#CCFF00] to-emerald-400 border border-[#CCFF00]/40 flex items-center justify-center text-black font-mono font-black text-xs flex-shrink-0 cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.25)] hover:scale-105 transition-all"
              title={`${role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student'} Profile`}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </Link>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content with Hardware Accelerated Scrolling */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden transform-gpu will-change-scroll">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
            <Suspense fallback={<DashboardContentLoadingFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
