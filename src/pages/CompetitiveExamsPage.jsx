import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Zap, Trophy, ShieldCheck, BookOpen, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { SectionHeading } from '../components/common/SectionHeading';
import CourseCard from '../components/CourseCard';
import { courseService } from '../services/courseService';
import { Skeleton } from '../components/ui/Loading';
import { ROUTES } from '../constants/routes';

export default function CompetitiveExamsPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadCompetitiveCourses() {
      try {
        setLoading(true);
        const list = await courseService.getCoursesByCategory('competitive-exams');
        if (isMounted) {
          if (list.length === 0) {
            const all = await courseService.getAllPublishedCourses();
            setCourses(all.filter((c) => c.categoryId === 'competitive-exams' || c.targetExam));
          } else {
            setCourses(list);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[CompetitiveExamsPage] Error loading courses:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadCompetitiveCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = courses.filter((c) => {
    if (!c.isPublished) return false;
    if (activeExam !== 'all') {
      const matchTarget = c.targetExam?.toLowerCase().includes(activeExam.toLowerCase());
      const matchTitle = c.title.toLowerCase().includes(activeExam.toLowerCase());
      if (!matchTarget && !matchTitle) return false;
    }
    return true;
  });

  return (
    <div className="w-full bg-[#07080D] text-slate-100 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[#CCFF00] font-semibold">COMPETITIVE EXAMINATIONS</span>
        </div>

        {/* Header Hero Banner */}
        <div className="bg-[#0E121A] border border-white/10 rounded-3xl p-8 sm:p-12 mb-12 text-white relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/25 text-[#CCFF00] font-mono text-xs uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span>STATE & NATIONAL RECRUITMENT ENGINE</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight mb-4 text-white">
            TARGET GOVERNMENT{' '}
            <span className="font-editorial italic font-normal text-slate-300 normal-case">
              Recruitment Exams.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-8 font-sans">
            Specialized preparation batches for BPSC TRE (Teacher Recruitment 3.0 & 4.0), UP Super TET, BSSC (Inter & CGL), and Bihar SI (Daroga) with comprehensive General Studies and pedagogy blueprints.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to={ROUTES.MOCK_TESTS}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#CCFF00] hover:text-black transition-all shadow-md"
            >
              <span>PRACTICE CBT MOCK TESTS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Exam Filter Tabs */}
        <div className="mb-10">
          <h2 className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-3">
            FILTER BY TARGET EXAM:
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {[
              { id: 'all', label: 'All Competitive Batches' },
              { id: 'BPSC', label: 'BPSC TRE' },
              { id: 'Super TET', label: 'UP Super TET' },
              { id: 'BSSC', label: 'BSSC (Inter & CGL)' },
              { id: 'Bihar SI', label: 'Bihar SI (Daroga)' },
            ].map((exam) => (
              <button
                key={exam.id}
                onClick={() => setActiveExam(exam.id)}
                className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition cursor-pointer border ${
                  activeExam === exam.id
                    ? 'bg-white text-black border-white font-extrabold shadow-md'
                    : 'bg-[#0E121A] text-slate-400 hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                {exam.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="mb-8">
          <SectionHeading
            tag="CURATED BATCHES"
            tagNumber="02"
            title="AVAILABLE COMPETITIVE"
            highlight="COURSES."
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#0E121A] p-5 rounded-2xl border border-white/10 space-y-3">
                <Skeleton className="h-44 w-full rounded-xl bg-white/5" />
                <Skeleton className="h-5 w-3/4 rounded-lg bg-white/5" />
                <Skeleton className="h-4 w-1/2 rounded-lg bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-[#0E121A] rounded-2xl border border-white/10 p-8 mb-16">
            <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <h3 className="font-display font-extrabold text-white text-lg uppercase">No Competitive Courses Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              New competitive batches are updated regularly by administrative coordinators.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {filteredCourses.map((c, idx) => (
              <CourseCard key={c.id} course={c} indexNumber={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
