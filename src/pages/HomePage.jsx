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
  Users,
  Clock,
  Star,
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

  // Interactive Prep Velocity Calculator State
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
    <div className="w-full bg-[#F8FAFC] text-slate-900 overflow-hidden relative">
      
      {/* ======================================================== */}
      {/* 1. HERO SECTION (EduCore Two-Column Academic Layout)    */}
      {/* ======================================================== */}
      <section className="relative pt-12 sm:pt-16 pb-16 lg:pb-24 bg-gradient-to-b from-blue-50/70 via-[#F8FAFC] to-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Heading, Subtitle & Prominent Actions */}
            <div className="lg:col-span-7 text-left">
              
              {/* Educational Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wide mb-6 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Premier Education & Exam Preparation</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E3A8A] tracking-tight leading-[1.15] mb-4 sm:mb-6">
                Learn Today.{' '}
                <span className="text-[#2563EB] block sm:inline">Lead Tomorrow.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-sm sm:text-lg text-slate-600 font-sans leading-relaxed mb-6 sm:mb-8 max-w-xl">
                Your complete learning platform for school courses, competitive exams, university entrance preparation, and mock tests.
              </p>

              {/* Prominent Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 mb-8 sm:mb-10">
                <a
                  href="#courses"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-sans text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-98"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-sans text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-98"
                >
                  <span>Start Learning</span>
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-slate-200/80">
                <div>
                  <p className="text-xl sm:text-2xl font-bold font-display text-slate-900">14,200+</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Enrolled Students</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold font-display text-blue-600">98%</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Exam Pass Rate</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold font-display text-emerald-600">450+</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Merit Rankers</p>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Academic Spotlight Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-7 shadow-md relative overflow-hidden">
                {/* Decorative top accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-400" />

                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">Academic Spotlight</h3>
                      <p className="text-xs text-slate-500">Live Learning Batches 2026–27</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    Live Batches
                  </span>
                </div>

                {/* Persona Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
                  <button
                    type="button"
                    onClick={() => setActiveTrack('competitive')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                      activeTrack === 'competitive'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Competitive
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTrack('entrance')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                      activeTrack === 'entrance'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Entrance
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTrack('school')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                      activeTrack === 'school'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    School 6-12
                  </button>
                </div>

                {/* Active Program Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                      {activeTrack === 'competitive' ? 'Government Recruitment' : activeTrack === 'entrance' ? 'Central University' : 'CBSE Curriculum'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">Batch 2026</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 leading-snug">
                    {activeTrack === 'competitive'
                      ? 'BPSC TRE 4.0 & Bihar SI Target Cohort'
                      : activeTrack === 'entrance'
                      ? 'AMU & Jamia Millia 11th Science Entrance'
                      : 'Class 10 CBSE Board Exam Foundation'}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      140+ Lessons
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                      24 Mock Tests
                    </span>
                  </div>
                </div>

                {/* Quick Academic Features */}
                <div className="space-y-2.5 mb-5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>NCERT & NTA syllabus-aligned video lessons & PDF notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Timed CBT Mock tests with instant performance analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Step-by-step doubt resolution support by expert faculty</span>
                  </div>
                </div>

                {/* CTA Link */}
                <Link
                  to={ROUTES.MOCK_TESTS}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition-colors"
                >
                  <span>Take Free Diagnostic Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. PROGRAM CATEGORY MARQUEE BAR                          */}
      {/* ======================================================== */}
      <section className="border-b border-slate-200 bg-white py-3.5 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <span>• CBSE Class 6–12 Foundation</span>
          <span className="text-blue-600">• BPSC TRE 3.0 & 4.0</span>
          <span>• Bihar SI Preparation</span>
          <span className="text-indigo-600">• AMU & Jamia Millia Entrance</span>
          <span>• UP Super TET Coaching</span>
          <span className="text-amber-600">• NTA CBT Mock Test Series</span>
          <span>• 1-on-1 Student Doubt Clearing</span>
          <span className="text-emerald-600">• 100% NCERT Aligned Revision Notes</span>
          <span>• 450+ Verified All-India Selections</span>
          {/* Duplicate loop */}
          <span>• CBSE Class 6–12 Foundation</span>
          <span className="text-blue-600">• BPSC TRE 3.0 & 4.0</span>
          <span>• Bihar SI Preparation</span>
          <span className="text-indigo-600">• AMU & Jamia Millia Entrance</span>
          <span>• UP Super TET Coaching</span>
          <span className="text-amber-600">• NTA CBT Mock Test Series</span>
          <span>• 1-on-1 Student Doubt Clearing</span>
          <span className="text-emerald-600">• 100% NCERT Aligned Revision Notes</span>
          <span>• 450+ Verified All-India Selections</span>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CURATED COURSE CATALOG & BROWSER                      */}
      {/* ======================================================== */}
      <section id="courses" className="py-16 lg:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <SectionHeading
            tag="Course Catalog"
            tagNumber="01"
            title="Comprehensive Courses for"
            highlight="School & Competitive Exams."
            subtitle="Explore our syllabus-aligned courses with chapter video lessons, conceptual notes, derivations, and board examination test series."
          />

          {/* Search & Category Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-8">
            <div className="flex flex-col md:flex-row items-center gap-3.5 mb-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by course name, exam, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition"
                />
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Clear Search
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {SEARCH_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedCategory(pill.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === pill.id
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
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

          {filteredCourses.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-6">
              <p className="text-base font-semibold text-slate-800 mb-1">No courses match your filter</p>
              <p className="text-xs text-slate-500 mb-4">Try clearing your search query or selecting a different category.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs"
              >
                Reset Filters
              </button>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to={ROUTES.SCHOOL_COURSES}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:border-blue-400 hover:bg-slate-50 text-slate-800 text-xs font-semibold uppercase tracking-wider transition-all shadow-xs"
            >
              <span>Explore All Courses Repository</span>
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </Link>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. THE 5-STEP STRUCTURED PEDAGOGY                       */}
      {/* ======================================================== */}
      <section className="py-16 lg:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <SectionHeading
            tag="Learning Methodology"
            tagNumber="02"
            title="How Brainstorm Academy"
            highlight="Powers Academic Success."
            subtitle="Five systematic phases designed to take an aspirant from foundational concept learning to confident top exam performance."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              {
                number: '01',
                title: 'Diagnostic Evaluation',
                desc: 'Take an initial 15-minute diagnostic test to benchmark current syllabus mastery and identify weak micro-topics.',
                tag: 'Phase 01',
              },
              {
                number: '02',
                title: 'Targeted Curriculum',
                desc: 'Get aligned with structured syllabus schedules for CBSE school grades, BPSC, Bihar SI, or university entrance exams.',
                tag: 'Phase 02',
              },
              {
                number: '03',
                title: 'Concept Video Lessons',
                desc: 'Watch high-yield chapter video lectures, download curated PDF revision notes, and solve standard past examination questions.',
                tag: 'Phase 03',
              },
              {
                number: '04',
                title: 'Proctored Mock Practice',
                desc: 'Practice under real exam conditions with strict timer controls, negative marking, and detailed score breakdowns.',
                tag: 'Phase 04',
              },
              {
                number: '05',
                title: 'Doubt & Exam Mastery',
                desc: 'Clear persistent doubts 1-on-1 with expert educators and enter exam day fully prepared with proven accuracy.',
                tag: 'Phase 05',
              },
            ].map((step) => (
              <div
                key={step.number}
                className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold font-display text-blue-600">
                      {step.number}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Step {step.number}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE PREP VELOCITY CALCULATOR                  */}
      {/* ======================================================== */}
      <section className="py-16 lg:py-24 border-b border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <SectionHeading
            tag="Student Planning Tool"
            tagNumber="03"
            title="Study Planner &"
            highlight="Score Estimator."
            subtitle="Configure your target exam and daily study commitment to calculate your projected percentile and time to full syllabus mastery."
          />

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Input Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2.5">
                  1. Select Target Examination
                </label>
                <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2 sm:gap-2.5">
                  {[
                    { id: 'bpsc', label: 'BPSC TRE 4.0' },
                    { id: 'amu', label: 'AMU & Jamia' },
                    { id: 'school', label: 'CBSE 10 & 12' },
                  ].map((exam) => (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setCalcExam(exam.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        calcExam === exam.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {exam.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    2. Daily Study Commitment
                  </label>
                  <span className="text-xs font-bold text-blue-600">
                    {dailyHours} Hours / Day
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>2 hrs (Foundation)</span>
                  <span>6 hrs (Standard)</span>
                  <span>10 hrs (Intensive)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    3. Current Diagnostic Score
                  </label>
                  <span className="text-xs font-bold text-slate-900">
                    {baselineScore}% Accuracy
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="90"
                  step="5"
                  value={baselineScore}
                  onChange={(e) => setBaselineScore(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>40% (Beginner)</span>
                  <span>65% (Intermediate)</span>
                  <span>90% (Advanced)</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Stats Panel */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide block mb-3">
                  Projected Preparation Output
                </span>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-xl bg-white border border-blue-100 shadow-xs">
                    <span className="text-xs text-slate-500 uppercase tracking-wide block mb-1">
                      Projected Exam Percentile
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-extrabold text-3xl sm:text-4xl text-blue-600">
                        {projectedPercentile}th
                      </span>
                      <span className="text-xs text-emerald-600 font-bold">Percentile</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-xs">
                      <span className="text-[11px] text-slate-500 uppercase block mb-1">
                        Time to Mastery
                      </span>
                      <span className="font-bold text-lg text-slate-900">
                        {weeksToMastery} Weeks
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-xs">
                      <span className="text-[11px] text-slate-500 uppercase block mb-1">
                        Mock Tests Needed
                      </span>
                      <span className="font-bold text-lg text-slate-900">
                        {dailyHours >= 6 ? '28 Full Mocks' : '16 Full Mocks'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-blue-200/60">
                <Link
                  to={ROUTES.REGISTER}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <span>Start Your Learning Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. PURPOSE-BUILT PORTALS (Student, Teacher, Admin)      */}
      {/* ======================================================== */}
      <section className="py-16 lg:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <SectionHeading
            tag="Platform Architecture"
            tagNumber="04"
            title="Integrated Experience for"
            highlight="Students, Teachers & Administrators."
            subtitle="Role-tailored dashboards designed to keep educational content organized, tests transparent, and progress visible."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Student Portal Card */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  Student Dashboard
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                  Enrolled courses, lesson progress, downloadable revision notes, authentic CBT practice tests, and question-by-question analytics.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>CBT Mock Test Room</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Chapter Progress Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Ask a Doubt Mentorship</span>
                  </div>
                </div>
              </div>
              <Link
                to={ROUTES.STUDENT.ROOT}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Enter Student Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Teacher Portal Card */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  Teacher Dashboard
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                  Manage assigned curriculum, upload notes and assignments, build practice tests, and resolve student doubts efficiently.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Course & Material Uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Test Series Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Doubt Resolution Center</span>
                  </div>
                </div>
              </div>
              <Link
                to={ROUTES.TEACHER.ROOT}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Enter Teacher Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Admin Dashboard Card */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  Admin Dashboard
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                  Complete administrative control center for user management, teacher provisioning, payment verification, and platform analytics.
                </p>
                <div className="space-y-2 mb-6 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>User & Faculty Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>Audit Logs & Compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>Platform Statistics & Reports</span>
                  </div>
                </div>
              </div>
              <Link
                to={ROUTES.ADMIN.ROOT}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. STUDENT SUCCESS & TESTIMONIALS                       */}
      {/* ======================================================== */}
      <section className="py-16 lg:py-24 border-b border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <SectionHeading
            tag="Student Feedback"
            tagNumber="05"
            title="Real Feedback from"
            highlight="Our Top Performers."
            subtitle="Meet students and teachers who achieved their academic and examination goals with Brainstorm Academy."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Mohd. Zeeshan',
                exam: 'AMU 11th Science Entrance',
                rank: 'AIR 14',
                quote:
                  'The chapter-wise past question analysis and negative-marking mock tests gave me the exact timing strategy I needed. Cracked AMU on my first attempt!',
                year: '2025 Batch',
              },
              {
                name: 'Priyanka Kumari',
                exam: 'BPSC TRE 2.0 (Classes 9–10)',
                rank: 'Selected / 1st List',
                quote:
                  'Brainstorm Academy’s pedagogy modules and bilingual test series are leagues ahead. The doubt clearing and practice tests made all the difference.',
                year: '2024 Batch',
              },
              {
                name: 'Aman Verma',
                exam: 'CBSE Class 10 Board',
                rank: '97.2% Aggregate',
                quote:
                  'The revision notes and practice problems cleared all my physics and math doubts before exams. My scores improved consistently every month.',
                year: '2025 Batch',
              },
            ].map((topper, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {topper.rank}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {topper.year}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic mb-6 font-sans">
                    "{topper.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {topper.name}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {topper.exam}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. FAQ ACCORDION                                         */}
      {/* ======================================================== */}
      <section className="py-16 lg:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            center
            tag="Frequently Asked Questions"
            tagNumber="06"
            title="Everything You Need to"
            highlight="Know."
            subtitle="Clear, transparent answers about our curriculum, test series, admissions, and faculty."
          />
          <FAQSection />
        </div>
      </section>

      {/* ======================================================== */}
      {/* 9. BOTTOM CTA BANNER                                     */}
      {/* ======================================================== */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Admissions Active for 2026–27 Session</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Start Your Academic Journey Today
          </h2>

          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-sans">
            Join thousands of students and teachers already learning, testing, and achieving top ranks with Brainstorm Academy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to={ROUTES.REGISTER}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold text-xs sm:text-sm shadow-md hover:bg-slate-50 transition-colors"
            >
              <span>Create Free Student Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={ROUTES.MOCK_TESTS}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-800/80 hover:bg-blue-800 text-white border border-blue-400/40 font-semibold text-xs sm:text-sm transition-colors"
            >
              <span>Take Free Mock Test</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
