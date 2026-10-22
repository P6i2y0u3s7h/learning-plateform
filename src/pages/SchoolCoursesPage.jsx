import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, ChevronRight, GraduationCap, Search, Layers, Sparkles } from 'lucide-react';
import { SectionHeading } from '../components/common/SectionHeading';
import CourseCard from '../components/CourseCard';
import { SCHOOL_CLASSES } from '../data/sampleData';
import { courseService } from '../services/courseService';
import { Skeleton } from '../components/ui/Loading';

export default function SchoolCoursesPage() {
  const [searchParams] = useSearchParams();
  const [activeClass, setActiveClass] = useState('all');
  const [activeStream, setActiveStream] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';

  useEffect(() => {
    let isMounted = true;
    async function loadSchoolCourses() {
      try {
        setLoading(true);
        const list = await courseService.getCoursesByCategory('school-courses');
        if (isMounted) {
          if (list.length === 0) {
            const allPublished = await courseService.getAllPublishedCourses();
            setCourses(allPublished.filter((c) => c.classGrade?.toLowerCase().includes('class')));
          } else {
            setCourses(list);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[SchoolCoursesPage] Error loading courses:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadSchoolCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = courses.filter((c) => {
    if (!c.isPublished) return false;

    // Search query
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;

    // Class filter
    if (activeClass !== 'all') {
      if (c.classGrade !== activeClass) return false;
    }

    // Stream filter (for Class 11 and 12)
    if (activeStream !== 'all') {
      if (c.stream !== activeStream) return false;
    }

    return true;
  });

  const isSeniorSecondary = activeClass === 'Class 11' || activeClass === 'Class 12';

  return (
    <div className="w-full bg-[#07080D] text-slate-100 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[#CCFF00] font-semibold">SCHOOL CURRICULUM</span>
        </div>

        {/* Page Header */}
        <div className="mb-10">
          <SectionHeading
            tag="CBSE & NCERT FOUNDATION"
            tagNumber="01"
            title="CLASSES 6–12 ACADEMIC"
            highlight="MASTERY."
            subtitle="NCERT-aligned comprehensive courses with chapter video lessons, conceptual notes, derivations, and board examination test series."
          />
        </div>

        {/* Class Selector Tabs */}
        <div className="mb-8">
          <h2 className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-3">
            SELECT GRADE LEVEL:
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveClass('all');
                setActiveStream('all');
              }}
              className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition cursor-pointer border ${
                activeClass === 'all'
                  ? 'bg-white text-black border-white font-extrabold shadow-md'
                  : 'bg-[#0E121A] text-slate-400 hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              All Grades (6–12)
            </button>
            {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
              <button
                key={cls}
                onClick={() => {
                  setActiveClass(cls);
                  if (cls !== 'Class 11' && cls !== 'Class 12') setActiveStream('all');
                }}
                className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition cursor-pointer border ${
                  activeClass === cls
                    ? 'bg-white text-black border-white font-extrabold shadow-md'
                    : 'bg-[#0E121A] text-slate-400 hover:text-white border-white/10 hover:border-white/20'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Stream Selector (Class 11 and 12) */}
        {(isSeniorSecondary || activeClass === 'all') && (
          <div className="mb-10 p-5 bg-[#0E121A] rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold text-[#CCFF00] uppercase tracking-wider block">
                Class 11 & 12 Academic Streams:
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Filter by board specialization</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Streams' },
                { id: 'Science PCM', label: 'Science PCM' },
                { id: 'Science PCB', label: 'Science PCB' },
                { id: 'Commerce', label: 'Commerce' },
                { id: 'Arts', label: 'Arts & Humanities' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setActiveStream(st.id)}
                  className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
                    activeStream === st.id
                      ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-sm'
                      : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#0E121A] p-5 rounded-2xl border border-white/10 space-y-3">
                <Skeleton className="h-44 w-full rounded-xl bg-white/5" />
                <Skeleton className="h-5 w-3/4 rounded-lg bg-white/5" />
                <Skeleton className="h-4 w-1/2 rounded-lg bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-[#0E121A] rounded-2xl border border-white/10 p-8">
            <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <h3 className="font-display font-extrabold text-white text-lg uppercase">No Published Batches Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no published batches for this filter. Check back soon or browse all courses!
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
