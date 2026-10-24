import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Building2, BookOpen, Award, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { SectionHeading } from '../components/common/SectionHeading';
import CourseCard from '../components/CourseCard';
import { courseService } from '../services/courseService';
import { Skeleton } from '../components/ui/Loading';
import { ROUTES } from '../constants/routes';

export default function AmuJamiaPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadEntranceCourses() {
      try {
        setLoading(true);
        const list = await courseService.getCoursesByCategory('entrance-preparation');
        if (isMounted) {
          if (list.length === 0) {
            const all = await courseService.getAllPublishedCourses();
            setCourses(all.filter((c) => c.categoryId === 'entrance-preparation' || c.targetExam === 'AMU' || c.targetExam === 'Jamia'));
          } else {
            setCourses(list);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[AmuJamiaPage] Error loading courses:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadEntranceCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = courses.filter((c) => {
    if (!c.isPublished) return false;
    if (activeFilter === 'amu') {
      return c.targetExam?.toLowerCase().includes('amu') || c.title.toLowerCase().includes('amu');
    }
    if (activeFilter === 'jamia') {
      return c.targetExam?.toLowerCase().includes('jamia') || c.title.toLowerCase().includes('jamia');
    }
    if (activeFilter === 'class-9') {
      return c.title.toLowerCase().includes('class 9') || c.classGrade?.toLowerCase().includes('class 9');
    }
    if (activeFilter === 'class-11') {
      return c.title.toLowerCase().includes('class 11') || c.classGrade?.toLowerCase().includes('class 11');
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
          <span className="text-blue-600 font-semibold">AMU & Jamia Entrance</span>
        </div>

        {/* Header Hero Banner (EduCore Theme) */}
        <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border border-blue-200/80 rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden shadow-sm">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Central University Entrance Blueprint</span>
          </div>

          <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 text-slate-900">
            AMU & Jamia Millia{' '}
            <span className="text-blue-600">
              Entrance Preparation.
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
            Specialized coaching for Aligarh Muslim University (AMU) & Jamia Millia Islamia (JMI) Class 9, Class 11 (Science, Commerce, Arts), and Diploma Engineering entrance examinations.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to={ROUTES.MOCK_TESTS}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm"
            >
              <span>Practice Entrance Mock Tests</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-10">
          <h2 className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">
            Filter Entrance Batches:
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {[
              { id: 'all', label: 'All Entrance Batches' },
              { id: 'amu', label: 'AMU Aligarh' },
              { id: 'jamia', label: 'Jamia Millia Islamia' },
              { id: 'class-9', label: 'Class 9 Entrance' },
              { id: 'class-11', label: 'Class 11 & Diploma Entrance' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveFilter(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  activeFilter === item.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-200 shadow-sm'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="mb-8">
          <SectionHeading
            tag="University Entrance"
            tagNumber="02"
            title="Available Entrance"
            highlight="Programs."
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
            <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="font-bold text-slate-900 text-lg">No Entrance Batches Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check back or adjust filters to view other university entrance programs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {filteredCourses.map((course, idx) => (
              <CourseCard key={course.id} course={course} indexNumber={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
