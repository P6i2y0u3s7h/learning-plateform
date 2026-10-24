import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Menu,
  X,
  Search,
  BookOpen,
  Trophy,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  ArrowRight,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Zap,
  Clock,
  Compass,
  Star,
  CheckCircle2,
  User,
  ChevronDown,
} from 'lucide-react';
import { APP_CONFIG } from '../../constants/app';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../context/AuthContext';
import { SAMPLE_COURSES } from '../../data/sampleData';
import brandLogo from '../../assets/brand-logo.jpg';

interface NavItem {
  number: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { number: '01', label: 'School Courses', path: ROUTES.SCHOOL_COURSES, icon: BookOpen },
  { number: '02', label: 'Competitive Exams', path: ROUTES.COMPETITIVE_EXAMS, icon: Trophy },
  { number: '03', label: 'AMU & Jamia', path: ROUTES.AMU_JAMIA, icon: Building2 },
  { number: '04', label: 'Study Notes', path: ROUTES.STUDY_MATERIALS, icon: BookOpen },
  { number: '05', label: 'Mock Tests', path: ROUTES.MOCK_TESTS, icon: ClipboardList },
];

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'school' | 'competitive' | 'entrance' | 'tests'>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, userProfile, role, logout } = useAuth();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Filter and course counts
  const filterCounts = {
    all: SAMPLE_COURSES.length,
    school: SAMPLE_COURSES.filter((c) => c.category === 'school').length,
    competitive: SAMPLE_COURSES.filter((c) => c.category === 'competitive').length,
    entrance: SAMPLE_COURSES.filter((c) => c.category === 'amu-jamia' || c.title.toLowerCase().includes('amu') || c.title.toLowerCase().includes('jamia')).length,
    tests: SAMPLE_COURSES.filter((c) => c.category === 'mock-tests').length,
  };

  // Search filtering logic
  const filteredResults = SAMPLE_COURSES.filter((course) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !query ||
      course.title.toLowerCase().includes(query) ||
      course.subject.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      course.tags?.some((t) => t.toLowerCase().includes(query));

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'school' && course.category === 'school') ||
      (selectedFilter === 'competitive' && course.category === 'competitive') ||
      (selectedFilter === 'entrance' && (course.category === 'amu-jamia' || course.title.toLowerCase().includes('amu') || course.title.toLowerCase().includes('jamia'))) ||
      (selectedFilter === 'tests' && course.category === 'mock-tests');

    return matchesQuery && matchesFilter;
  });

  // Reset activeIndex when query, filter, or modal open changes
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery, selectedFilter, spotlightOpen]);

  // Global Keyboard Shortcut: Ctrl+K or ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (spotlightOpen) {
          e.preventDefault();
          setSpotlightOpen(false);
        } else if (mobileOpen) {
          setMobileOpen(false);
        }
      } else if (spotlightOpen && filteredResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % filteredResults.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spotlightOpen, mobileOpen, filteredResults.length]);

  // Focus input when spotlight opens
  useEffect(() => {
    if (spotlightOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [spotlightOpen]);

  // Prevent background scroll when mobile menu or spotlight is open
  useEffect(() => {
    if (mobileOpen || spotlightOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen, spotlightOpen]);

  const getCourseVisual = (course: any) => {
    const subj = (course.subject || '').toLowerCase();
    const cat = (course.category || '').toLowerCase();
    const title = (course.title || '').toLowerCase();

    if (subj.includes('math') || title.includes('math')) {
      return {
        icon: Compass,
        tagBg: 'bg-blue-50 text-blue-700 border-blue-200',
        iconBg: 'bg-blue-50 text-blue-600',
        typeLabel: 'Mathematics',
      };
    }
    if (subj.includes('physic') || title.includes('physic')) {
      return {
        icon: Zap,
        tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        iconBg: 'bg-indigo-50 text-indigo-600',
        typeLabel: 'Physics',
      };
    }
    if (subj.includes('chem') || title.includes('chem')) {
      return {
        icon: Sparkles,
        tagBg: 'bg-amber-50 text-amber-700 border-amber-200',
        iconBg: 'bg-amber-50 text-amber-600',
        typeLabel: 'Chemistry',
      };
    }
    if (cat.includes('amu') || cat.includes('entrance') || title.includes('amu') || title.includes('jamia')) {
      return {
        icon: Building2,
        tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconBg: 'bg-emerald-50 text-emerald-600',
        typeLabel: 'AMU & Jamia',
      };
    }
    if (cat.includes('competitive') || title.includes('bpsc') || title.includes('tet')) {
      return {
        icon: Trophy,
        tagBg: 'bg-amber-50 text-amber-700 border-amber-200',
        iconBg: 'bg-amber-50 text-amber-600',
        typeLabel: 'Govt Exam',
      };
    }
    return {
      icon: BookOpen,
      tagBg: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600',
      typeLabel: course.subject || 'Curriculum',
    };
  };

  const handleSelectResult = (courseId: string) => {
    navigate(ROUTES.COURSE_DETAILS(courseId));
    setSpotlightOpen(false);
    setSearchQuery('');
  };

  const handleQuickTagClick = (tag: string) => {
    setSearchQuery(tag);
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredResults.length > 0 && filteredResults[activeIndex]) {
      handleSelectResult(filteredResults[activeIndex].id);
      return;
    }
    if (searchQuery.trim()) {
      navigate(`${ROUTES.SCHOOL_COURSES}?q=${encodeURIComponent(searchQuery.trim())}`);
      setSpotlightOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
    setMobileOpen(false);
  };

  const getDashboardPath = () => {
    if (role === 'admin') return ROUTES.ADMIN.ROOT;
    if (role === 'teacher') return ROUTES.TEACHER.ROOT;
    return ROUTES.STUDENT.ROOT;
  };

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 transition-all duration-300 ${
        scrolled ? 'shadow-xs' : ''
      }`}>
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 w-full min-w-0">
            
            {/* 1. Left: Brand Wordmark & Logo */}
            <div className="flex items-center justify-start flex-shrink-0">
              <Link 
                to={ROUTES.HOME} 
                className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group py-1"
                aria-label="Brainstorm Academy Homepage"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-blue-400 group-hover:shadow-sm transition-all duration-300 flex-shrink-0">
                  <img 
                    src={brandLogo} 
                    alt="Brainstorm Academy Logo" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1 leading-tight">
                    <span className="font-display font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                      Brainstorm
                    </span>
                    <span className="font-display font-bold text-blue-600 text-base sm:text-lg tracking-tight">
                      Academy.
                    </span>
                  </div>
                  <span className="font-sans text-[10px] text-slate-500 font-medium tracking-wider uppercase block -mt-0.5 hidden min-[440px]:block">
                    Learn Today. Lead Tomorrow.
                  </span>
                </div>
              </Link>
            </div>

            {/* 2. Center: Navigation Items */}
            <div className="hidden xl:flex items-center justify-center flex-1 min-w-0 px-4">
              <nav 
                className="flex items-center gap-1 p-1 rounded-full bg-slate-100/80 border border-slate-200/80 transition-all"
                aria-label="Main Navigation"
              >
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-white/60'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* 3. Right: Action Controls (Search + User Menu + Hamburger) */}
            <div className="flex items-center justify-end gap-2 sm:gap-2.5 flex-shrink-0">
              
              {/* Search Icon Button */}
              <button
                type="button"
                onClick={() => setSpotlightOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all cursor-pointer shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 flex-shrink-0"
                aria-label="Open search (Ctrl+K or ⌘K)"
                title="Search (⌘K)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Desktop Auth Actions & User Profile */}
              {user ? (
                <div className="flex items-center gap-2 flex-shrink-0 relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 h-10 px-3 rounded-full bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors flex-shrink-0 cursor-pointer"
                    aria-expanded={userMenuOpen}
                    aria-label="User Account Menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-sans font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : 'U')}
                    </div>
                    <div className="text-left text-xs pr-1 hidden sm:block">
                      <p className="font-semibold text-slate-900 leading-none truncate max-w-[80px]">
                        {userProfile?.displayName || user?.displayName || 'User'}
                      </p>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                        {role}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>

                  {/* Dropdown Menu Modal */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-72 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Info Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-sans font-bold text-base flex items-center justify-center flex-shrink-0 shadow-xs">
                          {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : 'U')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-slate-900 truncate">
                            {userProfile?.displayName || user?.displayName || 'Scholar'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user?.email}
                          </p>
                          <span className="inline-block mt-1 bg-blue-50 border border-blue-200 text-blue-700 font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                            {role} Portal
                          </span>
                        </div>
                      </div>

                      {/* Navigation Links based on role */}
                      <div className="space-y-1 font-sans text-xs">
                        {role === 'teacher' ? (
                          <>
                            <Link
                              to="/dashboard/teacher"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-blue-600" />
                              <span>Teacher Overview</span>
                            </Link>
                            <Link
                              to="/dashboard/teacher/materials"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-slate-400" />
                              <span>Study Materials</span>
                            </Link>
                            <Link
                              to="/dashboard/teacher/tests"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <ClipboardList className="w-4 h-4 text-slate-400" />
                              <span>Test Management</span>
                            </Link>
                          </>
                        ) : role === 'admin' ? (
                          <>
                            <Link
                              to="/dashboard/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-blue-600" />
                              <span>Admin Overview</span>
                            </Link>
                            <Link
                              to="/dashboard/admin/teachers"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <User className="w-4 h-4 text-slate-400" />
                              <span>Teacher Directory</span>
                            </Link>
                            <Link
                              to="/dashboard/admin/students"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-slate-400" />
                              <span>Student Directory</span>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to={getDashboardPath()}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-blue-600" />
                              <span>Student Dashboard</span>
                            </Link>
                            <Link
                              to="/dashboard/student/courses"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-slate-400" />
                              <span>My Enrolled Courses</span>
                            </Link>
                            <Link
                              to="/dashboard/student/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <User className="w-4 h-4 text-slate-400" />
                              <span>Student Profile</span>
                            </Link>
                          </>
                        )}
                      </div>

                      {/* Sign Out Action */}
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">Exit</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Direct Portal Link */}
                  <Link
                    to={getDashboardPath()}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold transition-all flex-shrink-0 whitespace-nowrap shadow-xs"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={ROUTES.LOGIN}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                </div>
              )}

              {/* Mobile / Tablet Menu Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden h-10 w-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex-shrink-0 ml-1"
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-4 pb-8 space-y-4 animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-5rem)] overflow-y-auto text-slate-800 shadow-lg">
            {/* Quick Search Action */}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setSpotlightOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs hover:border-blue-400 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="font-sans">Search courses, exams, tests...</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-400 font-mono">⌘K</span>
            </button>

            {/* Navigation Links */}
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between p-3 rounded-xl font-sans text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-blue-600" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </NavLink>
                );
              })}
            </div>

            {/* Mobile Auth Strip */}
            <div className="pt-4 border-t border-slate-100">
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-sans font-bold text-xs flex items-center justify-center">
                        {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{userProfile?.displayName || 'User'}</p>
                        <p className="text-[10px] text-blue-600 font-semibold uppercase">{role}</p>
                      </div>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setMobileOpen(false)}
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      Dashboard →
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-sans text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white font-sans text-xs font-semibold shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-sans text-xs font-semibold hover:bg-slate-50"
                  >
                    <span>Register</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Spotlight Search Modal */}
      {spotlightOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Search Command Palette"
        >
          <div 
            className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 p-4 sm:p-5 border-b border-slate-100 bg-white">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Search className="w-4 h-4" />
              </div>
              
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, board classes, AMU/Jamia entrance, CBT mock tests..."
                className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 font-sans outline-none"
              />

              {filteredResults.length > 0 && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                  <strong className="text-slate-900 mr-1">{filteredResults.length}</strong> results
                </span>
              )}

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSpotlightOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
                aria-label="Close search dialog"
              >
                <span className="hidden sm:inline"><kbd>ESC</kbd></span>
                <span className="sm:hidden">Close</span>
              </button>
            </form>

            {/* Filter Category Chips */}
            <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70 overflow-x-auto">
              {[
                { id: 'all', label: 'All Courses', count: filterCounts.all },
                { id: 'school', label: 'School (6–12)', count: filterCounts.school },
                { id: 'competitive', label: 'Competitive', count: filterCounts.competitive },
                { id: 'entrance', label: 'AMU & Jamia', count: filterCounts.entrance },
                { id: 'tests', label: 'Mock Tests', count: filterCounts.tests },
              ].map((tab) => {
                const isActive = selectedFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFilter(tab.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Results List */}
            <div className="max-h-[380px] overflow-y-auto p-3 sm:p-4 space-y-1.5">
              {filteredResults.length > 0 ? (
                filteredResults.slice(0, 8).map((course, idx) => {
                  const visual = getCourseVisual(course);
                  const Icon = visual.icon;
                  const isSelected = activeIndex === idx;

                  return (
                    <div
                      key={course.id}
                      onClick={() => handleSelectResult(course.id)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-200 shadow-xs'
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className={`w-10 h-10 rounded-xl ${visual.iconBg} border border-blue-100 flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-sans text-[11px] font-semibold text-blue-700">
                              {visual.typeLabel}
                            </span>
                            {course.class && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                {course.class}
                              </span>
                            )}
                          </div>
                          <h4 className="font-sans font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {course.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>{course.chapters} Chapters</span>
                            <span>•</span>
                            <span>{course.duration || '60 hrs'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 px-4 text-center">
                  <p className="text-sm font-semibold text-slate-800 mb-1">No matching courses found</p>
                  <p className="text-xs text-slate-500">Try searching for other terms like "Class 10", "Physics", "BPSC", or "AMU".</p>
                </div>
              )}
            </div>

            {/* Quick Suggestions Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-slate-600">Quick Searches:</span>
                {['Class 10 Math', 'Physics 12th', 'AMU 11th', 'BPSC TRE'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer text-xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <span className="hidden sm:inline">Use ↑ ↓ to navigate, ESC to close</span>
            </div>
          </div>

          <div className="fixed inset-0 -z-10" onClick={() => setSpotlightOpen(false)} />
        </div>
      )}
    </>
  );
};

export default Navbar;
