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
  const { user, userProfile, role, isTeacherApproved, logout } = useAuth();

  // Scroll detection for dynamic glassmorphic appearance
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

  // Global Keyboard Shortcut: ⌘K or Ctrl+K to open search, Esc to close, Arrow keys to navigate
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

  // Helper for unique styling per subject/category
  const getCourseVisual = (course: any) => {
    const subj = (course.subject || '').toLowerCase();
    const cat = (course.category || '').toLowerCase();
    const title = (course.title || '').toLowerCase();

    if (subj.includes('math') || title.includes('math')) {
      return {
        icon: Compass,
        accentColor: '#38BDF8',
        tagBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        iconBg: 'bg-gradient-to-br from-sky-500/20 to-blue-600/10 border-sky-400/30 text-sky-400',
        typeLabel: 'Mathematics',
      };
    }
    if (subj.includes('physic') || title.includes('physic')) {
      return {
        icon: Zap,
        accentColor: '#818CF8',
        tagBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        iconBg: 'bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border-indigo-400/30 text-indigo-400',
        typeLabel: 'Physics',
      };
    }
    if (subj.includes('chem') || title.includes('chem')) {
      return {
        icon: Sparkles,
        accentColor: '#F59E0B',
        tagBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-amber-400/30 text-amber-400',
        typeLabel: 'Chemistry',
      };
    }
    if (cat.includes('amu') || cat.includes('entrance') || title.includes('amu') || title.includes('jamia')) {
      return {
        icon: Building2,
        accentColor: '#34D399',
        tagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border-emerald-400/30 text-emerald-400',
        typeLabel: 'AMU & Jamia',
      };
    }
    if (cat.includes('competitive') || title.includes('bpsc') || title.includes('tet')) {
      return {
        icon: Trophy,
        accentColor: '#FBBF24',
        tagBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border-amber-400/30 text-amber-400',
        typeLabel: 'Govt Exam',
      };
    }
    if (cat.includes('test') || title.includes('mock') || title.includes('test')) {
      return {
        icon: Clock,
        accentColor: '#CCFF00',
        tagBg: 'bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/30',
        iconBg: 'bg-gradient-to-br from-[#CCFF00]/20 to-emerald-500/10 border-[#CCFF00]/30 text-[#CCFF00]',
        typeLabel: 'CBT Mock Test',
      };
    }
    return {
      icon: BookOpen,
      accentColor: '#38BDF8',
      tagBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      iconBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-400/30 text-cyan-400',
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
      <header className={`sticky top-0 z-40 text-white w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-[#07080D]/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(204,255,0,0.06)]' 
          : 'bg-[#07080D]/95 backdrop-blur-xl border-b border-white/[0.08]'
      }`}>

        {/* ======================================================== */}
        {/* ROW 2: MAIN NAVIGATION ROW                               */}
        {/* ======================================================== */}
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 gap-2 xl:gap-3 2xl:gap-4 w-full min-w-0 ${
            scrolled ? 'h-16 sm:h-18' : 'h-18 sm:h-20'
          }`}>
            
            {/* 1. Left: Brand Wordmark & Insignia */}
            <div className="flex items-center justify-start flex-shrink-0">
              <Link 
                to={ROUTES.HOME} 
                className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 group py-1"
                aria-label="Brainstorm Academy Homepage"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-black border border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-xl group-hover:border-[#CCFF00] group-hover:shadow-[0_0_25px_rgba(204,255,0,0.4)] transition-all duration-300 flex-shrink-0">
                  <img 
                    src={brandLogo} 
                    alt="Brainstorm Academy Logo" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1 leading-tight">
                    <span className="font-display font-black text-white text-sm sm:text-base 2xl:text-lg tracking-wider uppercase whitespace-nowrap">
                      BRAINSTORM
                    </span>
                    <span className="font-display font-black text-[#CCFF00] text-sm sm:text-base 2xl:text-lg tracking-wider uppercase whitespace-nowrap drop-shadow-[0_0_12px_rgba(204,255,0,0.4)]">
                      ACADEMY.
                    </span>
                  </div>
                  <span className="font-mono text-[7.5px] sm:text-[8.5px] text-[#38BDF8] tracking-[0.2em] uppercase block -mt-0.5 font-bold whitespace-nowrap hidden min-[440px]:block">
                    LEARN TODAY. LEAD TOMORROW.
                  </span>
                </div>
              </Link>
            </div>

            {/* 2. Center: Segmented Navigation Dock (Centered, Non-overlapping) */}
            <div className="hidden xl:flex items-center justify-center flex-1 min-w-0 px-2">
              <nav 
                className="flex items-center gap-0.5 p-1 rounded-full bg-[#0B0F17]/90 hover:bg-[#0B0F17] border border-white/10 hover:border-white/20 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all flex-shrink-0"
                aria-label="Main Navigation"
              >
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-full text-[10px] 2xl:text-[11px] font-mono tracking-tight uppercase transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-white/12 text-white font-bold border border-white/20 shadow-[0_0_15px_rgba(204,255,0,0.15)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Numeric Track Chip */}
                        <span className={`text-[8px] 2xl:text-[9px] font-mono font-bold px-1 py-0.5 rounded-md transition-all flex-shrink-0 ${
                          isActive 
                            ? 'bg-[#CCFF00] text-black shadow-[0_0_8px_#CCFF00]' 
                            : 'bg-white/5 text-[#CCFF00]/80 group-hover:bg-[#CCFF00]/20 group-hover:text-[#CCFF00]'
                        }`}>
                          {item.number}
                        </span>
                        
                        {/* Track Label */}
                        <span className="whitespace-nowrap font-medium">
                          {item.label}
                        </span>

                        {/* Neon Active Glow Accent */}
                        {isActive && (
                          <span className="absolute -bottom-1 left-2.5 right-2.5 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent shadow-[0_0_8px_#CCFF00] rounded-full" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* 3. Right: Action Controls (Search + Sign In + Get Started + Hamburger) */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2 2xl:gap-2.5 flex-shrink-0">
              
              {/* Search Icon Button */}
              <button
                type="button"
                onClick={() => setSpotlightOpen(true)}
                className="group relative w-10 h-10 rounded-full flex items-center justify-center bg-[#0B0F17]/90 hover:bg-white/10 border border-white/15 hover:border-[#CCFF00] text-slate-300 hover:text-[#CCFF00] transition-all duration-300 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.35)] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00] flex-shrink-0"
                aria-label="Open search (Ctrl+K or ⌘K)"
                title="Search (⌘K)"
              >
                {/* Subtle glass reflection highlight */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <Search className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform relative z-10" />

                {/* Tiny Hotkey Indicator Dot on Hover */}
                <span className="absolute -bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-[#CCFF00] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_6px_#CCFF00]" />
              </button>

              {/* Desktop Auth Actions & Get Started Button */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 relative" ref={userMenuRef}>
                  {/* User Profile Pill with Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 h-10 px-3 rounded-full glass-pill hover:border-[#CCFF00]/40 transition-colors flex-shrink-0 cursor-pointer"
                    aria-expanded={userMenuOpen}
                    aria-label="User Account Menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#CCFF00] to-[#00F59B] text-black font-mono font-black text-xs flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(204,255,0,0.4)]">
                      {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : 'U')}
                    </div>
                    <div className="text-left text-xs pr-1 hidden sm:block">
                      <p className="font-bold text-white leading-none truncate max-w-[80px]">
                        {userProfile?.displayName || user?.displayName || 'User'}
                      </p>
                      <span className="font-mono text-[9px] font-bold text-[#CCFF00] uppercase tracking-widest">
                        {role}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-[#CCFF00]' : ''}`} />
                  </button>

                  {/* Dropdown Menu Modal */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-72 bg-[#0E121A]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(204,255,0,0.1)] z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                      {/* Specular Top Glow */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent rounded-t-2xl" />

                      {/* User Dossier Snippet */}
                      <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CCFF00] to-[#10B981] text-black font-mono font-black text-lg flex items-center justify-center flex-shrink-0 shadow-md">
                          {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : 'U')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono font-bold text-sm text-white truncate">
                            {userProfile?.displayName || user?.displayName || 'Academic Scholar'}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400 truncate">
                            {user?.email}
                          </p>
                          <span className="inline-block mt-1 bg-[#CCFF00]/15 border border-[#CCFF00]/30 text-[#CCFF00] font-mono text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            {role} PORTAL ACTIVE
                          </span>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="space-y-1 font-mono text-xs">
                        {role === 'teacher' ? (
                          <>
                            <Link
                              to="/dashboard/teacher"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-slate-400" />
                              <span>01 // Teacher Cockpit</span>
                            </Link>
                            <Link
                              to="/dashboard/teacher/materials"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-slate-400" />
                              <span>02 // Study Materials</span>
                            </Link>
                            <Link
                              to="/dashboard/teacher/tests"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <ClipboardList className="w-4 h-4 text-slate-400" />
                              <span>03 // Test Management</span>
                            </Link>
                            <Link
                              to="/dashboard/teacher/assignments"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <User className="w-4 h-4 text-slate-400" />
                              <span>04 // Student Assignments</span>
                            </Link>
                          </>
                        ) : role === 'admin' ? (
                          <>
                            <Link
                              to="/dashboard/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-slate-400" />
                              <span>01 // Admin Control Center</span>
                            </Link>
                            <Link
                              to="/dashboard/admin/teachers"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <User className="w-4 h-4 text-slate-400" />
                              <span>02 // Faculty Directory</span>
                            </Link>
                            <Link
                              to="/dashboard/admin/students"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-slate-400" />
                              <span>03 // Student Directory</span>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/dashboard/student/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <User className="w-4 h-4 text-slate-400" />
                              <span>01 // My Profile Dossier</span>
                            </Link>
                            <Link
                              to={getDashboardPath()}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-slate-400" />
                              <span>02 // Student Learning Portal</span>
                            </Link>
                            <Link
                              to="/dashboard/student/courses"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-slate-400" />
                              <span>03 // My Enrolled Courses</span>
                            </Link>
                            <Link
                              to="/dashboard/student/tests"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-[#CCFF00] transition-colors"
                            >
                              <ClipboardList className="w-4 h-4 text-slate-400" />
                              <span>04 // CBT Practice Tests</span>
                            </Link>
                          </>
                        )}
                      </div>

                      {/* Sign Out Action */}
                      <div className="pt-3 mt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-mono text-xs font-bold transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">Exit</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Direct Portal Button */}
                  <Link
                    to={getDashboardPath()}
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full glass-pill hover:border-white/40 text-white font-mono text-xs tracking-wider uppercase font-bold transition-all flex-shrink-0 whitespace-nowrap"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span className="hidden sm:inline">Portal</span>
                  </Link>

                  {/* Quick Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-white/5 border border-white/5 transition-colors cursor-pointer flex-shrink-0"
                    title="Log Out"
                    aria-label="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Sign In Button */}
                  <Link
                    to={ROUTES.LOGIN}
                    className="hidden sm:inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-[#0B0F17]/90 hover:bg-white/10 border border-white/15 hover:border-white/40 text-slate-200 hover:text-white font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 whitespace-nowrap cursor-pointer group"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#CCFF00] group-hover:text-white transition-colors" />
                    <span>SIGN IN</span>
                  </Link>
                </div>
              )}

              {/* Mobile / Tablet Menu Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden h-10 w-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white bg-[#0B0F17]/90 hover:bg-white/10 border border-white/15 transition-colors cursor-pointer flex-shrink-0 ml-1"
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE NAVIGATION DRAWER (Phones & Tablets < 1280px)     */}
        {/* ======================================================== */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-white/10 bg-[#07080D]/98 backdrop-blur-3xl px-4 pt-4 pb-8 space-y-4 animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
            
            {/* Quick Search Action in Drawer */}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setSpotlightOpen(true);
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 text-slate-300 font-mono text-xs hover:border-[#CCFF00]/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-[#CCFF00]" />
                <span className="text-slate-300 font-sans">Search courses, exams, tests...</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-slate-400 font-mono">⌘K</span>
            </button>

            {/* Navigation Directory Heading */}
            <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-white/10 text-[10px] font-mono text-slate-400 tracking-[0.2em] uppercase">
              <span>EXPLORE DIRECTORY</span>
              <span className="text-[#CCFF00]">05 TRACKS</span>
            </div>

            {/* 5 Navigation Links */}
            <div className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between p-3.5 rounded-2xl font-mono text-xs tracking-[0.14em] uppercase transition-all border ${
                        isActive
                          ? 'bg-white/10 text-white border-[#CCFF00]/40 font-bold'
                          : 'text-slate-300 hover:bg-white/5 border-white/5 hover:border-white/15'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#CCFF00] font-bold font-mono">{item.number}</span>
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </NavLink>
                );
              })}
            </div>

            {/* Mobile Auth Actions Strip */}
            <div className="pt-4 border-t border-white/10">
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CCFF00] to-[#00F59B] text-black font-mono font-bold text-xs flex items-center justify-center">
                        {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{userProfile?.displayName || 'User'}</p>
                        <p className="font-mono text-[10px] text-[#CCFF00] uppercase tracking-widest">{role}</p>
                      </div>
                    </div>
                    <Link
                      to={role === 'teacher' ? ROUTES.TEACHER.ROOT : role === 'admin' ? ROUTES.ADMIN.ROOT : '/dashboard/student/profile'}
                      onClick={() => setMobileOpen(false)}
                      className="font-mono text-[10px] text-slate-300 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5"
                    >
                      {role === 'teacher' ? 'Faculty →' : role === 'admin' ? 'Admin →' : 'Profile →'}
                    </Link>
                  </div>

                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#CCFF00] text-black font-mono text-xs font-black tracking-wider uppercase shadow-[0_0_20px_rgba(204,255,0,0.35)]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-black" />
                    <span>Open {role === 'admin' ? 'Admin Portal' : role === 'teacher' ? 'Faculty Console' : 'Student Cockpit'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-full glass-pill text-white font-mono text-xs uppercase tracking-wider border border-white/20 hover:border-white/40"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-[#CCFF00] via-[#00F59B] to-[#38BDF8] text-black font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.35)]"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Bottom Support Badge in Drawer */}
            <div className="pt-2 text-center">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                SESSION 2026-27 ADMISSION HELPLINE: {APP_CONFIG.contact.phone}
              </span>
            </div>

          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* SPOTLIGHT SEARCH COMMAND PALETTE MODAL                        */}
      {/* ============================================================ */}
      {spotlightOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Search Command Palette"
        >
          {/* Ambient Glowing Orbs Behind Modal */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[320px] bg-[#CCFF00]/15 blur-[150px] pointer-events-none rounded-full" />
          <div className="absolute top-1/3 left-1/3 w-[450px] h-[320px] bg-[#38BDF8]/15 blur-[150px] pointer-events-none rounded-full" />

          {/* Dialog Container */}
          <div 
            className="w-full max-w-3xl rounded-3xl bg-[#090C13]/95 border border-white/15 shadow-[0_30px_100px_rgba(0,0,0,0.95),0_0_50px_rgba(204,255,0,0.06)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Specular Neon Hairline */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent shadow-[0_0_20px_#CCFF00]" />

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#CCFF00]/20 to-emerald-500/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00] flex-shrink-0 shadow-[0_0_15px_rgba(204,255,0,0.15)] relative">
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              </div>
              
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, board classes, AMU/Jamia entrance, CBT mock tests..."
                className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 font-sans outline-none"
              />

              {/* Match Counter Badge */}
              {filteredResults.length > 0 && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
                  <strong className="text-white mr-1">{filteredResults.length}</strong> modules
                </span>
              )}

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSpotlightOpen(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-400 hover:text-white hover:border-white/30 transition-all cursor-pointer flex-shrink-0"
                aria-label="Close search dialog"
              >
                <X className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline text-[10px]"><kbd>ESC</kbd></span>
                <span className="sm:hidden text-[10px] uppercase font-bold">Close</span>
              </button>
            </form>

            {/* Filter Category Chips with Live Counts & Icons */}
            <div className="px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between gap-2 bg-[#06080E]/80 backdrop-blur-md overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1.5 flex-nowrap">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mr-1 hidden sm:inline">
                  FILTER:
                </span>
                {[
                  { id: 'all', label: 'All Modules', icon: Sparkles, count: filterCounts.all },
                  { id: 'school', label: 'School (6th-12th)', icon: GraduationCap, count: filterCounts.school },
                  { id: 'competitive', label: 'Competitive', icon: Trophy, count: filterCounts.competitive },
                  { id: 'entrance', label: 'AMU & Jamia', icon: Building2, count: filterCounts.entrance },
                  { id: 'tests', label: 'CBT Mocks', icon: ClipboardList, count: filterCounts.tests },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = selectedFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedFilter(tab.id as any)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-gradient-to-r from-white to-slate-100 text-black border-white font-extrabold shadow-[0_2px_12px_rgba(255,255,255,0.25)]'
                          : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-white/25 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-sans font-bold ${
                        isActive ? 'bg-black/15 text-black' : 'bg-white/10 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[420px] overflow-y-auto p-3 sm:p-4 space-y-2">
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
                      className={`p-3.5 sm:p-4 rounded-2xl transition-all flex items-center justify-between group cursor-pointer border relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-r from-white/[0.09] via-white/[0.05] to-transparent border-[#CCFF00]/50 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(204,255,0,0.04)]'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Left neon electric accent line when active */}
                      {isSelected && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#CCFF00] shadow-[0_0_12px_#CCFF00]" />
                      )}

                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        {/* Subject Icon Squircle */}
                        <div className={`w-11 h-11 rounded-2xl ${visual.iconBg} border flex items-center justify-center flex-shrink-0 shadow-sm transition-transform ${isSelected ? 'scale-105 shadow-[0_0_15px_rgba(204,255,0,0.2)]' : 'group-hover:scale-105'}`}>
                          <Icon className="w-5 h-5 stroke-[2]" />
                        </div>

                        {/* Center Information */}
                        <div className="min-w-0">
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider border font-bold ${visual.tagBg}`}>
                              {visual.typeLabel}
                            </span>
                            {course.class && (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10 font-bold">
                                {course.class}
                              </span>
                            )}
                            {course.badge && (
                              <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider border font-extrabold ${
                                course.badge === 'Trending'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : course.badge === 'Popular'
                                  ? 'bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}>
                                {course.badge === 'Trending' ? '🔥 Trending' : course.badge === 'Popular' ? '⚡ Popular' : '★ Featured'}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className={`font-sans font-bold text-xs sm:text-sm tracking-tight truncate transition-colors ${
                            isSelected ? 'text-[#CCFF00]' : 'text-white group-hover:text-[#CCFF00]'
                          }`}>
                            {course.title}
                          </h4>

                          {/* Metrics row */}
                          <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400 flex-wrap">
                            <span>{course.chapters} Chapters</span>
                            <span>•</span>
                            <span>{course.duration || 'Comprehensive'}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {course.rating}
                            </span>
                            {course.enrolledStudents && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline text-slate-500">{(course.enrolledStudents / 1000).toFixed(1)}k enrolled</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Trigger */}
                      <div className="flex items-center flex-shrink-0">
                        {isSelected ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#CCFF00] text-black font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(204,255,0,0.4)] animate-in fade-in duration-150">
                            <span className="hidden sm:inline">OPEN</span>
                            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-white/30 transition-all">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-display font-bold text-sm mb-1 uppercase tracking-wider">No matching curriculum found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 font-sans">
                    We couldn't find modules matching <span className="text-[#CCFF00]">"{searchQuery}"</span>. Try quick recommendations below:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                    {[
                      { label: 'Class 10 Math', q: 'Class 10 Math' },
                      { label: 'Physics 12th', q: 'Physics 12th' },
                      { label: 'BPSC TRE', q: 'BPSC' },
                      { label: 'AMU 11th Science', q: 'AMU' },
                    ].map((rec) => (
                      <button
                        key={rec.label}
                        type="button"
                        onClick={() => handleQuickTagClick(rec.q)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#CCFF00]/15 border border-white/10 hover:border-[#CCFF00]/40 text-xs font-mono text-slate-300 hover:text-[#CCFF00] transition-colors cursor-pointer"
                      >
                        {rec.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions & Keyboard Shortcuts Bar */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-white/10 bg-[#06080E]/95 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mr-1">
                  <TrendingUp className="w-3 h-3 text-[#CCFF00]" />
                  <span>TRENDING:</span>
                </span>
                {['Class 10 Math', 'Physics 12th', 'AMU 11th', 'BPSC TRE', 'Chemistry 11th'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#CCFF00]/10 border border-white/10 hover:border-[#CCFF00]/30 text-[10px] font-mono text-slate-300 hover:text-[#CCFF00] transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] text-slate-300">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] text-slate-300">↓</kbd>
                  <span>Navigate</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] text-slate-300">↵</kbd>
                  <span>Select</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] text-slate-300">ESC</kbd>
                  <span>Close</span>
                </span>
              </div>
            </div>

          </div>

          {/* Click Backdrop to Close */}
          <div className="fixed inset-0 -z-10" onClick={() => setSpotlightOpen(false)} />
        </div>
      )}
    </>
  );
};

export default Navbar;
