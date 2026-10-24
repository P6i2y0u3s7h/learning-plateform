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
    <div className="w-full bg-[#F8FAFC] text-slate-900 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-600 font-semibold">Competitive Examinations</span>
        </div>

        {/* Header Hero Banner (EduCore Theme) */}
        <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border border-blue-200/80 rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden shadow-sm">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>State & National Recruitment Engine</span>
          </div>

          <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 text-slate-900">
            Target Government{' '}
            <span className="text-blue-600">
              Recruitment Exams.
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
            Specialized preparation batches for BPSC TRE (Teacher Recruitment 3.0 & 4.0), UP Super TET, BSSC (Inter & CGL), and Bihar SI (Daroga) with comprehensive General Studies and pedagogy blueprints.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to={ROUTES.MOCK_TESTS}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm"
            >
              <span>Practice CBT Mock Tests</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Exam Filter Tabs */}
        <div className="mb-10">
          <h2 className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">
            Filter by Target Exam:
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
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  activeExam === exam.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-200 shadow-sm'
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
            tag="Curated Batches"
            tagNumber="02"
            title="Available Competitive"
            highlight="Courses."
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-sm">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/80 p-8 mb-16 shadow-sm">
            <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="font-bold text-slate-900 text-lg">No Competitive Courses Found</h3>
            <p className="text-xs text-slate-500 mt-1">
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
