import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  BookOpen,
  Trophy,
  Building2,
  ClipboardList,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  X,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Target,
  BarChart3,
  Award,
  Layers,
  ChevronRight,
  Check,
  Play,
  Flame,
} from 'lucide-react';
import { SectionHeading } from '../components/common/SectionHeading';
import { CourseCard } from '../components/common/CourseCard';
import { FAQSection } from '../components/common/FAQSection';
import { SAMPLE_COURSES } from '../data/sampleData';
import { ROUTES } from '../constants/routes';
import { courseService } from '../services/courseService';

export default function HomePage() {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTrack, setActiveTrack] = useState('competitive');
  const [liveCourses, setLiveCourses] = useState(SAMPLE_COURSES);

  // Interactive Prep Velocity Calculator State (Scrub Tools style)
  const [calcExam, setCalcExam] = useState('bpsc');
  const [dailyHours, setDailyHours] = useState(4);
  const [baselineScore, setBaselineScore] = useState(65);

  useEffect(() => {
    let isMounted = true;
    async function fetchPublishedCourses() {
      try {
        const published = await courseService.getAllPublishedCourses();
        if (isMounted && published && published.length > 0) {
          setLiveCourses(published);
        }
      } catch (err) {
        console.warn('[HomePage] Using sample fallback courses:', err);
      }
    }
    fetchPublishedCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick categories for the search interface
  const SEARCH_PILLS = [
    { id: 'all', label: 'All Courses' },
    { id: 'school', label: 'School (6–12)' },
    { id: 'bpsc', label: 'BPSC TRE' },
    { id: 'supertet', label: 'UP Super TET' },
    { id: 'bssc', label: 'BSSC' },
    { id: 'biharsi', label: 'Bihar SI' },
    { id: 'amu-jamia', label: 'AMU & Jamia' },
  ];

  // Filter courses based on query and category pill
  const filteredCourses = useMemo(() => {
    let list = liveCourses.filter((c) => c.isPublished !== false);

    // Filter by category pill
    if (selectedCategory === 'school') {
      list = list.filter((c) => c.category === 'school' || c.categoryId === 'school-courses' || c.classGrade?.includes('Class'));
    } else if (selectedCategory === 'bpsc') {
      list = list.filter((c) => c.targetExam?.includes('BPSC') || c.title?.includes('BPSC'));
    } else if (selectedCategory === 'supertet') {
      list = list.filter((c) => c.targetExam?.includes('Super TET') || c.title?.includes('Super TET'));
    } else if (selectedCategory === 'bssc') {
      list = list.filter((c) => c.targetExam?.includes('BSSC') || c.title?.includes('BSSC'));
    } else if (selectedCategory === 'biharsi') {
      list = list.filter((c) => c.targetExam?.includes('Bihar SI') || c.title?.includes('Bihar SI'));
    } else if (selectedCategory === 'amu-jamia') {
      list = list.filter((c) => c.category === 'amu-jamia' || c.categoryId === 'entrance-preparation' || c.targetExam?.includes('AMU') || c.targetExam?.includes('Jamia'));
    }

    // Filter by text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.targetExam?.toLowerCase().includes(q) ||
          c.subject?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [liveCourses, selectedCategory, searchQuery]);

  // Dynamic calculations for Prep Velocity Tool
  const projectedPercentile = useMemo(() => {
    const scoreBonus = baselineScore * 0.4;
    const hoursBonus = dailyHours * 6;
    const calculated = Math.min(99.8, Math.round((55 + scoreBonus + hoursBonus) * 10) / 10);
    return calculated;
  }, [dailyHours, baselineScore]);

  const weeksToMastery = useMemo(() => {
    const totalRequiredHours = calcExam === 'bpsc' ? 360 : calcExam === 'amu' ? 280 : 220;
    const weeklyHours = dailyHours * 7;
    return Math.max(4, Math.round(totalRequiredHours / weeklyHours));
  }, [calcExam, dailyHours]);

  return (
    <div className="w-full bg-[#07080D] text-slate-100 overflow-hidden relative">
      {/* Background Decorative Grid & Glow Blobs */}
      <div className="absolute inset-0 scrub-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#CCFF00]/10 via-[#00F59B]/5 to-transparent blur-[140px] pointer-events-none" />

      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative pt-12 sm:pt-20 pb-16 lg:pb-24 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main Giant Headline */}
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02] uppercase text-white mb-6">
              WHERE ASPIRANTS EVOLVE INTO{' '}
              <span className="font-editorial italic font-normal text-slate-300 normal-case block sm:inline">
                Top Rankers.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-400 font-sans max-w-3xl mx-auto leading-relaxed mb-8">
              An ultra-high-yield academic learning engine engineered for competitive exams (BPSC, Bihar SI, Super TET), elite university entrance preparation (AMU, Jamia), and CBSE board toppers. Zero fluff. Precision pedagogy.
            </p>

            {/* Persona / Track Switcher (JoinScrub style dual-mode switch) */}
            <div className="inline-flex p-1 rounded-full bg-[#0E121A] border border-white/10 mb-8 max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTrack('competitive')}
                className={`px-4 sm:px-6 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTrack === 'competitive'
                    ? 'bg-white text-black font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                01 // Competitive (BPSC, SI, TET)
              </button>
              <button
                type="button"
                onClick={() => setActiveTrack('entrance')}
                className={`px-4 sm:px-6 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTrack === 'entrance'
                    ? 'bg-white text-black font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                02 // Entrance (AMU, Jamia)
              </button>
              <button
                type="button"
                onClick={() => setActiveTrack('school')}
                className={`px-4 sm:px-6 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTrack === 'school'
                    ? 'bg-white text-black font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                03 // School (CBSE 6-12)
              </button>
            </div>

            {/* High-Contrast Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a
                href="#courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-black font-mono text-xs font-black tracking-[0.16em] uppercase hover:bg-[#CCFF00] hover:text-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(204,255,0,0.5)]"
              >
                <span>EXPLORE ALL COURSES</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                to={ROUTES.MOCK_TESTS}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/[0.05] border border-white/20 hover:border-white/40 hover:bg-white/10 text-white font-mono text-xs tracking-[0.16em] uppercase font-bold transition-all"
              >
                <span>TAKE FREE MOCK TEST</span>
                <ArrowUpRight className="w-4 h-4 text-[#CCFF00]" />
              </Link>
            </div>

            {/* Live Trust Badges Strip */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 border-t border-white/5 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
                14,200+ Active Students
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
                94.8% First-Attempt Success
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
                450+ All-India Rankers
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00]" />
                100% NTA & NCERT Aligned
              </span>
            </div>
          </div>

          {/* Interactive Live Hero Terminal Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-[#0E121A] border border-white/10 overflow-hidden shadow-2xl relative">
            <div className="px-5 py-3.5 bg-black/40 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-400 uppercase tracking-widest">
                  SYS: LIVE CLASS & EXAM ENGINE // SESSION 2026-27
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#CCFF00] bg-[#CCFF00]/10 px-2.5 py-0.5 rounded-full border border-[#CCFF00]/20 font-bold">
                ● 1,420 STUDENTS IN MOCK EXAM ROOM
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase block mb-1">
                    ACTIVE BATCH
                  </span>
                  <h4 className="font-display font-extrabold text-white text-base uppercase">
                    {activeTrack === 'competitive'
                      ? 'BPSC TRE 4.0 & BIHAR SI COMMANDO'
                      : activeTrack === 'entrance'
                      ? 'AMU & JAMIA 11TH SCIENCE ENTRANCE'
                      : 'CBSE CLASS 10 BOARD MISSION 95+'}
                  </h4>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">SYLLABUS PACING</span>
                  <span className="text-[#CCFF00] font-bold">88% COMPLETED</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase block mb-1">
                    ALL-INDIA MOCK RANK
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-black text-2xl text-white">AIR 04</span>
                    <span className="font-mono text-xs text-emerald-400 font-bold">TOP 0.1%</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">TEST ACCURACY</span>
                  <span className="text-white font-bold">96.4% ACCURACY</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase block mb-1">
                    DOUBT RESOLUTION SPEED
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-black text-2xl text-white">~8 MINS</span>
                    <span className="font-mono text-xs text-[#CCFF00] font-bold">VERIFIED</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">TEACHER STATUS</span>
                  <span className="text-emerald-400 font-bold">● 18 FACULTY ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CONTINUOUS INFINITE MARQUEE BANNER (JoinScrub iconic) */}
      {/* ======================================================== */}
      <section className="border-y border-white/10 bg-[#0A0D14] py-3.5 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex items-center gap-8 font-mono text-xs uppercase tracking-[0.2em] font-semibold text-slate-300">
          <span>✦ CBSE CLASS 6-12 FOUNDATION</span>
          <span className="text-[#CCFF00]">✦ BPSC TRE 3.0 & 4.0</span>
          <span>✦ BIHAR SI COMMANDO BATCH</span>
          <span className="text-[#00F59B]">✦ AMU & JAMIA ENTRANCE PREP</span>
          <span>✦ UP SUPER TET PEDAGOGY</span>
          <span className="text-amber-400">✦ NTA-GRADE TIMED MOCK TESTS</span>
          <span>✦ 1-ON-1 DOUBT ENGINE</span>
          <span className="text-[#CCFF00]">✦ 100% NCERT ALIGNED STUDY NOTES</span>
          <span>✦ 450+ ALL-INDIA MERIT TOPPERS</span>
          {/* Duplicate loop */}
          <span>✦ CBSE CLASS 6-12 FOUNDATION</span>
          <span className="text-[#CCFF00]">✦ BPSC TRE 3.0 & 4.0</span>
          <span>✦ BIHAR SI COMMANDO BATCH</span>
          <span className="text-[#00F59B]">✦ AMU & JAMIA ENTRANCE PREP</span>
          <span>✦ UP SUPER TET PEDAGOGY</span>
          <span className="text-amber-400">✦ NTA-GRADE TIMED MOCK TESTS</span>
          <span>✦ 1-ON-1 DOUBT ENGINE</span>
          <span className="text-[#CCFF00]">✦ 100% NCERT ALIGNED STUDY NOTES</span>
          <span>✦ 450+ ALL-INDIA MERIT TOPPERS</span>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. THE OLD WAY VS THE BRAINSTORM ENGINE                   */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="ARCHITECTURE COMPARISON"
            tagNumber="01"
            title="THE TRADITIONAL COACHING MODEL IS"
            highlight="OBSOLETE."
            subtitle="Legacy coaching centers sell inflated promises with zero individual attention. Brainstorm Academy replaces rote chaos with modern, diagnostic-driven learning infrastructure."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* The Old Way Card */}
            <div className="p-8 rounded-3xl glass-card-subtle border-rose-500/20 shadow-[0_12px_36px_rgba(244,63,94,0.06)] relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <span className="font-mono text-xs text-rose-400 tracking-widest uppercase font-bold">
                  [ 01 // THE OLD WAY ]
                </span>
                <span className="text-xs font-mono text-rose-400/80 uppercase">
                  TRADITIONAL OFFLINE TUITIONS
                </span>
              </div>

              <ul className="space-y-5">
                {[
                  '100+ students packed into crowded coaching halls where introverts never get to ask questions.',
                  'Outdated rote-learning sheets completely disconnected from changing BPSC and NTA question patterns.',
                  'Blind test attempts without question-by-question analytics, negative marking breakdowns, or timing metrics.',
                  'Hefty upfront fees of ₹40,000–₹80,000 with zero refund flexibility or missed-class backup.',
                  'Doubts left unanswered for days, causing foundational learning gaps to compound.',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 text-sm text-slate-400 font-sans">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-mono font-bold">
                      ✕
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The Brainstorm Way Card */}
            <div className="p-8 rounded-3xl glass-cockpit border-[#CCFF00]/30 shadow-[0_0_50px_rgba(204,255,0,0.08)] relative overflow-hidden">
              {/* Subtle top specular glass highlight */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCFF00]/40 to-transparent" />

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <span className="font-mono text-xs text-[#CCFF00] tracking-widest uppercase font-bold">
                  [ 02 // THE BRAINSTORM ENGINE ]
                </span>
                <span className="text-xs font-mono text-[#CCFF00] uppercase font-bold">
                  PRECISION ACADEMIC PLATFORM
                </span>
              </div>

              <ul className="space-y-5">
                {[
                  'Bite-sized, high-yield conceptual lessons taught by experienced subject specialists and exam toppers.',
                  'Authentic NTA-style CBT test room with instant All-India rank, time per question, and weak-topic diagnostics.',
                  'Dedicated 1-on-1 doubt resolution portal where expert mentors answer step-by-step.',
                  '100% transparent and affordable pricing with free introductory batches and lifetime lecture replays.',
                  'Structured curriculum blueprints for BPSC TRE, Bihar SI, Super TET, AMU/Jamia, and CBSE 6–12.',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 text-sm text-slate-200 font-sans">
                    <span className="w-5 h-5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-mono font-bold shadow-[0_0_12px_rgba(204,255,0,0.3)]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. THE 5-STEP ENGINE (Glassmorphism Process Cards)       */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 border-b border-white/5 bg-[#060709] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="SYSTEM WORKFLOW"
            tagNumber="02"
            title="HOW THE BRAINSTORM ENGINE"
            highlight="CRACKS RANKS."
            subtitle="Five systematic phases designed to take an aspirant from foundational uncertainty to verified exam top rank."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                number: '01',
                title: 'DIAGNOSTIC ONBOARDING',
                desc: 'Take an instant 15-minute diagnostic test to benchmark your current syllabus mastery and identify weak micro-topics.',
                tag: 'PHASE 01',
              },
              {
                number: '02',
                title: 'TARGETED BATCH SYNC',
                desc: 'Get automatically assigned to specialized cohorts for BPSC, Bihar SI, AMU/Jamia entrance, or CBSE board classes.',
                tag: 'PHASE 02',
              },
              {
                number: '03',
                title: 'DAILY LIVE MASTERY',
                desc: 'Attend interactive live lectures, download crisp PDF notes, and solve 10 years of authentic past exam questions.',
                tag: 'PHASE 03',
              },
              {
                number: '04',
                title: 'PROCTORED CBT MOCK',
                desc: 'Practice under real exam conditions with strict countdown timers, negative marking penalties, and peer percentiles.',
                tag: 'PHASE 04',
              },
              {
                number: '05',
                title: 'MERIT LIST SELECTION',
                desc: 'Enter exam day with confidence, flawless speed-accuracy balance, and secure your target university or government post.',
                tag: 'PHASE 05',
              },
            ].map((step) => (
              <div
                key={step.number}
                className="p-6 rounded-2xl glass-cockpit-interactive flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-black text-white group-hover:text-[#CCFF00] transition-colors">
                      {step.number}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 glass-pill px-2.5 py-0.5 rounded-full">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-white uppercase tracking-tight mb-3">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-slate-300">
                  <span>STEP // {step.number}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#CCFF00]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE PREP VELOCITY & SCORE ESTIMATOR TOOL      */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 border-b border-white/5 relative">
        {/* Subtle Ambient Aurora Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#38BDF8]/10 via-[#CCFF00]/10 to-[#8B5CF6]/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeading
            tag="INTERACTIVE TOOLS"
            tagNumber="03"
            title="PREP VELOCITY &"
            highlight="SCORE PREDICTOR."
            subtitle="Configure your target exam and daily study commitment to calculate your projected percentile and time to full syllabus mastery."
          />

          <div className="p-8 sm:p-10 rounded-3xl glass-cockpit shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
            {/* Top specular highlight */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Input Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <label className="block font-mono text-xs text-slate-400 uppercase tracking-wider mb-2">
                  01 // SELECT YOUR TARGET EXAMINATION
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bpsc', label: 'BPSC TRE 4.0' },
                    { id: 'amu', label: 'AMU / JAMIA' },
                    { id: 'school', label: 'CBSE 10 & 12' },
                  ].map((exam) => (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setCalcExam(exam.id)}
                      className={`p-3 rounded-2xl border text-left font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        calcExam === exam.id
                          ? 'border-[#CCFF00] bg-[#CCFF00]/15 text-white font-bold shadow-[0_0_20px_rgba(204,255,0,0.15)]'
                          : 'border-white/10 glass-pill text-slate-400 hover:text-white'
                      }`}
                    >
                      {exam.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                    02 // DAILY COMMITTED STUDY HOURS
                  </label>
                  <span className="font-mono text-xs text-[#CCFF00] font-bold">
                    {dailyHours} HOURS / DAY
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full accent-[#CCFF00] cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-1">
                  <span>2h (Casual)</span>
                  <span>6h (Intensive)</span>
                  <span>10h (Full-time Aspirant)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                    03 // CURRENT BASELINE MOCK TEST SCORE
                  </label>
                  <span className="font-mono text-xs text-white font-bold">
                    {baselineScore}% ACCURACY
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="90"
                  step="5"
                  value={baselineScore}
                  onChange={(e) => setBaselineScore(Number(e.target.value))}
                  className="w-full accent-[#CCFF00] cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[10px] text-slate-500 mt-1">
                  <span>40% (Beginner)</span>
                  <span>65% (Intermediate)</span>
                  <span>90% (Advanced)</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Stats in Frosted Glass Panel */}
            <div className="lg:col-span-5 p-6 rounded-2xl glass-card-subtle flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block mb-4">
                  PREDICTIVE ALGORITHM OUTPUT
                </span>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      PROJECTED EXAM PERCENTILE
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-black text-3xl sm:text-4xl text-[#CCFF00]">
                        {projectedPercentile}th
                      </span>
                      <span className="font-mono text-xs text-emerald-400 font-bold">PERCENTILE</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block mb-1">
                        TIMELINE TO MASTERY
                      </span>
                      <span className="font-display font-black text-xl text-white">
                        {weeksToMastery} WEEKS
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block mb-1">
                        RECOMMENDED MOCKS
                      </span>
                      <span className="font-display font-black text-xl text-white">
                        {dailyHours >= 6 ? '28 Full Mocks' : '16 Full Mocks'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5">
                <Link
                  to={ROUTES.REGISTER}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-[#CCFF00] hover:text-black transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                >
                  <span>LOCK IN PREP ROADMAP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. CURATED COURSE CATALOG                                 */}
      {/* ======================================================== */}
      <section id="courses" className="py-20 lg:py-28 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="FEATURED CURRICULUM"
            tagNumber="04"
            title="SYSTEMATIC BATCHES FOR"
            highlight="SERIOUS ASPIRANTS."
            subtitle="Explore our comprehensive batches with full syllabus coverage, chapter-wise mock tests, and verified mentor doubt support."
          />

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-10">
            {SEARCH_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedCategory(pill.id)}
                className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                  selectedCategory === pill.id
                    ? 'bg-white text-black border-white font-extrabold shadow-md'
                    : 'glass-pill text-slate-400 hover:text-white'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.slice(0, 6).map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
                indexNumber={idx + 1}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to={ROUTES.SCHOOL_COURSES}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-pill hover:border-white/40 text-white font-mono text-xs font-bold tracking-widest uppercase transition-all"
            >
              <span>VIEW COMPLETE COURSE REPOSITORY</span>
              <ArrowUpRight className="w-4 h-4 text-[#CCFF00]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. DUAL PORTAL SHOWCASE                                  */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 border-b border-white/5 bg-[#060709] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="DUAL PORTAL ARCHITECTURE"
            tagNumber="05"
            title="PURPOSE-BUILT PORTALS FOR"
            highlight="STUDENTS & EDUCATORS."
            subtitle="Role-tailored infrastructure designed to eliminate friction and maximize academic performance."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Portal Card */}
            <div className="p-8 rounded-3xl glass-cockpit-interactive flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs text-[#CCFF00] tracking-widest uppercase font-bold">
                    [ 01 // STUDENT PORTAL ]
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 uppercase glass-pill px-3 py-1 rounded-full">
                    FREE ACCESS INCLUDED
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-white uppercase mb-4">
                  THE ASPIRANT COCKPIT
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-sans">
                  Full-screen distraction-free examination rooms, chapter progress trackers, downloadable handwritten revision notes, and instant mentor doubt submission.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    ✓ Proctored CBT Exam Room
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    ✓ Chapter Video Player
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    ✓ PDF Revision Viewer
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    ✓ Rank Diagnostic Reports
                  </div>
                </div>
              </div>

              <Link
                to={ROUTES.STUDENT.ROOT}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-[#CCFF00] hover:text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                <span>ENTER STUDENT PORTAL</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Teacher / Faculty Portal Card */}
            <div className="p-8 rounded-3xl glass-cockpit-interactive flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs text-amber-400 tracking-widest uppercase font-bold">
                    [ 02 // TEACHER & FACULTY ]
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 uppercase glass-pill px-3 py-1 rounded-full">
                    VERIFIED EDUCATORS
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-white uppercase mb-4">
                  THE PEDAGOGY ENGINE
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-sans">
                  Powerful lesson creation workflows, interactive test builders with negative marking controls, question banks, and student doubt management consoles.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    ✓ Dynamic Test Series Builder
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    ✓ Lesson & Video Manager
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    ✓ Student Doubt Console
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    ✓ Enrollment Analytics
                  </div>
                </div>
              </div>

              <Link
                to={ROUTES.TEACHER.ROOT}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full glass-pill hover:border-white/40 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>FACULTY DASHBOARD</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. WALL OF TOPPERS / VERIFIED TESTIMONIALS               */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="VERIFIED EVIDENCE"
            tagNumber="06"
            title="REAL RESULTS FROM"
            highlight="TOP PERFORMERS."
            subtitle="Meet the students who transformed their exam scores with Brainstorm Academy's structured pedagogy and mock tests."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Mohd. Zeeshan',
                exam: 'AMU 11th Science Entrance',
                rank: 'AIR 14',
                quote:
                  'The chapter-wise PYQ analysis and negative-marking mock tests gave me the exact timing strategy I needed. Cracked AMU on my first attempt!',
                year: '2025 Batch',
              },
              {
                name: 'Priyanka Kumari',
                exam: 'BPSC TRE 2.0 (Classes 9-10)',
                rank: 'Selected / 1st List',
                quote:
                  'Brainstorm Academy’s pedagogy modules and bilingual test series are leagues ahead of offline coachings in Patna. Highly recommended for all teachers.',
                year: '2024 Batch',
              },
              {
                name: 'Aman Verma',
                exam: 'CBSE Class 10 Board',
                rank: '97.2% Aggregate',
                quote:
                  'The revision notes and doubt solving engine cleared all my physics and math doubts before exams. Score shot up from 78% in pre-boards to 97% in boards.',
                year: '2025 Batch',
              },
            ].map((topper, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl glass-cockpit-interactive flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-[#CCFF00] font-bold">
                      {topper.rank}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 uppercase glass-pill px-2.5 py-0.5 rounded-full">
                      {topper.year}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic mb-6 font-sans">
                    "{topper.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h4 className="font-display font-extrabold text-white text-sm uppercase">
                    {topper.name}
                  </h4>
                  <span className="font-mono text-xs text-slate-400">
                    {topper.exam}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 9. FAQ ACCORDION                                         */}
      {/* ======================================================== */}
      <section className="py-20 lg:py-28 border-b border-white/5 bg-[#060709]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            center
            tag="FREQUENTLY ASKED QUESTIONS"
            tagNumber="07"
            title="EVERYTHING YOU NEED TO"
            highlight="KNOW."
            subtitle="Clear, transparent answers about our curriculum, test series, admissions, and faculty."
          />
          <FAQSection />
        </div>
      </section>

      {/* ======================================================== */}
      {/* 10. FLOATING GLASSMORPHIC CONVERSION CTA ISLAND           */}
      {/* ======================================================== */}
      <section className="py-24 lg:py-36 relative overflow-hidden">
        {/* Hardware-optimized Glowing Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(204,255,0,0.08),transparent_50%),radial-gradient(ellipse_at_70%_50%,rgba(56,189,248,0.08),transparent_50%),radial-gradient(ellipse_at_50%_90%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* The Glassmorphic Cockpit Island Card */}
          <div className="glass-cockpit rounded-3xl p-8 sm:p-14 lg:p-16 text-center relative overflow-hidden shadow-[0_25px_90px_rgba(0,0,0,0.9)] border border-white/20 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent backdrop-blur-3xl">
            {/* Top Glowing Specular Glass Highlight */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#38BDF8] to-transparent shadow-[0_0_20px_#CCFF00]" />
            <div className="absolute top-0 left-1/3 right-1/3 h-[1px] bg-white shadow-[0_0_10px_#ffffff]" />

            {/* Architectural Crosshair Corners */}
            <span className="absolute top-3.5 left-4 font-mono text-xs text-white/30 select-none">+</span>
            <span className="absolute top-3.5 right-4 font-mono text-xs text-white/30 select-none">+</span>
            <span className="absolute bottom-3.5 left-4 font-mono text-xs text-white/30 select-none">+</span>
            <span className="absolute bottom-3.5 right-4 font-mono text-xs text-white/30 select-none">+</span>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-[#CCFF00] font-mono text-xs uppercase tracking-widest mb-6 border border-[#CCFF00]/30 shadow-[0_0_15px_rgba(204,255,0,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span>SESSION 2026-27 ADMISSIONS ACTIVE</span>
            </div>

            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white mb-6 leading-tight">
              CRACK YOUR DREAM EXAM{' '}
              <span className="font-editorial italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] via-white to-[#38BDF8] normal-case block">
                In 2026.
              </span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
              Join over 14,200 ambitious aspirants preparing with precision pedagogy, interactive tests, and verified mentor guidance.
            </p>

            {/* Floating Glass Pill Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10 max-w-2xl mx-auto">
              <span className="glass-pill px-3.5 py-1.5 rounded-full font-mono text-[11px] text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border border-white/15">
                <span className="text-[#CCFF00]">✦</span> 14,200+ Active Aspirants
              </span>
              <span className="glass-pill px-3.5 py-1.5 rounded-full font-mono text-[11px] text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border border-white/15">
                <span className="text-[#38BDF8]">⚡</span> 1-on-1 Doubt Engine
              </span>
              <span className="glass-pill px-3.5 py-1.5 rounded-full font-mono text-[11px] text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border border-white/15">
                <span className="text-[#A855F7]">🛡</span> 100% NTA & NCERT Aligned
              </span>
              <span className="glass-pill px-3.5 py-1.5 rounded-full font-mono text-[11px] text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border border-white/15">
                <span className="text-emerald-400">🎓</span> 450+ Verified Top Rankers
              </span>
            </div>

            {/* High-Impact Glass CTA Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={ROUTES.REGISTER}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full bg-white text-black font-mono text-xs font-black tracking-[0.16em] uppercase hover:bg-[#CCFF00] hover:text-black transition-all shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_45px_rgba(204,255,0,0.6)] cursor-pointer"
              >
                <span>CREATE FREE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to={ROUTES.MOCK_TESTS}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full glass-pill hover:border-white/50 text-white font-mono text-xs tracking-[0.16em] uppercase font-bold transition-all cursor-pointer border border-white/20"
              >
                <span>START FREE MOCK TEST</span>
                <ArrowUpRight className="w-4 h-4 text-[#CCFF00]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
