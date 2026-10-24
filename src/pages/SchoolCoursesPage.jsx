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
    <div className="w-full bg-[#F8FAFC] text-slate-900 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-600 font-semibold">School Curriculum</span>
        </div>

        {/* Page Header */}
        <div className="mb-10">
          <SectionHeading
            tag="CBSE & NCERT Foundation"
            tagNumber="01"
            title="Classes 6–12 Academic"
            highlight="Mastery."
            subtitle="NCERT-aligned comprehensive courses with chapter video lessons, conceptual notes, derivations, and board examination test series."
          />
        </div>

        {/* Class Selector Tabs */}
        <div className="mb-8">
          <h2 className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">
            Select Grade Level:
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setActiveClass('all');
                setActiveStream('all');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer border ${
                activeClass === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-200 shadow-sm'
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
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer border ${
                  activeClass === cls
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-200 shadow-sm'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Stream Selector (Class 11 and 12) */}
        {(isSeniorSecondary || activeClass === 'all') && (
          <div className="mb-10 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                Class 11 & 12 Academic Streams:
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Filter by board examination specialization</p>
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
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer border ${
                    activeStream === st.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-blue-600 hover:border-blue-200'
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
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-sm">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
            <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="font-bold text-slate-900 text-lg">No Published Batches Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
