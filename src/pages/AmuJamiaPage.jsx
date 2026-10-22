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
    <div className="w-full bg-[#07080D] text-slate-100 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[#CCFF00] font-semibold">AMU & JAMIA ENTRANCE</span>
        </div>

        {/* Header Hero Banner */}
        <div className="bg-[#0E121A] border border-white/10 rounded-3xl p-8 sm:p-12 mb-12 text-white relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/25 text-[#CCFF00] font-mono text-xs uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
            <span>CENTRAL UNIVERSITY ENTRANCE BLUEPRINT</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight mb-4 text-white">
            AMU & JAMIA MILLIA{' '}
            <span className="font-editorial italic font-normal text-slate-300 normal-case">
              Entrance Preparation.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-8 font-sans">
            Specialized coaching for Aligarh Muslim University (AMU) & Jamia Millia Islamia (JMI) Class 9, Class 11 (Science, Commerce, Arts), and Diploma Engineering entrance examinations.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to={ROUTES.MOCK_TESTS}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#CCFF00] hover:text-black transition-all shadow-md"
            >
              <span>PRACTICE ENTRANCE MOCK TESTS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-10">
          <h2 className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-3">
            FILTER ENTRANCE BATCHES:
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
                className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition cursor-pointer border ${
                  activeFilter === item.id
                    ? 'bg-white text-black border-white font-extrabold shadow-md'
                    : 'bg-[#0E121A] text-slate-400 hover:text-white border-white/10 hover:border-white/20'
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
            tag="UNIVERSITY ENTRANCE"
            tagNumber="02"
            title="AVAILABLE ENTRANCE"
            highlight="PROGRAMS."
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
            <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <h3 className="font-display font-extrabold text-white text-lg uppercase">No Entrance Batches Found</h3>
            <p className="text-xs text-slate-400 mt-1">
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
