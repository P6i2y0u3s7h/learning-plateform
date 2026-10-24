import { Suspense } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar';
import { Search, LogOut } from 'lucide-react';
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
    <div className="flex h-screen h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 relative overflow-hidden">
      {/* Fixed-width, full-height independent sidebar */}
      <DashboardSidebar role={role} user={currentUser} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Fixed/Sticky Top Header */}
        <header className="bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0 sticky top-0 z-20 shadow-xs">
          <div className="flex-1 max-w-sm pl-10 lg:pl-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search curriculum, tests, notes..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition font-sans"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Indicator Badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-sans text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>{role} Portal</span>
            </span>

            {/* Notifications Dropdown */}
            <NotificationDropdown />

            {/* User Profile Avatar Link */}
            <Link
              to={profileLink}
              className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white font-sans font-bold text-xs flex-shrink-0 cursor-pointer shadow-xs transition-colors"
              title={`${role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student'} Profile`}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </Link>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Independently Scrollable Main Content */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden transform-gpu will-change-scroll overscroll-contain bg-[#F8FAFC]">
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
