import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import brandLogo from '../assets/brand-logo.jpg';
import {
  GraduationCap, LayoutDashboard, BookOpen, ClipboardList, BarChart3,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight, X, Menu,
  Users, UserCheck, BookMarked, Layers, PlayCircle, FileText,
  ClipboardCheck, HelpCircle, CreditCard, FileBarChart, ShieldCheck,
  MessageSquare, Calendar, Award, User,
} from 'lucide-react';

const STUDENT_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/student' },
  { label: 'My Profile', icon: User, path: '/dashboard/student/profile' },
  { label: 'My Courses', icon: BookOpen, path: '/dashboard/student/courses' },
  { label: 'Study Notes', icon: FileText, path: '/dashboard/student/materials' },
  { label: 'Upcoming Classes', icon: Calendar, path: '/dashboard/student/classes' },
  { label: 'Practice Tests', icon: ClipboardList, path: '/dashboard/student/tests' },
  { label: 'Assignments', icon: ClipboardCheck, path: '/dashboard/student/assignments' },
  { label: 'Test Results', icon: Award, path: '/dashboard/student/results' },
  { label: 'Progress Reports', icon: BarChart3, path: '/dashboard/student/progress' },
  { label: 'Notifications', icon: Bell, path: '/dashboard/student/notifications' },
  { label: 'Ask a Doubt', icon: HelpCircle, path: '/dashboard/student/doubts' },
  { label: 'Payment History', icon: CreditCard, path: '/dashboard/student/payments' },
  { label: 'Settings', icon: Settings, path: '/dashboard/student/settings' },
];

const TEACHER_NAV = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/teacher' },
  { label: 'Assigned Courses', icon: BookOpen, path: '/dashboard/teacher/courses' },
  { label: 'Study Materials', icon: FileText, path: '/dashboard/teacher/materials' },
  { label: 'Lessons', icon: PlayCircle, path: '/dashboard/teacher/lessons' },
  { label: 'Assignments', icon: ClipboardCheck, path: '/dashboard/teacher/assignments' },
  { label: 'Test Management', icon: ClipboardList, path: '/dashboard/teacher/tests' },
  { label: 'Student Doubts', icon: MessageSquare, path: '/dashboard/teacher/doubts' },
  { label: 'Performance', icon: BarChart3, path: '/dashboard/teacher/performance' },
  { label: 'Notifications', icon: Bell, path: '/dashboard/teacher/notifications' },
  { label: 'Settings', icon: Settings, path: '/dashboard/teacher/settings' },
];

const ADMIN_NAV = [
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/admin' },
  { label: 'Students', icon: Users, path: '/dashboard/admin/students' },
  { label: 'Teachers', icon: UserCheck, path: '/dashboard/admin/teachers' },
  { label: 'Administrators', icon: ShieldCheck, path: '/dashboard/admin/admins' },
  { label: 'Courses', icon: BookMarked, path: '/dashboard/admin/courses' },
  { label: 'Categories', icon: Layers, path: '/dashboard/admin/categories' },
  { label: 'Subjects', icon: BookOpen, path: '/dashboard/admin/subjects' },
  { label: 'Chapters', icon: Layers, path: '/dashboard/admin/chapters' },
  { label: 'Lessons', icon: PlayCircle, path: '/dashboard/admin/lessons' },
  { label: 'Study Materials', icon: FileText, path: '/dashboard/admin/materials' },
  { label: 'Tests', icon: ClipboardList, path: '/dashboard/admin/tests' },
  { label: 'Assignments', icon: ClipboardCheck, path: '/dashboard/admin/assignments' },
  { label: 'Enrollments', icon: GraduationCap, path: '/dashboard/admin/enrollments' },
  { label: 'Payments', icon: CreditCard, path: '/dashboard/admin/payments' },
  { label: 'Doubt Support', icon: HelpCircle, path: '/dashboard/admin/doubts' },
  { label: 'Announcements', icon: Bell, path: '/dashboard/admin/notifications' },
  { label: 'Reports', icon: FileBarChart, path: '/dashboard/admin/reports' },
  { label: 'Website Settings', icon: Settings, path: '/dashboard/admin/settings' },
  { label: 'Audit Logs', icon: ShieldCheck, path: '/dashboard/admin/audit-logs' },
];

const NAV_MAP = { student: STUDENT_NAV, teacher: TEACHER_NAV, admin: ADMIN_NAV };
const ROLE_LABEL = { student: 'Student Portal', teacher: 'Teacher Portal', admin: 'Admin Portal' };

// Direct route prefetchers for instant navigation
const TEACHER_ROUTE_PREFETCHERS = {
  '/dashboard/teacher': () => import('../pages/dashboard/teacher/TeacherOverview'),
  '/dashboard/teacher/courses': () => import('../pages/dashboard/teacher/TeacherCourses'),
  '/dashboard/teacher/materials': () => import('../pages/dashboard/teacher/TeacherMaterials'),
  '/dashboard/teacher/lessons': () => import('../pages/dashboard/teacher/TeacherLessons'),
  '/dashboard/teacher/assignments': () => import('../pages/dashboard/teacher/TeacherAssignments'),
  '/dashboard/teacher/tests': () => import('../pages/dashboard/teacher/TeacherTests'),
  '/dashboard/teacher/doubts': () => import('../pages/dashboard/teacher/TeacherDoubts'),
  '/dashboard/teacher/performance': () => import('../pages/dashboard/teacher/TeacherPerformance'),
  '/dashboard/teacher/notifications': () => import('../pages/dashboard/teacher/TeacherNotifications'),
  '/dashboard/teacher/settings': () => import('../pages/dashboard/teacher/TeacherSettings'),
};

const prefetchTeacherRoute = (path) => {
  if (TEACHER_ROUTE_PREFETCHERS[path]) {
    TEACHER_ROUTE_PREFETCHERS[path]().catch(() => {});
  }
};

export default function DashboardSidebar({ role = 'student', user = {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = NAV_MAP[role] || STUDENT_NAV;
  const roleLabel = ROLE_LABEL[role] || 'Portal';

  // Pre-warm teacher routes during browser idle time
  useEffect(() => {
    if (role === 'teacher') {
      const timer = setTimeout(() => {
        Object.values(TEACHER_ROUTE_PREFETCHERS).forEach((loader) => loader().catch(() => {}));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [role]);

  const renderContent = (isMobile = false) => (
    <div className={`flex flex-col h-full bg-white text-slate-800 border-r border-slate-200 ${!collapsed || isMobile ? 'w-64' : 'w-16'} transition-all duration-300 overflow-hidden shadow-xs`}>
      {/* 1. Header & User Profile section */}
      <div className="flex-shrink-0">
        {/* Brand Wordmark Header */}
        <div className="flex items-center gap-3 px-3.5 py-4 border-b border-slate-100">
          <Link to="/" className="flex-shrink-0 group" title="Brainstorm Academy">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 flex items-center justify-center border border-slate-200 shadow-xs">
              <img
                src={brandLogo}
                alt="Brainstorm Academy Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>

          {(!collapsed || isMobile) && (
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1 leading-tight">
                <span className="font-display font-bold text-slate-900 text-sm tracking-tight">
                  Brainstorm
                </span>
                <span className="font-display font-bold text-blue-600 text-sm tracking-tight">
                  Academy.
                </span>
              </div>
              <span className="font-sans text-[9px] text-slate-400 font-medium tracking-wide uppercase block mt-0.5">
                Learn Today. Lead Tomorrow.
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span className="text-[10px] text-blue-700 font-semibold uppercase">
                  {roleLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Info Strip */}
        {(!collapsed || isMobile) && (
          <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-sans text-xs font-bold shadow-xs">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate font-sans">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Navigation Directory */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5 overscroll-contain sidebar-scrollbar">
        {(!collapsed || isMobile) && (
          <div className="px-3 pb-2 pt-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>
        )}
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard/student' || item.path === '/dashboard/teacher' || item.path === '/dashboard/admin'}
              onClick={() => isMobile && setMobileOpen(false)}
              onMouseEnter={() => prefetchTeacherRoute(item.path)}
              onFocus={() => prefetchTeacherRoute(item.path)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent'
                }`
              }
              title={collapsed && !isMobile ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {(!collapsed || isMobile) && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* 3. Collapse Toggle Footer */}
      {!isMobile && (
        <div className="flex-shrink-0 p-3 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer uppercase tracking-wider"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px]">Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Toggle Header */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white text-slate-800 border border-slate-200 shadow-md cursor-pointer"
          aria-label="Toggle Dashboard Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-y-0 left-0 w-72 h-full z-50 animate-in slide-in-from-left duration-200 shadow-2xl">
            {renderContent(true)}
          </div>
          <div className="w-full h-full" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 h-full h-screen h-[100dvh] sticky top-0 z-30">
        {renderContent(false)}
      </aside>
    </>
  );
}
