import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, BookOpen, Clock, Layers, PlayCircle, FileText, ChevronDown } from 'lucide-react';
import { Button, Badge, SectionHeading } from '../components/UI';
import CourseCard from '../components/CourseCard';
import { SCHOOL_CLASSES } from '../data/sampleData';
import { courseService } from '../services/courseService';
import { Skeleton } from '../components/ui/Loading';

export default function ClassPage() {
  const { classId } = useParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState('all');

  const classInfo = SCHOOL_CLASSES.find((c) => c.id === classId);
  const label = classInfo?.label || classId?.replace('class-', 'Class ') || 'Class 10';
  const isSeniorClass = label === 'Class 11' || label === 'Class 12';

  useEffect(() => {
    let isMounted = true;
    async function loadClassCourses() {
      try {
        setLoading(true);
        const list = await courseService.getCoursesByClass(label);
        if (isMounted) {
          if (list.length === 0) {
            const all = await courseService.getAllPublishedCourses();
            setCourses(all.filter((c) => c.classGrade === label));
          } else {
            setCourses(list);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('[ClassPage] Error loading class courses:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadClassCourses();
    return () => {
      isMounted = false;
    };
  }, [label]);

  const filteredCourses = courses.filter((c) => {
    if (!c.isPublished) return false;
    if (isSeniorClass && selectedStream !== 'all') {
      return c.stream === selectedStream;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-6 flex-wrap">
        <Link to="/" className="hover:text-[#2457A7] transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/school-courses" className="hover:text-[#2457A7] transition-colors">School Courses</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#172033] font-medium">{label}</span>
      </div>

      {/* Header */}
      <div className="bg-[#17365D] rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-8 sm:mb-10 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#F4B942] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-[#17365D]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F4B942] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">NCERT & State Board</p>
            <h1 className="font-display font-black text-2xl sm:text-4xl mb-2">{label} Curriculum</h1>
            <p className="text-blue-200 text-xs sm:text-base max-w-xl leading-relaxed">
              Complete syllabus coverage for {label} with chapter-wise video lectures, exemplar problems, notes, and term assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Stream Selector for Class 11 & 12 */}
      {isSeniorClass && (
        <div className="mb-10 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Choose Academic Stream:
            </span>
            <p className="text-xs text-gray-500">Filter courses by specialized stream</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Streams' },
              { id: 'Science PCM', label: 'Science PCM (Maths)' },
              { id: 'Science PCB', label: 'Science PCB (Biology)' },
              { id: 'Commerce', label: 'Commerce' },
              { id: 'Arts', label: 'Arts & Humanities' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStream(st.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedStream === st.id
                    ? 'bg-[#17365D] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Courses List */}
      <div className="mb-14">
        <SectionHeading tag="Courses" title={`Published Courses for ${label}`} />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 space-y-3">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 p-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-bold text-[#172033] text-base">No Courses for this Stream</h3>
            <p className="text-xs text-gray-400 mt-1">
              Check back soon or select another stream to view active courses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
