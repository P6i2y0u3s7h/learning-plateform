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
const ROLE_LABEL = { student: 'STUDENT PORTAL', teacher: 'TEACHER PORTAL', admin: 'ADMIN CONTROL' };
const ROLE_COLOR = { student: '#F4B942', teacher: '#10B981', admin: '#F4B942' };

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
  const roleLabel = ROLE_LABEL[role] || 'PORTAL';
  const roleColor = ROLE_COLOR[role] || '#F4B942';

  // Pre-warm teacher routes during browser idle time for zero-latency clicks
  useEffect(() => {
    if (role === 'teacher') {
      const timer = setTimeout(() => {
        Object.values(TEACHER_ROUTE_PREFETCHERS).forEach((loader) => loader().catch(() => {}));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [role]);

  const renderContent = (isMobile = false) => (
    <div className={`flex flex-col h-full bg-[#060C17] text-white border-r border-white/10 ${!collapsed || isMobile ? 'w-64' : 'w-16'} transition-all duration-300`}>
      {/* Brand Wordmark Header */}
      <div className="flex items-center gap-3 px-3.5 py-4 border-b border-white/10">
        <Link to="/" className="flex-shrink-0 group" title="Brainstorm Academy">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex-shrink-0 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
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
              <span className="font-display font-black text-white text-xs sm:text-sm tracking-wider uppercase whitespace-nowrap">
                BRAINSTORM
              </span>
              <span className="font-display font-black text-[#CCFF00] text-xs sm:text-sm tracking-wider uppercase whitespace-nowrap drop-shadow-[0_0_12px_rgba(204,255,0,0.4)]">
                ACADEMY.
              </span>
            </div>
            <span className="font-mono text-[7px] sm:text-[7.5px] text-[#38BDF8] tracking-[0.18em] uppercase block font-bold whitespace-nowrap mt-0.5">
              LEARN TODAY. LEAD TOMORROW.
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="font-mono text-[8px] text-[#CCFF00] uppercase tracking-widest font-bold">
                [ {roleLabel} ]
              </span>
            </div>
          </div>
        )}
      </div>

      {/* User Info Strip with Cyber Squircle Avatar */}
      {(!collapsed || isMobile) && (
        <div className="px-3.5 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#CCFF00] via-[#10B981] to-[#047857] text-black border border-[#CCFF00]/40 flex items-center justify-center flex-shrink-0 font-mono text-xs font-black shadow-[0_0_10px_rgba(204,255,0,0.25)]">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate font-sans">{user.name}</p>
              <p className="font-mono text-[9.5px] text-slate-400 truncate tracking-wide">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Directory with Scrub Monospace Styling */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {(!collapsed || isMobile) && (
          <div className="px-3 pb-2 pt-1 font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em]">
            NAVIGATION INDEX
          </div>
        )}
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const idxString = String(idx + 1).padStart(2, '0');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard/student' || item.path === '/dashboard/teacher' || item.path === '/dashboard/admin'}
              onClick={() => isMobile && setMobileOpen(false)}
              onMouseEnter={() => prefetchTeacherRoute(item.path)}
              onFocus={() => prefetchTeacherRoute(item.path)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-xs tracking-wider uppercase transition-all duration-150 border ${
                  isActive
                    ? 'bg-[#CCFF00]/10 text-white border-[#CCFF00]/40 font-bold shadow-[0_0_12px_rgba(204,255,0,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`
              }
              title={collapsed && !isMobile ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-[#CCFF00]' : 'text-slate-400'}`} />
                  {(!collapsed || isMobile) && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="truncate">{item.label}</span>
                      <span className={`text-[9px] font-mono ${isActive ? 'text-[#CCFF00]' : 'text-slate-600'}`}>{idxString}</span>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      {!isMobile && (
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-mono text-xs text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors cursor-pointer uppercase tracking-wider"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[10px]">COLLAPSE</span>
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
          className="p-2 rounded-xs bg-[#060C17] text-white border border-white/15 shadow-md cursor-pointer"
          aria-label="Toggle Dashboard Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-72 z-50 animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </div>
          <div className="w-full h-full" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 h-screen sticky top-0 z-30">
        {renderContent(false)}
      </aside>
    </>
  );
}
